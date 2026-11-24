#!/usr/bin/env node
/**
 * Capture README demo images + walkthrough GIF (1440×900, dark theme).
 * Requires: API :8000, Vite :5173, demo seed applied.
 * Run: cd frontend && node scripts/capture_demo_preview.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../..");
const OUT = path.join(REPO, "docs/demo/images");
const TMP = path.join(REPO, ".tmp/demo-gif-frames");
/** Use localhost (not 127.0.0.1) — API CORS allows `http://localhost:5173` only */
const BASE = process.env.PALANDER_UI_URL ?? "http://localhost:5173";
const DATE = "2026-10-28";
const VIEWPORT = { width: 1440, height: 900 };
const PASTE_SAMPLE = readFileSync(
  path.join(REPO, "backend/fixtures/demo/schedule_import.txt"),
  "utf8",
).trim();

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[autocomplete="username"]').fill("dev");
  await page.locator('input[autocomplete="current-password"]').fill("dev");
  await page.getByRole("button", { name: /^Sign in/ }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
  return file;
}

async function frame(page, index) {
  const file = path.join(TMP, `frame-${String(index).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

function buildGif() {
  const listFile = path.join(TMP, "giflist.txt");
  const frames = ["hero.png", "planning.png", "recurrence.png", "schedule-import.png"]
    .map((name) => path.join(OUT, name))
    .filter((p) => {
      try {
        readFileSync(p);
        return true;
      } catch {
        return false;
      }
    });

  if (frames.length < 2) {
    console.warn("skip GIF — not enough frames");
    return;
  }

  const body = frames
    .flatMap((f) => [`file '${f.replace(/'/g, "'\\''")}'`, "duration 2"])
    .concat([`file '${frames.at(-1).replace(/'/g, "'\\''")}'`])
    .join("\n");
  writeFileSync(listFile, body);

  const gifOut = path.join(OUT, "walkthrough.gif");
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listFile,
      "-vf",
      "fps=2,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen=256[p];[s1][p]paletteuse",
      gifOut,
    ],
    { stdio: "inherit" },
  );
  if (r.status !== 0) {
    console.warn("ffmpeg failed — GIF not updated");
    return;
  }
  console.log("wrote", gifOut);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("palander-theme", "dark");
    document.documentElement.dataset.theme = "dark";
  });

  await login(page);

  await page.goto(`${BASE}/?date=${DATE}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Daily execution" }).waitFor({
    timeout: 30_000,
  });
  await shot(page, "hero.png");
  await shot(page, "daily.png");
  await frame(page, 0);

  await page.goto(`${BASE}/planning`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Planning" }).waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: "Objectives" }).click();
  await page
    .getByRole("button", { name: "Objectives" })
    .waitFor({ state: "visible" });
  await page.waitForTimeout(800);
  await shot(page, "planning.png");
  await frame(page, 1);

  await page.goto(`${BASE}/?date=${DATE}`, { waitUntil: "networkidle" });
  const eventBlock = page.locator('[role="button"]', {
    hasText: /Deep work block|Team sync/,
  });
  await eventBlock.first().waitFor({ timeout: 20_000 });
  await eventBlock.first().scrollIntoViewIfNeeded();
  await eventBlock.first().dblclick();
  await page.locator("#domain").waitFor({ timeout: 15_000 });
  await page.waitForTimeout(400);
  await shot(page, "recurrence.png");
  await frame(page, 2);
  await page.keyboard.press("Escape");
  await page.locator("#domain").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

  await page.goto(`${BASE}/monthly?date=${DATE}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Import schedule/i }).click();
  await page
    .getByRole("heading", { name: "Import schedule" })
    .waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: "Paste text" }).click();
  await page.locator("textarea").first().fill(PASTE_SAMPLE);
  await page.waitForTimeout(500);
  await shot(page, "schedule-import.png");
  await frame(page, 3);

  await browser.close();
  buildGif();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});