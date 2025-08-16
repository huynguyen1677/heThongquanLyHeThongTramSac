import express from 'express';
import { sessions } from '../ocpp/sessions.js';
// import { firestoreService } from '../services/firestore.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { 
      stationId, 
      status, 
      limit = 100, 
      startDate, 
      endDate 
    } = req.query;
    
    let transactions;
    
    // If Firestore is available, use it for historical data
    /*
    if (firestoreService.isAvailable() && (startDate || endDate)) {
      transactions = await firestoreService.getTransactions({
        stationId,
        status,
        limit: parseInt(limit),
        startDate,
        endDate
      });
    } else {
    */
      // Use session manager for current data
      if (status === 'active') {
        transactions = sessions.getActiveTransactions(stationId);
      } else {
        transactions = sessions.getAllTransactions(stationId, parseInt(limit));
        if (status && status !== 'all') {
          transactions = transactions.filter(tx => tx.status === status);
        }
      }
    // }
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction by ID
router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // First try session manager
    let transaction = sessions.getTransaction(parseInt(transactionId));
    
    // If not found and Firestore is available, try there
    /*
    if (!transaction && firestoreService.isAvailable()) {
      transaction = await firestoreService.getTransaction(transactionId);
    }
    */
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get active transactions
router.get('/active/all', async (req, res) => {
  try {
    const { stationId } = req.query;
    const activeTransactions = sessions.getActiveTransactions(stationId);
    
    res.json({
      success: true,
      data: activeTransactions,
      count: activeTransactions.length
    });
  } catch (error) {
    logger.error('Error getting active transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Stop transaction manually
router.post('/:transactionId/stop', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason = 'Remote', meterStop } = req.body;
    
    const transaction = sessions.getTransaction(parseInt(transactionId));
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (transaction.status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: 'Transaction is not active'
      });
    }

    // Stop the transaction
    const stoppedTransaction = sessions.stopTransaction(transaction.stationId, parseInt(transactionId), {
      meterStop: meterStop || transaction.meterStart,
      reason
    });

    // Save to Firestore if available
    /*
    if (firestoreService.isAvailable()) {
      await firestoreService.updateTransaction(transactionId, stoppedTransaction);
    }
    */

    res.json({
      success: true,
      data: stoppedTransaction
    });
  } catch (error) {
    logger.error('Error stopping transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { stationId, startDate, endDate } = req.query;
    
    let transactions;
    
    /*
    if (firestoreService.isAvailable() && (startDate || endDate)) {
      transactions = await firestoreService.getTransactions({
        stationId,
        startDate,
        endDate,
        limit: 1000
      });
    } else {
    */
      transactions = sessions.getAllTransactions(stationId, 1000);
    // }

    // Calculate statistics
    const totalTransactions = transactions.length;
    const activeTransactions = transactions.filter(tx => tx.status === 'Active').length;
    const completedTransactions = transactions.filter(tx => tx.status === 'Completed').length;
    
    const totalEnergy = transactions
      .filter(tx => tx.status === 'Completed')
      .reduce((sum, tx) => sum + (tx.energyConsumed || 0), 0);
    
    const totalDuration = transactions
      .filter(tx => tx.status === 'Completed')
      .reduce((sum, tx) => sum + (tx.duration || 0), 0);
    
    const averageEnergy = completedTransactions > 0 ? totalEnergy / completedTransactions : 0;
    const averageDuration = completedTransactions > 0 ? totalDuration / completedTransactions : 0;
    
    // Group by date for trend analysis
    const dailyStats = {};
    transactions.forEach(tx => {
      const date = new Date(tx.startTime).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          transactions: 0,
          energy: 0,
          duration: 0
        };
      }
      dailyStats[date].transactions += 1;
      if (tx.status === 'Completed') {
        dailyStats[date].energy += tx.energyConsumed || 0;
        dailyStats[date].duration += tx.duration || 0;
      }
    });

    const trendData = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        summary: {
          totalTransactions,
          activeTransactions,
          completedTransactions,
          totalEnergyDelivered: totalEnergy,
          totalChargingTime: totalDuration,
          averageEnergyPerSession: averageEnergy,
          averageSessionDuration: averageDuration
        },
        trends: trendData
      }
    });
  } catch (error) {
    logger.error('Error getting transaction statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get meter values for transaction
router.get('/:transactionId/meter-values', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = sessions.getTransaction(parseInt(transactionId));
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        meterValues: transaction.meterValues || [],
        count: (transaction.meterValues || []).length
      }
    });
  } catch (error) {
    logger.error('Error getting transaction meter values:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get transactions by date range - COMMENTED OUT due to path-to-regexp error
/*
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { stationId } = req.query;
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    let transactions;
    
    transactions = sessions.getAllTransactions(stationId, 1000);
    transactions = transactions.filter(tx => {
      const txDate = new Date(tx.startTime);
      return txDate >= startDate && txDate <= endDate;
    });
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      date
    });
  } catch (error) {
    logger.error('Error getting transactions by date:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
*/

// Export transactions to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { stationId, startDate, endDate } = req.query;
    
    let transactions;
    
    /*
    if (firestoreService.isAvailable() && (startDate || endDate)) {
      transactions = await firestoreService.getTransactions({
        stationId,
        startDate,
        endDate,
        limit: 5000
      });
    } else {
    */
      transactions = sessions.getAllTransactions(stationId, 5000);
    // }

    // CSV headers
    const headers = [
      'Transaction ID',
      'Station ID',
      'Connector ID',
      'ID Tag',
      'Start Time',
      'Stop Time',
      'Duration (seconds)',
      'Meter Start',
      'Meter Stop',
      'Energy Consumed (Wh)',
      'Status',
      'Stop Reason'
    ];

    // CSV rows
    const rows = transactions.map(tx => [
      tx.id,
      tx.stationId,
      tx.connectorId,
      tx.idTag,
      tx.startTime,
      tx.stopTime || '',
      tx.duration || '',
      tx.meterStart,
      tx.meterStop || '',
      tx.energyConsumed || '',
      tx.status,
      tx.reason || ''
    ]);

    // Generate CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
