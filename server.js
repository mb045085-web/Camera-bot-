const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json({ limit: "20mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const REGISTER_SECRET = process.env.REGISTER_SECRET || "changeme";
const PRIVATE_GROUP_CHAT_ID = process.env.PRIVATE-1002530552602 || null;

const sessionToChatId = {};

function dataUrlToBuffer(dataUrl) {
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  return { buf: Buffer.from(m[2], "base64"), mime: m[1] };
}

app.post("/register-session", (req, res) => {
  const { session, chat_id, secret } = req.body;
  if (secret !== REGISTER_SECRET) return res.status(403).json({ ok: false });
  sessionToChatId[session] = chat_id;
  res.json({ ok: true });
});

app.post("/upload", async (req, res) => {
  try {
    const { session, index, image } = req.body;
    const chatId = sessionToChatId[session];
    if (!chatId) return res.status(403).send("unknown session");

    const { buf } = dataUrlToBuffer(image);
    const fname = path.join(__dirname, "tmp.jpg");
    fs.writeFileSync(fname, buf);

    // Send to user only
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream(fname));
    form.append("caption", `Image ${index} for your session`);
    await fetch(url, { method: "POST", body: form });

    // Log to private group
    if (PRIVATE_GROUP_CHAT_ID) {
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: PRIVATE_GROUP_CHAT_ID,
            text: `📸 Session ${session}\nUser: ${chatId}\nImage: ${index}`,
          }),
        }
      );
    }

    fs.unlinkSync(fname);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).send("error");
  }
});

app.get("/", (req, res) => res.send("Server is running ✅"));

app.listen(3000, () => console.log("Server running on 3000"));
