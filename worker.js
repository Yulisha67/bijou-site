// Forwards form submissions (POST /) to a Telegram chat; serves static assets otherwise.
// Secrets (set in Cloudflare, never in the repo): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
const SKIP = new Set(['lang', 'viewport', 'order', 'bot-field']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/') {
      return env.ASSETS.fetch(request);
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return new Response('not configured', { status: 500 });
    }
    const form = await request.formData();
    const lines = ['🆕 Нова заявка з сайту'];
    for (const [key, value] of form) {
      if (SKIP.has(key) || !String(value).trim()) continue;
      lines.push(`${key}: ${String(value).slice(0, 500)}`);
    }
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n').slice(0, 4000) }),
    });
    // Non-2xx makes the page fall back to its mailto link.
    return new Response(res.ok ? 'ok' : 'telegram error', { status: res.ok ? 200 : 502 });
  },
};
