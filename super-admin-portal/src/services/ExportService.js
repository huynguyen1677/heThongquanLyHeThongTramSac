/**
 * ExportService - Service chuyên xuất dữ liệu ra các format khác nhau
 * Hỗ trợ CSV, PDF, Excel với formatting phù hợp
 */

import BaseService from './BaseService';
import AnalyticsService from './AnalyticsService';

export class ExportService extends BaseService {

  // ===== CSV EXPORT =====

  /**
   * Export data to CSV format
   * @param {Array} data - Dữ liệu cần export
   * @param {string} filename - Tên file
   * @param {Array} headers - Headers cho CSV
   */
  static exportToCSV(data, filename, headers = null) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      // Auto-generate headers if not provided
      if (!headers) {
        headers = Object.keys(data[0]);
      }

      // Create CSV content
      let csvContent = headers.join(',') + '\n';

      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => {
          let value = row[header] || '';
          
          // Handle special cases
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
          } else if (typeof value === 'number') {
            value = value.toString();
          } else if (value instanceof Date) {
            value = this.formatDate(value);
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          
          return value;
        });
        
        csvContent += values.join(',') + '\n';
      });

      // Download file
      this.downloadFile(csvContent, filename, 'text/csv');
      
      console.log(`✅ Exported ${data.length} records to ${filename}`);
      return true;
    } catch (error) {
      return this.handleError(error, 'Exporting to CSV');
    }
  }

  /**
   * Export system overview data to CSV
   * @param {Object} overviewData - Dữ liệu overview
   * @param {string} timeRange - Khoảng thời gian
   */
  static async exportSystemOverviewCSV(overviewData, timeRange = 'today') {
    try {
      const filename = `system_overview_${timeRange}_${this.getCurrentTimestamp()}.csv`;
      
      const exportData = [
        { metric: 'Total Stations', value: overviewData.totalStations },
        { metric: 'Online Stations', value: overviewData.onlineStations },
        { metric: 'Offline Stations', value: overviewData.offlineStations },
        { metric: 'Active Sessions', value: overviewData.activeSessions },
        { metric: 'Revenue (VND)', value: overviewData.todayRevenue },
        { metric: 'Energy Consumed (kWh)', value: overviewData.todayEnergy },
        { metric: 'System Uptime (%)', value: overviewData.uptime },
        { metric: 'Utilization Rate (%)', value: overviewData.utilizationRate },
        { metric: 'Average Session Duration (min)', value: overviewData.averageSessionDuration },
        { metric: 'Most Common Error', value: overviewData.mostCommonError },
        { metric: 'Error Count', value: overviewData.errorCount },
        { metric: 'Peak Hours', value: overviewData.peakHours.join(', ') }
      ];

      return this.exportToCSV(exportData, filename, ['metric', 'value']);
    } catch (error) {
      return this.handleError(error, 'Exporting system overview to CSV');
    }
  }

  /**
   * Export revenue analytics to CSV
   * @param {Object} revenueData - Dữ liệu revenue
   * @param {string} timeRange - Khoảng thời gian
   */
  static async exportRevenueAnalyticsCSV(revenueData, timeRange = 'month') {
    try {
      const filename = `revenue_analytics_${timeRange}_${this.getCurrentTimestamp()}.csv`;
      
      // Main revenue metrics
      const summaryData = [
        { metric: 'Total Revenue (VND)', value: revenueData.totalRevenue },
        { metric: 'Total Transactions', value: revenueData.totalTransactions },
        { metric: 'Average Transaction Value (VND)', value: revenueData.averageTransactionValue },
        { metric: 'Revenue Growth (%)', value: revenueData.growthMetrics?.revenueGrowth || 0 },
        { metric: 'Transaction Growth (%)', value: revenueData.growthMetrics?.transactionGrowth || 0 }
      ];

      // Revenue by period data
      const periodData = revenueData.revenueByPeriod.map(period => ({
        period: period.date || period.hour || period.month,
        revenue: period.revenue,
        transactions: period.transactions
      }));

      // Payment method data
      const paymentMethodData = revenueData.revenueByPaymentMethod.map(method => ({
        payment_method: method.method,
        revenue: method.revenue,
        transactions: method.transactions,
        percentage: method.percentage
      }));

      // Create workbook-like structure for CSV
      let csvContent = 'REVENUE SUMMARY\n';
      csvContent += 'Metric,Value\n';
      summaryData.forEach(row => {
        csvContent += `${row.metric},${row.value}\n`;
      });

      csvContent += '\n\nREVENUE BY PERIOD\n';
      csvContent += 'Period,Revenue (VND),Transactions\n';
      periodData.forEach(row => {
        csvContent += `${row.period},${row.revenue},${row.transactions}\n`;
      });

      csvContent += '\n\nREVENUE BY PAYMENT METHOD\n';
      csvContent += 'Payment Method,Revenue (VND),Transactions,Percentage (%)\n';
      paymentMethodData.forEach(row => {
        csvContent += `${row.payment_method},${row.revenue},${row.transactions},${row.percentage}\n`;
      });

      this.downloadFile(csvContent, filename, 'text/csv');
      
      console.log(`✅ Exported revenue analytics to ${filename}`);
      return true;
    } catch (error) {
      return this.handleError(error, 'Exporting revenue analytics to CSV');
    }
  }

  /**
   * Export station analytics to CSV
   * @param {Object} stationData - Dữ liệu station analytics
   * @param {string} timeRange - Khoảng thời gian
   */
  static async exportStationAnalyticsCSV(stationData, timeRange = 'month') {
    try {
      const filename = `station_analytics_${timeRange}_${this.getCurrentTimestamp()}.csv`;
      
      const exportData = stationData.stationPerformance.map(station => ({
        station_id: station.stationId,
        station_name: station.stationName,
        revenue: station.revenue,
        energy_kwh: station.energy,
        session_count: station.sessionCount,
        avg_session_duration_min: station.averageSessionDuration,
        utilization_rate_percent: station.utilizationRate,
        status: station.status
      }));

      const headers = [
        'station_id', 'station_name', 'revenue', 'energy_kwh', 
        'session_count', 'avg_session_duration_min', 'utilization_rate_percent', 'status'
      ];

      return this.exportToCSV(exportData, filename, headers);
    } catch (error) {
      return this.handleError(error, 'Exporting station analytics to CSV');
    }
  }

  // ===== PDF EXPORT =====

  /**
   * Generate PDF report for system overview
   * @param {Object} overviewData - Dữ liệu overview
   * @param {string} timeRange - Khoảng thời gian
   */
  static async generateSystemOverviewPDF(overviewData, timeRange = 'today') {
    try {
      // Since we can't import jsPDF in Node.js environment directly,
      // we'll create HTML content that can be printed as PDF
      const filename = `system_overview_${timeRange}_${this.getCurrentTimestamp()}.html`;
      
      const htmlContent = this.generateSystemOverviewHTML(overviewData, timeRange);
      
      this.downloadFile(htmlContent, filename, 'text/html');
      
      console.log(`✅ Generated PDF-ready HTML report: ${filename}`);
      console.log('📄 You can print this HTML file as PDF using browser Print dialog');
      
      return true;
    } catch (error) {
      return this.handleError(error, 'Generating system overview PDF');
    }
  }

  /**
   * Generate HTML content for system overview report
   * @param {Object} overviewData - Dữ liệu overview
   * @param {string} timeRange - Khoảng thời gian
   */
  static generateSystemOverviewHTML(overviewData, timeRange) {
    const currentDate = this.formatDate(new Date());
    
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Overview Report - ${timeRange}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 5px 0;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .metric-card h3 {
            color: #4f46e5;
            margin: 0 0 10px 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin: 0;
        }
        .status-section {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .status-section h2 {
            color: #334155;
            margin: 0 0 15px 0;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .status-item {
            background: white;
            border-radius: 6px;
            padding: 15px;
            border-left: 4px solid #4f46e5;
        }
        .status-item .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .metrics-grid { grid-template-columns: repeat(3, 1fr); }
            .status-grid { grid-template-columns: repeat(4, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>System Overview Report</h1>
        <p>Time Range: ${timeRange.toUpperCase()}</p>
        <p>Generated on: ${currentDate}</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <h3>Total Stations</h3>
            <p class="value">${overviewData.totalStations}</p>
        </div>
        <div class="metric-card">
            <h3>Online Stations</h3>
            <p class="value">${overviewData.onlineStations}</p>
        </div>
        <div class="metric-card">
            <h3>Active Sessions</h3>
            <p class="value">${overviewData.activeSessions}</p>
        </div>
        <div class="metric-card">
            <h3>Revenue (VND)</h3>
            <p class="value">${this.formatCurrency(overviewData.todayRevenue)}</p>
        </div>
        <div class="metric-card">
            <h3>Energy (kWh)</h3>
            <p class="value">${overviewData.todayEnergy}</p>
        </div>
        <div class="metric-card">
            <h3>System Uptime</h3>
            <p class="value">${overviewData.uptime}%</p>
        </div>
    </div>

    <div class="status-section">
        <h2>System Performance</h2>
        <div class="status-grid">
            <div class="status-item">
                <div class="label">Utilization Rate</div>
                <div class="value">${overviewData.utilizationRate}%</div>
            </div>
            <div class="status-item">
                <div class="label">Avg Session Duration</div>
                <div class="value">${overviewData.averageSessionDuration} min</div>
            </div>
            <div class="status-item">
                <div class="label">Error Count</div>
                <div class="value">${overviewData.errorCount}</div>
            </div>
            <div class="status-item">
                <div class="label">Peak Hours</div>
                <div class="value">${overviewData.peakHours.join(', ') || 'N/A'}</div>
            </div>
        </div>
    </div>

    <div class="status-section">
        <h2>System Health</h2>
        <div class="status-grid">
            <div class="status-item">
                <div class="label">Offline Stations</div>
                <div class="value">${overviewData.offlineStations}</div>
            </div>
            <div class="status-item">
                <div class="label">Most Common Error</div>
                <div class="value">${overviewData.mostCommonError}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>EV Charging Management System - Super Admin Portal</p>
        <p>Report generated automatically on ${currentDate}</p>
    </div>
</body>
</html>`;
  }

  // ===== EXCEL EXPORT =====

  /**
   * Export data to Excel-compatible CSV format
   * @param {Object} data - Object chứa multiple sheets data
   * @param {string} filename - Tên file
   */
  static exportToExcel(data, filename) {
    try {
      // Create workbook structure with multiple sheets
      let excelContent = '';
      
      Object.entries(data).forEach(([sheetName, sheetData], index) => {
        if (index > 0) excelContent += '\n\n';
        
        excelContent += `--- ${sheetName.toUpperCase()} ---\n`;
        
        if (Array.isArray(sheetData) && sheetData.length > 0) {
          const headers = Object.keys(sheetData[0]);
          excelContent += headers.join('\t') + '\n';
          
          sheetData.forEach(row => {
            const values = headers.map(header => {
              let value = row[header] || '';
              if (typeof value === 'number') {
                return value.toString();
              } else if (value instanceof Date) {
                return this.formatDate(value);
              } else if (typeof value === 'object') {
                return JSON.stringify(value);
              }
              return value.toString();
            });
            excelContent += values.join('\t') + '\n';
          });
        }
      });

      this.downloadFile(excelContent, filename, 'text/tab-separated-values');
      
      console.log(`✅ Exported Excel-compatible file: ${filename}`);
      return true;
    } catch (error) {
      return this.handleError(error, 'Exporting to Excel');
    }
  }

  /**
   * Export comprehensive analytics to Excel
   * @param {string} timeRange - Khoảng thời gian
   * @param {number} selectedMonth - Tháng được chọn
   * @param {number} selectedYear - Năm được chọn
   */
  static async exportComprehensiveAnalytics(timeRange = 'month', selectedMonth = null, selectedYear = null) {
    try {
      console.log('📊 Generating comprehensive analytics report...');
      
      // Get all analytics data
      const [overviewData, revenueData, stationData] = await Promise.all([
        AnalyticsService.calculateSystemOverview(timeRange, selectedMonth, selectedYear),
        AnalyticsService.calculateRevenueAnalytics(timeRange, selectedMonth, selectedYear),
        AnalyticsService.calculateStationAnalytics(null, timeRange, selectedMonth, selectedYear)
      ]);

      const filename = `comprehensive_analytics_${timeRange}_${this.getCurrentTimestamp()}.xls`;

      // Prepare data for multiple sheets
      const workbookData = {
        'System Overview': [
          { metric: 'Total Stations', value: overviewData.totalStations },
          { metric: 'Online Stations', value: overviewData.onlineStations },
          { metric: 'Offline Stations', value: overviewData.offlineStations },
          { metric: 'Active Sessions', value: overviewData.activeSessions },
          { metric: 'Revenue (VND)', value: overviewData.todayRevenue },
          { metric: 'Energy (kWh)', value: overviewData.todayEnergy },
          { metric: 'System Uptime (%)', value: overviewData.uptime },
          { metric: 'Utilization Rate (%)', value: overviewData.utilizationRate },
          { metric: 'Avg Session Duration (min)', value: overviewData.averageSessionDuration }
        ],
        
        'Revenue by Period': revenueData.revenueByPeriod.map(period => ({
          period: period.date || period.hour || period.month,
          revenue: period.revenue,
          transactions: period.transactions
        })),
        
        'Payment Methods': revenueData.revenueByPaymentMethod,
        
        'Station Performance': stationData.stationPerformance.map(station => ({
          station_id: station.stationId,
          station_name: station.stationName,
          revenue: station.revenue,
          energy_kwh: station.energy,
          sessions: station.sessionCount,
          avg_duration_min: station.averageSessionDuration,
          utilization_percent: station.utilizationRate,
          status: station.status
        }))
      };

      return this.exportToExcel(workbookData, filename);
    } catch (error) {
      return this.handleError(error, 'Exporting comprehensive analytics');
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Download file to user's device
   * @param {string} content - Nội dung file
   * @param {string} filename - Tên file
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType) {
    try {
      // Create blob
      const blob = new Blob([content], { type: mimeType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Get current timestamp for filenames
   */
  static getCurrentTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  /**
   * Format currency for display
   * @param {number} amount - Số tiền
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // ===== BATCH EXPORT OPERATIONS =====

  /**
   * Export all analytics data in multiple formats
   * @param {string} timeRange - Khoảng thời gian
   * @param {Object} options - Export options
   */
  static async exportAllFormats(timeRange = 'month', options = {}) {
    try {
      const { 
        selectedMonth = null, 
        selectedYear = null,
        formats = ['csv', 'excel', 'pdf']
      } = options;

      console.log('🚀 Starting batch export in multiple formats...');

      const results = [];

      // Get all data once
      const [overviewData, revenueData, stationData] = await Promise.all([
        AnalyticsService.calculateSystemOverview(timeRange, selectedMonth, selectedYear),
        AnalyticsService.calculateRevenueAnalytics(timeRange, selectedMonth, selectedYear),
        AnalyticsService.calculateStationAnalytics(null, timeRange, selectedMonth, selectedYear)
      ]);

      // Export in requested formats
      if (formats.includes('csv')) {
        await Promise.all([
          this.exportSystemOverviewCSV(overviewData, timeRange),
          this.exportRevenueAnalyticsCSV(revenueData, timeRange),
          this.exportStationAnalyticsCSV(stationData, timeRange)
        ]);
        results.push('CSV exports completed');
      }

      if (formats.includes('excel')) {
        await this.exportComprehensiveAnalytics(timeRange, selectedMonth, selectedYear);
        results.push('Excel export completed');
      }

      if (formats.includes('pdf')) {
        await this.generateSystemOverviewPDF(overviewData, timeRange);
        results.push('PDF export completed');
      }

      console.log('✅ Batch export completed successfully');
      return {
        success: true,
        results,
        message: `Exported analytics data for ${timeRange} in ${formats.join(', ')} format(s)`
      };
    } catch (error) {
      return this.handleError(error, 'Batch exporting all formats');
    }
  }

  /**
   * Export filtered station data
   * @param {Object} filters - Filters cho station data
   */
  static async exportFilteredStations(filters = {}) {
    try {
      const {
        ownerId = null,
        timeRange = 'month',
        selectedMonth = null,
        selectedYear = null,
        status = null,
        minRevenue = null,
        format = 'csv'
      } = filters;

      const stationData = await AnalyticsService.calculateStationAnalytics(
        ownerId, timeRange, selectedMonth, selectedYear
      );

      // Apply additional filters
      let filteredStations = stationData.stationPerformance;

      if (status) {
        filteredStations = filteredStations.filter(station => station.status === status);
      }

      if (minRevenue !== null) {
        filteredStations = filteredStations.filter(station => station.revenue >= minRevenue);
      }

      const filename = `filtered_stations_${this.getCurrentTimestamp()}.${format}`;

      switch (format) {
        case 'csv':
          return this.exportToCSV(filteredStations, filename);
        case 'excel':
          return this.exportToExcel({ 'Filtered Stations': filteredStations }, filename);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return this.handleError(error, 'Exporting filtered stations');
    }
  }
}

export default ExportService;