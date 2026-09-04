import { chromium } from "playwright-core";

const EXEC = "/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failures = 0;

async function audit(width, height, label) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  const prep = await page.evaluate(() => {
    // A fixed overlay (the mobile action bar) paints over the hero, and
    // anything below the fold is not in a viewport screenshot. Sampling
    // either would compare text against pixels it never sits on.
    let cutoff = window.innerHeight;
    const all = document.body.getElementsByTagName("*");
    for (const el of all) {
      if (getComputedStyle(el).position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.bottom >= window.innerHeight - 1 && r.top > 0) {
        cutoff = Math.min(cutoff, Math.floor(r.top));
      }
    }

    const hero = document.querySelector("#top");
    const els = Array.from(
      hero.querySelectorAll("p, h1, a.btn, a.group p"),
    ).filter((el) => el.textContent.trim().length > 0);

    const out = [];
    for (const el of els) {
      if (Array.from(el.children).some((c) => c.tagName === "P")) continue;
      const cs = getComputedStyle(el);
      const m = cs.color.match(/[\d.]+/g).map(Number);
      const rects = [];
      const walk = (node) => {
        if (node.nodeType === 3 && node.textContent.trim()) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const b of range.getClientRects()) {
            if (b.width < 2 || b.height < 2) continue;
            const y = Math.floor(b.top);
            const h = Math.min(Math.ceil(b.height), cutoff - y);
            if (y < 0 || h < 2) continue;
            rects.push({ x: Math.floor(b.left), y, w: Math.ceil(b.width), h });
          }
        }
        node.childNodes.forEach(walk);
      };
      walk(el);
      if (!rects.length) continue;
      const px = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      out.push({
        text: el.textContent.trim().slice(0, 26),
        fg: [m[0], m[1], m[2], m[3] === undefined ? 1 : m[3]],
        px,
        weight,
        large: px >= 24 || (px >= 18.66 && weight >= 700),
        rects,
      });
    }
    // hide glyphs only: backgrounds, borders and fills stay intact
    for (const el of els) el.style.color = "transparent";
    return { targets: out, cutoff };
  });

  const shot = await page.screenshot({ type: "png" });

  const results = await page.evaluate(
    async ({ b64, targets }) => {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = "data:image/png;base64," + b64;
      });
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const lin = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const lum = (r, g, b) =>
        0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

      return targets.map((t) => {
        let worst = Infinity;
        let at = null;
        for (const r of t.rects) {
          const d = ctx.getImageData(r.x, r.y, r.w, r.h).data;
          for (let i = 0; i < d.length; i += 4) {
            const br = d[i];
            const bg2 = d[i + 1];
            const bb = d[i + 2];
            const a = t.fg[3];
            const fr = a * t.fg[0] + (1 - a) * br;
            const fg2 = a * t.fg[1] + (1 - a) * bg2;
            const fb = a * t.fg[2] + (1 - a) * bb;
            const lf = lum(fr, fg2, fb);
            const lb = lum(br, bg2, bb);
            const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
            if (ratio < worst) {
              worst = ratio;
              at = {
                x: r.x + ((i / 4) % r.w),
                y: r.y + Math.floor(i / 4 / r.w),
                bg: [br, bg2, bb],
              };
            }
          }
        }
        return { ...t, worst: +worst.toFixed(2), at };
      });
    },
    { b64: shot.toString("base64"), targets: prep.targets },
  );

  console.log(
    "== " + label + " " + width + "x" + height + " (above y=" + prep.cutoff + ") ==",
  );
  for (const r of results) {
    const need = r.large ? 3 : 4.5;
    const ok = r.worst >= need;
    if (!ok) failures++;
    console.log(
      (ok ? "PASS" : "FAIL").padEnd(5),
      JSON.stringify(r.text).padEnd(30),
      String(r.px) + "px/" + r.weight,
      "a=" + r.fg[3],
      "worst=" + r.worst.toFixed(2),
      "need=" + need,
      ok ? "" : "at " + JSON.stringify(r.at),
    );
  }
  await page.close();
}

for (const [w, h, l] of [
  [1920, 1080, "wide"],
  [1440, 900, "desktop"],
  [1280, 800, "xl"],
  [1024, 800, "lg"],
  [768, 900, "tablet"],
  [430, 932, "mobile-lg"],
  [390, 844, "mobile"],
])
  await audit(w, h, l);

console.log("\nTOTAL FAILURES: " + failures);
await browser.close();
