import { chromium } from "playwright";
import * as path from "path";
import * as os from "os";

export async function runAuth() {
  const userDataDir = path.join(os.homedir(), ".notebooklm-mcp-auth");
  console.log(`Setting up authentication in: ${userDataDir}`);
  
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto("https://notebooklm.google.com/");

  console.log("Please log in to your Google Account in the browser window.");
  console.log("Close the browser window once you have successfully logged in.");

  // Wait for the browser to be closed by the user
  return new Promise<void>((resolve) => {
    browser.on("close", () => {
      console.log("Authentication session saved.");
      resolve();
    });
  });
}
