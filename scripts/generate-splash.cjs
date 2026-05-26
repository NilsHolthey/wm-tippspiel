const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SIZES = [
  [2048, 2732], [1668, 2388], [1536, 2048], [1640, 2360],
  [1668, 2224], [1620, 2160], [1488, 2266], [1320, 2868],
  [1206, 2622], [1260, 2736], [1290, 2796], [1179, 2556],
  [1170, 2532], [1284, 2778], [1125, 2436], [1242, 2688],
  [828,  1792], [1242, 2208], [750,  1334], [640,  1136],
];

const BG = { r: 6, g: 10, b: 27 };
const OUT = path.join(__dirname, "../public/splash");
const ICON = path.join(__dirname, "../public/icons/icon-512.png");

function roundedRectMask(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`
  );
}

async function generate() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const [w, h] of SIZES) {
    const iconSize = Math.round(Math.min(w, h) * 0.28);
    const radius = Math.round(iconSize * 0.22);

    const maskedIcon = await sharp(ICON)
      .resize(iconSize, iconSize)
      .ensureAlpha()
      .composite([{ input: roundedRectMask(iconSize, radius), blend: "dest-in" }])
      .png()
      .toBuffer();

    const left = Math.round((w - iconSize) / 2);
    const top  = Math.round((h - iconSize) / 2);

    await sharp({
      create: { width: w, height: h, channels: 3, background: BG },
    })
      .composite([{ input: maskedIcon, left, top }])
      .png()
      .toFile(path.join(OUT, `apple-splash-${w}-${h}.png`));

    console.log(`✓ ${w}×${h}`);
  }

  console.log("\nDone — all splash images written to public/splash/");
}

generate().catch(err => { console.error(err); process.exit(1); });
