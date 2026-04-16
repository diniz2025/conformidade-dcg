import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, plano: usuario.plano },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verificarToken(req, res, next) {
  const token = req.cookies?.dcg_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ erro: 'Nao autenticado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ erro: 'Token invalido ou expirado' });
  }
}

export function apenasAdmin(req, res, next) {
  if (req.usuario?.email !== 'diniz@dcgseguros.com.br') {
    return res.status(403).json({ erro: 'Acesso restrito' });
  }
  next();
}
