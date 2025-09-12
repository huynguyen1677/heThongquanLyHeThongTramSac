/**
 * SuperAdminService - Refactored to use modular service architecture
 * Composing functionality from specialized services for better maintainability
 */

import BaseService from './BaseService';
import FirestoreService from './FirestoreService';
import RealtimeService from './RealtimeService';
import AnalyticsService from './AnalyticsService';
import ExportService from './ExportService';

export class SuperAdminService extends BaseService {
  
  // ===== SYSTEM OVERVIEW =====
  static async getSystemOverview(timeRange = 'today', selectedMonth = null, selectedYear = null) {
    try {
      console.log('🔄 Getting system overview via AnalyticsService...');
      return await AnalyticsService.calculateSystemOverview(timeRange, selectedMonth, selectedYear);
    } catch (error) {
      return this.handleError(error, 'Getting system overview');
    }
  }

  // ===== STATION MANAGEMENT =====
  static async getAllStations() {
    try {
      return await FirestoreService.getAllStations();
    } catch (error) {
      return this.handleError(error, 'Getting all stations');
    }
  }

  static async getStationsByOwner(ownerId) {
    try {
      return await FirestoreService.getStationsByOwner(ownerId);
    } catch (error) {
      return this.handleError(error, 'Getting stations by owner');
    }
  }

  static async changeStationAvailability(stationId, availability) {
    try {
      // Call CSMS API to change availability
      const response = await fetch(`http://localhost:3000/api/stations/${stationId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: availability ? 'Operative' : 'Inoperative'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update Firestore using our service
      await FirestoreService.updateStation(stationId, {
        availability: availability ? 'Operative' : 'Inoperative'
      });

      // Log audit
      await this.createAuditLog({
        action: 'station_availability_changed',
        stationId,
        availability: availability ? 'Operative' : 'Inoperative',
        adminId: 'super_admin'
      });

      return true;
    } catch (error) {
      return this.handleError(error, 'Changing station availability');
    }
  }

  static async resetStation(stationId) {
    try {
      // Call CSMS API to reset station
      const response = await fetch(`http://localhost:3000/api/stations/${stationId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'Soft' 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Log audit
      await this.createAuditLog({
        action: 'station_reset',
        stationId,
        resetType: 'Soft',
        adminId: 'super_admin'
      });

      return true;
    } catch (error) {
      return this.handleError(error, 'Resetting station');
    }
  }

  static async unlockConnector(stationId, connectorId) {
    try {
      // Call CSMS API to unlock connector
      const response = await fetch(`http://localhost:3000/api/stations/${stationId}/connectors/${connectorId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Log audit
      await this.createAuditLog({
        action: 'connector_unlocked',
        stationId,
        connectorId,
        adminId: 'super_admin'
      });

      return true;
    } catch (error) {
      return this.handleError(error, 'Unlocking connector');
    }
  }

  // ===== OWNER MANAGEMENT =====
  static async getAllOwners() {
    try {
      return await FirestoreService.getAllOwners();
    } catch (error) {
      return this.handleError(error, 'Getting all owners');
    }
  }

  static async createOwner(ownerData) {
    try {
      const result = await FirestoreService.createOwner(ownerData);
      
      // Log audit
      await this.createAuditLog({
        action: 'owner_created',
        ownerId: result.id,
        ownerData: { ...ownerData, password: '[HIDDEN]' },
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Creating owner');
    }
  }

  static async updateOwner(ownerId, ownerData) {
    try {
      const result = await FirestoreService.updateOwner(ownerId, ownerData);
      
      // Log audit
      await this.createAuditLog({
        action: 'owner_updated',
        ownerId,
        ownerData: { ...ownerData, password: '[HIDDEN]' },
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Updating owner');
    }
  }

  static async deleteOwner(ownerId) {
    try {
      // Check if owner has stations
      const stations = await FirestoreService.getStationsByOwner(ownerId);
      if (stations.length > 0) {
        throw new Error('Cannot delete owner with assigned stations. Please reassign stations first.');
      }

      const result = await FirestoreService.deleteOwner(ownerId);
      
      // Log audit
      await this.createAuditLog({
        action: 'owner_deleted',
        ownerId,
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Deleting owner');
    }
  }

  static async toggleOwnerStatus(ownerId, status) {
    try {
      const result = await FirestoreService.updateOwner(ownerId, { status });
      
      // Log audit
      await this.createAuditLog({
        action: 'owner_status_changed',
        ownerId,
        newStatus: status,
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Toggling owner status');
    }
  }

  static async assignStationToOwner(stationId, ownerId) {
    try {
      const result = await FirestoreService.updateStation(stationId, { ownerId });
      
      // Log audit
      await this.createAuditLog({
        action: 'station_assigned',
        stationId,
        ownerId,
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Assigning station to owner');
    }
  }

  // ===== ANALYTICS & REPORTING =====
  static async getRevenueAnalytics(timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      return await AnalyticsService.calculateRevenueAnalytics(timeRange, selectedMonth, selectedYear);
    } catch (error) {
      return this.handleError(error, 'Getting revenue analytics');
    }
  }

  static async getStationAnalytics(ownerId = null, timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      return await AnalyticsService.calculateStationAnalytics(ownerId, timeRange, selectedMonth, selectedYear);
    } catch (error) {
      return this.handleError(error, 'Getting station analytics');
    }
  }

  static async getSystemReports(timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      // Get comprehensive analytics
      const [overview, revenue, stations] = await Promise.all([
        AnalyticsService.calculateSystemOverview(timeRange, selectedMonth, selectedYear),
        AnalyticsService.calculateRevenueAnalytics(timeRange, selectedMonth, selectedYear),
        AnalyticsService.calculateStationAnalytics(null, timeRange, selectedMonth, selectedYear)
      ]);

      return {
        overview,
        revenue,
        stations,
        timeRange,
        selectedMonth,
        selectedYear,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, 'Getting system reports');
    }
  }

  // ===== DATA EXPORT =====
  static async exportSystemOverview(timeRange = 'today', format = 'csv') {
    try {
      const overviewData = await AnalyticsService.calculateSystemOverview(timeRange);
      
      switch (format) {
        case 'csv':
          return await ExportService.exportSystemOverviewCSV(overviewData, timeRange);
        case 'pdf':
          return await ExportService.generateSystemOverviewPDF(overviewData, timeRange);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return this.handleError(error, 'Exporting system overview');
    }
  }

  static async exportRevenueAnalytics(timeRange = 'month', format = 'csv') {
    try {
      const revenueData = await AnalyticsService.calculateRevenueAnalytics(timeRange);
      
      switch (format) {
        case 'csv':
          return await ExportService.exportRevenueAnalyticsCSV(revenueData, timeRange);
        case 'excel':
          return await ExportService.exportToExcel({ 'Revenue Analytics': revenueData }, `revenue_${timeRange}.xls`);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return this.handleError(error, 'Exporting revenue analytics');
    }
  }

  static async exportStationAnalytics(timeRange = 'month', format = 'csv') {
    try {
      const stationData = await AnalyticsService.calculateStationAnalytics(null, timeRange);
      
      switch (format) {
        case 'csv':
          return await ExportService.exportStationAnalyticsCSV(stationData, timeRange);
        case 'excel':
          return await ExportService.exportToExcel({ 'Station Analytics': stationData.stationPerformance }, `stations_${timeRange}.xls`);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return this.handleError(error, 'Exporting station analytics');
    }
  }

  static async exportAllData(timeRange = 'month', formats = ['csv', 'excel']) {
    try {
      return await ExportService.exportAllFormats(timeRange, { formats });
    } catch (error) {
      return this.handleError(error, 'Exporting all data');
    }
  }

  // ===== PRICING TEMPLATES =====
  static async getPricingTemplates() {
    try {
      return await FirestoreService.getPricingTemplates();
    } catch (error) {
      return this.handleError(error, 'Getting pricing templates');
    }
  }

  static async createPricingTemplate(templateData) {
    try {
      const result = await FirestoreService.createPricingTemplate(templateData);
      
      // Log audit
      await this.createAuditLog({
        action: 'pricing_template_created',
        templateId: result.id,
        templateData,
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Creating pricing template');
    }
  }

  static async updatePricingTemplate(templateId, templateData) {
    try {
      const result = await FirestoreService.updatePricingTemplate(templateId, templateData);
      
      // Log audit
      await this.createAuditLog({
        action: 'pricing_template_updated',
        templateId,
        templateData,
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Updating pricing template');
    }
  }

  static async deletePricingTemplate(templateId) {
    try {
      const result = await FirestoreService.deletePricingTemplate(templateId);
      
      // Log audit
      await this.createAuditLog({
        action: 'pricing_template_deleted',
        templateId,
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Deleting pricing template');
    }
  }

  // ===== AUDIT LOGS =====
  static async getAuditLogs(limit = 100) {
    try {
      return await FirestoreService.getAuditLogs(limit);
    } catch (error) {
      return this.handleError(error, 'Getting audit logs');
    }
  }

  static async createAuditLog(logData) {
    try {
      return await FirestoreService.createAuditLog({
        ...logData,
        source: 'super_admin_portal',
        timestamp: new Date()
      });
    } catch (error) {
      // Don't throw error for audit logging to prevent blocking main operations
      console.warn('Failed to create audit log:', error);
      return false;
    }
  }

  // ===== REALTIME DATA =====
  static async getRealtimeData() {
    try {
      return await RealtimeService.getRealtimeStations();
    } catch (error) {
      return this.handleError(error, 'Getting realtime data');
    }
  }

  static async subscribeToRealtimeUpdates(callback) {
    try {
      return RealtimeService.subscribeToStationUpdates(callback);
    } catch (error) {
      return this.handleError(error, 'Subscribing to realtime updates');
    }
  }

  static async syncRealtimeToFirestore() {
    try {
      return await RealtimeService.syncStationsToFirestore();
    } catch (error) {
      return this.handleError(error, 'Syncing realtime to Firestore');
    }
  }

  // ===== SYSTEM MANAGEMENT =====
  static async getSystemErrors(limit = 50) {
    try {
      return await FirestoreService.getSystemErrors(limit);
    } catch (error) {
      return this.handleError(error, 'Getting system errors');
    }
  }

  static async clearSystemErrors() {
    try {
      const result = await FirestoreService.clearSystemErrors();
      
      // Log audit
      await this.createAuditLog({
        action: 'system_errors_cleared',
        adminId: 'super_admin'
      });

      return result;
    } catch (error) {
      return this.handleError(error, 'Clearing system errors');
    }
  }

  static async getSystemHealth() {
    try {
      const [overview, errors, realtimeData] = await Promise.all([
        this.getSystemOverview(),
        this.getSystemErrors(10),
        this.getRealtimeData()
      ]);

      return {
        overview,
        recentErrors: errors,
        realtimeStatus: realtimeData ? 'connected' : 'disconnected',
        systemStatus: overview.onlineStations > 0 ? 'operational' : 'degraded',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, 'Getting system health');
    }
  }

  // ===== LEGACY COMPATIBILITY =====
  // Keep some methods for backward compatibility

  static async getTodaySessions() {
    try {
      return await FirestoreService.getSessionsByOwner(null, 'today');
    } catch (error) {
      return this.handleError(error, 'Getting today sessions');
    }
  }

  static async getTodayPayments() {
    try {
      return await FirestoreService.getPaymentsByTimeRange('today');
    } catch (error) {
      return this.handleError(error, 'Getting today payments');
    }
  }

  static async getSessionsInRange(startDate, endDate) {
    try {
      return await FirestoreService.getSessionsInRange(startDate, endDate);
    } catch (error) {
      return this.handleError(error, 'Getting sessions in range');
    }
  }

  static async getPaymentsInRange(startDate, endDate) {
    try {
      return await FirestoreService.getPaymentsInRange(startDate, endDate);
    } catch (error) {
      return this.handleError(error, 'Getting payments in range');
    }
  }

  // Legacy export method
  static exportToCSV(data, filename) {
    try {
      return ExportService.exportToCSV(data, filename);
    } catch (error) {
      return this.handleError(error, 'Legacy CSV export');
    }
  }
}

export default SuperAdminService;