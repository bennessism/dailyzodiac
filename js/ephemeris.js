const PLANET_NAMES = [
  "Sun","Moon","Mercury","Venus","Mars",
  "Jupiter","Saturn","Uranus","Neptune","Pluto"
];

// Pinned to the same version bundled in vendor/swisseph/.
// Attempt initialization and one real calculation before selecting a source,
// so missing WASM assets also trigger the CDN fallback.
const SOURCES = [
  { label: "local", url: "../vendor/swisseph/index.js" },
  { label: "cdn", url: "https://esm.sh/@swisseph/browser@1.4.0" }
];

export async function calculateCurrentSky(date = new Date()) {
  const errors = [];
  for (const source of SOURCES) {
    let swe;
    try {
      const mod = await import(source.url);
      if (typeof mod.SwissEphemeris !== "function" || !mod.Planet) {
        throw new Error("Missing Swiss Ephemeris exports");
      }
      swe = new mod.SwissEphemeris();
      await swe.init();
      const jd = swe.dateToJulianDay(date);
      const positions = [];
      for (const name of PLANET_NAMES) {
        const body = mod.Planet[name];
        const result = swe.calculatePosition(jd, body);
        if (!Number.isFinite(result.longitude) || !Number.isFinite(result.latitude)) {
          throw new Error(`Invalid ${name} coordinates`);
        }
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
        engineSource: source.label,
        ephemeris: "Moshier (built in)",
        positions
      };
    } catch (error) {
      errors.push(`${source.label}: ${error?.message || error}`);
    } finally {
      try { swe?.close(); } catch (_) {}
    }
  }
  throw new Error(`Swiss Ephemeris failed from both sources. ${errors.join(" | ")}`);
}

export function normalizeLongitude(value) {
  return ((Number(value) % 360) + 360) % 360;
}
