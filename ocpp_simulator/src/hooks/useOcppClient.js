import { useRef, useState, useEffect, useCallback } from 'react';
import { OcppClient } from '../services/OcppClient';

export function useOcppClient({ onLog, onCall } = {}) {
  const ocppClientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!ocppClientRef.current) {
      ocppClientRef.current = new OcppClient();

      ocppClientRef.current.setMessageHandler((type, actionOrLevel, data, messageId) => {
        if (type === 'log' && onLog) {
          onLog({
            type: 'log',
            level: actionOrLevel,
            message: data,
            timestamp: new Date().toISOString()
          });
        } else if (type === 'call' && onCall) {
          onCall({
            action: actionOrLevel,
            payload: data,
            messageId: messageId
          });
        }
      });

      ocppClientRef.current.setStatusHandler((status) => {
        setConnectionStatus(status);
        setIsConnected(status === 'connected');
        
        if (onLog) {
          onLog({
            type: 'log',
            level: 'info',
            message: `Connection status: ${status}`,
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    // Không cleanup trong dependency change
  }, []); // Bỏ onLog, onCall khỏi dependencies

  // Các hàm thao tác với OCPP client
  const connect = useCallback(async (...args) => {
    if (!ocppClientRef.current) {
      throw new Error('OCPP Client not initialized');
    }
    return ocppClientRef.current.connect(...args);
  }, []);

  const disconnect = useCallback(async () => {
    if (ocppClientRef.current) {
      return ocppClientRef.current.disconnect();
    }
  }, []);

  const sendCall = useCallback((...args) => {
    return ocppClientRef.current.sendCall(...args);
  }, []);

  const sendCallResult = useCallback((...args) => {
    return ocppClientRef.current.sendCallResult(...args);
  }, []);

  const sendCallError = useCallback((...args) => {
    return ocppClientRef.current.sendCallError(...args);
  }, []);

  const startHeartbeat = useCallback((interval) => {
    return ocppClientRef.current.startHeartbeat(interval);
  }, []);

  // Expose các hàm và state cần thiết
  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendCall,
    sendCallResult,
    sendCallError,
    startHeartbeat,
    ocppClient: ocppClientRef.current,
  };
}