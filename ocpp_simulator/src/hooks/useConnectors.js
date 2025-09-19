import { useState, useCallback, useMemo } from 'react';
import { MeterService } from '../services/MeterService.js';
import { OcppMessageService } from '../services/OcppMessageService.js';

export function useConnectors(sendCall) {
  const [connectors, setConnectors] = useState([]);
  const [meterServices, setMeterServices] = useState(new Map());

  // Tạo message service với sendCall function
  const messageService = useMemo(() => {
    return sendCall ? new OcppMessageService(sendCall) : null;
  }, [sendCall]);

  const initializeConnectors = useCallback(async (count = 2) => {
    console.log(`🔧 Initializing ${count} connectors...`);
    
    const newConnectors = [];
    const newMeterServices = new Map();

    for (let i = 1; i <= count; i++) {
      newConnectors.push({
        id: i,
        status: 'Available',
        errorCode: 'NoError',
        transactionId: null,
        meterStart: 0,
        cumulativeMeter: 0,
        info: ''
      });

      if (messageService) {
        try {
          const meterService = new MeterService(i, messageService);
          // Cập nhật giá điện từ API (không chặn nếu lỗi)
          try {
            await meterService.updatePriceFromApi('http://localhost:3000/api/settings/price-per-kwh');
          } catch (priceError) {
            console.warn(`⚠️ Could not update price for connector ${i}:`, priceError.message);
            // Đặt giá mặc định
            meterService.setPricePerKwh(3500);
          }
          newMeterServices.set(i, meterService);
          console.log(`✅ Meter service initialized for connector ${i}`);
        } catch (error) {
          console.error(`❌ Failed to initialize meter service for connector ${i}:`, error);
        }
      }
    }

    setConnectors(newConnectors);
    setMeterServices(newMeterServices);
    console.log(`✅ Initialized ${newConnectors.length} connectors successfully`);
  }, [messageService]);

  const resetConnectors = useCallback(() => {
    console.log('🔧 Resetting all connectors...');
    
    // Dừng tất cả meter services an toàn
    meterServices.forEach((service, connectorId) => {
      try {
        if (service && typeof service.stop === 'function') {
          service.stop();
          console.log(`✅ Stopped meter service for connector ${connectorId}`);
        }
      } catch (error) {
        console.error(`❌ Error stopping meter service for connector ${connectorId}:`, error);
      }
    });

    setConnectors([]);
    setMeterServices(new Map());
    console.log('✅ All connectors reset successfully');
  }, [meterServices]);

  const updateConnector = useCallback((connectorId, updates) => {
    setConnectors(prev => 
      prev.map(connector => 
        connector.id === connectorId 
          ? { ...connector, ...updates }
          : connector
      )
    );
  }, []);

  const getConnector = useCallback((connectorId) => {
    return connectors.find(c => c.id === connectorId);
  }, [connectors]);

  return {
    connectors,
    meterServices, // Chỉ trả về meterServices, bỏ meterTimers
    initializeConnectors,
    resetConnectors,
    updateConnector,
    getConnector
  };
}