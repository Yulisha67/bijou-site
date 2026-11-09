// Forwards form submissions (POST /) to a Telegram chat; serves static assets otherwise.
// Secrets/vars (set in Cloudflare, never in the repo): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional),
// RESEND_API_KEY, ORDER_EMAIL_TO, ORDER_EMAIL_FROM (optional; FROM must be a domain verified in Resend).
const SKIP = new Set(['lang', 'viewport', 'order', 'bot-field']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/') {
      return env.ASSETS.fetch(request);
    }
    const form = await request.formData();
    const lines = ['Нова заявка з сайту'];
    for (const [key, value] of form) {
      if (SKIP.has(key) || !String(value).trim()) continue;
      lines.push(`${key}: ${String(value).slice(0, 500)}`);
    }
    const text = lines.join('\n').slice(0, 4000);
    const sends = [];
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      sends.push(fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: '🆕 ' + text }),
      }));
    }
    if (env.RESEND_API_KEY && env.ORDER_EMAIL_TO && env.ORDER_EMAIL_FROM) {
      sends.push(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.ORDER_EMAIL_FROM, to: [env.ORDER_EMAIL_TO], subject: 'Нова заявка з сайту Bijou', text }),
      }));
    }
    if (!sends.length) return new Response('not configured', { status: 500 });
    const results = await Promise.all(sends);
    // Any failure makes the page fall back to its mailto link.
    const ok = results.every((r) => r.ok);
    return new Response(ok ? 'ok' : 'send error', { status: ok ? 200 : 502 });
  },
};
