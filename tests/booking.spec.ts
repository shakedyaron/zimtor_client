import { test, expect } from "@playwright/test"
import { hasBusinessSlug, getBusinessSlug } from "./helpers/auth"

test.describe("Booking Flow", () => {
  test.beforeEach(() => {
    test.skip(!hasBusinessSlug(), "Set TEST_BUSINESS_SLUG to run booking flow tests")
  })

  test("booking page loads and shows business info", async ({ page }) => {
    await page.goto(`/${getBusinessSlug()}`)
    await expect(page.locator("text=zimtor")).toBeVisible()
    await expect(page.locator("text=קביעת תור")).toBeVisible()
  })

  test("step 1 — choose a service", async ({ page }) => {
    await page.goto(`/${getBusinessSlug()}`)

    // Wait for services to load (spinner gone)
    await page.waitForSelector("text=בחר שירות", { timeout: 10_000 })

    // Check step indicator shows step 1 active
    await expect(page.locator("text=שירות").first()).toBeVisible()

    // There should be at least one service card
    const serviceCards = page.locator("button").filter({ hasText: /משך:/ })
    const count = await serviceCards.count()
    expect(count).toBeGreaterThan(0)

    // Click the first service
    await serviceCards.first().click()

    // Should advance to step 2
    await expect(page.locator("text=תאריך ושעה")).toBeVisible({ timeout: 5_000 })
  })

  test("step 2 — choose available date and time", async ({ page }) => {
    await page.goto(`/${getBusinessSlug()}`)
    await page.waitForSelector("text=בחר שירות", { timeout: 10_000 })

    // Pick first service
    await page.locator("button").filter({ hasText: /משך:/ }).first().click()
    await page.waitForSelector("text=תאריך ושעה", { timeout: 5_000 })

    // A date should already be pre-selected; look for available time slots
    await page.waitForSelector("text=שעות פנויות", { timeout: 10_000 })

    // If there are available slots, pick one
    const slots = page.locator("div").filter({ hasText: /שעות פנויות/ }).locator("button").filter({ hasText: /\d{2}:\d{2}/ })
    const slotCount = await slots.count()

    if (slotCount > 0) {
      await slots.first().click()
      // Continue button
      await page.getByRole("button", { name: "המשך" }).click()
      // Should advance to step 3
      await expect(page.locator("text=פרטי הזמנה")).toBeVisible({ timeout: 5_000 })
    } else {
      // No slots available on pre-selected date — just verify UI shows the message
      await expect(page.locator("text=אין שעות פנויות").or(page.locator("text=העסק סגור"))).toBeVisible()
    }
  })

  test("full booking flow — complete appointment", async ({ page }) => {
    await page.goto(`/${getBusinessSlug()}`)
    await page.waitForSelector("text=בחר שירות", { timeout: 10_000 })

    // Step 1: pick first service
    await page.locator("button").filter({ hasText: /משך:/ }).first().click()
    await page.waitForSelector("text=תאריך ושעה", { timeout: 5_000 })

    // Step 2: wait for slots, pick the first available one
    await page.waitForSelector("text=שעות פנויות", { timeout: 10_000 })

    const slots = page
      .locator("div")
      .filter({ hasText: /שעות פנויות/ })
      .locator("button")
      .filter({ hasText: /\d{2}:\d{2}/ })

    const slotCount = await slots.count()
    test.skip(slotCount === 0, "No available time slots to book")

    await slots.first().click()
    await page.getByRole("button", { name: "המשך" }).click()
    await page.waitForSelector("text=פרטי הזמנה", { timeout: 5_000 })

    // Step 3: fill customer details
    await page.fill('#cname', "לקוח בדיקה")
    await page.fill('#cphone', "0500000000")

    await page.getByRole("button", { name: "קבע תור" }).click()

    // Step 4: success screen
    await expect(page.locator("text=התור נקבע!")).toBeVisible({ timeout: 15_000 })
    await expect(page.locator("text=לקוח בדיקה")).toBeVisible()
  })

  test("can book another appointment after success", async ({ page }) => {
    await page.goto(`/${getBusinessSlug()}`)
    await page.waitForSelector("text=בחר שירות", { timeout: 10_000 })

    // Quick flow to success (reuse same pattern)
    await page.locator("button").filter({ hasText: /משך:/ }).first().click()
    await page.waitForSelector("text=שעות פנויות", { timeout: 10_000 })

    const slots = page
      .locator("div")
      .filter({ hasText: /שעות פנויות/ })
      .locator("button")
      .filter({ hasText: /\d{2}:\d{2}/ })

    test.skip(await slots.count() === 0, "No available time slots")

    await slots.first().click()
    await page.getByRole("button", { name: "המשך" }).click()
    await page.fill('#cname', "בדיקה")
    await page.fill('#cphone', "0500000001")
    await page.getByRole("button", { name: "קבע תור" }).click()
    await page.waitForSelector("text=התור נקבע!", { timeout: 15_000 })

    // Click "book another"
    await page.getByRole("button", { name: "קביעת תור נוסף" }).click()

    // Should be back at step 1
    await expect(page.locator("text=בחר שירות")).toBeVisible()
  })
})
