import { useState, useCallback } from 'react';

export function useLogs(maxEntries = 500) {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((logEntry) => {
    setLogs(prev => [...prev, logEntry].slice(-maxEntries));
  }, [maxEntries]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    logs,
    addLog,
    clearLogs,
    setLogs, // Nếu cần thao tác trực tiếp
  };
}