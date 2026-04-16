import dotenv from 'dotenv';
dotenv.config();

export async function enviarWhatsApp(telefone, mensagem) {
  const clean = telefone.replace(/\D/g, '');
  const numero = clean.startsWith('55') ? clean : '55' + clean;
  try {
    const url = 'https://api.z-api.io/instances/' + process.env.ZAPI_INSTANCE + '/token/' + process.env.ZAPI_TOKEN + '/send-text';
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': process.env.ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone: numero, message: mensagem }),
    });
    const data = await r.json();
    console.log('WhatsApp enviado para', numero);
    return { ok: r.ok, data };
  } catch (e) {
    console.error('Erro Zapi:', e.message);
    return { ok: false, erro: e.message };
  }
}
