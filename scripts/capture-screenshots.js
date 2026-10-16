const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browser = chromePaths.find((p) => fs.existsSync(p));
if (!browser) {
    console.error("No browser executable found.");
    process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");
const screenshotsDir = path.join(rootDir, "screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

function capture(url, filename, windowSize = "1280,840", waitMs = 4000) {
    const dest = path.join(screenshotsDir, filename);
    console.log(`Capturing ${url} -> ${filename}...`);
    const args = [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        `--window-size=${windowSize}`,
        `--virtual-time-budget=${waitMs}`,
        `--screenshot=${dest}`,
        url,
    ];

    const res = spawnSync(browser, args, { stdio: "inherit" });
    if (fs.existsSync(dest)) {
        console.log(`✓ Saved ${dest} (${fs.statSync(dest).size} bytes)`);
    } else {
        console.error(`Failed to capture ${filename}, exit code: ${res.status}`);
    }
}

// 1. Copy Banner image
const ogSource = path.join(rootDir, "public", "og-image.png");
if (fs.existsSync(ogSource)) {
    fs.copyFileSync(ogSource, path.join(screenshotsDir, "banner.png"));
    console.log("✓ Copied public/og-image.png -> screenshots/banner.png");
}

// 2. Capture Landing Page Hero
capture("http://localhost:3001", "landing-hero.png", "1280,860", 3000);

// 3. Capture Full Landing Page (Protocol & Dynamics)
capture("http://localhost:3001", "landing-features.png", "1280,1800", 3500);

// 4. Capture Live Gameplay Dossier (via seed.html)
capture("http://localhost:3001/seed.html", "gameplay-dossier.png", "1280,880", 5000);
