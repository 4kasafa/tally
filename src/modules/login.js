require('dotenv').config();
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  await page.goto("https://pos.ketoko.co.id/login-form", { waitUntil: "networkidle2" });

  // Isi Id Perusahaan
  await page.type('input.dx-texteditor-input', process.env.KETOKO_COMPANY || "LAYTOKOBPN");

  // Isi User ID
  await page.type('input.dx-texteditor-input', process.env.KETOKO_USERNAME || "SALAM-PR");

  // Isi Password
  await page.type('input.dx-texteditor-input', process.env.KETOKO_PASSWORD || "SALAM");

  // Tunggu dropdown Shift muncul lalu pilih
  await page.waitForSelector('dx-select-box[placeholder="Login Shift"], input[aria-haspopup="listbox"]', { timeout: 15000 });
  await page.click('dx-select-box[placeholder="Login Shift"] .dx-dropdowneditor-button, input[aria-haspopup="listbox"]');

  await page.waitForSelector('.dx-list-item', { timeout: 10000 });
  const SHIFT = process.env.KETOKO_SHIFT || "SORE";
  const [shiftOption] = await page.$x(`//div[contains(@class,"dx-list-item") and normalize-space(text())="${SHIFT}"]`);
  if (shiftOption) {
    await shiftOption.click();
  } else {
    const firstOption = await page.$('.dx-list-item');
    if (firstOption) await firstOption.click();
  }

  // Klik tombol Login
  const [loginBtn] = await page.$x("//div[contains(@class,'dx-button') and .//span[text()='Login']]");
  if (loginBtn) {
    await loginBtn.click();
  }

  await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(()=>{});

  console.log("✅ Login selesai, termasuk pilih shift.");
})();
