#!/usr/bin/env node
/**
 * make-og.mjs — generates the social sharing (Open Graph) image.
 *
 * Run from the project root:  node scripts/make-og.mjs   (or: npm run og)
 *
 * Output: public/og-image.png — 1200x630 PNG.
 *
 * Layout:
 *   - #f5f0e6 paper background with a 12px #111111 frame inset from the edge
 *   - Left: name in uppercase (Arial 900), split "first word / rest",
 *           with a #ff71ae highlighter bar behind the second line,
 *           then the hero.eyebrow line in Courier New bold uppercase,
 *           and the site URL in small mono at the bottom-left.
 *   - Right: src/assets/lohith.jpg cropped to a 400x400 square (face kept
 *           via sharp's "attention" crop), 6px #111111 border, 14px hard
 *           offset #111111 shadow, rotated ~2 degrees.
 *
 * The text/frames layer is one SVG string (XML-escaped); the photo is
 * processed with sharp and composited on top. No new dependencies:
 * node: built-ins + sharp only.
 *
 * Name / role / eyebrow are read from src/content/profile/profile.yaml with
 * simple regexes — they are single-line plain scalars, so no yaml library
 * is needed. Run this again whenever the name or the photo changes.
 */

import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE_PATH = resolve(ROOT, 'src/content/profile/profile.yaml');
const PHOTO_PATH = resolve(ROOT, 'src/assets/lohith.jpg');
const OUT_PATH = resolve(ROOT, 'public/og-image.png');

// ── Canvas + design tokens (from src/styles/theme.css) ──────────────────────
const W = 1200;
const H = 630;
const PAPER = '#f5f0e6';
const INK = '#111111';
const HOT = '#ff71ae'; // highlighter pink

const MARGIN_X = 72;          // left edge of the text block
const NAME_SIZE = 84;         // target size (~84px); auto-shrinks to fit
const NAME_TRACK_EM = -0.065; // tight uppercase tracking, like the site
const EYEBROW_SIZE = 26;
const URL_SIZE = 16;

const NAME_FONT = 'Arial, Helvetica, sans-serif';
const MONO_FONT = "'Courier New', Courier, monospace";

// Photo (right side)
const PHOTO_SIZE = 400;      // square side before the border
const PHOTO_BORDER = 6;      // ink border around the photo
const SHADOW_OFFSET = 14;    // hard offset shadow, down-right
const PHOTO_ROTATE = 2;      // degrees
const PHOTO_CENTER = { x: 945, y: 315 };
const MAX_TEXT_WIDTH = PHOTO_CENTER.x - PHOTO_SIZE / 2 - PHOTO_BORDER - SHADOW_OFFSET - MARGIN_X - 40;

function die(message) {
  console.error(`make-og: ${message}`);
  console.error('make-og: no og-image.png was written.');
  process.exit(1);
}

/** Escape XML special characters so names/roles can't break the SVG. */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Strip a trailing " # comment" and surrounding YAML quotes from a scalar. */
function cleanScalar(value) {
  return value
    .replace(/\s+#.*$/, '')
    .replace(/^["'](.*)["']$/, '$1')
    .trim();
}

/** Read the three single-line plain scalars we need — no yaml library. */
function readProfileFields() {
  if (!existsSync(PROFILE_PATH)) {
    die(`profile file not found: ${PROFILE_PATH}`);
  }
  const raw = readFileSync(PROFILE_PATH, 'utf8');

  const pick = (regex, label) => {
    const match = raw.match(regex);
    if (!match) {
      die(`could not find a top-level "${label}" line in ${PROFILE_PATH}`);
    }
    return cleanScalar(match[1]);
  };

  const name = pick(/^name:[ \t]*(.+?)[ \t]*$/m, 'name');
  const role = pick(/^role:[ \t]*(.+?)[ \t]*$/m, 'role');
  // hero.eyebrow is nested, so it is indented; fall back to the role.
  const eyebrowMatch = raw.match(/^[ \t]+eyebrow:[ \t]*(.+?)[ \t]*$/m);
  const eyebrow = eyebrowMatch ? cleanScalar(eyebrowMatch[1]) : role;

  if (!name) die('the "name" field in profile.yaml is empty');
  return { name, role, eyebrow };
}

/** Render one line of text off-canvas and trim it to measure its real pixel width. */
async function measureTextWidth(text, { size, family, weight, spacingPx }) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="${Math.round(size * 2)}">` +
    `<text x="20" y="${Math.round(size * 1.2)}" font-family="${family}" font-weight="${weight}" ` +
    `font-size="${size}" letter-spacing="${spacingPx}" fill="#000000">${esc(text)}</text></svg>`;
  try {
    const { info } = await sharp(Buffer.from(svg))
      .flatten({ background: '#ffffff' })
      .trim()
      .toBuffer({ resolveWithObject: true });
    if (info.width > 0 && info.width < 2000) return info.width;
  } catch {
    // fall through to the estimate below
  }
  // Fallback estimate: uppercase Arial 900 averages ~0.72em per glyph.
  return Math.round(text.length * size * (0.72 + NAME_TRACK_EM));
}

/** Build one <text> element. */
function text(x, y, value, { size, family, weight, spacingPx = 0, fill = INK }) {
  return (
    `<text x="${x}" y="${y}" font-family="${family}" font-weight="${weight}" ` +
    `font-size="${size}" letter-spacing="${spacingPx}" fill="${fill}">${esc(value)}</text>`
  );
}

async function main() {
  if (!existsSync(PHOTO_PATH)) {
    die(`photo not found: ${PHOTO_PATH}`);
  }

  const { name, role, eyebrow } = readProfileFields();

  // ── Name split: first word / rest ─────────────────────────────────────────
  const words = name.trim().split(/\s+/);
  const line1 = words[0].toUpperCase();
  const line2 = words.slice(1).join(' ').toUpperCase();
  const twoLines = line2.length > 0;

  // ── Fit the name into the left column (cap ~84px) ─────────────────────────
  const trackAt = (size) => (NAME_TRACK_EM * size).toFixed(2);
  const w1Base = await measureTextWidth(line1, { size: NAME_SIZE, family: NAME_FONT, weight: 900, spacingPx: trackAt(NAME_SIZE) });
  const w2Base = twoLines
    ? await measureTextWidth(line2, { size: NAME_SIZE, family: NAME_FONT, weight: 900, spacingPx: trackAt(NAME_SIZE) })
    : 0;
  const widestBase = Math.max(w1Base, w2Base);
  const nameSize =
    widestBase > MAX_TEXT_WIDTH
      ? Math.max(56, Math.floor((NAME_SIZE * MAX_TEXT_WIDTH) / widestBase))
      : NAME_SIZE;
  const scale = nameSize / NAME_SIZE;
  const w2 = Math.round(w2Base * scale);
  const trackPx = trackAt(nameSize);

  // ── Eyebrow: pack at 26px, shrink only if a wrapped line still overflows ──
  const eyebrowUpper = eyebrow.toUpperCase();
  const eyebrowParts = eyebrowUpper.split('·').map((part) => part.trim()).filter(Boolean);
  const measureEyebrow = (value) =>
    measureTextWidth(value, { size: EYEBROW_SIZE, family: MONO_FONT, weight: 700, spacingPx: 1 });

  let eyebrowLines = [];
  let current = '';
  for (const part of eyebrowParts) {
    const candidate = current ? `${current} · ${part}` : part;
    if ((await measureEyebrow(candidate)) <= MAX_TEXT_WIDTH) {
      current = candidate;
    } else {
      if (current) eyebrowLines.push(current);
      current = part;
    }
  }
  if (current) eyebrowLines.push(current);
  if (eyebrowLines.length === 0) eyebrowLines = [eyebrowUpper];

  let eyebrowSize = EYEBROW_SIZE;
  const longestEyebrow = eyebrowLines.reduce(
    async (best, line) => Math.max(await best, await measureEyebrow(line)),
    Promise.resolve(0),
  );
  if (longestEyebrow > MAX_TEXT_WIDTH) {
    eyebrowSize = Math.max(16, Math.floor((EYEBROW_SIZE * MAX_TEXT_WIDTH) / longestEyebrow));
  }

  // ── Baselines ─────────────────────────────────────────────────────────────
  const lineGap = Math.round(nameSize * 0.92);
  const base1 = twoLines ? 248 : 280;
  const base2 = base1 + lineGap;
  const lastNameBase = twoLines ? base2 : base1;
  const eyebrowGap = Math.round(nameSize * 0.78);
  const eyebrowLineGap = Math.round(eyebrowSize * 1.35);

  // ── SVG layer: frame, highlighter bar, text ───────────────────────────────
  const svg = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  // 12px ink frame inset from the edge (stroke straddles the path: 6px out, 6px in).
  svg.push(`<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${INK}" stroke-width="12"/>`);

  // Highlighter bar behind the second line (drawn first so the text sits on top).
  if (twoLines) {
    const barW = w2 + 24;
    const barH = Math.round(nameSize * 0.4);
    const barX = MARGIN_X - 12;
    const barY = Math.round(base2 - nameSize * 0.3);
    const barCx = barX + barW / 2;
    const barCy = barY + barH / 2;
    svg.push(`<g transform="rotate(-1.5 ${barCx} ${barCy})"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="${HOT}"/></g>`);
  }

  svg.push(text(MARGIN_X, base1, line1, { size: nameSize, family: NAME_FONT, weight: 900, spacingPx: trackPx }));
  if (twoLines) {
    svg.push(text(MARGIN_X, base2, line2, { size: nameSize, family: NAME_FONT, weight: 900, spacingPx: trackPx }));
  }

  let eyebrowY = lastNameBase + eyebrowGap;
  for (const line of eyebrowLines) {
    svg.push(text(MARGIN_X, eyebrowY, line, { size: eyebrowSize, family: MONO_FONT, weight: 700, spacingPx: 1 }));
    eyebrowY += eyebrowLineGap;
  }

  // Bottom-left small mono site address.
  svg.push(
    text(MARGIN_X, H - 52, 'silaparasetti-lohith-portfolio.vercel.app', {
      size: URL_SIZE,
      family: MONO_FONT,
      weight: 700,
      spacingPx: 0.5,
    }),
  );
  svg.push('</svg>');
  const svgBuffer = Buffer.from(svg.join(''));

  // ── Photo: 400x400 square (face kept) + ink border + rotation ─────────────
  const square = await sharp(PHOTO_PATH)
    .rotate() // respect EXIF orientation first
    .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover', position: 'attention' })
    .toBuffer();

  const bordered = await sharp(square)
    .extend({
      top: PHOTO_BORDER,
      bottom: PHOTO_BORDER,
      left: PHOTO_BORDER,
      right: PHOTO_BORDER,
      background: INK,
    })
    .png()
    .toBuffer();

  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const photoRot = await sharp(bordered)
    .rotate(PHOTO_ROTATE, { background: transparent })
    .png()
    .toBuffer({ resolveWithObject: true });

  const shadowBase = await sharp({
    create: {
      width: PHOTO_SIZE + PHOTO_BORDER * 2,
      height: PHOTO_SIZE + PHOTO_BORDER * 2,
      channels: 4,
      background: INK,
    },
  })
    .png()
    .toBuffer();
  const shadowRot = await sharp(shadowBase)
    .rotate(PHOTO_ROTATE, { background: transparent })
    .png()
    .toBuffer({ resolveWithObject: true });

  const photoLeft = Math.round(PHOTO_CENTER.x - photoRot.info.width / 2);
  const photoTop = Math.round(PHOTO_CENTER.y - photoRot.info.height / 2);
  const shadowLeft = Math.round(PHOTO_CENTER.x - shadowRot.info.width / 2) + SHADOW_OFFSET;
  const shadowTop = Math.round(PHOTO_CENTER.y - shadowRot.info.height / 2) + SHADOW_OFFSET;

  // ── Compose and write ─────────────────────────────────────────────────────
  mkdirSync(dirname(OUT_PATH), { recursive: true });

  const info = await sharp({
    create: { width: W, height: H, channels: 4, background: PAPER },
  })
    .composite([
      { input: svgBuffer }, // frame + all text
      { input: shadowRot.data, left: shadowLeft, top: shadowTop }, // hard shadow
      { input: photoRot.data, left: photoLeft, top: photoTop }, // bordered photo
    ])
    .png({ compressionLevel: 9 })
    .toFile(OUT_PATH);

  if (info.width !== W || info.height !== H) {
    die(`unexpected output size ${info.width}x${info.height} (wanted ${W}x${H})`);
  }

  const bytes = statSync(OUT_PATH).size;
  console.log(`✔ OG image written: ${OUT_PATH} (${W}x${H} PNG, ${(bytes / 1024).toFixed(0)} KB)`);
  console.log(`  name: "${name}"  role: "${role}"  eyebrow: "${eyebrow}"`);
}

main().catch((err) => {
  console.error(`make-og: ${err && err.message ? err.message : err}`);
  process.exit(1);
});
