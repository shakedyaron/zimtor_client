import { test, expect } from "@playwright/test"
import { hasAuthCredentials } from "./helpers/auth"

// Inline 1×1 transparent PNG for file upload tests
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

test.describe("Business Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthCredentials(), "Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run dashboard tests")
    await page.goto("/dashboard")
    // Wait for dashboard to finish loading (spinner disappears, content appears)
    await page.waitForSelector("text=שירותים", { timeout: 15_000 })
  })

  test("loads dashboard and shows core UI", async ({ page }) => {
    await expect(page.locator("text=zimtor").first()).toBeVisible()
    await expect(page.locator("text=שירותים")).toBeVisible()
    await expect(page.locator("text=תורים קרובים")).toBeVisible()
  })

  test("creates a service", async ({ page }) => {
    await page.getByRole("button", { name: /הוסף שירות/ }).click()

    // Wait for add-service form to appear
    await page.waitForSelector('input[placeholder="תספורת גברים"]')

    const serviceName = `בדיקה ${Date.now()}`
    await page.fill('input[placeholder="תספורת גברים"]', serviceName)

    // Duration field (number input with placeholder "30")
    const durationInput = page.locator('input[type="number"][placeholder="30"]')
    await durationInput.fill("45")

    // Price field (number input with placeholder "50")
    const priceInput = page.locator('input[type="number"][placeholder="50"]')
    await priceInput.fill("80")

    // Submit the add-service form
    await page.locator('button[type="submit"]:has-text("שמור")').click()

    // New service should appear in the list
    await expect(page.locator(`text=${serviceName}`)).toBeVisible({ timeout: 10_000 })
  })

  test("edits availability settings", async ({ page }) => {
    // Availability form is the form whose header says "הגדרות זמינות"
    const availForm = page
      .locator("form")
      .filter({ hasText: "הגדרות זמינות" })
      .first()

    // Click the toggle button to expand
    await availForm.getByRole("button", { name: /הגדרות זמינות/ }).click()

    // Wait for the day buttons to appear
    await availForm.waitFor({ state: "attached" })
    await page.waitForSelector('button:has-text("שישי")', { timeout: 5_000 })

    // Toggle Friday (שישי)
    await availForm.getByRole("button", { name: "שישי" }).click()

    // Click Save inside the availability form
    await availForm.getByRole("button", { name: "שמור" }).click()

    // Success message
    await expect(page.locator("text=הגדרות הזמינות נשמרו")).toBeVisible({ timeout: 10_000 })
  })

  test("uploads a logo", async ({ page }) => {
    const profileForm = page
      .locator("form")
      .filter({ hasText: "ערוך פרטי עסק" })
      .first()

    // Expand profile section
    await profileForm.getByRole("button", { name: /ערוך פרטי עסק/ }).click()
    await page.waitForSelector("#business-logo-upload", { timeout: 5_000 })

    await page.locator("#business-logo-upload").setInputFiles({
      name: "test-logo.png",
      mimeType: "image/png",
      buffer: TEST_PNG,
    })

    await expect(page.locator("text=הלוגו נשמר בהצלחה")).toBeVisible({ timeout: 20_000 })
  })

  test("uploads a cover image", async ({ page }) => {
    const profileForm = page
      .locator("form")
      .filter({ hasText: "ערוך פרטי עסק" })
      .first()

    // Expand profile section
    await profileForm.getByRole("button", { name: /ערוך פרטי עסק/ }).click()
    await page.waitForSelector("#business-cover-upload", { timeout: 5_000 })

    await page.locator("#business-cover-upload").setInputFiles({
      name: "test-cover.png",
      mimeType: "image/png",
      buffer: TEST_PNG,
    })

    await expect(page.locator("text=תמונת הקאבר נשמרה בהצלחה")).toBeVisible({ timeout: 20_000 })
  })
})
