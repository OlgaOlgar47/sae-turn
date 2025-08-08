const { chromium } = require("playwright");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const URL = process.env.URL;
const NO_SLOTS_TEXT = "En la oficina seleccionada no hay cupos disponibles";

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  });
}

async function checkSlots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.click("#form\\:botonElegirHora");
    await page.waitForTimeout(2000);

    const noSlots = await page.locator(`text=${NO_SLOTS_TEXT}`).count();

    if (noSlots > 0) {
      console.log(new Date().toLocaleString(), "❌ There is no available date");
    } else {
      console.log(new Date().toLocaleString(), "✅ There is available dates!");
      await sendTelegramMessage(
        "⚠️ Появились свободные даты на сайте SAE MEC!"
      );
    }
  } catch (err) {
    console.error("Error:", err);
    await sendTelegramMessage(`❌ Script failed with error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (_req, res) => res.send("OK"));
app.listen(PORT, () => console.log("HTTP server listening on " + PORT));

// Checking every 5 minutes
(async () => {
  console.log("⏳ Monitoring is on...checking every 5 min...");
  await checkSlots(); // first check immediate
  setInterval(checkSlots, 5 * 60 * 1000);
})();
