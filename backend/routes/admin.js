import express from 'express';
import { query } from '../db.js';
import { verificarToken, apenasAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verificarToken, apenasAdmin);

// Resumo geral
router.get('/resumo', async (req, res) => {
  try {
    const u = await query("SELECT COUNT(*) as total, SUM(CASE WHEN plano!='free' THEN 1 ELSE 0 END) as pagantes FROM usuarios");
    const c = await query("SELECT COUNT(*) FROM cnpjs");
    const a = await query("SELECT COUNT(*) FROM alertas WHERE criado_em > NOW() - INTERVAL '30 days'");
    const p = await query("SELECT SUM(valor) as total FROM pagamentos WHERE status='approved' AND criado_em > NOW() - INTERVAL '30 days'");
    const pPlano = await query("SELECT plano, COUNT(*) as qtd FROM usuarios GROUP BY plano");
    res.json({
      usuarios: parseInt(u.rows[0].total),
      pagantes: parseInt(u.rows[0].pagantes),
      cnpjs: parseInt(c.rows[0].count),
      alertas_30d: parseInt(a.rows[0].count),
      receita_30d: parseFloat(p.rows[0].total || 0),
      por_plano: pPlano.rows,
    });
  } catch (e) { res.status(500).json({ erro: e.message }) }
});

// Lista usuários
router.get('/usuarios', async (req, res) => {
  const r = await query(`
    SELECT u.id, u.nome, u.email, u.telefone, u.plano, u.plano_expira, u.email_verificado, u.criado_em,
           (SELECT COUNT(*) FROM cnpjs WHERE usuario_id=u.id) as total_cnpjs
    FROM usuarios u ORDER BY u.criado_em DESC LIMIT 200`);
  res.json({ usuarios: r.rows });
});

// Lista CNPJs
router.get('/cnpjs', async (req, res) => {
  const r = await query(`
    SELECT c.*, u.nome as usuario_nome, u.email as usuario_email, u.plano
    FROM cnpjs c JOIN usuarios u ON c.usuario_id=u.id
    ORDER BY c.criado_em DESC LIMIT 200`);
  res.json({ cnpjs: r.rows });
});

// Lista pagamentos
router.get('/pagamentos', async (req, res) => {
  const r = await query(`
    SELECT p.*, u.nome as usuario_nome, u.email as usuario_email
    FROM pagamentos p JOIN usuarios u ON p.usuario_id=u.id
    ORDER BY p.criado_em DESC LIMIT 200`);
  res.json({ pagamentos: r.rows });
});

// Lista alertas
router.get('/alertas', async (req, res) => {
  const r = await query(`
    SELECT a.*, u.email as usuario_email, c.cnpj, c.razao_social
    FROM alertas a JOIN usuarios u ON a.usuario_id=u.id JOIN cnpjs c ON a.cnpj_id=c.id
    ORDER BY a.criado_em DESC LIMIT 100`);
  res.json({ alertas: r.rows });
});

// Alterar plano de usuário manualmente
router.put('/usuario/:id/plano', async (req, res) => {
  const { plano, dias } = req.body;
  const exp = new Date();
  exp.setDate(exp.getDate() + (dias || 30));
  await query('UPDATE usuarios SET plano=$1, plano_expira=$2 WHERE id=$3', [plano, exp, req.params.id]);
  res.json({ ok: true });
});

export default router;
