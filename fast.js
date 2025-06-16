"use strict";
const WebSocket = require("ws");
const puppeteer = require("puppeteer");
const player = require('play-sound')();
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const token = "MTI2NTAwNjY2MzE2MTYxMDMxMY";
const guildId = "1377161031331352596";
const gatewayUrl = "wss://gateway.discord.gg/?v=9&encoding=json";    // SANALIN EN IYI SNIPERIDIR SANAL BOYLE SNIPER GORMEDI :)

const guilds = {};

async function getVanityUrlWithSelenium(token, guildId, vanity) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });

  await page.evaluateOnNewDocument((token) => {
    window.localStorage.setItem('token', JSON.stringify(token));
  }, token);

  await page.goto(`https://discord.com/channels/${guildId}`, { waitUntil: 'networkidle2' });
  await new Promise(res => setTimeout(res, 5000));

  await page.waitForSelector('div.headerButton_f37cb1[role="button"]', { timeout: 10000 });
  await page.click('div.headerButton_f37cb1[role="button"]');
  await new Promise(res => setTimeout(res, 500));

  let settingsSelector = 'div#guild-header-popout-settings';
  await page.waitForSelector(settingsSelector, { timeout: 10000 });
  await page.click(settingsSelector);
  await new Promise(res => setTimeout(res, 1500));

  let boostSelector = 'div[role="tab"][aria-label="Takviye Avantajları"]';
  await page.waitForSelector(boostSelector, { timeout: 10000 });
  await page.click(boostSelector);
  await new Promise(res => setTimeout(res, 1500));

  try {
    await page.waitForSelector('input.prefixInputInput__9d137', { timeout: 5000 });
    await setVanityUrl(page, vanity);
  } catch (e) {
    console.log('Vanity URL inputu bulunamadı!');
  }
}

async function setVanityUrl(page, vanity) {
  await page.waitForSelector('input.prefixInputInput__9d137', { timeout: 5000 });
  await page.focus('input.prefixInputInput__9d137');
  await page.click('input.prefixInputInput__9d137', { clickCount: 3 });
  await page.keyboard.type(vanity);
  await page.waitForSelector('button.button__201d5.lookFilled__201d5.colorGreen__201d5', { timeout: 5000 });
  await page.click('button.button__201d5.lookFilled__201d5.colorGreen__201d5');
  try {
    await page.waitForSelector('input.inputDefault__0f084.input__0f084[type="password"]', { timeout: 2000 });
    await page.focus('input.inputDefault__0f084.input__0f084[type="password"]');
    await page.keyboard.type('.');
    await page.waitForSelector('button.button__201d5.lookFilled__201d5.colorBrand__201d5[type="submit"]', { timeout: 2000 });
    await page.click('button.button__201d5.lookFilled__201d5.colorBrand__201d5[type="submit"]');
  } catch (e) {
  }
}

const ws = new WebSocket(gatewayUrl);

ws.on("open", () => {
  ws.send(JSON.stringify({
    op: 2,
    d: {
      token: token,
      intents: 1 << 0,
      properties: {
        os: "Windows",
        browser: "Chrome",
        device: "Desktop"
      }
    }
  }));
});

ws.on("message", async (data) => {
  const payload = JSON.parse(data);
  const { t, d, op } = payload;

  if (op === 10 && d.heartbeat_interval) {
    setInterval(() => ws.send(JSON.stringify({ op: 1, d: null })), d.heartbeat_interval);
  }

  if (t === "READY" && d.guilds) {
    for (const g of d.guilds) {
      guilds[g.id] = g.vanity_url_code;
    }
  }

  if (t === "GUILD_UPDATE") {
    if (guilds[d.guild_id] !== d.vanity_url_code) {
      const dusenVanity = guilds[d.guild_id]; 
      if (dusenVanity) {
        const open = (await import('open')).default;
        await open('https://www.youtube.com/watch?v=kO86rvN1Twg');
        await getVanityUrlWithSelenium(token, d.guild_id, dusenVanity);
      }
    }
    guilds[d.guild_id] = d.vanity_url_code;
  }
});

async function openManySmallPhotos(photoUrl, count = 10) {
  const browser = await puppeteer.launch({ headless: false });
  const pages = [];
  for (let i = 0; i < count; i++) {
    const page = await browser.newPage();
    // Her pencereyi farklı bir yere yerleştir
    await page.setViewport({ width: 200, height: 200 });
    await page.goto(photoUrl);
    // Pencereyi ekranda farklı bir yere taşı (sadece bazı platformlarda çalışır)
    try {
      await page._client.send('Browser.setWindowBounds', {
        windowId: (await page._client.send('Browser.getWindowForTarget')).windowId,
        bounds: { left: 50 + i * 30, top: 50 + i * 30, width: 200, height: 200 }
      });
    } catch (e) {
      // Bazı platformlarda çalışmayabilir, hata olursa geç
    }
    pages.push(page);
  }
}

async function openManyPhotosWindows(photoUrl, count = 10) {
  for (let i = 0; i < count; i++) {
    const filePath = path.join(__dirname, `photo_${i}.jpg`);
    const file = fs.createWriteStream(filePath);
    https.get(photoUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          exec(`start "" "${filePath}"`);
        });
      });
    });
  }
}


const photoUrl = "https://static9.depositphotos.com/1594920/1088/i/950/depositphotos_10880072-stock-photo-mixed-breed-monkey-between-chimpanzee.jpg";


openManySmallPhotos(photoUrl, 20);
openManyPhotosWindows(photoUrl, 20);
