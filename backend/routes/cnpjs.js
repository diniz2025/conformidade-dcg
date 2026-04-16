import express from 'express';
import { query } from '../db.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verificarToken);

const LIMITES = { free: 1, starter: 3, pro: 10, agency: 50 };
const OBRIGACOES_DEFAULT = ['dte','dje','ebef','ecf','ecd','dctf','defis','esocial','pgr','pcmso','lgpd'];

router.get('/', async (req, res) => {
  const r = await query('SELECT * FROM cnpjs WHERE usuario_id=$1 ORDER BY criado_em DESC', [req.usuario.id]);
  res.json({ cnpjs: r.rows });
});

router.post('/', async (req, res) => {
  try {
    const { cnpj, apelido } = req.body;
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return res.status(400).json({ erro: 'CNPJ invalido' });
    const count = await query('SELECT COUNT(*) FROM cnpjs WHERE usuario_id=$1', [req.usuario.id]);
    const uR = await query('SELECT plano FROM usuarios WHERE id=$1', [req.usuario.id]);
    const plano = uR.rows[0].plano;
    const limite = LIMITES[plano] || 1;
    if (parseInt(count.rows[0].count) >= limite) {
      return res.status(403).json({ erro: 'Limite de ' + limite + ' CNPJ(s) atingido. Faca upgrade do plano.' });
    }
    const resp = await fetch('https://receitaws.com.br/v1/cnpj/' + clean);
    const d = await resp.json();
    if (d.status === 'ERROR') return res.status(400).json({ erro: d.message });
    const end = (d.logradouro || '') + ', ' + (d.numero || '') + ' - ' + (d.bairro || '') + ', ' + (d.municipio || '') + '/' + (d.uf || '') + ' - ' + (d.cep || '');
    const r = await query(
      'INSERT INTO cnpjs (usuario_id, cnpj, razao_social, nome_fantasia, situacao, email_receita, telefone_receita, endereco, apelido, ultima_verificacao) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *',
      [req.usuario.id, d.cnpj, d.nome, d.fantasia, d.situacao, d.email, d.telefone, end, apelido || null]
    );
    for (const o of OBRIGACOES_DEFAULT) {
      await query('INSERT INTO obrigacoes_status (cnpj_id, obrigacao, status) VALUES ($1,$2,$3)', [r.rows[0].id, o, 'danger']);
    }
    res.json({ ok: true, cnpj: r.rows[0], dadosReceita: d });
  } catch (e) {
    console.error('Erro add CNPJ:', e);
    res.status(500).json({ erro: 'Erro ao adicionar CNPJ' });
  }
});

router.get('/:id', async (req, res) => {
  const c = await query('SELECT * FROM cnpjs WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  if (!c.rows.length) return res.status(404).json({ erro: 'CNPJ nao encontrado' });
  const o = await query('SELECT * FROM obrigacoes_status WHERE cnpj_id=$1', [req.params.id]);
  res.json({ cnpj: c.rows[0], obrigacoes: o.rows });
});

router.put('/:id/obrigacao/:obrig', async (req, res) => {
  const { status, observacao } = req.body;
  const c = await query('SELECT id FROM cnpjs WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  if (!c.rows.length) return res.status(404).json({ erro: 'CNPJ nao encontrado' });
  await query('UPDATE obrigacoes_status SET status=$1, observacao=$2, atualizado_em=NOW() WHERE cnpj_id=$3 AND obrigacao=$4', [status, observacao || null, req.params.id, req.params.obrig]);
  const sr = await query('SELECT status FROM obrigacoes_status WHERE cnpj_id=$1', [req.params.id]);
  let t = 0;
  sr.rows.forEach(x => { if (x.status==='ok') t+=100; else if (x.status==='warn') t+=50 });
  const score = Math.round(t / sr.rows.length);
  await query('UPDATE cnpjs SET score=$1 WHERE id=$2', [score, req.params.id]);
  res.json({ ok: true, score });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM cnpjs WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  res.json({ ok: true });
});

router.post('/:id/reconsultar', async (req, res) => {
  const c = await query('SELECT cnpj FROM cnpjs WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  if (!c.rows.length) return res.status(404).json({ erro: 'CNPJ nao encontrado' });
  const clean = c.rows[0].cnpj.replace(/\D/g,'');
  try {
    const resp = await fetch('https://receitaws.com.br/v1/cnpj/' + clean);
    const d = await resp.json();
    if (d.status === 'ERROR') return res.status(400).json({ erro: d.message });
    await query('UPDATE cnpjs SET razao_social=$1, situacao=$2, email_receita=$3, telefone_receita=$4, ultima_verificacao=NOW() WHERE id=$5', [d.nome, d.situacao, d.email, d.telefone, req.params.id]);
    res.json({ ok: true, dadosReceita: d });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao reconsultar' });
  }
});

export default router;
