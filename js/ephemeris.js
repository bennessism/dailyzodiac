const PLANET_NAMES = [
  "Sun","Moon","Mercury","Venus","Mars",
  "Jupiter","Saturn","Uranus","Neptune","Pluto"
];

async function loadLibrary() {
  const errors = [];
  const sources = [
    { label: "local", url: "../vendor/swisseph/index.js" },
    { label: "cdn", url: "https://esm.sh/@swisseph/browser" }
  ];

  for (const source of sources) {
    try {
      const mod = await import(source.url);
      return { mod, source: source.label };
    } catch (error) {
      errors.push(`${source.label}: ${error?.message || error}`);
    }
  }
  throw new Error(`Swiss Ephemeris could not be loaded. ${errors.join(" | ")}`);
}

export async function calculateCurrentSky(date = new Date()) {
  const { mod, source } = await loadLibrary();
  const { SwissEphemeris, Planet } = mod;
  const swe = new SwissEphemeris();

  try {
    await swe.init();
    const jd = swe.dateToJulianDay(date);
    const positions = [];

    for (const name of PLANET_NAMES) {
      const body = Planet[name];
      const result = swe.calculatePosition(jd, body);
      positions.push({
        id: name.toLowerCase(),
        name,
        longitude: normalizeLongitude(result.longitude),
        latitude: result.latitude,
        distance: result.distance
      });
    }

    return {
      date: date.toISOString(),
      julianDay: jd,
      engine: "@swisseph/browser",
      engineSource: source,
      ephemeris: "Moshier (built in)",
      positions
    };
  } finally {
    try { swe.close(); } catch (_) {}
  }
}

export function normalizeLongitude(value) {
  return ((Number(value) % 360) + 360) % 360;
}
