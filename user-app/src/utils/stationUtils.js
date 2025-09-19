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

// Loại bỏ dấu tiếng Việt
function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");
}

// Chuẩn hóa từ khóa
function normalizeKeyword(str) {
  if (!str) return "";
  return removeVietnameseTones(str.toLowerCase().trim())
    .replace(/[^\w\s]/g, " ") // Thay ký tự đặc biệt bằng khoảng trắng
    .replace(/\s+/g, " ") // Gộp nhiều khoảng trắng thành 1
    .trim();
}

// Tìm kiếm thông minh với nhiều từ khóa
export function filterStationsByKeyword(stations, keyword) {
  if (!Array.isArray(stations)) return [];
  if (!keyword) return stations;
  
  const normalizedKeyword = normalizeKeyword(keyword);
  const keywords = normalizedKeyword.split(" ").filter(k => k.length > 0);
  
  if (keywords.length === 0) return stations;

  return stations.filter(station => {
    // Chuẩn hóa các trường tìm kiếm
    const searchFields = [
      station.address || "",
      station.stationId || "",
      station.name || station.stationName || "",
      // Thêm các trường phụ
      station.district || "",
      station.city || "",
      station.province || "",
      // Từ connector types
      ...getConnectorTypes(station),
      // Từ status
      station.online ? "hoạt động đang online" : "ngoại tuyến offline"
    ];
    
    const searchText = normalizeKeyword(searchFields.join(" "));
    
    // Kiểm tra từng keyword
    return keywords.every(kw => searchText.includes(kw));
  });
}

// Lấy danh sách loại connector
function getConnectorTypes(station) {
  const connectors = Array.isArray(station.connectors) 
    ? station.connectors 
    : Object.values(station.connectors || {});
  
  return connectors.map(c => c.type || "").filter(Boolean);
}

// Tìm kiếm thông minh với điểm số
export function smartSearchStations(stations, keyword) {
  if (!Array.isArray(stations)) return [];
  if (!keyword) return stations;
  
  const normalizedKeyword = normalizeKeyword(keyword);
  const keywords = normalizedKeyword.split(" ").filter(k => k.length > 0);
  
  if (keywords.length === 0) return stations;

  const scoredStations = stations.map(station => {
    const score = calculateSearchScore(station, keywords, normalizedKeyword);
    return { ...station, searchScore: score };
  }).filter(station => station.searchScore > 0);

  return scoredStations.sort((a, b) => b.searchScore - a.searchScore);
}

// Tính điểm tìm kiếm
function calculateSearchScore(station, keywords, fullKeyword) {
  let score = 0;
  
  const fields = {
    stationName: normalizeKeyword(station.name || station.stationName || ""),
    stationId: normalizeKeyword(station.stationId || ""),
    address: normalizeKeyword(station.address || ""),
    district: normalizeKeyword(station.district || ""),
    city: normalizeKeyword(station.city || ""),
    province: normalizeKeyword(station.province || "")
  };

  // Điểm cho từng trường (ưu tiên tên trạm > ID > địa chỉ)
  const fieldWeights = {
    stationName: 100,
    stationId: 80,
    address: 60,
    district: 40,
    city: 30,
    province: 20
  };

  // Kiểm tra khớp hoàn toàn
  Object.entries(fields).forEach(([field, value]) => {
    if (value.includes(fullKeyword)) {
      score += fieldWeights[field] * 2; // Bonus cho khớp hoàn toàn
    }
  });

  // Kiểm tra từng keyword
  keywords.forEach(keyword => {
    Object.entries(fields).forEach(([field, value]) => {
      if (value.includes(keyword)) {
        score += fieldWeights[field];
      }
      
      // Bonus nếu keyword xuất hiện ở đầu
      if (value.startsWith(keyword)) {
        score += fieldWeights[field] * 0.5;
      }
    });
  });

  // Bonus cho trạm đang hoạt động
  if (station.online) {
    score += 10;
  }

  return score;
}

// Gợi ý tìm kiếm
export function getSearchSuggestions(stations, keyword) {
  if (!keyword || keyword.length < 2) return [];
  
  const normalizedKeyword = normalizeKeyword(keyword);
  const suggestions = new Set();

  stations.forEach(station => {
    const fields = [
      station.name || station.stationName || "",
      station.stationId || "",
      station.address || "",
      station.district || "",
      station.city || "",
      station.province || ""
    ];

    fields.forEach(field => {
      const normalized = normalizeKeyword(field);
      if (normalized.includes(normalizedKeyword)) {
        // Thêm từ hoàn chỉnh
        const words = field.split(/\s+/).filter(w => w.length > 1);
        words.forEach(word => {
          const normalizedWord = normalizeKeyword(word);
          if (normalizedWord.includes(normalizedKeyword)) {
            suggestions.add(word);
          }
        });
      }
    });
  });

  return Array.from(suggestions).slice(0, 10); // Giới hạn 10 gợi ý
}