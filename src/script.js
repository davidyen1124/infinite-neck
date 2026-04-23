const SOURCE_WIDTH = 724;
const SOURCE_HEIGHT = 2172;

const GEOMETRY = {
  headArtTop: 242,
  headCut: 760,
  bodyCut: 842,
  neckTop: 630,
  neckStripX: 336,
  neckStripY: 700,
  neckStripWidth: 58,
  neckStripHeight: 126,
  bodyOverlap: 7,
};

const root = document.documentElement;
const experience = document.querySelector(".experience");
const canvas = document.querySelector(".character-canvas");
const context = canvas.getContext("2d");
const sourceImage = new Image();
sourceImage.src = "./assets/character.png";

let rafId = 0;
let metrics = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setSceneScale() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const imageAspect = SOURCE_WIDTH / SOURCE_HEIGHT;
  const isNarrowMobile = viewportWidth < 380;
  const isCompactMobile = viewportWidth < 430;
  const isMobile = viewportWidth < 720;

  const characterWidth = isNarrowMobile
    ? Math.min(viewportWidth * 0.68, 236)
    : isCompactMobile
    ? Math.min(viewportWidth * 0.72, 280)
    : isMobile
    ? Math.min(viewportWidth * 0.78, 320)
    : Math.min(viewportWidth * 0.34, 430);
  const characterHeight = characterWidth / imageAspect;
  const scale = characterWidth / SOURCE_WIDTH;
  const scrollLength = Math.max(viewportHeight * 7.5, 5400);
  const desiredHeadTop = isNarrowMobile ? 84 : isCompactMobile ? 66 : isMobile ? 22 : 12;
  const y = desiredHeadTop - GEOMETRY.headArtTop * scale;

  metrics = {
    viewportWidth,
    viewportHeight,
    characterWidth,
    characterHeight,
    headCut: GEOMETRY.headCut * scale,
    bodyCut: GEOMETRY.bodyCut * scale,
    neckTop: GEOMETRY.neckTop * scale,
    neckStripX: GEOMETRY.neckStripX * scale,
    neckStripWidth: GEOMETRY.neckStripWidth * scale,
    bodyOverlap: GEOMETRY.bodyOverlap * scale,
    x: (viewportWidth - characterWidth) / 2,
    y,
  };

  root.style.setProperty("--scroll-length", `${scrollLength}px`);
  experience.style.minHeight = `calc(100vh + ${scrollLength}px)`;
  resizeCanvas();
  updateScrollState();
}

function updateScrollState() {
  if (!metrics) {
    return;
  }

  const { viewportHeight, viewportWidth, y, bodyCut, bodyOverlap, neckTop } = metrics;
  const isNarrowMobile = viewportWidth < 380;
  const isCompactMobile = viewportWidth < 430;
  const scrollRange = Math.max(experience.offsetHeight - window.innerHeight, 1);
  const progress = clamp(window.scrollY / scrollRange, 0, 1);
  const eased = 1 - Math.pow(1 - progress, 1.3);
  const bodyTopAtRest = y + bodyCut - bodyOverlap;
  const desiredBodyTop = viewportHeight * (isNarrowMobile ? 0.62 : isCompactMobile ? 0.59 : viewportWidth < 720 ? 0.56 : 0.58);
  const maxBodyOffset = Math.max(desiredBodyTop - bodyTopAtRest, 0);
  const bodyOffset = eased * maxBodyOffset;
  const bodyTop = bodyTopAtRest + bodyOffset;
  const neckStart = y + neckTop;
  const neckHeight = Math.max(bodyTop + bodyOverlap - neckStart, 0);

  root.style.setProperty("--scroll-progress", progress.toFixed(4));
  metrics.bodyTop = bodyTop;
  metrics.neckHeight = neckHeight;
  drawScene();
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.imageSmoothingEnabled = true;
}

function drawScene() {
  if (!metrics || !sourceImage.complete) {
    return;
  }

  const {
    viewportWidth,
    viewportHeight,
    characterWidth,
    characterHeight,
    x,
    y,
    headCut,
    bodyCut,
    bodyTop,
    bodyOverlap,
    neckTop,
    neckStripX,
    neckStripWidth,
    neckHeight,
  } = metrics;

  context.clearRect(0, 0, viewportWidth, viewportHeight);

  const neckX = x + neckStripX;
  const neckY = y + neckTop;
  const bodyHeight = characterHeight - bodyCut;

  context.drawImage(
    sourceImage,
    GEOMETRY.neckStripX,
    GEOMETRY.neckStripY,
    GEOMETRY.neckStripWidth,
    GEOMETRY.neckStripHeight,
    neckX,
    neckY,
    neckStripWidth,
    neckHeight,
  );

  context.drawImage(
    sourceImage,
    0,
    GEOMETRY.bodyCut,
    SOURCE_WIDTH,
    SOURCE_HEIGHT - GEOMETRY.bodyCut,
    x,
    bodyTop,
    characterWidth,
    bodyHeight,
  );

  context.drawImage(
    sourceImage,
    0,
    0,
    SOURCE_WIDTH,
    GEOMETRY.headCut,
    x,
    y,
    characterWidth,
    headCut,
  );
}

function requestUpdate() {
  if (rafId) {
    return;
  }

  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    updateScrollState();
  });
}

window.addEventListener("resize", setSceneScale);
window.addEventListener("scroll", requestUpdate);

if (sourceImage.complete && sourceImage.naturalWidth > 0) {
  setSceneScale();
} else {
  sourceImage.addEventListener("load", setSceneScale, { once: true });
}
