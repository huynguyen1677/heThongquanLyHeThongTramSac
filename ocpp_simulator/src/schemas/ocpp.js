import { z } from 'zod';

// Base OCPP Message Schema - Union type for different message formats
export const OcppMessageSchema = z.union([
  // CALL: [2, messageId, action, payload]
  z.tuple([z.literal(2), z.string(), z.string(), z.any()]),
  // CALLRESULT: [3, messageId, payload]  
  z.tuple([z.literal(3), z.string(), z.any()]),
  // CALLERROR: [4, messageId, errorCode, errorDescription, errorDetails?]
  z.tuple([z.literal(4), z.string(), z.string(), z.string(), z.any().optional()])
]);

// BootNotification
export const BootNotificationReqSchema = z.object({
  chargePointVendor: z.string(),
  chargePointModel: z.string(),
  firmwareVersion: z.string().optional(),
  chargePointSerialNumber: z.string().optional(),
  chargeBoxSerialNumber: z.string().optional(),
  iccid: z.string().optional(),
  imsi: z.string().optional(),
  meterSerialNumber: z.string().optional(),
  meterType: z.string().optional()
});

export const BootNotificationConfSchema = z.object({
  status: z.enum(['Accepted', 'Pending', 'Rejected']),
  currentTime: z.string(),
  interval: z.number()
});

// Heartbeat
export const HeartbeatReqSchema = z.object({});
export const HeartbeatConfSchema = z.object({
  currentTime: z.string()
});

// StatusNotification
export const StatusNotificationReqSchema = z.object({
  connectorId: z.number(),
  status: z.enum([
    'Available', 
    'Preparing', 
    'Charging', 
    'SuspendedEVSE', 
    'SuspendedEV', 
    'Finishing', 
    'Reserved', 
    'Unavailable', 
    'Faulted'
  ]),
  errorCode: z.enum([
    'NoError',
    'ConnectorLockFailure',
    'EVCommunicationError',
    'GroundFailure',
    'HighTemperature',
    'InternalError',
    'LocalListConflict',
    'OtherError',
    'OverCurrentFailure',
    'PowerMeterFailure',
    'PowerSwitchFailure',
    'ReaderFailure',
    'ResetFailure',
    'UnderVoltage',
    'OverVoltage',
    'WeakSignal'
  ]),
  info: z.string().optional(),
  timestamp: z.string().optional(),
  vendorId: z.string().optional(),
  vendorErrorCode: z.string().optional()
});

export const StatusNotificationConfSchema = z.object({});

// Authorize
export const AuthorizeReqSchema = z.object({
  idTag: z.string()
});

export const AuthorizeConfSchema = z.object({
  idTagInfo: z.object({
    status: z.enum(['Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx']),
    expiryDate: z.string().optional(),
    parentIdTag: z.string().optional()
  })
});

// StartTransaction
export const StartTransactionReqSchema = z.object({
  connectorId: z.number(),
  idTag: z.string(),
  meterStart: z.number(),
  reservationId: z.number().optional(),
  timestamp: z.string()
});

export const StartTransactionConfSchema = z.object({
  transactionId: z.number(),
  idTagInfo: z.object({
    status: z.enum(['Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx']),
    expiryDate: z.string().optional(),
    parentIdTag: z.string().optional()
  })
});

// StopTransaction
export const StopTransactionReqSchema = z.object({
  meterStop: z.number(),
  timestamp: z.string(),
  transactionId: z.number(),
  reason: z.enum([
    'EmergencyStop',
    'EVDisconnected',
    'HardReset',
    'Local',
    'Other',
    'PowerLoss',
    'Reboot',
    'Remote',
    'SoftReset',
    'UnlockCommand',
    'DeAuthorized'
  ]).optional(),
  idTag: z.string().optional(),
  transactionData: z.array(z.any()).optional()
});

export const StopTransactionConfSchema = z.object({
  idTagInfo: z.object({
    status: z.enum(['Accepted', 'Blocked', 'Expired', 'Invalid', 'ConcurrentTx']),
    expiryDate: z.string().optional(),
    parentIdTag: z.string().optional()
  }).optional()
});

// MeterValues
export const SampledValueSchema = z.object({
  value: z.string(),
  context: z.enum([
    'Interruption.Begin',
    'Interruption.End',
    'Sample.Clock',
    'Sample.Periodic',
    'Transaction.Begin',
    'Transaction.End',
    'Trigger',
    'Other'
  ]).optional(),
  format: z.enum(['Raw', 'SignedData']).optional(),
  measurand: z.enum([
    'Energy.Active.Export.Register',
    'Energy.Active.Import.Register',
    'Energy.Reactive.Export.Register',
    'Energy.Reactive.Import.Register',
    'Energy.Active.Export.Interval',
    'Energy.Active.Import.Interval',
    'Energy.Reactive.Export.Interval',
    'Energy.Reactive.Import.Interval',
    'Power.Active.Export',
    'Power.Active.Import',
    'Power.Offered',
    'Power.Reactive.Export',
    'Power.Reactive.Import',
    'Power.Factor',
    'Current.Import',
    'Current.Export',
    'Current.Offered',
    'Voltage',
    'Frequency',
    'Temperature',
    'SoC',
    'RPM'
  ]).optional(),
  phase: z.enum(['L1', 'L2', 'L3', 'N', 'L1-N', 'L2-N', 'L3-N', 'L1-L2', 'L2-L3', 'L3-L1']).optional(),
  location: z.enum(['Cable', 'EV', 'Inlet', 'Outlet', 'Body']).optional(),
  unit: z.enum([
    'Wh', 'kWh', 'varh', 'kvarh', 'W', 'kW', 'VA', 'kVA', 'var', 'kvar',
    'A', 'V', 'K', 'Celcius', 'Fahrenheit', 'Percent'
  ]).optional()
});

export const MeterValueSchema = z.object({
  timestamp: z.string(),
  sampledValue: z.array(SampledValueSchema)
});

export const MeterValuesReqSchema = z.object({
  connectorId: z.number(),
  transactionId: z.number().optional(),
  meterValue: z.array(MeterValueSchema)
});

export const MeterValuesConfSchema = z.object({});

// Remote Commands
export const RemoteStartTransactionReqSchema = z.object({
  connectorId: z.number().optional(),
  idTag: z.string(),
  chargingProfile: z.any().optional()
});

export const RemoteStartTransactionConfSchema = z.object({
  status: z.enum(['Accepted', 'Rejected'])
});

export const RemoteStopTransactionReqSchema = z.object({
  transactionId: z.number()
});

export const RemoteStopTransactionConfSchema = z.object({
  status: z.enum(['Accepted', 'Rejected'])
});

// DataTransfer
export const DataTransferReqSchema = z.object({
  vendorId: z.string(),
  messageId: z.string().optional(),
  data: z.string().optional()
});

export const DataTransferConfSchema = z.object({
  status: z.enum(['Accepted', 'Rejected', 'UnknownMessageId', 'UnknownVendorId']),
  data: z.string().optional()
});

// Validation helper functions
export function validateOcppMessage(message) {
  try {
    return OcppMessageSchema.safeParse(message);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function validateByAction(action, payload, isRequest = true) {
  const schemas = {
    BootNotification: {
      req: BootNotificationReqSchema,
      conf: BootNotificationConfSchema
    },
    Heartbeat: {
      req: HeartbeatReqSchema,
      conf: HeartbeatConfSchema
    },
    StatusNotification: {
      req: StatusNotificationReqSchema,
      conf: StatusNotificationConfSchema
    },
    Authorize: {
      req: AuthorizeReqSchema,
      conf: AuthorizeConfSchema
    },
    StartTransaction: {
      req: StartTransactionReqSchema,
      conf: StartTransactionConfSchema
    },
    StopTransaction: {
      req: StopTransactionReqSchema,
      conf: StopTransactionConfSchema
    },
    MeterValues: {
      req: MeterValuesReqSchema,
      conf: MeterValuesConfSchema
    },
    RemoteStartTransaction: {
      req: RemoteStartTransactionReqSchema,
      conf: RemoteStartTransactionConfSchema
    },
    RemoteStopTransaction: {
      req: RemoteStopTransactionReqSchema,
      conf: RemoteStopTransactionConfSchema
    },
    DataTransfer: {
      req: DataTransferReqSchema,
      conf: DataTransferConfSchema
    }
  };

  const schema = schemas[action];
  if (!schema) {
    return { success: false, error: `Unknown action: ${action}` };
  }

  const targetSchema = isRequest ? schema.req : schema.conf;
  return targetSchema.safeParse(payload);
}
