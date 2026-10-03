import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { validatePage } from "../lib/page-schema";

test("home lists the demo pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Landing pages from validated JSON");
  for (const slug of ["launch", "webinar", "saas"]) {
    await expect(page.locator(`a[href="/p/${slug}"]`).first()).toBeVisible();
    await expect(page.locator(`a[href="/editor/${slug}"]`).first()).toBeVisible();
  }
});

test("/p/launch renders the hero headline, OG image and click-to-load video", async ({ page, request }) => {
  await page.goto("/p/launch");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Send the invoice before you close the laptop");
  await expect(page).toHaveTitle("Tally 2.0: invoicing for freelancers, launch week pricing");

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toContain("/p/launch/opengraph-image");
  const og = await request.get(new URL(ogImage!).pathname);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toBe("image/png");

  // FAQ is native details/summary
  const firstQuestion = page.locator("#faq summary").first();
  await firstQuestion.click();
  await expect(page.locator("#faq details").first()).toHaveAttribute("open", "");

  // The YouTube iframe is only added after clicking play
  await expect(page.locator("#tour iframe")).toHaveCount(0);
  await page.getByRole("button", { name: /Play video: Tally 2.0 product tour/ }).click();
  await expect(page.locator("#tour iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/);
});

test("editor: change hero headline, preview updates, export downloads valid JSON", async ({ page }) => {
  await page.goto("/editor/launch");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText("Send the invoice before you close the laptop");

  const headline = page.getByLabel("Headline", { exact: true });
  await headline.fill("Invoices that send themselves");
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText("Invoices that send themselves");

  // Field-level validation from zod
  await headline.fill("");
  await expect(page.getByText("Headline is required", { exact: true })).toBeVisible();
  await headline.fill("Invoices that send themselves");

  // Draft survives a reload (localStorage)
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByRole("region", { name: "Live preview" }).getByRole("heading", { level: 1 })).toHaveText(
    "Invoices that send themselves",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("launch.json");
  const json = JSON.parse(await readFile((await download.path())!, "utf8"));
  const result = validatePage(json);
  expect(result.ok).toBe(true);
  expect(json.blocks[0].props.headline).toBe("Invoices that send themselves");
});

test("editor: add a block from the registry and reorder it with the keyboard buttons", async ({ page }) => {
  await page.goto("/editor/saas");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const list = page.getByRole("list", { name: "Page blocks" });
  await expect(list.getByRole("listitem").first()).toBeVisible();
  const before = await list.getByRole("listitem").count();

  await page.getByRole("button", { name: "Page settings" }).click();
  await page.getByRole("button", { name: "+ Add block" }).click();
  await page.getByRole("button", { name: /^Countdown/ }).click();
  await expect(list.getByRole("listitem")).toHaveCount(before + 1);
  await expect(list.getByRole("listitem").last()).toContainText("Countdown");

  await page.getByRole("button", { name: "Move Countdown up" }).click();
  await expect(list.getByRole("listitem").nth(before - 1)).toContainText("Countdown");
});

test("lead form on /p/webinar submits and the lead shows up in GET /api/leads", async ({ page, request }) => {
  const name = `E2E ${Date.now()}`;
  await page.goto("/p/webinar");
  const form = page.locator("#inscricao");
  await form.getByRole("textbox", { name: "Nome" }).fill(name);
  await form.getByRole("textbox", { name: "E-mail" }).fill("e2e@example.com");
  await form.getByLabel(/Aceito receber/).check();
  await form.getByRole("button", { name: "Quero minha vaga" }).click();
  await expect(form.getByRole("status")).toContainText("Inscrição confirmada");

  const res = await request.get("/api/leads");
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { sandbox: boolean; leads: { name?: string; email: string; listId?: string }[] };
  expect(body.sandbox).toBe(true);
  const lead = body.leads.find((l) => l.name === name);
  expect(lead).toBeDefined();
  expect(lead!.email).toBe("e2***@example.com");
  expect(lead!.listId).toBe("aula-checkout-nov26");
});

test("leads API rejects invalid input and silently drops honeypot hits", async ({ request }) => {
  const invalid = await request.post("/api/leads", {
    data: { pageSlug: "webinar", blockId: "inscricao", email: "nope" },
  });
  expect(invalid.status()).toBe(422);
  expect((await invalid.json()).fields.email).toBeTruthy();

  const bot = await request.post("/api/leads", {
    data: {
      pageSlug: "webinar",
      blockId: "inscricao",
      name: "Bot",
      email: "bot@example.com",
      consent: true,
      website: "http://spam",
    },
  });
  expect(bot.status()).toBe(200);
  const leads = (await (await request.get("/api/leads")).json()).leads as { name?: string }[];
  expect(leads.some((l) => l.name === "Bot")).toBe(false);
});
