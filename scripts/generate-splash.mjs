import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons", "splash");
mkdirSync(outDir, { recursive: true });

const BG_COLOR = { r: 11, g: 13, b: 24, alpha: 1 }; // #0B0D18
const LOGO_SIZE = 200;

const sizes = [
  { w: 640,  h: 1136, name: "640x1136"  }, // iPhone SE 1st gen
  { w: 750,  h: 1334, name: "750x1334"  }, // iPhone 8
  { w: 1242, h: 2208, name: "1242x2208" }, // iPhone 8 Plus
  { w: 1125, h: 2436, name: "1125x2436" }, // iPhone X / XS / 11 Pro
  { w: 828,  h: 1792, name: "828x1792"  }, // iPhone XR / 11
  { w: 1242, h: 2688, name: "1242x2688" }, // iPhone XS Max / 11 Pro Max
  { w: 1170, h: 2532, name: "1170x2532" }, // iPhone 12 / 13 / 14
  { w: 1284, h: 2778, name: "1284x2778" }, // iPhone 12 Pro Max / 13 Pro Max
  { w: 1179, h: 2556, name: "1179x2556" }, // iPhone 14 Pro / 15 / 15 Pro
  { w: 1290, h: 2796, name: "1290x2796" }, // iPhone 14 Pro Max / 15 Plus / 15 Pro Max
  { w: 1488, h: 2266, name: "1488x2266" }, // iPad Mini
  { w: 1536, h: 2048, name: "1536x2048" }, // iPad 9th / 10th gen
  { w: 2048, h: 2732, name: "2048x2732" }, // iPad Pro 12.9"
];

const logoBuffer = await sharp(join(root, "public", "icons", "icon-512.png"))
  .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

for (const { w, h, name } of sizes) {
  const left = Math.round((w - LOGO_SIZE) / 2);
  const top = Math.round((h - LOGO_SIZE) / 2);

  await sharp({
    create: { width: w, height: h, channels: 4, background: BG_COLOR },
  })
    .composite([{ input: logoBuffer, left, top }])
    .png()
    .toFile(join(outDir, `splash-${name}.png`));

  console.log(`✓ splash-${name}.png`);
}

console.log("Done.");
