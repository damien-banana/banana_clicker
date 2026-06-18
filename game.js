const SAVE_KEY = "bananaClickerSave";
const LEGACY_SAVE_KEY = "bananaEmpireSave";
const SOUND_KEY = "bananaClickerSound";
const PLAYER_ID_KEY = "bananaClickerPlayerId";
const PLAYER_NAME_KEY = "bananaClickerPlayerName";

let audioCtx = null;
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let gameStarted = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type = "sine", volume = 0.12, delay = 0) {
  if (!soundEnabled || !audioCtx) return;

  const t = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function playClickSound() {
  playTone(320 + Math.random() * 80, 0.07, "square", 0.06);
  playTone(520 + Math.random() * 60, 0.05, "sine", 0.04);
}

function playBuySound() {
  playTone(523, 0.1, "square", 0.1);
  playTone(659, 0.1, "square", 0.09, 0.07);
  playTone(784, 0.14, "square", 0.08, 0.14);
}

function playAchievementSound() {
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.22, "triangle", 0.11, i * 0.09));
}

function playGoldenSound() {
  playTone(880, 0.12, "sine", 0.12);
  playTone(1320, 0.18, "sine", 0.09, 0.08);
  playTone(1760, 0.2, "sine", 0.06, 0.16);
}

function playStartSound() {
  [392, 494, 587, 784].forEach((f, i) => playTone(f, 0.28, "triangle", 0.1, i * 0.07));
}

function playSaveSound() {
  playTone(440, 0.08, "sine", 0.08);
  playTone(554, 0.12, "sine", 0.07, 0.06);
}

function playPrestigeSound() {
  [392, 494, 587, 784, 988, 1175].forEach((f, i) => playTone(f, 0.35, "triangle", 0.12, i * 0.1));
  setTimeout(() => playTone(1568, 0.5, "sine", 0.1), 550);
}

const PRESTIGE_MIN_EARNED = 100000;
const PRESTIGE_BONUS_PER_POINT = 0.12;

function updateSoundButton() {
  const btn = document.getElementById("sound-btn");
  if (btn) {
    btn.textContent = soundEnabled ? "🔊 Sons" : "🔇 Sons";
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  updateSoundButton();
  if (soundEnabled) {
    initAudio();
    playTone(523, 0.1, "sine", 0.08);
  }
}

const BUILDINGS = [
  { id: "cursor", name: "Singe aide", icon: "🐒", desc: "Un singe qui cueille des bananes.", baseCost: 25, baseBps: 0.1, costMult: 1.18 },
  { id: "bananier", name: "Bananier", icon: "🌴", desc: "Produit des bananes en continu.", baseCost: 80, baseBps: 0.8, costMult: 1.18 },
  { id: "plantation", name: "Plantation", icon: "🏝️", desc: "Des hectares de bananiers.", baseCost: 500, baseBps: 6, costMult: 1.18 },
  { id: "camion", name: "Camion", icon: "🚚", desc: "Transporte les bananes vers les marchés.", baseCost: 2800, baseBps: 40, costMult: 1.18 },
  { id: "usine", name: "Usine", icon: "🏭", desc: "Transforme tout en purée de banane.", baseCost: 15000, baseBps: 220, costMult: 1.18 },
  { id: "port", name: "Port", icon: "🚢", desc: "Export mondial de bananes.", baseCost: 85000, baseBps: 1200, costMult: 1.18 },
  { id: "empire", name: "Empire Banane", icon: "👑", desc: "Contrôle l'économie mondiale de la banane.", baseCost: 500000, baseBps: 7000, costMult: 1.18 },
  { id: "temple", name: "Temple Banane", icon: "🛕", desc: "Les dieux bénissent tes récoltes.", baseCost: 3500000, baseBps: 45000, costMult: 1.18 },
];

const UPGRADES = [
  { id: "click2", name: "Pouces musclés", icon: "💪", desc: "Double la puissance de clic.", cost: 200, type: "click", mult: 2, req: () => state.totalEarned >= 100 },
  { id: "click5", name: "Gants banane", icon: "🧤", desc: "×5 puissance de clic.", cost: 5000, type: "click", mult: 5, req: () => state.totalEarned >= 5000 },
  { id: "click10", name: "Banane dorée", icon: "✨", desc: "×10 puissance de clic.", cost: 150000, type: "click", mult: 10, req: () => state.totalEarned >= 150000 },
  { id: "bananier2", name: "Engrais miracle", icon: "🧪", desc: "Bananier ×2 production.", cost: 1200, type: "building", buildingId: "bananier", mult: 2, req: () => getBuildingCount("bananier") >= 15 },
  { id: "plantation2", name: "Irrigation", icon: "💧", desc: "Plantation ×2 production.", cost: 15000, type: "building", buildingId: "plantation", mult: 2, req: () => getBuildingCount("plantation") >= 15 },
  { id: "global2", name: "Révolution banane", icon: "🍌", desc: "Toute production ×2.", cost: 300000, type: "global", mult: 2, req: () => state.totalEarned >= 500000 },
  { id: "global5", name: "Ère de la banane", icon: "🌟", desc: "Toute production ×3.", cost: 5000000, type: "global", mult: 3, req: () => state.totalEarned >= 5000000 },
];

const ACHIEVEMENTS = [
  { id: "first", name: "Première banane", icon: "🍌", desc: "Collecter ta première banane.", check: () => state.lifetimeEarned >= 1 },
  { id: "hundred", name: "Centurion", icon: "💯", desc: "100 bananes au total.", check: () => state.lifetimeEarned >= 100 },
  { id: "thousand", name: "Mille bananes", icon: "🎯", desc: "1 000 bananes au total.", check: () => state.lifetimeEarned >= 1000 },
  { id: "million", name: "Millionnaire banane", icon: "💰", desc: "1 million de bananes.", check: () => state.lifetimeEarned >= 1000000 },
  { id: "clicker", name: "Clic maniaque", icon: "👆", desc: "1 000 clics.", check: () => state.lifetimeClicks >= 1000 },
  { id: "singe10", name: "Armée de singes", icon: "🐒", desc: "10 singes aides.", check: () => getBuildingCount("cursor") >= 10 },
  { id: "golden", name: "Chasseur doré", icon: "🌟", desc: "Cliquer une banane dorée.", check: () => state.goldenClicked >= 1 },
  { id: "empire", name: "Empereur", icon: "👑", desc: "Acheter l'Empire Banane.", check: () => getBuildingCount("empire") >= 1 },
  { id: "prestige1", name: "Réincarnation", icon: "⭐", desc: "Prestiger pour la première fois.", check: () => state.prestigeCount >= 1 },
  { id: "prestige5", name: "Vétéran banane", icon: "🌠", desc: "Atteindre 5 points de prestige.", check: () => state.prestigePoints >= 5 },
  { id: "story", name: "Rebelle", icon: "📖", desc: "Voir la première cutscene.", check: () => state.seenCutscenes.length >= 1 },
];

const CUTSCENES = [
  {
    id: "prologue",
    title: "La dernière banane du matin",
    emoji: "🍌🌴",
    image: "images/cutscenes/01-prologue.png",
    lines: [
      { speaker: "Kiki", text: "Encore une matinée… une banane, une seule. Les gorilles prennent tout le reste." },
      { speaker: "Kiki", text: "Mais si je commence petit… peut-être qu'un jour les singes mangeront à leur faim." },
      { speaker: "Kiki", text: "Allez. Une banane. Puis une autre. C'est ça, mon plan." },
    ],
  },
  {
    id: "ally",
    title: "Premier allié",
    emoji: "🐒🐒",
    image: "images/cutscenes/02-ally.png",
    lines: [
      { speaker: "Bongo", text: "Hé ! Tu cliques comme un fou. Tu montes une révolution ou tu fais du sport ?" },
      { speaker: "Kiki", text: "Les deux. Tu veux rejoindre le clan ?" },
      { speaker: "Bongo", text: "Gratuit ? … OK. Mais je prends 10 % des bananes." },
      { speaker: "Kiki", text: "5 %." },
      { speaker: "Bongo", text: "Deal. Chef." },
    ],
  },
  {
    id: "plantation",
    title: "Terres interdites",
    emoji: "🏝️👷",
    image: "images/cutscenes/03-plantation.png",
    lines: [
      { speaker: "Kiki", text: "Cinq bananiers. On ne se cache plus." },
      { speaker: "Bongo", text: "Au loin… l'usine Banana Factory. Les humains bossent sans voir qu'on repousse les limites." },
      { speaker: "Kiki", text: "Ils font leur stage, on fait notre révolution. Chacun son combat." },
      { speaker: "Bongo", text: "Les gorilles vont remarquer." },
    ],
  },
  {
    id: "convoy",
    title: "Le convoi des gorilles",
    emoji: "🚚🦍",
    image: "images/cutscenes/04-convoy.png",
    lines: [
      { speaker: "Gros Koko", text: "Qui ose transporter des bananes dans MON secteur ?" },
      { speaker: "Bongo", text: "C'est Gros Koko… le gorille qui pense que la gravité lui obéit." },
      { speaker: "Kiki", text: "On ne recule pas. Le camion roule pour le clan." },
      { speaker: "Gros Koko", text: "Tu vas regretter, petit singe." },
    ],
  },
  {
    id: "factory",
    title: "L'usine et les humains",
    emoji: "🏭👷",
    image: "images/cutscenes/05-factory.png",
    lines: [
      { speaker: "Kiki", text: "Une usine à purée. On ne fait plus que cueillir — on transforme." },
      { speaker: "Bongo", text: "Les humains de l'usine font « convoyeur, machine à peler »… nous on fait « liberté »." },
      { speaker: "Kiki", text: "Ils ne savent pas qu'on existe. Mieux vaut ainsi." },
      { speaker: "Bongo", text: "Koko a doublé ses gorilles. Il a peur." },
    ],
  },
  {
    id: "duel",
    title: "Le gorille en chef",
    emoji: "👑🦍",
    image: "images/cutscenes/06-duel.png",
    lines: [
      { speaker: "Gros Koko", text: "Tu contrôles l'économie banane ? Ridicule. Je contrôle les gorilles." },
      { speaker: "Kiki", text: "Et bientôt, les singes contrôleront leur vie." },
      { speaker: "Gros Koko", text: "Je vais écraser ton empire. Comme une banane trop mûre." },
      { speaker: "Kiki", text: "On verra qui glisse en premier." },
      { speaker: "Gros Koko", text: "… Qu'est-ce que ça veut dire ?" },
      { speaker: "Kiki", text: "Tu comprendras." },
    ],
  },
  {
    id: "banana-slip",
    title: "La banane du destin",
    emoji: "🦍🍌💥",
    image: "images/cutscenes/07-banana-slip.png",
    lines: [
      { speaker: "Gros Koko", text: "PERSONNE NE PRIE LE TEMPLE BANANE !" },
      { speaker: "Bongo", text: "Koko ! Regarde tes pieds !" },
      { speaker: "Gros Koko", text: "Quoi ? Une ban— AAAAAH !" },
      { speaker: "Bongo", text: "… Chef. C'était magnifique." },
      { speaker: "Kiki", text: "La gravité est neutre. Elle choisit toujours le gorille le plus arrogant." },
      { speaker: "Gros Koko", text: "Je… je ne glisse pas. C'est… un plongeon tactique." },
      { speaker: "Tous les singes", text: "LIBERTÉ !" },
    ],
  },
  {
    id: "revolution",
    title: "La révolution banane",
    emoji: "⭐🎉🍌",
    image: "images/cutscenes/08-revolution.png",
    lines: [
      { speaker: "Mama Banane", text: "Tu as recommencé. Pas parce que tu as échoué — parce que tu es devenu une légende." },
      { speaker: "Kiki", text: "Chaque prestige, le clan est plus fort. Koko est encore dans la boue, probablement." },
      { speaker: "Bongo", text: "Il dit qu'il « médite sur la banane »." },
      { speaker: "Kiki", text: "Les singes sont libres. Les humains bossent. Les gorilles… glissent." },
      { speaker: "Kiki", text: "La révolution banane continue." },
    ],
  },
];

const state = {
  bananas: 0,
  totalEarned: 0,
  lifetimeEarned: 0,
  totalClicks: 0,
  lifetimeClicks: 0,
  goldenClicked: 0,
  buildings: {},
  upgrades: [],
  achievements: [],
  clickMult: 1,
  globalMult: 1,
  buildingMults: {},
  prestigePoints: 0,
  prestigeCount: 0,
  seenCutscenes: [],
};

BUILDINGS.forEach((b) => {
  state.buildings[b.id] = 0;
  state.buildingMults[b.id] = 1;
});

let goldenVisible = false;
let goldenTimeout = null;
let lastSave = 0;
let lastShopUpdate = 0;
let cutsceneActive = false;
let currentCutscene = null;
let cutsceneLineIndex = 0;
const pendingCutscenes = [];

const welcomeScreenEl = document.getElementById("welcome-screen");
const gameScreenEl = document.getElementById("game-screen");
const welcomeContinueEl = document.getElementById("welcome-continue");
const bananaBtn = document.getElementById("banana-btn");
const bananaCountEl = document.getElementById("banana-count");
const bpsDisplayEl = document.getElementById("bps-display");
const ppcDisplayEl = document.getElementById("ppc-display");
const clickCountEl = document.getElementById("click-count");
const prestigeDisplayEl = document.getElementById("prestige-display");
const prestigePanelEl = document.getElementById("prestige-panel");
const goldenBananaEl = document.getElementById("golden-banana");
const buildingsListEl = document.getElementById("buildings-list");
const upgradesListEl = document.getElementById("upgrades-list");
const achievementsListEl = document.getElementById("achievements-list");
const cutsceneOverlayEl = document.getElementById("cutscene-overlay");
const cutsceneImageEl = document.getElementById("cutscene-image");
const cutsceneFallbackEl = document.getElementById("cutscene-fallback");
const cutsceneTitleEl = document.getElementById("cutscene-title");
const cutsceneLineEl = document.getElementById("cutscene-line");
const cutsceneNextEl = document.getElementById("cutscene-next");
const cutsceneSkipEl = document.getElementById("cutscene-skip");

function getBuildingCount(id) {
  return state.buildings[id] || 0;
}

function buildingCost(building, count) {
  return Math.floor(building.baseCost * Math.pow(building.costMult, count));
}

function formatNumber(n) {
  if (n < 1000) {
    const hasFraction = Math.abs(n % 1) > 0.0001;
    if (!hasFraction) {
      return Math.floor(n).toLocaleString("fr-FR");
    }
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  if (n < 1000000) {
    const v = n / 1000;
    return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + "K";
  }
  if (n < 1000000000) {
    const v = n / 1000000;
    return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + "M";
  }
  if (n < 1000000000000) {
    const v = n / 1000000000;
    return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + "B";
  }
  const v = n / 1000000000000;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + "T";
}

function getPrestigeMultiplier() {
  return 1 + state.prestigePoints * PRESTIGE_BONUS_PER_POINT;
}

function getPrestigeGainFromEarned(earned) {
  if (earned < PRESTIGE_MIN_EARNED) return 0;
  return Math.floor(Math.sqrt(earned / PRESTIGE_MIN_EARNED));
}

function getBuildingBps(building) {
  const count = getBuildingCount(building.id);
  const mult = state.buildingMults[building.id] || 1;
  return count * building.baseBps * mult * state.globalMult * getPrestigeMultiplier();
}

function getTotalBps() {
  return BUILDINGS.reduce((sum, b) => sum + getBuildingBps(b), 0);
}

function getClickPower() {
  const cursor = BUILDINGS.find((b) => b.id === "cursor");
  const count = getBuildingCount("cursor");
  const mult = state.buildingMults[cursor.id] || 1;
  const cursorContribution = count * cursor.baseBps * mult * 0.5;
  return Math.max(1, Math.floor((1 + cursorContribution) * state.clickMult * state.globalMult * getPrestigeMultiplier()));
}

function addBananas(amount) {
  state.bananas += amount;
  state.totalEarned += amount;
  state.lifetimeEarned += amount;
  checkAchievements();
}

function showFloatText(x, y, text) {
  const el = document.createElement("div");
  el.className = "float-text";
  el.textContent = text;
  el.style.left = x + "px";
  el.style.top = y + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function spawnFallingBananas(clickX) {
  const container = document.getElementById("banana-rain");
  const count = 7 + Math.floor(Math.random() * 4);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "falling-banana";
    el.textContent = "🍌";

    const spread = window.innerWidth * 0.55;
    const x = clickX
      ? clickX + (Math.random() - 0.5) * spread
      : Math.random() * window.innerWidth;
    const clampedX = Math.max(10, Math.min(window.innerWidth - 60, x));

    el.style.left = clampedX + "px";
    el.style.fontSize = (48 + Math.random() * 52) + "px";
    el.style.animationDuration = (2.2 + Math.random() * 1.8) + "s";
    el.style.animationDelay = Math.random() * 0.35 + "s";

    container.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

function onBananaClick(e) {
  if (!gameStarted || cutsceneActive) return;

  const power = getClickPower();
  addBananas(power);
  state.totalClicks++;
  state.lifetimeClicks++;
  playClickSound();

  bananaBtn.classList.add("pulse");
  setTimeout(() => bananaBtn.classList.remove("pulse"), 200);

  const x = e.clientX || (bananaBtn.offsetLeft + 100);
  const y = e.clientY || (bananaBtn.offsetTop + 100);
  showFloatText(x - 20, y - 30, "+" + formatNumber(power));
  spawnFallingBananas(x);

  updateUI();
  maybeSpawnGolden();
}

function onGoldenClick(e) {
  if (!goldenVisible) return;
  e.stopPropagation();

  const bonus = Math.max(100, getTotalBps() * 30 + getClickPower() * 50);
  addBananas(bonus);
  state.goldenClicked++;

  goldenVisible = false;
  goldenBananaEl.classList.add("hidden");
  clearTimeout(goldenTimeout);

  playGoldenSound();
  showFloatText(e.clientX, e.clientY, "+" + formatNumber(bonus) + " 🌟");
  spawnFallingBananas(e.clientX);
  showToast("Banane dorée ! +" + formatNumber(bonus));
  updateUI();
}

function maybeSpawnGolden() {
  if (goldenVisible) return;
  if (Math.random() < 0.008) spawnGolden();
}

function spawnGolden() {
  goldenVisible = true;
  const zone = document.querySelector(".click-zone");
  const rect = zone.getBoundingClientRect();
  const x = 40 + Math.random() * (rect.width - 120);
  const y = 60 + Math.random() * (rect.height - 140);
  goldenBananaEl.style.left = x + "px";
  goldenBananaEl.style.top = y + "px";
  goldenBananaEl.classList.remove("hidden");

  goldenTimeout = setTimeout(() => {
    goldenVisible = false;
    goldenBananaEl.classList.add("hidden");
  }, 8000);
}

function buyBuilding(buildingId) {
  const building = BUILDINGS.find((b) => b.id === buildingId);
  const count = getBuildingCount(buildingId);
  const cost = buildingCost(building, count);

  if (state.bananas < cost) return;

  state.bananas -= cost;
  state.buildings[buildingId] = count + 1;
  playBuySound();
  showToast(building.name + " acheté !");
  checkCutsceneTriggers("building", buildingId);
  updateUI();
}

function buyUpgrade(upgradeId) {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (state.upgrades.includes(upgradeId)) return;
  if (!upgrade.req()) return;
  if (state.bananas < upgrade.cost) return;

  state.bananas -= upgrade.cost;
  state.upgrades.push(upgradeId);

  if (upgrade.type === "click") {
    state.clickMult *= upgrade.mult;
  } else if (upgrade.type === "building") {
    state.buildingMults[upgrade.buildingId] *= upgrade.mult;
  } else if (upgrade.type === "global") {
    state.globalMult *= upgrade.mult;
  }

  playBuySound();
  showToast("Amélioration : " + upgrade.name);
  updateUI();
}

function checkAchievements() {
  ACHIEVEMENTS.forEach((ach) => {
    if (!state.achievements.includes(ach.id) && ach.check()) {
      state.achievements.push(ach.id);
      playAchievementSound();
      showToast("🏆 Trophée : " + ach.name);
    }
  });
}

function renderBuildings() {
  buildingsListEl.innerHTML = BUILDINGS.map((b) => {
    const count = getBuildingCount(b.id);
    const cost = buildingCost(b, count);
    const bps = getBuildingBps(b);
    const canBuy = state.bananas >= cost;
    return `
      <div class="shop-item ${canBuy ? "" : "disabled"}" data-building="${b.id}">
        <div class="item-icon">${b.icon}</div>
        <div class="item-info">
          <div class="item-name">${b.name}</div>
          <div class="item-desc">${b.desc}</div>
        </div>
        <div class="item-meta">
          <div class="item-cost">🍌 ${formatNumber(cost)}</div>
          <div class="item-count">${count} · +${formatNumber(bps)}/s</div>
        </div>
      </div>
    `;
  }).join("");

  buildingsListEl.querySelectorAll(".shop-item:not(.disabled)").forEach((el) => {
    el.addEventListener("click", () => buyBuilding(el.dataset.building));
  });
}

function renderUpgrades() {
  const available = UPGRADES.filter((u) => u.req() && !state.upgrades.includes(u.id));

  if (available.length === 0 && state.upgrades.length === UPGRADES.length) {
    upgradesListEl.innerHTML = "<p class='panel-desc'>Toutes les améliorations sont achetées !</p>";
    return;
  }

  const locked = UPGRADES.filter((u) => !u.req() && !state.upgrades.includes(u.id));
  const owned = UPGRADES.filter((u) => state.upgrades.includes(u.id));

  let html = "";

  available.forEach((u) => {
    const canBuy = state.bananas >= u.cost;
    html += `
      <div class="shop-item ${canBuy ? "" : "disabled"}" data-upgrade="${u.id}">
        <div class="item-icon">${u.icon}</div>
        <div class="item-info">
          <div class="item-name">${u.name}</div>
          <div class="item-desc">${u.desc}</div>
        </div>
        <div class="item-meta">
          <div class="item-cost">🍌 ${formatNumber(u.cost)}</div>
        </div>
      </div>
    `;
  });

  owned.forEach((u) => {
    html += `
      <div class="shop-item owned">
        <div class="item-icon">${u.icon}</div>
        <div class="item-info">
          <div class="item-name">${u.name}</div>
          <div class="item-desc">Acheté ✓</div>
        </div>
      </div>
    `;
  });

  locked.slice(0, 3).forEach((u) => {
    html += `
      <div class="shop-item disabled">
        <div class="item-icon">🔒</div>
        <div class="item-info">
          <div class="item-name">${u.name}</div>
          <div class="item-desc">??? (pas encore débloqué)</div>
        </div>
      </div>
    `;
  });

  upgradesListEl.innerHTML = html;

  upgradesListEl.querySelectorAll("[data-upgrade]").forEach((el) => {
    if (!el.classList.contains("disabled")) {
      el.addEventListener("click", () => buyUpgrade(el.dataset.upgrade));
    }
  });
}

function renderAchievements() {
  achievementsListEl.innerHTML = ACHIEVEMENTS.map((ach) => {
    const unlocked = state.achievements.includes(ach.id);
    return `
      <div class="shop-item achievement ${unlocked ? "unlocked" : "locked"}">
        <div class="item-icon">${unlocked ? ach.icon : "🔒"}</div>
        <div class="item-info">
          <div class="item-name">${unlocked ? ach.name : "???"}</div>
          <div class="item-desc">${unlocked ? ach.desc : "Trophée secret"}</div>
        </div>
        ${unlocked ? '<div class="item-meta"><div class="item-count">✓</div></div>' : ""}
      </div>
    `;
  }).join("");
}

function renderPrestige() {
  if (!prestigePanelEl) return;

  const gain = getPrestigeGainFromEarned(state.totalEarned);
  const mult = getPrestigeMultiplier();
  const bonusPct = Math.round((mult - 1) * 100);
  const nextBonusPct = Math.round((mult + gain * PRESTIGE_BONUS_PER_POINT - 1) * 100);
  const canPrestige = gain > 0;

  prestigePanelEl.innerHTML = `
    <div class="prestige-hero">
      <div class="prestige-hero-icon">⭐</div>
      <div class="prestige-hero-title">Bonus de prestige</div>
      <div class="prestige-hero-mult">×${mult.toFixed(2)} (+${bonusPct}%)</div>
    </div>
    <div class="prestige-stats">
      <div class="prestige-stat">
        <span class="prestige-stat-label">Points</span>
        <span class="prestige-stat-value">${state.prestigePoints} ⭐</span>
      </div>
      <div class="prestige-stat">
        <span class="prestige-stat-label">Prestiges</span>
        <span class="prestige-stat-value">${state.prestigeCount}</span>
      </div>
      <div class="prestige-stat">
        <span class="prestige-stat-label">Cette run</span>
        <span class="prestige-stat-value">${formatNumber(state.totalEarned)}</span>
      </div>
      <div class="prestige-stat">
        <span class="prestige-stat-label">Gain si prestige</span>
        <span class="prestige-stat-value">+${gain} ⭐</span>
      </div>
    </div>
    <p class="prestige-desc">
      Prestiger efface ta run (bananes, plantations, améliorations) mais garde tes trophées et tes points de prestige.
      Chaque point donne +${Math.round(PRESTIGE_BONUS_PER_POINT * 100)}% sur toute la production.
      Minimum : ${formatNumber(PRESTIGE_MIN_EARNED)} bananes gagnées cette run.
    </p>
    <button type="button" id="prestige-btn" class="prestige-btn ${canPrestige ? "ready" : "disabled"}" ${canPrestige ? "" : "disabled"}>
      ${canPrestige ? `⭐ PRESTIGER (+${gain} pt → +${nextBonusPct}%)` : "🔒 Pas assez de bananes cette run"}
    </button>
    <p class="prestige-warning">Le bouton Reset efface tout, y compris le prestige.</p>
  `;

  const btn = document.getElementById("prestige-btn");
  if (btn && canPrestige) {
    btn.addEventListener("click", doPrestige);
  }
}

function queueCutscene(id) {
  if (state.seenCutscenes.includes(id)) return;
  if (pendingCutscenes.includes(id)) return;
  pendingCutscenes.push(id);
  if (!cutsceneActive) {
    playNextCutscene();
  }
}

function playNextCutscene() {
  if (pendingCutscenes.length === 0) {
    cutsceneActive = false;
    currentCutscene = null;
    return;
  }

  const id = pendingCutscenes.shift();
  if (state.seenCutscenes.includes(id)) {
    playNextCutscene();
    return;
  }

  const scene = CUTSCENES.find((c) => c.id === id);
  if (!scene) {
    playNextCutscene();
    return;
  }

  currentCutscene = scene;
  cutsceneLineIndex = 0;
  cutsceneActive = true;

  cutsceneOverlayEl.classList.remove("hidden");
  cutsceneOverlayEl.setAttribute("aria-hidden", "false");
  cutsceneTitleEl.textContent = scene.title;

  cutsceneImageEl.hidden = true;
  cutsceneImageEl.src = scene.image;
  cutsceneImageEl.onload = () => {
    cutsceneImageEl.hidden = false;
    cutsceneFallbackEl.style.display = "none";
  };
  cutsceneImageEl.onerror = () => {
    cutsceneImageEl.hidden = true;
    cutsceneFallbackEl.style.display = "flex";
    cutsceneFallbackEl.textContent = scene.emoji;
  };
  cutsceneFallbackEl.style.display = "flex";
  cutsceneFallbackEl.textContent = scene.emoji;

  updateCutsceneLine();
}

function updateCutsceneLine() {
  if (!currentCutscene) return;

  const line = currentCutscene.lines[cutsceneLineIndex];
  const isLast = cutsceneLineIndex >= currentCutscene.lines.length - 1;
  cutsceneLineEl.innerHTML = "<strong>" + line.speaker + "</strong>" + line.text;
  cutsceneNextEl.textContent = isLast ? "Terminer" : "Continuer";
}

function finishCutscene() {
  if (currentCutscene && !state.seenCutscenes.includes(currentCutscene.id)) {
    state.seenCutscenes.push(currentCutscene.id);
    checkAchievements();
    persistSave();
  }

  cutsceneOverlayEl.classList.add("hidden");
  cutsceneOverlayEl.setAttribute("aria-hidden", "true");
  currentCutscene = null;
  cutsceneLineIndex = 0;

  setTimeout(() => playNextCutscene(), 300);
}

function skipCutscene() {
  finishCutscene();
}

function nextCutsceneLine() {
  if (!currentCutscene) return;
  cutsceneLineIndex += 1;
  if (cutsceneLineIndex >= currentCutscene.lines.length) {
    finishCutscene();
  } else {
    updateCutsceneLine();
  }
}

function checkCutsceneTriggers(source, buildingId) {
  if (source === "start") {
    queueCutscene("prologue");
    return;
  }

  if (source === "building") {
    if (buildingId === "cursor" && getBuildingCount("cursor") === 1) {
      queueCutscene("ally");
    }
    if (buildingId === "bananier" && getBuildingCount("bananier") >= 5) {
      queueCutscene("plantation");
    }
    if (buildingId === "camion" && getBuildingCount("camion") === 1) {
      queueCutscene("convoy");
    }
    if (buildingId === "usine" && getBuildingCount("usine") === 1) {
      queueCutscene("factory");
    }
    if (buildingId === "empire" && getBuildingCount("empire") === 1) {
      queueCutscene("duel");
    }
    if (buildingId === "temple" && getBuildingCount("temple") === 1) {
      queueCutscene("banana-slip");
    }
  }

  if (source === "prestige" && state.prestigeCount === 1) {
    queueCutscene("revolution");
  }
}

function persistSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData()));
}

function resetRunState() {
  state.bananas = 0;
  state.totalEarned = 0;
  state.totalClicks = 0;
  state.goldenClicked = 0;
  state.upgrades = [];
  state.clickMult = 1;
  state.globalMult = 1;
  BUILDINGS.forEach((b) => {
    state.buildings[b.id] = 0;
    state.buildingMults[b.id] = 1;
  });
  goldenVisible = false;
  goldenBananaEl.classList.add("hidden");
  clearTimeout(goldenTimeout);
}

function doPrestige() {
  const gain = getPrestigeGainFromEarned(state.totalEarned);
  if (gain <= 0) return;

  const newMult = 1 + (state.prestigePoints + gain) * PRESTIGE_BONUS_PER_POINT;
  const msg =
    `Prestiger et gagner ${gain} point(s) de prestige ?\n\n` +
    `Tu perds : bananes, plantations, améliorations.\n` +
    `Tu gardes : trophées, points de prestige.\n\n` +
    `Nouveau bonus : ×${newMult.toFixed(2)} production`;

  if (!confirm(msg)) return;

  state.prestigePoints += gain;
  state.prestigeCount += 1;
  resetRunState();
  checkAchievements();
  playPrestigeSound();
  showToast(`⭐ Prestige ! +${gain} pt — ×${getPrestigeMultiplier().toFixed(2)} prod`);
  checkCutsceneTriggers("prestige");
  updateUI();
  saveGame();
}

function buildSaveData() {
  return {
    bananas: state.bananas,
    totalEarned: state.totalEarned,
    lifetimeEarned: state.lifetimeEarned,
    totalClicks: state.totalClicks,
    lifetimeClicks: state.lifetimeClicks,
    goldenClicked: state.goldenClicked,
    buildings: state.buildings,
    upgrades: state.upgrades,
    achievements: state.achievements,
    clickMult: state.clickMult,
    globalMult: state.globalMult,
    buildingMults: state.buildingMults,
    prestigePoints: state.prestigePoints,
    prestigeCount: state.prestigeCount,
    seenCutscenes: state.seenCutscenes,
  };
}

function updateUI() {
  bananaCountEl.textContent = formatNumber(state.bananas);
  bpsDisplayEl.textContent = formatNumber(getTotalBps());
  ppcDisplayEl.textContent = formatNumber(getClickPower());
  if (clickCountEl) clickCountEl.textContent = formatNumber(state.totalClicks);
  if (prestigeDisplayEl) {
    prestigeDisplayEl.textContent = "⭐ " + state.prestigePoints + " (×" + getPrestigeMultiplier().toFixed(2) + ")";
  }

  renderBuildings();
  renderUpgrades();
  renderAchievements();
  renderPrestige();
}

function saveGame() {
  persistSave();
  playSaveSound();
  showToast("Sauvegarde !");
}

function loadGame() {
  let raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    raw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (raw) localStorage.setItem(SAVE_KEY, raw);
  }
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    state.bananas = data.bananas || 0;
    state.totalEarned = data.totalEarned || 0;
    state.lifetimeEarned = data.lifetimeEarned || data.totalEarned || 0;
    state.totalClicks = data.totalClicks || 0;
    state.lifetimeClicks = data.lifetimeClicks || data.totalClicks || 0;
    state.goldenClicked = data.goldenClicked || 0;
    state.upgrades = data.upgrades || [];
    state.achievements = data.achievements || [];
    state.clickMult = data.clickMult || 1;
    state.globalMult = data.globalMult || 1;
    state.prestigePoints = data.prestigePoints || 0;
    state.prestigeCount = data.prestigeCount || 0;
    state.seenCutscenes = data.seenCutscenes || [];

    if (data.buildings) {
      Object.assign(state.buildings, data.buildings);
    }
    if (data.buildingMults) {
      Object.assign(state.buildingMults, data.buildingMults);
    }
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}

function resetGame() {
  if (!confirm("Effacer TOUTE ta progression (y compris le prestige) ?")) return;

  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

function hasSavedProgress() {
  return state.totalEarned > 0 || state.totalClicks > 0 || state.bananas > 0 || state.prestigePoints > 0;
}

function updateWelcomeContinue() {
  if (!welcomeContinueEl) return;
  if (hasSavedProgress()) {
    let msg = "Progression trouvée : " + formatNumber(state.bananas) + " bananes · " + formatNumber(state.totalClicks) + " clics";
    if (state.prestigePoints > 0) {
      msg += " · ⭐ " + state.prestigePoints + " prestige";
    }
    welcomeContinueEl.textContent = msg;
    welcomeContinueEl.classList.remove("hidden");
  } else {
    welcomeContinueEl.classList.add("hidden");
  }
}

function startGame() {
  initAudio();
  playStartSound();
  gameStarted = true;

  welcomeScreenEl.classList.add("fade-out");
  gameScreenEl.classList.remove("hidden");

  setTimeout(() => {
    welcomeScreenEl.style.display = "none";
  }, 650);

  updateUI();
  setTimeout(() => checkCutsceneTriggers("start"), 900);
}

document.getElementById("play-btn").addEventListener("click", startGame);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
  });
});

bananaBtn.addEventListener("click", onBananaClick);
goldenBananaEl.addEventListener("click", onGoldenClick);
document.getElementById("save-btn").addEventListener("click", saveGame);
document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("sound-btn").addEventListener("click", toggleSound);

cutsceneNextEl.addEventListener("click", nextCutsceneLine);
cutsceneSkipEl.addEventListener("click", skipCutscene);
cutsceneOverlayEl.addEventListener("click", (e) => {
  if (e.target === cutsceneOverlayEl) skipCutscene();
});

loadGame();
updateWelcomeContinue();
updateSoundButton();

let accumulator = 0;
let lastTick = performance.now();

function gameLoop(now) {
  const delta = (now - lastTick) / 1000;
  lastTick = now;
  accumulator += delta;

  if (!gameStarted) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (accumulator >= 0.1) {
    const bps = getTotalBps();
    if (bps > 0) {
      addBananas(bps * accumulator);
    }
    accumulator = 0;
    bananaCountEl.textContent = formatNumber(state.bananas);
    bpsDisplayEl.textContent = formatNumber(getTotalBps());

    const nowMs = Date.now();
    if (nowMs - lastShopUpdate > 1000) {
      renderBuildings();
      renderUpgrades();
      renderPrestige();
      lastShopUpdate = nowMs;
    }
    if (nowMs - lastSave > 10000) {
      persistSave();
      lastSave = nowMs;
    }
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

setInterval(() => {
  if (!gameStarted || goldenVisible || Math.random() >= 0.15) return;
  spawnGolden();
}, 30000);

// ─── Leaderboard ────────────────────────────────────────────────────────────

const leaderboardListEl = document.getElementById("leaderboard-list");

function getOrCreatePlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function renderLeaderboard(entries) {
  if (!leaderboardListEl) return;
  if (!entries || entries.length === 0) {
    leaderboardListEl.innerHTML = '<p class="leaderboard-empty">Aucun score enregistré.</p>';
    return;
  }
  leaderboardListEl.innerHTML = entries
    .map((entry, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      const prestige = entry.prestigePoints > 0 ? ` · ⭐ ${entry.prestigePoints}` : "";
      return `
        <div class="shop-item leaderboard-row">
          <div class="leaderboard-rank">${medal}</div>
          <div class="item-info">
            <div class="item-name">${escapeHtml(entry.name)}</div>
            <div class="item-desc">${formatNumber(entry.score)} bananes${prestige}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchLeaderboard() {
  if (!leaderboardListEl) return;
  leaderboardListEl.innerHTML = '<p class="leaderboard-empty">Chargement…</p>';
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderLeaderboard(data.entries);
  } catch {
    leaderboardListEl.innerHTML = '<p class="leaderboard-empty">Impossible de charger le classement.</p>';
  }
}

async function submitLeaderboardScore() {
  const score = Math.floor(state.lifetimeEarned);
  if (score <= 0) {
    showToast("Aucun score à envoyer !");
    return;
  }
  let name = localStorage.getItem(PLAYER_NAME_KEY);
  if (!name) {
    name = prompt("Entre ton pseudo pour le classement (max 32 caractères) :");
    if (!name || name.trim().length === 0) return;
    name = name.trim();
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }

  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: getOrCreatePlayerId(),
        name,
        score,
        lifetimeClicks: Math.floor(state.lifetimeClicks),
        prestigePoints: Math.floor(state.prestigePoints),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    showToast("Score envoyé ! 🍌");
    fetchLeaderboard();
  } catch (err) {
    showToast("Erreur : " + err.message);
  }
}

document.getElementById("leaderboard-submit-btn")?.addEventListener("click", submitLeaderboardScore);
document.getElementById("leaderboard-refresh-btn")?.addEventListener("click", fetchLeaderboard);

document.querySelectorAll(".tab").forEach((tab) => {
  if (tab.dataset.tab === "leaderboard") {
    tab.addEventListener("click", fetchLeaderboard);
  }
});

