import cron from 'node-cron';
import { query } from './backend/db.js';
import { enviarEmail, templateAlerta } from './backend/services/email.js';
import { enviarWhatsApp } from './backend/services/whatsapp.js';
import dotenv from 'dotenv';
dotenv.config();

const OBRIG_INFO = {
  dte: { nome: 'DTE - Domicilio Tributario Eletronico', link: 'https://cav.receita.fazenda.gov.br/', mensagem: 'Sua empresa precisa estar cadastrada no DTE. Sem o cadastro, intimacoes da Receita Federal sao consideradas recebidas automaticamente.' },
  dje: { nome: 'DJE - Domicilio Judicial Eletronico', link: 'https://domicilio-eletronico.cnj.jus.br/', mensagem: 'O prazo do DJE era 31/03/2026. Sem cadastro, voce pode perder processos judiciais por revelia.' },
  ebef: { nome: 'e-BEF - Beneficiario Final', link: 'https://cav.receita.fazenda.gov.br/', mensagem: 'Declaracao obrigatoria de pessoas fisicas que controlam a empresa. Cronograma progressivo ate 2028.' },
  ecf: { nome: 'ECF - Escrituracao Contabil Fiscal', link: 'https://www.gov.br/receitafederal/pt-br', mensagem: 'Entrega anual ate julho. Multa de 0,25% do lucro liquido.' },
  pgr: { nome: 'PGR/NR-1 - Gerenciamento de Riscos', link: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras', mensagem: 'Obrigatorio para toda empresa com empregados. Multas de R$ 2.396 a R$ 6.708.' },
};

async function verificarCNPJs() {
  console.log('[' + new Date().toISOString() + '] 🔍 Iniciando verificacao diaria...');
  try {
    const cnpjs = await query(`
      SELECT c.*, u.nome, u.email, u.telefone, u.plano
      FROM cnpjs c JOIN usuarios u ON c.usuario_id = u.id
      WHERE u.email_verificado = TRUE
    `);
    console.log('Total CNPJs para verificar:', cnpjs.rows.length);

    for (const c of cnpjs.rows) {
      try {
        const pendentes = await query(
          "SELECT obrigacao FROM obrigacoes_status WHERE cnpj_id=$1 AND status='danger' AND obrigacao IN ('dte','dje','ebef','ecf','pgr')",
          [c.id]
        );
        if (!pendentes.rows.length) continue;

        // Verificar se ja enviou alerta nas ultimas 24h
        const recente = await query(
          "SELECT id FROM alertas WHERE cnpj_id=$1 AND criado_em > NOW() - INTERVAL '24 hours'",
          [c.id]
        );
        if (recente.rows.length) { console.log('CNPJ', c.cnpj, 'ja alertado nas ultimas 24h'); continue; }

        // Escolher a obrigacao mais critica
        const obrigCritica = pendentes.rows[0].obrigacao;
        const info = OBRIG_INFO[obrigCritica];
        if (!info) continue;

        const nomeEmpresa = c.apelido || c.razao_social || c.cnpj;
        const titulo = 'Pendencia ' + info.nome + ' - ' + nomeEmpresa;
        const mensagem = 'Pendencia identificada na empresa ' + nomeEmpresa + ' (' + c.cnpj + '): ' + info.mensagem;

        // Enviar e-mail (todos os planos)
        await enviarEmail({
          para: c.email,
          assunto: '⚠️ Alerta Conformidade DCG - ' + info.nome,
          html: templateAlerta(c.nome, info.nome + ' | ' + nomeEmpresa, info.mensagem, info.link)
        });

        // Enviar WhatsApp (planos pagos)
        if (c.plano !== 'free' && c.telefone) {
          const msg = '🔔 *Alerta Conformidade DCG*\n\n' + titulo + '\n\n' + info.mensagem + '\n\n🔗 ' + info.link + '\n\nAcesse seu painel: https://conformidade.dcgseguros.com.br/app.html';
          await enviarWhatsApp(c.telefone, msg);
        }

        // Registrar alerta
        await query(
          "INSERT INTO alertas (usuario_id, cnpj_id, tipo, obrigacao, titulo, mensagem, canal, enviado) VALUES ($1,$2,'danger',$3,$4,$5,$6,TRUE)",
          [c.usuario_id, c.id, obrigCritica, titulo, mensagem, c.plano !== 'free' ? 'email+whatsapp' : 'email']
        );

        console.log('✅ Alerta enviado para', c.email, '- CNPJ', c.cnpj, '- Obrigacao', obrigCritica);
      } catch (e) {
        console.error('Erro no CNPJ', c.cnpj, ':', e.message);
      }
    }
    console.log('[' + new Date().toISOString() + '] ✅ Verificacao concluida');
  } catch (e) {
    console.error('Erro geral worker:', e);
  }
}

// Executa todo dia as 8h da manha (horario SP)
cron.schedule('0 8 * * *', verificarCNPJs, { timezone: 'America/Sao_Paulo' });

// Tambem executa uma vez ao iniciar (para teste)
console.log('🤖 Worker Conformidade DCG iniciado - proximo run: 08:00 diariamente');

// Endpoint manual para disparar via HTTP (protegido)
import express from 'express';
const app = express();
app.post('/trigger/:secret', async (req, res) => {
  if (req.params.secret !== 'dcg_worker_2026_manual') return res.status(403).send('Forbidden');
  verificarCNPJs();
  res.send('Triggered');
});
app.listen(3061, '127.0.0.1', () => console.log('Worker trigger endpoint: porta 3061 (local)'));
