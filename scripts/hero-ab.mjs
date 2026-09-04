import { chromium } from "playwright-core";

const EXEC = "/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const BASE = "https://cdn.builder.io/api/v1/image/assets%2Ff25f245e49654bde9827409a45007914%2F";
const W = "?format=webp&width=1920";

const IMAGES = {
  current_two_bikes: "bca7bdd0928f4f368bd3df793ee29cdc",
  orange_cvo_mountains: "d878dd230e9e41ceae579d70bcec2bcd",
  two_cvo_st_rocks: "ed01bfd4f5f54ac5bb7c4c770872c795",
  black_roadglide_sunset: "5568dddb128942c1b3a2bb82572c5cf7",
  red_cvo_forest: "3681e48e64b740df8ea65db73ea56b52",
  roadglide_ultra_field: "58982fb9371f4afe8b8bac532d30f146",
  old_shop_photo: "f34d3293ef974da897f5007b910db556",
};

const BONE = 0.8531;
const EMBER = 0.3547;
const ratio = (fg, bg) => (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);

const browser = await chromium.launch({
  executablePath: EXEC,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

// One page per viewport, reused across candidates so we only pay page load once.
async function openPage(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  return page;
}

async function applyVariant(page, imgId, mark) {
  return page.evaluate(
    async ({ url, mark }) => {
      const hero = document.querySelector("#top");
      const bg = hero.querySelector("div.bg-cover");
      const img = hero.querySelector('img[aria-hidden="true"]');
      if (url) {
        const pre = new Image();
        await new Promise((res, rej) => {
          pre.onload = res;
          pre.onerror = rej;
          pre.src = url;
        });
        bg.style.backgroundImage = "url('" + url + "')";
      }
      if (mark) {
        img.style.display = mark.show ? "block" : "none";
        if (mark.show) {
          img.style.height = mark.height;
          img.style.opacity = String(mark.opacity);
        }
      }
      await new Promise((r) => requestAnimationFrame(() => r()));
      const applied = getComputedStyle(bg).backgroundImage;
      const m = applied.match(/%2F([0-9a-f]{8})/);
      return { appliedId: m ? m[1] : applied.slice(0, 40) };
    },
    { url: imgId ? BASE + imgId + W : null, mark },
  );
}

async function score(page, label) {
  // glyph line boxes while copy is visible
  const lines = await page.evaluate(() => {
    const hero = document.querySelector("#top");
    const h1 = hero.querySelector("h1");
    const column = h1.parentElement;
    const out = [];
    const walk = (node, owner) => {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 2 || r.height < 2) continue;
          out.push({
            owner,
            text: node.textContent.trim().slice(0, 18),
            x: Math.floor(r.left),
            y: Math.floor(r.top),
            w: Math.ceil(r.width),
            h: Math.ceil(r.height),
          });
        }
      }
      node.childNodes.forEach((c) => walk(c, owner));
    };
    walk(hero.querySelector("p.eyebrow"), "eyebrow");
    walk(h1, "headline");
    const outline = Array.from(column.querySelectorAll("a")).find((a) =>
      a.className.includes("btn-outline"),
    );
    if (outline) walk(outline, "cta");
    return out;
  });

  // hide copy + product card so the shot shows only the treated photo
  const heroBox = await page.evaluate(() => {
    const hero = document.querySelector("#top");
    const h1 = hero.querySelector("h1");
    h1.parentElement.style.visibility = "hidden";
    const links = Array.from(hero.querySelectorAll("a"));
    links[links.length - 1].style.visibility = "hidden";
    const r = hero.getBoundingClientRect();
    return {
      x: Math.round(r.left),
      y: Math.round(r.top),
      w: Math.round(r.width),
      h: Math.round(Math.min(r.height, window.innerHeight)),
    };
  });

  const shot = await page.screenshot({ type: "png" });
  const b64 = shot.toString("base64");

  const out = await page.evaluate(
    async ({ b64, lines, heroBox }) => {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = "data:image/png;base64," + b64;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const lin = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const lum = (r, g, b) =>
        0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

      const textMax = lines.map((l) => {
        const d = ctx.getImageData(l.x, l.y, l.w, l.h).data;
        let max = 0;
        for (let i = 0; i < d.length; i += 4)
          max = Math.max(max, lum(d[i], d[i + 1], d[i + 2]));
        return { ...l, maxLum: max };
      });

      const stats = (x, y, w, h) => {
        const d = ctx.getImageData(x, y, w, h).data;
        let sum = 0;
        let sum2 = 0;
        let n = 0;
        let bright = 0;
        for (let i = 0; i < d.length; i += 4) {
          const L = lum(d[i], d[i + 1], d[i + 2]);
          sum += L;
          sum2 += L * L;
          if (L > 0.18) bright++;
          n++;
        }
        const mean = sum / n;
        return {
          mean,
          std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)),
          brightShare: bright / n,
        };
      };

      const whole = stats(heroBox.x, heroBox.y, heroBox.w, heroBox.h);
      // right 40% is where the scrim is thinnest, i.e. where the photo is
      // actually supposed to read as a photo
      const sx = heroBox.x + Math.round(heroBox.w * 0.6);
      const showcase = stats(
        sx,
        heroBox.y,
        heroBox.w - Math.round(heroBox.w * 0.6),
        heroBox.h,
      );
      return { textMax, whole, showcase };
    },
    { b64, lines, heroBox },
  );

  // restore visibility for the next variant
  await page.evaluate(() => {
    const hero = document.querySelector("#top");
    const h1 = hero.querySelector("h1");
    h1.parentElement.style.visibility = "";
    const links = Array.from(hero.querySelectorAll("a"));
    links[links.length - 1].style.visibility = "";
  });

  let worstMargin = Infinity;
  let worstWho = null;
  for (const t of out.textMax) {
    const isEmber = t.owner === "eyebrow" || t.text.startsWith("Rider");
    const need = t.owner === "headline" ? 3 : 4.5;
    const c = ratio(isEmber ? EMBER : BONE, t.maxLum);
    const margin = c / need;
    if (margin < worstMargin) {
      worstMargin = margin;
      worstWho = t.owner + ":" + t.text + " " + c.toFixed(2) + "/" + need;
    }
  }
  return {
    label,
    aaMargin: +worstMargin.toFixed(3),
    worst: worstWho,
    bgMean: +out.whole.mean.toFixed(4),
    bgStd: +out.whole.std.toFixed(4),
    showMean: +out.showcase.mean.toFixed(4),
    showStd: +out.showcase.std.toFixed(4),
    showBlown: +out.showcase.brightShare.toFixed(4),
  };
}

const desktop = await openPage(1440, 900);
const mobile = await openPage(390, 844);

console.log("### IMAGE CANDIDATES (watermark at current 30rem / 0.06)");
const rows = [];
for (const [name, id] of Object.entries(IMAGES)) {
  const ok = await applyVariant(desktop, id, {
    show: true,
    height: "30rem",
    opacity: 0.06,
  });
  await applyVariant(mobile, id, null);
  await desktop.waitForTimeout(400);
  await mobile.waitForTimeout(400);
  const d = await score(desktop, name + " [desktop]");
  const m = await score(mobile, name + " [mobile]");
  rows.push({ name, d, m });
  console.log(
    name.padEnd(24),
    "applied=" + ok.appliedId,
    "| desktop AA x" + d.aaMargin.toFixed(2).padStart(5),
    "showDetail " + d.showStd.toFixed(3),
    "showMean " + d.showMean.toFixed(3),
    "blown " + (d.showBlown * 100).toFixed(1) + "%",
    "| mobile AA x" + m.aaMargin.toFixed(2).padStart(5),
    "showDetail " + m.showStd.toFixed(3),
  );
  if (d.aaMargin < 1) console.log("     desktop worst:", d.worst);
  if (m.aaMargin < 1) console.log("     mobile  worst:", m.worst);
}

const ranked = rows
  .map((x) => ({
    name: x.name,
    min: Math.min(x.d.aaMargin, x.m.aaMargin),
    detail: x.d.showStd,
  }))
  .sort((a, b) => b.min - a.min);
console.log("\nranked by worst-case AA headroom:");
for (const r of ranked)
  console.log("  x" + r.min.toFixed(2), r.name, "detail=" + r.detail);

// ---- watermark sweep on the two most interesting images ----
async function markStats(page, rect) {
  const shot = await page.screenshot({ type: "png" });
  return page.evaluate(
    async ({ b64, rect }) => {
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
      const d = ctx.getImageData(rect.x, rect.y, rect.w, rect.h).data;
      let sum = 0;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        sum +=
          0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
        n++;
      }
      return sum / n;
    },
    { b64: shot.toString("base64"), rect },
  );
}

async function hideCopy(page, hide) {
  await page.evaluate((hide) => {
    const hero = document.querySelector("#top");
    const v = hide ? "hidden" : "";
    hero.querySelector("h1").parentElement.style.visibility = v;
    const links = Array.from(hero.querySelectorAll("a"));
    links[links.length - 1].style.visibility = v;
  }, hide);
}

const VARIANTS = [
  { label: "no watermark", show: false, height: "0", opacity: 0 },
  { label: "24rem @ 0.05", show: true, height: "24rem", opacity: 0.05 },
  { label: "24rem @ 0.10", show: true, height: "24rem", opacity: 0.1 },
  { label: "30rem @ 0.06", show: true, height: "30rem", opacity: 0.06 },
  { label: "30rem @ 0.12", show: true, height: "30rem", opacity: 0.12 },
  { label: "38rem @ 0.08", show: true, height: "38rem", opacity: 0.08 },
  { label: "46rem @ 0.10", show: true, height: "46rem", opacity: 0.1 },
];

for (const imgName of ["red_cvo_forest", "orange_cvo_mountains"]) {
  console.log("\n### WATERMARK SWEEP on " + imgName + " (desktop 1440)");
  for (const v of VARIANTS) {
    await applyVariant(desktop, IMAGES[imgName], v);
    await desktop.waitForTimeout(350);
    const s = await score(desktop, v.label);
    // perceptibility: mark box mean luminance with mark on vs off
    const rect = await desktop.evaluate(() => {
      const hero = document.querySelector("#top");
      const img = hero.querySelector('img[aria-hidden="true"]');
      const r = img.getBoundingClientRect();
      const hr = hero.getBoundingClientRect();
      const w = r.width || 319;
      const h = r.height || 480;
      return {
        x: Math.round(hr.width / 2 - w / 2),
        y: Math.round(hr.height / 2 - h / 2),
        w: Math.round(w),
        h: Math.round(h),
      };
    });
    await hideCopy(desktop, true);
    const on = await markStats(desktop, rect);
    await applyVariant(desktop, null, { show: false, height: "0", opacity: 0 });
    await desktop.waitForTimeout(200);
    const off = await markStats(desktop, rect);
    await hideCopy(desktop, false);
    console.log(
      v.label.padEnd(15),
      "AA x" + s.aaMargin.toFixed(2),
      "| markBox " + rect.w + "x" + rect.h,
      "lift=" + ((on - off) * 1000).toFixed(2) + "/1000",
      s.aaMargin < 1 ? "FAIL " + s.worst : "",
    );
  }
}

// ---- can we lighten the desktop scrim so the bike actually reads? ----
async function setScrim(page, rightAlpha) {
  await page.evaluate((a) => {
    const hero = document.querySelector("#top");
    const grad = hero.querySelectorAll("div.absolute")[1];
    grad.style.backgroundImage =
      "linear-gradient(to right, rgb(32,30,30) 0%, rgba(32,30,30,0.90) 50%, rgba(32,30,30," +
      a +
      ") 100%)";
  }, rightAlpha);
}

console.log("\n### DESKTOP SCRIM SWEEP (watermark 30rem @ 0.10, 1440)");
for (const imgName of [
  "red_cvo_forest",
  "orange_cvo_mountains",
  "two_cvo_st_rocks",
  "old_shop_photo",
]) {
  console.log("-- " + imgName);
  for (const a of [0.9, 0.75, 0.6, 0.45, 0.3, 0.15]) {
    await applyVariant(desktop, IMAGES[imgName], {
      show: true,
      height: "30rem",
      opacity: 0.1,
    });
    await setScrim(desktop, a);
    await desktop.waitForTimeout(350);
    const s = await score(desktop, "alpha " + a);
    console.log(
      "   right-stop " + String(Math.round(a * 100)).padStart(3) + "% ink",
      "AA x" + s.aaMargin.toFixed(2),
      "detail " + s.showStd.toFixed(3),
      "mean " + s.showMean.toFixed(3),
      "blown " + (s.showBlown * 100).toFixed(1) + "%",
      s.aaMargin < 1 ? "FAIL " + s.worst : "",
    );
  }
}

await desktop.close();
await mobile.close();
await browser.close();
