import { calculateCurrentSky } from "./ephemeris.js";
import {
  signForLongitude,
  detectAspects,
  rankSignalsForTheme,
  formatDegree
} from "./zodiac-engine.js";

const $ = (id) => document.getElementById(id);

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function titleCase(value) {
  return value.replace(/\b\w/g, m => m.toUpperCase());
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric"
  }).format(date);
}

function renderSigns(signs, onSelect) {
  $("sign-grid").innerHTML = signs.map(sign => `
    <button class="sign-button" data-sign="${sign.id}">
      <span class="symbol">${sign.symbol}</span>
      <strong>${sign.name}</strong>
      <small>${titleCase(sign.element)} · ${titleCase(sign.modality)}</small>
    </button>
  `).join("");

  document.querySelectorAll(".sign-button").forEach(button => {
    button.addEventListener("click", () => onSelect(button.dataset.sign));
  });
}

function renderSky(positioned, aspects) {
  $("sky-grid").innerHTML = positioned.map(p => `
    <article class="sky-card">
      <strong>${p.name}</strong>
      <span>${p.sign.symbol} ${p.sign.name}</span>
      <small>${formatDegree(p.sign.degree)}</small>
    </article>
  `).join("");

  const top = aspects.slice(0, 8);
  $("aspect-list").innerHTML = top.length
    ? `<h3>Major aspects in the current sky</h3>` + top.map(item => `
        <div class="aspect-row">
          <span><strong>${item.planetA.name}</strong> ${item.aspect.label.toLowerCase()} <strong>${item.planetB.name}</strong></span>
          <span>orb ${item.aspect.delta.toFixed(2)}°</span>
        </div>
      `).join("")
    : `<p class="muted">No configured major aspects are within orb at this moment.</p>`;
}

function aspectInterpretation(item, themeId, aspectLibrary) {
  const key = `${item.planetA.id}_${item.planetB.id}`;
  const record = aspectLibrary.entries?.[key]?.[item.aspect.id];
  return record?.[themeId] || record?.overall || "";
}

function buildThemeText({
  theme,
  signals,
  relationStatements,
  planetSigns,
  aspects,
  aspectLibrary
}) {
  const useful = signals.filter(s => s.relation !== "neutral").slice(0, 3);
  const paragraphs = [];

  for (const signal of useful) {
    const placement = planetSigns.entries?.[`${signal.id}_${signal.sign.id}`];
    const placementText = placement?.[theme.id] || placement?.overall || "";
    const relationText = relationStatements[signal.relation]?.[theme.id]
      || relationStatements[signal.relation]?.overall
      || "";

    if (placementText || relationText) {
      paragraphs.push(
        `<strong>${signal.name} in ${signal.sign.name} · ${titleCase(signal.relation)}</strong> ${placementText} ${relationText}`
      );
    }
  }

  const relevantAspects = aspects
    .filter(item => theme.planets.includes(item.planetA.id) || theme.planets.includes(item.planetB.id))
    .slice(0, 2);

  for (const item of relevantAspects) {
    const text = aspectInterpretation(item, theme.id, aspectLibrary);
    if (text) {
      paragraphs.push(
        `<strong>${item.planetA.name} ${item.aspect.label} ${item.planetB.name}</strong> ${text}`
      );
    }
  }

  if (!paragraphs.length) {
    return "<p>No major configured signal dominates this theme right now, so it can be treated as a quieter background area today.</p>";
  }

  return paragraphs.map(p => `<p>${p}</p>`).join("");
}

function renderReading({
  selectedSign,
  themes,
  positioned,
  aspects,
  rules,
  relationStatements,
  planetSigns,
  aspectLibrary,
  date
}) {
  $("reading").hidden = false;
  $("reading-title").textContent = `${selectedSign.name} Daily Zodiac`;
  $("reading-subtitle").textContent = formatDate(date);
  $("sign-symbol").textContent = selectedSign.symbol;

  $("theme-grid").innerHTML = themes.map(theme => {
    const signals = rankSignalsForTheme({
      selectedSign,
      positionedPlanets: positioned,
      theme,
      relationWeights: rules.relationWeights
    });
    const text = buildThemeText({
      theme,
      signals,
      relationStatements,
      planetSigns,
      aspects,
      aspectLibrary
    });
    return `
      <article class="theme-card">
        <h3>${theme.label}</h3>
        ${text}
      </article>
    `;
  }).join("");

  $("reading-aspects").innerHTML = aspects.length
    ? `<h3>Today’s strongest sky aspects</h3>` + aspects.slice(0, 5).map(item => {
        const interpretation = aspectInterpretation(item, "overall", aspectLibrary);
        return `
          <div class="aspect-row">
            <span>
              <strong>${item.planetA.name} ${item.aspect.label.toLowerCase()} ${item.planetB.name}</strong>
              ${interpretation ? `<br><small>${interpretation}</small>` : ""}
            </span>
            <span>${item.aspect.nature} · orb ${item.aspect.delta.toFixed(2)}°</span>
          </div>
        `;
      }).join("")
    : "";

  $("reading").scrollIntoView({ behavior:"smooth", block:"start" });
}

async function main() {
  const date = new Date();
  $("today-date").textContent = formatDate(date);

  const [
    signData,
    themeData,
    aspectData,
    rules,
    relationStatements,
    planetSigns,
    aspectLibrary
  ] = await Promise.all([
    loadJson("./data/signs.json"),
    loadJson("./data/themes.json"),
    loadJson("./data/aspects.json"),
    loadJson("./data/daily-rules.json"),
    loadJson("./data/relation-statements.json"),
    loadJson("./data/planet-signs.json"),
    loadJson("./data/planet-aspects.json")
  ]);

  const signs = signData.signs;
  renderSigns(signs, () => {});

  try {
    const sky = await calculateCurrentSky(date);
    const positioned = sky.positions.map(position => ({
      ...position,
      sign: signForLongitude(position.longitude, signs)
    }));
    const aspects = detectAspects(positioned, aspectData.aspects);

    $("engine-status").className = "status ok";
    $("engine-status").textContent =
      `Ephemeris ready · ${sky.engine} · ${sky.ephemeris} · source: ${sky.engineSource}`;

    renderSky(positioned, aspects);

    renderSigns(signs, signId => {
      const selectedSign = signs.find(s => s.id === signId);
      renderReading({
        selectedSign,
        themes:themeData.themes,
        positioned,
        aspects,
        rules,
        relationStatements,
        planetSigns,
        aspectLibrary,
        date
      });
    });
  } catch (error) {
    console.error(error);
    $("engine-status").className = "status error";
    $("engine-status").textContent =
      "Ephemeris unavailable. No zodiac reading is generated until the calculation engine loads successfully.";
    $("sky-grid").innerHTML = "";
    $("aspect-list").innerHTML =
      '<p class="muted">The site deliberately does not substitute invented planetary positions.</p>';
  }
}

main().catch(error => {
  console.error(error);
  $("engine-status").className = "status error";
  $("engine-status").textContent = "Daily Zodiac could not initialize.";
});
