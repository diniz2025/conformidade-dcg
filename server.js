import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import authRoutes from './backend/routes/auth.js';
import cnpjsRoutes from './backend/routes/cnpjs.js';
import pagamentosRoutes from './backend/routes/pagamentos.js';
import adminRoutes from './backend/routes/admin.js';
import parceirosRoutes from './backend/routes/parceiros.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('X-XSS-Protection','1; mode=block');
  next();
});

// Proxy público de consulta CNPJ (sem login)
app.get('/api/cnpj/:cnpj', async (req,res)=>{
  try {
    const r = await fetch('https://receitaws.com.br/v1/cnpj/' + req.params.cnpj);
    res.json(await r.json());
  } catch(e) {
    res.status(500).json({status:'ERROR', message:'Erro ReceitaWS'});
  }
});

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/cnpjs', cnpjsRoutes);
app.use('/api', pagamentosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parceiros', parceirosRoutes);

// Health check
app.get('/api/health', (req,res) => res.json({ ok: true, ts: new Date() }));

// Estáticos
app.use(express.static(join(__dirname,'public'),{maxAge:'1d'}));
app.get('*',(req,res)=>res.sendFile(join(__dirname,'public','index.html')));

const PORT = process.env.PORT || 3060;
app.listen(PORT,'0.0.0.0',()=>console.log(`🚀 Conformidade DCG SaaS ativo na porta ${PORT}`));
