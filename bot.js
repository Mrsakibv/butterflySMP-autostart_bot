
const { chromium } = require("playwright");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

async function getBotStatus() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/site_settings?select=bot_enabled&id=eq.true`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase request failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.length) {
    throw new Error("site_settings record not found");
  }

  return data[0].bot_enabled;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log("================================");
  console.log("Starting Seedloaf bot...");
  console.log("================================");

  let browser;

  try {
    console.log("Starting Chromium...");

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    });

    const context = await browser.newContext({
      storageState: "auth.json",
    });

    const page = await context.newPage();

    console.log("Opening Seedloaf...");

    await page.goto("https://seedloaf.com/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    console.log("Current URL:", page.url());

    const login = page.getByText("Login", {
      exact: true,
    });

    if (await login.isVisible().catch(() => false)) {
      console.log("Login button found. Clicking...");

      await login.click();

      await page.waitForTimeout(5000);
    }

    console.log("Opening dashboard...");

    await page.goto("https://seedloaf.com/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    console.log("Dashboard loaded.");
    console.log("Current URL:", page.url());

    while (true) {
      try {
        console.log("\n================================");
        console.log("Checking bot control...");
        console.log("================================");

        const enabled = await getBotStatus();

        console.log(
          "Seedloaf Bot:",
          enabled ? "ON" : "OFF"
        );

        if (!enabled) {
          console.log(
            "Bot is OFF from Admin Dashboard."
          );

          console.log(
            "Automatic world start is disabled."
          );

          console.log(
            "Checking again in 60 seconds..."
          );

          await wait(60000);

          continue;
        }

        console.log(
          "Bot is ON. Refreshing Seedloaf dashboard..."
        );

        await page.reload({
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        await page.waitForTimeout(5000);

        console.log("Dashboard refreshed.");
        console.log("Checking world status...");

        const startButton = page.getByRole("button", {
          name: "Start World",
        });

        if (
          await startButton.isVisible().catch(() => false)
        ) {
          console.log("World is OFF.");
          console.log("Starting world...");

          await startButton.click();

          console.log("Start World clicked!");

          await page.waitForTimeout(5000);

          console.log(
            "Start request completed."
          );
        } else {
          console.log(
            "World appears to be ONLINE."
          );
        }

        console.log(
          "Next check in 60 seconds..."
        );

        await wait(60000);

      } catch (error) {
        console.log(
          "\nSomething went wrong:"
        );

        console.log(error.message);

        console.log(
          "Retrying in 60 seconds..."
        );

        await wait(60000);
      }
    }

  } catch (error) {
    console.error(
      "Fatal error:",
      error.message
    );

    if (browser) {
      await browser.close().catch(() => {});
    }

    process.exit(1);
  }
})();
