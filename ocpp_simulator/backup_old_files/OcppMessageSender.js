// // Thay đổi constructor nhận sendCall function thay vì ocppClient
// export class OcppMessageSender {
//   constructor(sendCallFunction, connectorId) {
//     this.sendCall = sendCallFunction;
//     this.connectorId = connectorId;
//   }

//   /**
//    * Gửi StatusNotification - CHỈ GỬI, KHÔNG XỬ LÝ STATE
//    */
//   async sendStatusNotification(status, errorCode = 'NoError', additionalInfo = {}) {
//     const payload = {
//       connectorId: this.connectorId,
//       status,
//       errorCode,
//       timestamp: new Date().toISOString(),
//       info: additionalInfo?.info,
//       ...additionalInfo
//     };

//     // CHỈ GỬI MESSAGE, KHÔNG XỬ LÝ GÌ KHÁC
//     return await this.sendCall('StatusNotification', payload);
//   }

//   /**
//    * Gửi MeterValues - CHỈ GỬI, KHÔNG XỬ LÝ STATE
//    */
//   async sendMeterValues(transactionId, meterValue, currentPowerKw) {
//     const payload = {
//       connectorId: this.connectorId,
//       transactionId: transactionId,
//       meterValue: [
//         {
//           timestamp: new Date().toISOString(),
//           sampledValue: [
//             {
//               value: Math.round(meterValue).toString(),
//               measurand: 'Energy.Active.Import.Register',
//               unit: 'Wh'
//             },
//             {
//               value: Math.round(currentPowerKw * 1000).toString(),
//               measurand: 'Power.Active.Import',
//               unit: 'W'
//             }
//           ]
//         }
//       ]
//     };

//     return await this.sendCall('MeterValues', payload);
//   }

//   /**
//    * Gửi DataTransfer - CHỈ GỬI, KHÔNG XỬ LÝ STATE
//    */
//   async sendRealtimeData(transactionId, currentEnergyKwh, fullChargeThresholdKwh) {
//     const realtimeData = {
//       connectorId: this.connectorId,
//       transactionId: transactionId,
//       fullChargeThresholdKwh: fullChargeThresholdKwh,
//       currentEnergyKwh: currentEnergyKwh,
//       timestamp: new Date().toISOString()
//     };

//     const payload = {
//       vendorId: 'RealtimeUpdate',
//       messageId: 'ChargeThreshold',
//       data: JSON.stringify(realtimeData)
//     };

//     return await this.sendCall('DataTransfer', payload);
//   }
// }