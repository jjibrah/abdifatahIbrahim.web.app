const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Load the .env file (Make sure it's placed inside the functions/ directory!)
require("dotenv").config();

admin.initializeApp();

/**
 * Triggered whenever a new document is added to the "inquiries" collection.
 * 
 * NOTE: Set these config variables in your Firebase project using the CLI:
 * firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN" telegram.chat_id="YOUR_CHAT_ID"
 */
exports.sendTelegramNotification = functions.firestore
  .document('inquiries/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    // Attempt to get credentials from Firebase remote config first, fallback to process.env
    const botToken = functions.config().telegram?.bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = functions.config().telegram?.chat_id || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("CRITICAL: Telegram Bot Token or Chat ID is missing!");
      return null;
    }

    const { name, email, intent, message } = data;

    // Crafting the message for Telegram
    const telegramMessage = `
🔔 *New Portfolio Inquiry* 🔔
*Name:* ${name}
*Email:* ${email}
*Intent:* ${intent}

*Message:*
${message}
    `;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      // Node 18 natively supports fetch
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Telegram API Error:", errorText);
      } else {
        console.log("Telegram notification sent successfully.");
      }
    } catch (error) {
      console.error("Network or Fetch Error contacting Telegram:", error);
    }

    return null;
  });