import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query } from '../db.js';
import { gerarToken, verificarToken } from '../middleware/auth.js';
import { enviarEmail, templateVerificacao } from '../services/email.js';

const router = express.Router();

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Dados incompletos' });
    if (senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter 6+ caracteres' });
    const existe = await query('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length) return res.status(400).json({ erro: 'E-mail ja cadastrado' });
    const hash = await bcrypt.hash(senha, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const r = await query(
      'INSERT INTO usuarios (nome, email, senha_hash, telefone, plano, token_verificacao) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nome, email, plano',
      [nome, email.toLowerCase(), hash, telefone || null, 'free', token]
    );
    const u = r.rows[0];
    const link = process.env.SITE_URL + '/api/auth/verificar/' + token;
    enviarEmail({ para: email, assunto: 'Confirme seu e-mail - Conformidade DCG', html: templateVerificacao(nome, link) });
    const jwtToken = gerarToken(u);
    res.cookie('dcg_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30*24*60*60*1000 });
    res.json({ ok: true, usuario: u, token: jwtToken });
  } catch (e) {
    console.error('Erro cadastro:', e);
    res.status(500).json({ erro: 'Erro ao cadastrar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const r = await query('SELECT * FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (!r.rows.length) return res.status(401).json({ erro: 'E-mail ou senha invalidos' });
    const u = r.rows[0];
    const ok = await bcrypt.compare(senha, u.senha_hash);
    if (!ok) return res.status(401).json({ erro: 'E-mail ou senha invalidos' });
    const jwtToken = gerarToken(u);
    res.cookie('dcg_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30*24*60*60*1000 });
    res.json({ ok: true, usuario: { id: u.id, nome: u.nome, email: u.email, plano: u.plano }, token: jwtToken });
  } catch (e) {
    console.error('Erro login:', e);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('dcg_token');
  res.json({ ok: true });
});

router.get('/verificar/:token', async (req, res) => {
  try {
    const r = await query('UPDATE usuarios SET email_verificado=TRUE, token_verificacao=NULL WHERE token_verificacao=$1 RETURNING email', [req.params.token]);
    if (!r.rows.length) return res.redirect('/?verif=erro');
    res.redirect('/?verif=ok');
  } catch (e) { res.redirect('/?verif=erro'); }
});

router.get('/me', verificarToken, async (req, res) => {
  const r = await query('SELECT id, nome, email, telefone, plano, plano_expira, email_verificado FROM usuarios WHERE id=$1', [req.usuario.id]);
  res.json({ usuario: r.rows[0] });
});


router.post('/esqueci-senha', async (req, res) => {
  try {
    const { email } = req.body;
    const r = await query('SELECT id, nome FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (!r.rows.length) return res.json({ ok: true });
    const u = r.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60*60*1000);
    await query('INSERT INTO resets_senha (usuario_id, token, expira) VALUES ($1,$2,$3)', [u.id, token, expira]);
    const link = process.env.SITE_URL + '/redefinir.html?t=' + token;
    const html = '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#1565A8;color:#fff;padding:30px;border-radius:12px 12px 0 0;text-align:center"><h1>Redefinir Senha</h1></div><div style="background:#fff;padding:30px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px"><h2>Ola, ' + u.nome + '!</h2><p>Voce solicitou a redefinicao da sua senha. Clique no botao abaixo (valido por 1 hora):</p><p style="text-align:center;margin:30px 0"><a href="' + link + '" style="background:#1565A8;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Redefinir Senha</a></p><p style="font-size:12px;color:#64748B">Se nao foi voce, ignore este e-mail.</p><p style="font-size:12px;color:#64748B">DCG Corretora de Seguros - (11) 93075-9163</p></div></div>';
    enviarEmail({ para: email, assunto: 'Redefinir senha - Conformidade DCG', html });
    res.json({ ok: true });
  } catch (e) { console.error('Erro esqueci:', e); res.status(500).json({ erro: 'Erro' }); }
});

router.post('/redefinir-senha', async (req, res) => {
  try {
    const { token, senha } = req.body;
    if (senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter 6+ caracteres' });
    const r = await query('SELECT usuario_id FROM resets_senha WHERE token=$1 AND usado=FALSE AND expira > NOW()', [token]);
    if (!r.rows.length) return res.status(400).json({ erro: 'Link invalido ou expirado' });
    const hash = await bcrypt.hash(senha, 10);
    await query('UPDATE usuarios SET senha_hash=$1 WHERE id=$2', [hash, r.rows[0].usuario_id]);
    await query('UPDATE resets_senha SET usado=TRUE WHERE token=$1', [token]);
    res.json({ ok: true });
  } catch (e) { console.error('Erro redefinir:', e); res.status(500).json({ erro: 'Erro' }); }
});

export default router;
