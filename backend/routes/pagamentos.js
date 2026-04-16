import express from 'express';
import { query } from '../db.js';
import { verificarToken } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const PLANOS = {
  starter: { nome: 'Starter', preco: 19.90, cnpjs: 3 },
  pro: { nome: 'Pro', preco: 59.90, cnpjs: 10 },
  agency: { nome: 'Agency', preco: 149.90, cnpjs: 50 },
};

router.post('/checkout', verificarToken, async (req, res) => {
  try {
    const { plano } = req.body;
    if (!PLANOS[plano]) return res.status(400).json({ erro: 'Plano invalido' });
    const uR = await query('SELECT * FROM usuarios WHERE id=$1', [req.usuario.id]);
    const u = uR.rows[0];
    const p = PLANOS[plano];
    const preference = {
      items: [{
        title: 'Conformidade DCG - Plano ' + p.nome,
        description: 'Monitoramento de ate ' + p.cnpjs + ' CNPJs',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: p.preco,
      }],
      payer: { name: u.nome, email: u.email },
      back_urls: {
        success: process.env.SITE_URL + '/?pag=sucesso',
        failure: process.env.SITE_URL + '/?pag=erro',
        pending: process.env.SITE_URL + '/?pag=pendente',
      },
      auto_return: 'approved',
      external_reference: 'conf_' + u.id + '_' + plano + '_' + Date.now(),
      notification_url: process.env.SITE_URL + '/api/webhook/mercadopago',
      metadata: { usuario_id: u.id, plano: plano },
    };
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.MP_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });
    const data = await r.json();
    if (!data.id) {
      console.error('MP erro:', data);
      return res.status(500).json({ erro: 'Erro ao criar checkout' });
    }
    await query('INSERT INTO pagamentos (usuario_id, mp_preference_id, plano, valor, status) VALUES ($1,$2,$3,$4,$5)', [u.id, data.id, plano, p.preco, 'pending']);
    res.json({ ok: true, checkout_url: data.init_point, preference_id: data.id });
  } catch (e) {
    console.error('Erro checkout:', e);
    res.status(500).json({ erro: 'Erro no checkout' });
  }
});

router.post('/webhook/mercadopago', async (req, res) => {
  try {
    console.log('Webhook MP:', JSON.stringify(req.body));
    const { type, data } = req.body;
    if (type !== 'payment' || !data?.id) return res.status(200).send('OK');
    const r = await fetch('https://api.mercadopago.com/v1/payments/' + data.id, {
      headers: { 'Authorization': 'Bearer ' + process.env.MP_ACCESS_TOKEN },
    });
    const pay = await r.json();
    const ref = pay.external_reference || '';
    const match = ref.match(/^conf_(\d+)_(\w+)_/);
    if (!match) return res.status(200).send('OK');
    const usuarioId = match[1];
    const plano = match[2];
    await query('INSERT INTO pagamentos (usuario_id, mp_payment_id, plano, valor, status, metodo) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING', [usuarioId, pay.id, plano, pay.transaction_amount, pay.status, pay.payment_method_id]);
    if (pay.status === 'approved') {
      const expira = new Date();
      expira.setDate(expira.getDate() + 30);
      await query('UPDATE usuarios SET plano=$1, plano_expira=$2, atualizado_em=NOW() WHERE id=$3', [plano, expira, usuarioId]);
      console.log('Usuario ' + usuarioId + ' upgrade para ' + plano);
    }
    res.status(200).send('OK');
  } catch (e) {
    console.error('Erro webhook:', e);
    res.status(200).send('OK');
  }
});

export default router;
