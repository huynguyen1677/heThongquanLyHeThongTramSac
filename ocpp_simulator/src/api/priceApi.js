/**
 * Lấy giá điện từ CSMS qua API.
 * @param {string} apiUrl - Đường dẫn API trả về { pricePerKwh: number }
 * @returns {Promise<number|null>}
 */
export async function fetchPricePerKwh(apiUrl) {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data && data.data && typeof data.data.pricePerKwh === 'number') {
      return data.data.pricePerKwh;
    }
    return null;
  } catch (error) {
    console.error('Lỗi khi lấy giá điện từ API:', error);
    return null;
  }
}