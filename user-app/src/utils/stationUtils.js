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