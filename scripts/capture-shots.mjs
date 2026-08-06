/**
 * Screenshots the live deployments into `public/shots/<slug>/`.
 *
 *   npm run capture:shots            # every project that has a liveUrl
 *   npm run capture:shots -- --only music-genre-classifier
 *   npm run capture:shots -- --keep-png   # leave the raw PNGs for inspection
 *   npm run capture:shots -- --video      # also record the hover clips
 *   npm run capture:shots -- --video --audio ~/some-track.mp3
 *
 * Deliberately NOT a build step, for the same reason `sync-github.mjs` is not:
 * builds stay deterministic and offline, and a Streamlit app being asleep can
 * never break a deploy. Run it when a project's UI changes, look at the files,
 * commit them.
 *
 * Captures per project:
 *   poster.avif  — the viewport, what ships on first load
 *   tall.avif    — the full page, which the frame pans on hover
 *   demo.webm    — `--video` only; the clip the frame plays on hover
 *
 * The clips are opt-in because they need `ffmpeg` on PATH (`brew install
 * ffmpeg`) and because only some projects have anything worth filming. A clip
 * is scripted per project in `DEMO` below — a slow scroll of a one-screen app
 * shows nothing, so there is no generic fallback. A project with no `DEMO`
 * entry keeps its poster, and the frame falls back to the CSS hover treatment.
 *
 * The live URLs are read out of `src/content/projects.ts` rather than repeated
 * here, so there is no second list to keep in sync. What this script cannot
 * know is the alt text and the address-bar hostname; those are copy, and copy
 * lives in `src/content/**`. The script prints a ready-made `media` block at
 * the end for you to paste in and then write the alt text by hand.
 *
 * Streamlit and Hugging Face Spaces cold-start. The first request to a sleeping
 * app returns a spinner, and a spinner committed as a screenshot is worse than
 * no screenshot. `settle()` below waits for the app's own content and the
 * script refuses to write a capture it believes is still loading.
 */

import { mkdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { execFile as execFileCb } from "node:child_process";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const execFile = promisify(execFileCb);
const HOME = os.homedir();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = path.join(ROOT, "public/shots");

const BRAVE =
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

/** Desktop-ish, and 2x so the AVIF still looks sharp on a retina laptop. */
const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

/** The pan only needs a screenful or two of travel. Beyond that is dead weight. */
const MAX_TALL_RATIO = 2.5;

/** Above this and the shot is not worth its bytes; re-crop or lower quality. */
const POSTER_BUDGET = 60 * 1024;

/**
 * A clip is fetched only on hover, so it is not first-load weight — but it is
 * still someone's data, and a portfolio preview that takes a second to arrive
 * has missed its moment.
 */
const VIDEO_BUDGET = 400 * 1024;

/** Long enough to show the app doing something, short enough to loop cleanly. */
const MAX_CLIP_SECONDS = 15;

/**
 * A demo runs at the app's pace, and a free dyno's pace includes several
 * seconds of nothing happening while it thinks. Played back a little faster the
 * clip keeps its content and loses the dead air — the same reason product demos
 * are almost never shown in real time.
 */
const PLAYBACK_SPEED = 1.6;

const args = process.argv.slice(2);
const flag = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : null;
const only = flag("--only");
const keepPng = args.includes("--keep-png");
const wantVideo = args.includes("--video");

/**
 * The music classifier's entire UI is a file drop zone — without a real track
 * it has nothing to show, and a synthetic tone would only produce a nonsense
 * prediction on screen. Pass a file you have the rights to. It is read from
 * outside the repo on purpose: it drives the recording, it is not an asset the
 * site ships.
 */
const audioPath = flag("--audio");

/**
 * Pulls slug + liveUrl straight out of the content file. A regex rather than an
 * import because `projects.ts` is TypeScript and this script is plain node --
 * adding a TS loader to read two fields would be a poor trade.
 */
async function readProjects() {
  const src = await readFile(path.join(ROOT, "src/content/projects.ts"), "utf8");
  const out = [];
  const entry = /slug:\s*"([^"]+)"[\s\S]*?(?=slug:\s*"|export function)/g;
  for (const [block, slug] of src.matchAll(entry)) {
    const live = block.match(/liveUrl:\s*"([^"]+)"/);
    if (live) out.push({ slug, liveUrl: live[1] });
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Free-tier hosts idle their apps out. The screen they serve instead is a
 * perfectly valid-looking page — plenty of text, no spinner — so "did the page
 * load" is the wrong question. These are the exact strings the two hosts use.
 */
const ASLEEP =
  /gone to sleep|is sleeping|wake it back up|restart this space|zzzz|waking up|is starting|preparing space|taking longer than normal|check back in a minute|building|please wait/i;

/**
 * Text that is present whether or not the app has rendered, and so proves
 * nothing. Streamlit's shell serves the `<noscript>` line from the very first
 * byte; counting it as content is what let a half-booted app through and
 * overwrote a good screenshot with a "taking longer than normal" screen.
 */
const BOILERPLATE = /you need to enable javascript to run this app\.?/gi;

/** Third-party widgets that are never the app being captured. */
const IGNORED_FRAMES = /statuspage\.io|googletagmanager|doubleclick/i;

/** The button that wakes each one. Matched on its label, not a brittle selector. */
const WAKE_LABEL = /yes, get this app back up|restart this space|wake/i;

/**
 * Reads the page across every frame.
 *
 * Two traps, both learned the hard way. Streamlit Cloud serves the app inside
 * an iframe — the top document says only "You need to enable JavaScript", so
 * looking at `page` alone concludes the app is blank forever. And Streamlit's
 * `innerText` comes back empty even once it has rendered, so `textContent` is
 * the reliable read. Frames also detach mid-boot when the host reloads the
 * page, hence the per-frame try/catch.
 */
async function look(page) {
  let text = "";
  let spinner = false;

  for (const frame of page.frames()) {
    if (IGNORED_FRAMES.test(frame.url())) continue;
    try {
      const seen = await frame.evaluate(() => {
        const el = document.body || document.documentElement;
        if (!el) return null;
        return {
          text: (el.innerText || el.textContent || "").trim(),
          spinner: Boolean(
            document.querySelector(
              '[data-testid="stSkeleton"], .stSpinner, .loading, [aria-busy="true"]',
            ),
          ),
        };
      });
      if (!seen) continue;
      if (seen.text) text += `\n${seen.text}`;
      spinner = spinner || seen.spinner;
    } catch {
      // Frame detached while the host was reloading. Nothing to read.
    }
  }

  // Measure only what the app itself put on screen. Returned in full, not
  // truncated: callers wait on text that can appear well down the page.
  text = text.replace(BOILERPLATE, "").trim();
  return { text, length: text.length, spinner };
}

/** Clicks the wake button wherever it lives. Returns whether it clicked. */
async function wake(page) {
  for (const frame of page.frames()) {
    try {
      const clicked = await frame.evaluate((source) => {
        const re = new RegExp(source, "i");
        const el = [...document.querySelectorAll("button, a")].find((n) =>
          re.test(n.innerText || n.textContent || ""),
        );
        if (!el) return false;
        el.click();
        return true;
      }, WAKE_LABEL.source);
      if (clicked) return true;
    } catch {
      // Detached mid-boot.
    }
  }
  return false;
}

/**
 * Waits for the app itself, waking it first if the host has idled it out.
 * A cold Streamlit boot is ~30s; a Hugging Face Space rebuilding can be minutes,
 * hence the generous ceiling. Returns null rather than screenshotting a
 * placeholder — a sleep screen committed as a portfolio shot is worse than an
 * empty slot.
 */
async function settle(page, { budgetMs = 240_000 } = {}) {
  const deadline = Date.now() + budgetMs;
  let woke = false;

  await sleep(2500);
  while (Date.now() < deadline) {
    const state = await look(page);
    const asleep = ASLEEP.test(state.text);

    if (!asleep && !state.spinner && state.length > 120) return state;

    if (asleep && !woke && (await wake(page))) {
      woke = true;
      process.stdout.write("  · app was asleep — woke it, waiting for boot\n");
      await sleep(10_000);
      continue;
    }
    await sleep(5000);
  }
  return null;
}

/**
 * Kills the things that ruin a screenshot: banners, carets, running animation.
 * Applied to every frame, since the app itself may be one.
 */
async function tidy(page) {
  const css = `
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      [class*="cookie" i], [id*="cookie" i],
      [class*="consent" i], [id*="consent" i],
      [class*="banner" i][class*="privacy" i] { display: none !important; }
  `;
  for (const frame of page.frames()) {
    try {
      await frame.addStyleTag({ content: css });
    } catch {
      // Detached, or a cross-origin frame we cannot touch. Not fatal.
    }
  }
  await sleep(400);
}

/**
 * One AVIF per capture, and only one. `next/image` re-encodes to WebP itself
 * for anything that cannot take AVIF (`formats` in `next.config.ts`), so
 * shipping a second source file here would be bytes in the repo that no request
 * ever asks for. Every browser in `browserslist` supports AVIF anyway.
 */
async function encode(png, outBase) {
  const { width, height } = await sharp(png).metadata();
  // Halve back down from deviceScaleFactor: 2 — the source was captured at 2x,
  // so this is a real resample rather than an upscale.
  const w = Math.round(width / 2);
  const h = Math.round(height / 2);

  await sharp(png)
    .resize(w, h, { fit: "inside" })
    .avif({ quality: 50, effort: 6 })
    .toFile(`${outBase}.avif`);

  return { width: w, height: h };
}

/**
 * Every frame that could plausibly be the app, biggest first. Streamlit runs
 * the whole app inside an iframe, so anything that only looks at the main frame
 * silently does nothing there — which is how the first music clip came out as
 * an upload with no result.
 */
function appFrames(page) {
  return page.frames().filter((f) => !IGNORED_FRAMES.test(f.url()));
}

/**
 * Clicks the first button containing `label`. Substring rather than exact
 * match, because these apps label buttons with emoji ("🚀 Analyze Music Genre")
 * and pinning the exact glyphs in a script is a trap.
 */
async function clickByText(page, label) {
  for (const frame of appFrames(page)) {
    try {
      const hit = await frame.evaluate((l) => {
        const el = [...document.querySelectorAll("button")].find((n) =>
          (n.innerText || n.textContent || "").toLowerCase().includes(l),
        );
        if (!el) return false;
        el.click();
        return true;
      }, label.toLowerCase());
      if (hit) return true;
    } catch {
      // Detached.
    }
  }
  return false;
}

/** Types into an input via the native setter, so React and Dash both notice. */
async function setInputs(page, values) {
  await page.evaluate((vals) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set;
    const dateInputs = [...document.querySelectorAll("input")].filter((i) =>
      /^\d{4}-\d{2}-\d{2}$/.test(i.value),
    );
    dateInputs.forEach((el, i) => {
      if (vals[i] === undefined) return;
      setter.call(el, vals[i]);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, values);
}

/**
 * Some apps boot into an empty state. A dashboard screenshot with no chart in
 * it says "unfinished", which is the opposite of what the card is for — so the
 * few that need driving get driven here, keyed by slug. Anything not listed is
 * captured exactly as it loads.
 */
const PREPARE = {
  /**
   * Dash boots with an empty plot area and its date range defaulted to the last
   * twelve months — which for this deployment returns nothing, because the
   * upstream price feed no longer serves that window. A fixed historical range
   * gives a real chart from real data.
   */
  "stock-prediction-dashboard": async (page) => {
    await setInputs(page, ["2023-01-01", "2024-01-01"]);
    await sleep(2000);
    await clickByText(page, "Submit");
    await sleep(12_000);
    await clickByText(page, "Stock Price");
    await sleep(14_000);

    // The first auto-callback fires on load with the unusable default range and
    // leaves its error line above the chart. It is stale by the time the real
    // series has rendered, so it is an artifact of driving the app, not part of
    // the app's actual state.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("div, p, span")) {
        if (
          el.children.length === 0 &&
          /error fetching data|no data found/i.test(el.textContent || "")
        ) {
          el.style.display = "none";
        }
      }
    });
  },
};

/**
 * Scrolls by hand, one frame at a time.
 *
 * Two things this has to get right. Native `scrollTo({behavior:"smooth"})`
 * jumps in a couple of steps under a screencast, which films as a cut rather
 * than a movement — so the easing is done here, per frame. And the thing that
 * scrolls is often not the window: Dash lays its output out in an inner
 * `div` with its own overflow, leaving `document.scrollHeight` stuck at the
 * viewport height. Scrolling the window there does nothing at all, which is
 * exactly how the first cut of the dashboard clip came out motionless. So the
 * deepest real scroller is found first, and the window is only the fallback.
 */
async function glideTo(page, y, ms = 2200) {
  // Whichever frame actually has something to scroll — for Streamlit that is
  // the app's iframe, not the document this script starts from.
  const frame =
    (
      await Promise.all(
        appFrames(page).map(async (f) => {
          try {
            const room = await f.evaluate(
              () =>
                Math.max(
                  document.documentElement.scrollHeight -
                    document.documentElement.clientHeight,
                  ...[...document.querySelectorAll("*")]
                    .filter((el) => el.clientHeight > 200)
                    .map((el) => el.scrollHeight - el.clientHeight),
                  0,
                ),
            );
            return { f, room };
          } catch {
            return { f, room: -1 };
          }
        }),
      )
    ).sort((a, b) => b.room - a.room)[0]?.f ?? page.mainFrame();

  await frame.evaluate(
    (target, duration) =>
      new Promise((resolve) => {
        const scroller =
          [...document.querySelectorAll("*")]
            .filter(
              (el) =>
                el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 200,
            )
            .sort(
              (a, b) =>
                b.scrollHeight - b.clientHeight - (a.scrollHeight - a.clientHeight),
            )[0] ?? null;

        const read = () => (scroller ? scroller.scrollTop : window.scrollY);
        const write = (v) =>
          scroller ? (scroller.scrollTop = v) : window.scrollTo(0, v);

        const from = read();
        const distance = target - from;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          // Ease in and out, so it starts and stops like a hand did it.
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          write(from + distance * eased);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    y,
    ms,
  );
}

/** Waits for text to appear anywhere in the app, so clips are not padded with guesswork. */
async function waitForText(page, re, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { text } = await look(page);
    if (re.test(text)) return true;
    await sleep(1500);
  }
  return false;
}

/**
 * Finds a file input anywhere in the page, including inside an app's iframe,
 * retrying while the app finishes mounting. Streamlit's uploader appears a
 * beat after the first paint, and its input is `display:none` — which is fine,
 * `uploadFile` does not need it visible.
 */
async function findFileInput(page, { tries = 12, gap = 2500 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    for (const frame of page.frames()) {
      if (IGNORED_FRAMES.test(frame.url())) continue;
      try {
        const handle = await frame.$('input[type="file"]');
        if (handle) return handle;
      } catch {
        // Detached mid-boot.
      }
    }
    await sleep(gap);
  }
  return null;
}

/**
 * What each project's hover clip actually shows.
 *
 * There is no generic "scroll the page slowly" fallback, because all three of
 * these apps are one screen tall — a scroll would film nothing moving. Each
 * clip is a scripted run through the thing the project actually does, and a
 * project with no entry here simply does not get a clip.
 *
 * Every step is padded with waits: the recorder is running in real time, and
 * a click whose result appears instantly reads as a glitch rather than a
 * demonstration.
 *
 * Each entry is `{ setup?, run, speed? }`:
 *   setup — runs before the recorder starts, for anything necessary but dull.
 *           Uploading a file is setup; nobody needs to watch a file picker.
 *   run   — the part that gets filmed.
 *   speed — playback multiplier, when the app's own latency needs compressing
 *           harder than the default.
 */
const DEMO = {
  /**
   * Hovering a half expands it and reveals a real headline the pipeline pulled
   * — which is the whole project in one gesture, so the clip is just that,
   * twice, then a vote.
   *
   * The coordinates matter more than they look. The expanded half takes about
   * three quarters of the width, so hovering at x=1080 is still inside the
   * *dark* half once it has grown, and the first cut of this clip never
   * switched sides. Aim near the edges.
   */
  "other-side-of-india": {
    run: async (page) => {
      await page.mouse.move(240, 520, { steps: 40 });
      await sleep(3000);
      await page.mouse.move(1340, 520, { steps: 70 });
      await sleep(3400);
      await page.mouse.move(720, 240, { steps: 40 });
      await sleep(1400);
      await clickByText(page, "hopeful");
      await sleep(3200);
    },
  },

  /**
   * `PREPARE` has already charted the price by the time this runs, so the clip
   * picks up from there and adds the two things worth seeing: the technical
   * indicators, then the forecast the project is named for.
   *
   * The indicator chart renders *below* the fold, inside the app's own scroll
   * container — the first cut of this clip clicked the button and filmed
   * fourteen seconds of a motionless page. The scroll is the point, not padding.
   *
   * "Generate Forecast" is deliberately not clicked: on this deployment it adds
   * no plot even after twenty seconds, so filming it would be filming a button
   * that appears to do nothing.
   */
  "stock-prediction-dashboard": {
    run: async (page) => {
      await sleep(1200);
      await clickByText(page, "indicators");
      await sleep(6000);
      await glideTo(page, 430, 2400);
      await sleep(3000);
      await glideTo(page, 0, 1800);
      await sleep(1200);
    },
  },

  /**
   * Uploads a real track and waits for a real prediction. Needs `--audio`;
   * without it there is nothing to show and the clip is skipped rather than
   * faked.
   */
  "music-genre-classifier": {
    speed: 1.5,

    /** Get the track in and the button on screen — none of that is worth filming. */
    setup: async (page) => {
      if (!audioPath) {
        process.stdout.write("  · no --audio given, so no clip to record\n");
        return false;
      }
      const input = await findFileInput(page);
      if (!input) {
        process.stdout.write("  · could not find the upload input — clip skipped\n");
        return false;
      }
      await input.uploadFile(path.resolve(audioPath.replace(/^~/, HOME)));
      // Streamlit re-runs the script and draws the file card and audio player.
      await sleep(9000);
      await glideTo(page, 520, 1200);
      await sleep(1500);
    },

    /**
     * Uploading classifies nothing — the app waits for this button. The clip is
     * the click, the spectrogram conversion, and the genre it lands on.
     */
    run: async (page) => {
      await sleep(1400);
      const clicked = await clickByText(page, "analyze music genre");
      if (!clicked) {
        process.stdout.write("  · Analyze button not found — clip skipped\n");
        return false;
      }
      // Waited for rather than guessed at, so the clip is never padded with
      // dead air or cut off mid-spectrogram. The pattern has to be specific:
      // matching /confidence/ alone returns instantly, because the sidebar
      // already says "Show Confidence Breakdown".
      const done = await waitForText(page, /predicted\s*genre/i, 90_000);
      if (!done) {
        process.stdout.write("  · classification never finished — clip skipped\n");
        return false;
      }
      await sleep(2000);
      // Down to the verdict and the per-genre confidence bars, and hold there:
      // the genre it picked is the whole point of the clip.
      await glideTo(page, 760, 2800);
      await sleep(5000);
    },
  },
};

/**
 * Records the demo and re-encodes it down to something worth shipping.
 *
 * Puppeteer's own screencast output is generous; a second pass at VP9 with a
 * high CRF and no audio track gets a UI clip into the tens of kilobytes, which
 * is the difference between "plays instantly on hover" and "arrives eventually".
 */
async function record(page, slug, dir) {
  const demo = DEMO[slug];
  const raw = path.join(dir, "demo.raw.webm");
  const out = path.join(dir, "demo.webm");

  // Anything necessary but dull happens before the camera rolls.
  if (demo.setup && (await demo.setup(page)) === false) return null;

  const recorder = await page.screencast({
    path: raw,
    scale: 0.5, // 1440x900 viewport -> 720x450, ample for a ~520px frame.
  });

  let ok = true;
  try {
    ok = (await demo.run(page)) !== false;
  } finally {
    await recorder.stop();
  }

  if (!ok) {
    await rm(raw, { force: true });
    return null;
  }

  await execFile("ffmpeg", [
    "-y",
    "-i", raw,
    "-an", // No audio track: the clip is muted on the page regardless.
    "-vf", `setpts=PTS/${demo.speed ?? PLAYBACK_SPEED}`,
    "-t", String(MAX_CLIP_SECONDS),
    "-c:v", "libvpx-vp9",
    "-crf", "40",
    "-b:v", "0",
    "-r", "24",
    "-pix_fmt", "yuv420p",
    "-row-mt", "1",
    out,
  ]);
  await rm(raw, { force: true });
  return out;
}

/**
 * What to point the browser at, which is not always the URL a human should
 * click. A Hugging Face Space page wraps the app in Spaces' own header, "like"
 * button and tab bar — none of which is this project. Every Space also serves
 * itself bare at `<user>-<name>.hf.space`, so capture that and leave `liveUrl`
 * pointing at the friendlier page.
 */
function captureUrlFor(liveUrl) {
  const hf = liveUrl.match(
    /^https:\/\/huggingface\.co\/spaces\/([^/]+)\/([^/?#]+)/,
  );
  if (hf) {
    const sub = `${hf[1]}-${hf[2]}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    return `https://${sub}.hf.space`;
  }
  return liveUrl;
}

async function capture(browser, project) {
  const { slug, liveUrl } = project;
  const target = captureUrlFor(liveUrl);
  const dir = path.join(OUT_ROOT, slug);
  await mkdir(dir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  // Some hosts serve a stripped page to an obvious headless UA.
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  );

  process.stdout.write(
    `\n${slug}\n  ${target}${target !== liveUrl ? "  (bare app)" : ""}\n`,
  );

  try {
    await page.goto(target, { waitUntil: "networkidle2", timeout: 90_000 });
  } catch {
    process.stdout.write("  ✗ navigation timed out — skipped\n");
    await page.close();
    return null;
  }

  const state = await settle(page);
  if (!state) {
    process.stdout.write(
      "  ✗ never woke up — nothing written, the old shot is untouched.\n" +
        `    Open ${target} in a browser, wait for it, then re-run with\n` +
        `    npm run capture:shots -- --only ${slug}\n`,
    );
    await page.close();
    return null;
  }
  if (PREPARE[slug]) {
    process.stdout.write("  · driving the app into a state worth showing\n");
    await PREPARE[slug](page);
  }
  await tidy(page);

  const posterPng = path.join(dir, "poster.png");
  await page.screenshot({ path: posterPng, captureBeyondViewport: false });
  const poster = await encode(posterPng, path.join(dir, "poster"));

  // Full page, clipped to something a hover-pan can actually traverse.
  const fullHeight = await page.evaluate(() =>
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
  );
  const tallHeight = Math.min(
    fullHeight,
    Math.round(VIEWPORT.height * MAX_TALL_RATIO),
  );

  let tall = null;
  if (tallHeight > VIEWPORT.height * 1.2) {
    const tallPng = path.join(dir, "tall.png");
    await page.screenshot({
      path: tallPng,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: tallHeight, scale: 2 },
    });
    tall = await encode(tallPng, path.join(dir, "tall"));
    if (!keepPng) await rm(tallPng, { force: true });
  } else {
    process.stdout.write("  · page is one screen tall — no pan capture\n");
  }

  if (!keepPng) await rm(posterPng, { force: true });

  // Recorded last, so the stills are already safely on disk if the demo throws.
  let video = null;
  if (wantVideo && DEMO[slug]) {
    process.stdout.write("  · recording the hover clip\n");
    try {
      video = await record(page, slug, dir);
    } catch (error) {
      process.stdout.write(`  ✗ clip failed: ${error.message.slice(0, 120)}\n`);
    }
  } else if (wantVideo) {
    process.stdout.write("  · no DEMO script for this one — no clip\n");
  }

  await page.close();
  return { slug, host: new URL(liveUrl).hostname, poster, tall, video };
}

async function report(results) {
  const { stat } = await import("node:fs/promises");
  process.stdout.write("\n─── captured ───\n");
  const blocks = [];

  for (const r of results) {
    if (!r) continue;
    const dir = path.join(OUT_ROOT, r.slug);
    const size = async (f) => {
      try {
        return (await stat(path.join(dir, f))).size;
      } catch {
        return 0;
      }
    };
    const pAvif = await size("poster.avif");
    const tAvif = await size("tall.avif");
    const demo = r.video ? await size("demo.webm") : 0;
    const kb = (b) => `${(b / 1024).toFixed(1)} KB`;

    process.stdout.write(
      `${r.slug}\n  poster.avif ${kb(pAvif)}${
        pAvif > POSTER_BUDGET ? "  ⚠ over the 60 KB budget" : ""
      }\n${r.tall ? `  tall.avif   ${kb(tAvif)}\n` : ""}${
        demo
          ? `  demo.webm   ${kb(demo)}${
              demo > VIDEO_BUDGET ? "  ⚠ over the 400 KB budget" : ""
            }\n`
          : ""
      }`,
    );

    blocks.push(
      `    // ${r.slug}\n` +
        `    media: {\n` +
        `      poster: "/shots/${r.slug}/poster.avif",\n` +
        `      width: ${r.poster.width},\n` +
        `      height: ${r.poster.height},\n` +
        (r.tall
          ? `      tall: "/shots/${r.slug}/tall.avif",\n` +
            `      tallHeight: ${r.tall.height},\n`
          : "") +
        (r.video ? `      video: "/shots/${r.slug}/demo.webm",\n` : "") +
        `      host: "${r.host}",\n` +
        `      alt: "TODO — describe what the app does",\n` +
        `    },`,
    );
  }

  process.stdout.write(
    "\n─── paste into src/content/projects.ts, then write the alt text ───\n\n" +
      blocks.join("\n\n") +
      "\n",
  );
}

const all = await readProjects();
const targets = only ? all.filter((p) => p.slug === only) : all;

if (targets.length === 0) {
  console.error(
    only
      ? `No project with slug "${only}" (or it has no liveUrl).`
      : "No projects with a liveUrl.",
  );
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: BRAVE,
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

const results = [];
for (const project of targets) {
  results.push(await capture(browser, project));
}
await browser.close();
await report(results);

if (results.some((r) => r === null)) {
  process.stdout.write("\nSome captures were skipped — see above.\n");
  process.exit(1);
}
