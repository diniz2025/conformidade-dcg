import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { enviarEmail } from '../services/email.js';
import { enviarWhatsApp } from '../services/whatsapp.js';

const router = express.Router();

function gerarCodigo(nome) {
  const prefix = (nome || 'CT').trim().toUpperCase().split(' ')[0].substring(0,3);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return prefix + '-' + rand;
}

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, telefone, crc, cidade, pix } = req.body;
    if (!nome || !email) return res.status(400).json({ erro: 'Dados incompletos' });
    const existe = await query('SELECT id FROM parceiros WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length) return res.status(400).json({ erro: 'E-mail ja cadastrado como parceiro' });
    let codigo = gerarCodigo(nome);
    let tentativa = 0;
    while (tentativa < 10) {
      const check = await query('SELECT id FROM parceiros WHERE codigo=$1', [codigo]);
      if (!check.rows.length) break;
      codigo = gerarCodigo(nome);
      tentativa++;
    }
    const r = await query(
      'INSERT INTO parceiros (nome, email, telefone, crc, cidade, codigo, pix) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [nome, email.toLowerCase(), telefone, crc, cidade, codigo, pix]
    );
    const link = process.env.SITE_URL + '/?ref=' + codigo;
    const html = '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#1565A8;color:#fff;padding:30px;border-radius:12px 12px 0 0;text-align:center"><h1>Bem-vindo ao Programa de Parceiros DCG</h1></div><div style="background:#fff;padding:30px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px"><h2>Ola, ' + nome + '!</h2><p>Seu cadastro foi recebido. Em breve nosso time entrara em contato para aprovar sua parceria.</p><p><strong>Seu codigo de indicacao:</strong></p><p style="text-align:center;font-size:28px;font-weight:900;color:#1565A8;background:#E8F1FA;padding:16px;border-radius:12px;letter-spacing:2px">' + codigo + '</p><p><strong>Seu link exclusivo:</strong><br><a href="' + link + '">' + link + '</a></p><p>Divulgue este link. A cada contratacao, voce recebe <strong>20% do valor todo mes</strong> enquanto o cliente permanecer ativo.</p><p style="font-size:12px;color:#64748B;margin-top:20px">DCG Corretora de Seguros - (11) 93075-9163</p></div></div>';
    enviarEmail({ para: email, assunto: 'Programa de Parceiros DCG - Codigo ' + codigo, html });
    enviarWhatsApp('5511994104891', 'Novo parceiro DCG! Nome: ' + nome + ' | Email: ' + email + ' | Tel: ' + (telefone||'-') + ' | CRC: ' + (crc||'-') + ' | Codigo: ' + codigo);
    res.json({ ok: true, codigo: codigo, link: link });
  } catch (e) {
    console.error('Erro parceiro:', e);
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

router.get('/validar/:codigo', async (req, res) => {
  const r = await query('SELECT id, nome FROM parceiros WHERE codigo=$1', [req.params.codigo.toUpperCase()]);
  res.json({ valido: r.rows.length > 0, parceiro: r.rows[0] || null });
});

export default router;
