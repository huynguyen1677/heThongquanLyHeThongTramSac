export const DEFAULT_HEARTBEAT_INTERVAL = 300; // 5 minutes
export const DEFAULT_CALL_TIMEOUT = 15000; // 15 seconds
export const DEFAULT_PRICE_PER_KWH = 2380; // VND per kWh
export const MAX_CONNECTORS_PER_STATION = 10;
export const MIN_POWER_KW = 0.1;
export const MAX_POWER_KW = 50;

export const OCPP = {
  MESSAGE_TYPE: {
    CALL: 2,
    CALLRESULT: 3,
    CALLERROR: 4
  }
};

export const CONNECTOR_STATUS = {
  AVAILABLE: 'Available',
  PREPARING: 'Preparing',
  CHARGING: 'Charging',
  SUSPENDED_EVSE: 'SuspendedEVSE',
  SUSPENDED_EV: 'SuspendedEV',
  FINISHING: 'Finishing',
  RESERVED: 'Reserved',
  UNAVAILABLE: 'Unavailable',
  FAULTED: 'Faulted'
};

export const TRANSACTION_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

export const OCPP_ACTIONS = {
  // Station to CSMS
  BOOT_NOTIFICATION: 'BootNotification',
  HEARTBEAT: 'Heartbeat',
  STATUS_NOTIFICATION: 'StatusNotification',
  AUTHORIZE: 'Authorize',
  START_TRANSACTION: 'StartTransaction',
  STOP_TRANSACTION: 'StopTransaction',
  METER_VALUES: 'MeterValues',
  
  // CSMS to Station
  REMOTE_START_TRANSACTION: 'RemoteStartTransaction',
  REMOTE_STOP_TRANSACTION: 'RemoteStopTransaction',
  CHANGE_AVAILABILITY: 'ChangeAvailability',
  RESET: 'Reset',
  UNLOCK_CONNECTOR: 'UnlockConnector'
};

export const OCPP_ERROR_CODES = {
  NOT_IMPLEMENTED: 'NotImplemented',
  NOT_SUPPORTED: 'NotSupported',
  INTERNAL_ERROR: 'InternalError',
  PROTOCOL_ERROR: 'ProtocolError',
  SECURITY_ERROR: 'SecurityError',
  FORMATION_VIOLATION: 'FormationViolation',
  PROPERTY_CONSTRAINT_VIOLATION: 'PropertyConstraintViolation',
  OCCURENCE_CONSTRAINT_VIOLATION: 'OccurenceConstraintViolation',
  TYPE_CONSTRAINT_VIOLATION: 'TypeConstraintViolation',
  GENERIC_ERROR: 'GenericError'
};

export const AVAILABILITY_TYPE = {
  INOPERATIVE: 'Inoperative',
  OPERATIVE: 'Operative'
};

export const RESET_TYPE = {
  HARD: 'Hard',
  SOFT: 'Soft'
};

export const REMOTE_START_STOP_STATUS = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
};

export const FIREBASE_COLLECTIONS = {
  STATIONS: 'stations',
  TRANSACTIONS: 'transactions',
  EVENTS: 'events'
};

export const FIREBASE_RTDB_PATHS = {
  LIVE_STATIONS: '/live/stations'
};
