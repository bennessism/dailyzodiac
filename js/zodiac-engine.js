export function signForLongitude(longitude, signs) {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30) % 12;
  return {
    ...signs[index],
    degree: normalized - index * 30
  };
}

export function shortestAngle(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function detectAspects(positions, aspectDefs) {
  const found = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const separation = shortestAngle(a.longitude, b.longitude);

      let best = null;
      for (const aspect of aspectDefs) {
        const delta = Math.abs(separation - aspect.angle);
        if (delta <= aspect.orb && (!best || delta < best.delta)) {
          best = { ...aspect, delta };
        }
      }

      if (best) {
        found.push({
          planetA: a,
          planetB: b,
          aspect: best,
          separation,
          exactness: Math.max(0, 1 - best.delta / best.orb)
        });
      }
    }
  }
  return found.sort((x, y) => y.exactness - x.exactness);
}

export function wholeSignRelation(fromIndex, toIndex) {
  const diff = (fromIndex - toIndex + 12) % 12;
  if (diff === 0) return "conjunction";
  if (diff === 2 || diff === 10) return "sextile";
  if (diff === 3 || diff === 9) return "square";
  if (diff === 4 || diff === 8) return "trine";
  if (diff === 6) return "opposition";
  return "neutral";
}

export function rankSignalsForTheme({
  selectedSign,
  positionedPlanets,
  theme,
  relationWeights
}) {
  return positionedPlanets
    .filter(p => theme.planets.includes(p.id))
    .map(p => {
      const relation = wholeSignRelation(p.sign.index, selectedSign.index);
      return {
        ...p,
        relation,
        score: relationWeights[relation] || 0
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function formatDegree(value) {
  const degree = Math.floor(value);
  const minutes = Math.round((value - degree) * 60);
  return `${degree}°${String(minutes).padStart(2,"0")}′`;
}
