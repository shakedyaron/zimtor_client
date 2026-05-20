import { test as setup } from "@playwright/test"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.join(__dirname, ".auth/user.json")

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  // Ensure the .auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (!email || !password) {
    // No credentials — save empty state; dashboard tests will skip themselves
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  await page.goto("/auth")

  // Wait for the form to be ready
  await page.waitForSelector('input[type="email"]')

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Click the submit button (כניסה לחשבון)
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL("/dashboard", { timeout: 20_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
