/**
 * post-generator.js
 *
 * Usage: node post-generator.js
 *
 * Environment variables (set these in GitHub secrets):
 * - OPENAI_API_KEY (required)
 * - ADMIN_URL (optional, default https://thinkscope.netlify.app/admin)
 * - ADMIN_USERNAME (optional)
 * - ADMIN_PASSWORD (optional)
 *
 * IMPORTANT: You must update the CSS selectors below to match your admin form.
 */

import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import puppeteer from "puppeteer";

const REPO_ROOT = process.cwd();
const CATEGORIES_FILE = path.join(REPO_ROOT, "categories.json");
const STATE_FILE = path.join(REPO_ROOT, "state.json");
const LOG_FILE = path.join(REPO_ROOT, "posts_log.csv");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ADMIN_URL = process.env.ADMIN_URL || "https://thinkscope.netlify.app/admin";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

if (!OPENAI_KEY) {
  console.error("OPENAI_API_KEY missing. Set it in environment variables.");
  process.exit(1);
}

async function readJson(file) {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function writeJson(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2), "utf8");
}

async function appendLog(row) {
  const exists = await fs.access(LOG_FILE).then(() => true).catch(() => false);
  const header = "timestamp,title,category,post_url,status,notes\n";
  const csv = `${row.timestamp},${escapeCsv(row.title)},${escapeCsv(row.category)},${escapeCsv(row.post_url || "")},${row.status},${escapeCsv(row.notes || "")}\n`;
  if (!exists) {
    await fs.writeFile(LOG_FILE, header + csv, "utf8");
  } else {
    await fs.appendFile(LOG_FILE, csv, "utf8");
  }
}

function escapeCsv(s) {
  if (!s) return "";
  return `"${s.replace(/"/g, '""')}"`;
}

async function generatePost(category) {
  const prompt = `You are a helpful blog writer. Produce a single JSON response (no extra text) with keys:
"title": short catchy title (6-10 words),
"content_html": the blog content as HTML (approx 450-600 words, with paragraphs and 2-3 subheadings),
"meta_description": 120-150 characters.
Write a post for the category: ${category}. Use simple language and end with 2-3 bullet takeaways (use <ul><li>) inside content_html.`;
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",   // you may change the model name
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.7
    })
  });

  const j = await res.json();
  if (!j.choices || !j.choices[0]) throw new Error("OpenAI returned no choices: " + JSON.stringify(j));
  // The assistant reply might include surrounding text — try to parse JSON out of it.
  const raw = j.choices[0].message.content;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Try to extract JSON substring
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      const sub = raw.slice(first, last + 1);
      parsed = JSON.parse(sub);
    } else {
      throw new Error("Failed to parse JSON from OpenAI response: " + raw);
    }
  }
  return parsed;
}

async function run() {
  // Read categories and state
  const cats = await readJson(CATEGORIES_FILE);
  const state = await readJson(STATE_FILE);
  const idx = Number(state.next_index || 0);
  const category = cats.categories[idx % cats.categories.length];

  console.log("Selected category:", category);

  // Generate post from OpenAI
  console.log("Generating post via OpenAI...");
  const post = await generatePost(category);
  console.log("Title:", post.title);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  // Optional login flow (update selectors below if your site requires login)
  await page.goto(ADMIN_URL, { waitUntil: "networkidle2" });

  // If login fields exist and secrets are provided, perform login
  if (ADMIN_USERNAME && ADMIN_PASSWORD) {
    try {
      // TODO: update these selectors to match your admin login form
      const userSel = 'input[name="username"]';
      const passSel = 'input[name="password"]';
      const submitSel = 'button[type="submit"]';

      if (await page.$(userSel)) {
        await page.type(userSel, ADMIN_USERNAME, { delay: 50 });
        await page.type(passSel, ADMIN_PASSWORD, { delay: 50 });
        await Promise.all([
          page.click(submitSel),
          page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 })
        ]);
        console.log("Logged into admin.");
      } else {
        console.log("Login selectors not found — continuing without login.");
      }
    } catch (e) {
      console.warn("Login attempt failed:", e.message);
    }
  }

  // Wait for editor to be ready
  await page.waitForTimeout(1200);

  // ---------- UPDATE THESE SELECTORS to match your admin page ----------
  // Title input:
  const titleSelector = 'input[name="title"], input#title, textarea[name="title"]';
  // Category dropdown or label: try select, else click label
  const categorySelectSelector = 'select[name="category"], select#category';
  // For tag-style clickable categories, use a label that contains the text
  const clickableCategoryLabelXPath = `//label[contains(normalize-space(.), "${category}")]`;
  // Content editable field (plain textarea or contenteditable)
  const contentTextareaSelector = 'textarea[name="content"], textarea#content, div[contenteditable="true"]';
  // Publish button
  const publishButtonSelector = 'button[type="submit"], button#publish, button:contains("Publish")';
  // --------------------------------------------------------------------

  // Fill title
  const titleEl = await page.$(titleSelector);
  if (titleEl) {
    await titleEl.click({ clickCount: 3 });
    await titleEl.type(post.title, { delay: 15 });
  } else {
    console.warn("Title selector not found. Inspect your admin page and update titleSelector in script.");
  }

  // Select category
  const catSelEl = await page.$(categorySelectSelector);
  if (catSelEl) {
    try {
      // Try to set value directly
      await page.select(categorySelectSelector, category);
      console.log("Category selected via select element.");
    } catch {
      // fallback: set via JS
      await page.evaluate((sel, category) => {
        const s = document.querySelector(sel);
        if (s) {
          for (const opt of s.options) {
            if (opt.text.trim().toLowerCase() === category.trim().toLowerCase()) {
              s.value = opt.value;
              s.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        }
      }, categorySelectSelector, category);
    }
  } else {
    // Try clicking a label with the category text
    const [label] = await page.$x(clickableCategoryLabelXPath);
    if (label) {
      await label.click();
      console.log("Clicked category label.");
    } else {
      console.warn("Category selector not found. Update category selectors in script.");
    }
  }

  // Fill content
  const contentEl = await page.$(contentTextareaSelector);
  if (contentEl) {
    // Some editors are contenteditable divs
    const tag = await page.evaluate(el => el.tagName.toLowerCase(), contentEl);
    if (tag === "textarea" || tag === "input") {
      await contentEl.click({ clickCount: 3 });
      // Remove HTML if editor is plain textarea
      const plain = post.content_html.replace(/<\/?[^>]+(>|$)/g, "");
      await contentEl.type(plain, { delay: 5 });
    } else {
      // contenteditable
      await page.evaluate((sel, html) => {
        const el = document.querySelector(sel);
        if (el) el.innerHTML = html;
      }, contentTextareaSelector, post.content_html);
    }
    console.log("Content populated.");
  } else {
    // If using iframe based editor (e.g., TinyMCE), try to set its body
    const frames = page.frames();
    let setInFrame = false;
    for (const frame of frames) {
      try {
        await frame.evaluate((html) => {
          if (document.body) {
            document.body.innerHTML = html;
            return true;
          }
          return false;
        }, post.content_html);
        setInFrame = true;
        console.log("Set content in iframe editor.");
        break;
      } catch (e) {
        /* ignore */
      }
    }
    if (!setInFrame) {
      console.warn("Content area not found. Inspect your editor and update contentTextareaSelector.");
    }
  }

  // Optional: set meta description if your admin form has a meta field
  // await page.type('input[name="meta_description"]', post.meta_description || "", { delay: 10 });

  // Publish
  // Try to click a publish button. You likely need to update selector.
  const publishEl = await page.$(publishButtonSelector);
  if (publishEl) {
    await Promise.all([
      publishEl.click(),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {})
    ]);
    console.log("Clicked publish.");
  } else {
    // Try to find a button that contains "Publish"
    const publishBtn = await page.$x("//button[contains(normalize-space(.), 'Publish')]");
    if (publishBtn.length) {
      await publishBtn[0].click();
      await page.waitForTimeout(1500);
      console.log("Clicked publish (XPath).");
    } else {
      console.warn("Publish button not found; check publishButtonSelector and update.");
    }
  }

  // Give some time for publish to complete
  await page.waitForTimeout(2000);

  // Try to capture the post URL after publish (if your admin redirects)
  let postUrl = "";
  try {
    postUrl = page.url();
  } catch {}

  await browser.close();

  // Append log
  const now = new Date().toISOString();
  await appendLog({
    timestamp: now,
    title: post.title,
    category,
    post_url: postUrl,
    status: "Published",
    notes: ""
  });

  // Update next_index and write state file
  state.next_index = (idx + 1) % cats.categories.length;
  await writeJson(STATE_FILE, state);

  console.log("Done. Updated next_index to", state.next_index);
}

run().catch(async (err) => {
  console.error("Error during run:", err);
  // Append error to log
  const now = new Date().toISOString();
  await appendLog({
    timestamp: now,
    title: "",
    category: "",
    post_url: "",
    status: "ERROR",
    notes: err.message.replace(/(\r|\n)/g, " ")
  });
  process.exit(1);
});
