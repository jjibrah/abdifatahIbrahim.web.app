require('dotenv').config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken || !chatId) {
  console.error("Missing Bot Token or Chat ID in .env file!");
  process.exit(1);
}

const telegramMessage = `
🧪 *System Diagnostic Test* 🧪
*Status:* Online
*Message:* Hello from Antigravity! Your Telegram Bot integration is successfully wired up and working.
`;

const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

console.log("Transmitting secure payload to Telegram...");

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: telegramMessage,
    parse_mode: 'Markdown'
  })
})
.then(res => {
  if (!res.ok) {
    return res.text().then(text => {
      console.error("Telegram API Error:", text);
    });
  }
  console.log("✅ Success! Check your Telegram app for the message.");
})
.catch(err => {
  console.error("Network Error:", err);
});
