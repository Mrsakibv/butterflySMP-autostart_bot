const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://seedloaf.com/", {
    waitUntil: "domcontentloaded"
  });

  console.log("Seedloaf opened.");
  console.log("Login manually.");
  console.log("After login, wait until you see your World Overview/dashboard.");
  console.log("Then press ENTER here.");

  await new Promise(resolve => {
    process.stdin.once("data", resolve);
  });

  console.log("Current URL:", page.url());

  await context.storageState({
    path: "auth.json",
    indexedDB: true
  });

  console.log("Authentication state saved.");

  await browser.close();
})();