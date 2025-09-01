const HIDDEN_FIELDS = ["internalCode", "createdAt", "updatedAt"];

export function filterStationFields(station, hiddenFields = HIDDEN_FIELDS) {
  const result = {};
  Object.entries(station).forEach(([key, value]) => {
    if (!hiddenFields.includes(key) && key !== "id") {
      result[key] = value;
    }
  });
  return result;
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function sortStationsByDistance(stations, userPos) {
  if (!userPos) return stations;
  return stations
    .filter(s => typeof s.latitude === "number" && typeof s.longitude === "number")
    .map(s => ({
      ...s,
      distance: haversineDistance(userPos.latitude, userPos.longitude, s.latitude, s.longitude)
    }))
    .sort((a, b) => a.distance - b.distance);
}

export function filterStationsByKeyword(stations, keyword) {
  if (!keyword) return stations;
  const lower = keyword.toLowerCase();
  return stations.filter(
    s =>
      (s.name || s.stationName || "").toLowerCase().includes(lower) ||
      (s.address || "").toLowerCase().includes(lower)
  );
}