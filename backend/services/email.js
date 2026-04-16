import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function enviarEmail({ para, assunto, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: para,
      subject: assunto,
      html,
    });
    console.log('Email enviado:', info.messageId);
    return { ok: true, id: info.messageId };
  } catch (e) {
    console.error('Erro SMTP:', e.message);
    return { ok: false, erro: e.message };
  }
}

export function templateVerificacao(nome, link) {
  return '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#1565A8;color:#fff;padding:30px;border-radius:12px 12px 0 0;text-align:center"><h1 style="margin:0;font-size:24px">Conformidade DCG</h1></div><div style="background:#fff;padding:30px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px"><h2>Ola, ' + nome + '!</h2><p>Confirme seu e-mail para ativar sua conta:</p><p style="text-align:center;margin:30px 0"><a href="' + link + '" style="background:#1565A8;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Confirmar e-mail</a></p><p style="font-size:12px;color:#64748B">Se nao foi voce, ignore este e-mail.</p><p style="font-size:12px;color:#64748B">DCG Corretora de Seguros LTDA - (11) 93075-9163</p></div></div>';
}

export function templateAlerta(nome, obrigacao, mensagem, linkOficial) {
  return '<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:40px 20px"><div style="background:#DC2626;color:#fff;padding:30px;border-radius:12px 12px 0 0;text-align:center"><h1 style="margin:0;font-size:24px">Alerta de Conformidade</h1></div><div style="background:#fff;padding:30px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px"><h2>Ola, ' + nome + '!</h2><p><strong>Obrigacao: ' + obrigacao + '</strong></p><p>' + mensagem + '</p><p style="text-align:center;margin:30px 0"><a href="' + linkOficial + '" style="background:#1565A8;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Acessar Portal Oficial</a></p><p style="font-size:12px;color:#64748B">Este alerta e gerado automaticamente pelo Conformidade DCG. A regularizacao deve ser feita por voce ou seu contador nos portais oficiais.</p><p style="font-size:12px;color:#64748B">DCG Corretora de Seguros LTDA - (11) 93075-9163</p></div></div>';
}
