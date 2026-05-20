import type { Page } from "@playwright/test"

export function hasAuthCredentials() {
  return !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD)
}

export function hasBusinessSlug() {
  return !!process.env.TEST_BUSINESS_SLUG
}

export function getBusinessSlug() {
  return process.env.TEST_BUSINESS_SLUG ?? ""
}

/** Manually log in via the UI (use only when storage state is not set up) */
export async function loginViaUI(page: Page) {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  if (!email || !password) throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD must be set")

  await page.goto("/auth")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL("/dashboard", { timeout: 20_000 })
}
