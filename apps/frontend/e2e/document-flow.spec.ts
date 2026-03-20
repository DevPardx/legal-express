import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@legalexpress.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "password123";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/documents/);
}

test.describe("Authentication", () => {
  test("shows login page at /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("wrong@example.com");
    await page.getByLabel("Password").fill("badpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/documents/);
  });
});

test.describe("Document request flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders the multi-step form at /request", async ({ page }) => {
    await page.goto("/request");
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
  });

  test("validates required fields before advancing to step 2", async ({ page }) => {
    await page.goto("/request");
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL(/\/request/);
  });

  test("advances to step 2 after filling required fields in step 1", async ({ page }) => {
    await page.goto("/request");
    await page.getByLabel(/Full Name/i).fill("Jane Smith");
    await page.getByLabel(/Email Address/i).fill("jane@example.com");
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByLabel(/Document Type/i)).toBeVisible();
  });

  test("completes the full form submission and reaches success page", async ({ page }) => {
    await page.goto("/request");

    // Step 1 — client info
    await page.getByLabel(/Full Name/i).fill("Jane Smith");
    await page.getByLabel(/Email Address/i).fill("jane@example.com");
    await page.getByRole("button", { name: /next/i }).click();

    // Step 2 — document details
    await page.selectOption('[name="documentType"]', "CONTRACT");
    await page.selectOption('[name="outputFormat"]', "pdf");
    await page.getByRole("button", { name: /next/i }).click();

    // Step 3 — review & submit
    await expect(page.getByText("Jane Smith")).toBeVisible();
    await page.getByRole("button", { name: /Submit Request/i }).click();

    // Success page
    await page.waitForURL(/\/success\//);
    await expect(page.getByText(/Document Request Submitted/i)).toBeVisible();
  });

  test("shows the conditional urgency field only when urgent is checked", async ({ page }) => {
    await page.goto("/request");
    await page.getByLabel(/Full Name/i).fill("Jane");
    await page.getByLabel(/Email Address/i).fill("jane@example.com");
    await page.getByRole("button", { name: /next/i }).click();

    // Urgency reason field should not be visible initially
    await expect(page.getByLabel(/Reason for Urgency/i)).not.toBeVisible();

    // Check the urgent checkbox
    await page.getByLabel(/Urgent Processing/i).check();

    // Now the reason field should appear
    await expect(page.getByLabel(/Reason for Urgency/i)).toBeVisible();
  });
});

test.describe("Documents dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows the documents dashboard at /documents", async ({ page }) => {
    await page.goto("/documents");
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });

  test("shows the documents list at /documents/list", async ({ page }) => {
    await page.goto("/documents/list");
    await expect(page.getByRole("heading", { name: /My Documents/i })).toBeVisible();
  });

  test("has a New Request button that navigates to /request", async ({ page }) => {
    await page.goto("/documents");
    await page.getByRole("link", { name: /New Request/i }).click();
    await expect(page).toHaveURL(/\/request/);
  });
});

test.describe("Language toggle (i18n)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("toggles to French and back to English", async ({ page }) => {
    await page.goto("/request");
    // English is the default
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();

    // Toggle to French
    await page.getByText("EN | FR").click();
    await expect(page.getByLabel(/Nom complet/i)).toBeVisible();

    // Toggle back to English
    await page.getByText(/FR \| EN/).click();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
  });
});
