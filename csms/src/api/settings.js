import express from 'express';
import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Lấy giá điện hiện tại
router.get('/price-per-kwh', async (req, res) => {
  try {
    let price = await firestoreService.getPricePerKwh();
    
    // Nếu chưa có giá điện trong database, sử dụng giá mặc định và lưu vào database
    if (price === null || price === undefined) {
      const defaultPrice = 3500; // 3500 VND/kWh
      await firestoreService.setPricePerKwh(defaultPrice);
      price = defaultPrice;
      logger.info(`Set default price per kWh: ${defaultPrice}`);
    }
    
    res.json({
      success: true,
      data: { pricePerKwh: price }
    });
  } catch (error) {
    logger.error('Error getting pricePerKwh:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cập nhật giá điện (nếu cần cho admin)
router.post('/price-per-kwh', async (req, res) => {
  try {
    const { pricePerKwh } = req.body;
    if (typeof pricePerKwh !== 'number' || pricePerKwh <= 0) {
      return res.status(400).json({
        success: false,
        error: 'pricePerKwh must be a positive number'
      });
    }
    await firestoreService.setPricePerKwh(pricePerKwh);
    res.json({
      success: true,
      data: { pricePerKwh }
    });
  } catch (error) {
    logger.error('Error setting pricePerKwh:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;