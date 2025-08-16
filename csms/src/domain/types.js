/**
 * @typedef {Object} StationContext
 * @property {string} stationId
 * @property {string} ownerId
 * @property {boolean} online
 * @property {number} lastHeartbeat
 * @property {number} intervalSec
 * @property {WebSocket} socket
 * @property {Map<string, ConnectorState>} connectors
 * @property {Map<string, PendingCall>} pendingCalls
 */

/**
 * @typedef {Object} ConnectorState
 * @property {string} status - Available|Preparing|Charging|Finishing|Unavailable|Faulted
 * @property {string} errorCode - NoError|ConnectorLockFailure|...
 * @property {Transaction|null} tx
 */

/**
 * @typedef {Object} Transaction
 * @property {number} transactionId
 * @property {string} idTag
 * @property {number} meterStart
 * @property {number|null} meterStop
 * @property {number} startTs
 * @property {number|null} stopTs
 * @property {number} whTotal - Current total Wh from MeterValues
 * @property {number} wNow - Current power in W from MeterValues
 */

/**
 * @typedef {Object} PendingCall
 * @property {Function} resolve
 * @property {Function} reject
 * @property {NodeJS.Timeout} timeout
 * @property {string} action
 * @property {number} timestamp
 */

/**
 * @typedef {Object} StationMetadata
 * @property {string} stationId
 * @property {string} stationName
 * @property {string} ownerId
 * @property {string} vendor
 * @property {string} model
 * @property {string} firmwareVersion
 * @property {Array<ConnectorMetadata>} connectors
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} ConnectorMetadata
 * @property {number} connectorId
 * @property {number} powerKw
 */

/**
 * @typedef {Object} TransactionRecord
 * @property {number} transactionId
 * @property {string} stationId
 * @property {string} ownerId
 * @property {number} connectorId
 * @property {string} userId
 * @property {string} idTag
 * @property {FirebaseFirestore.Timestamp} startTs
 * @property {FirebaseFirestore.Timestamp} stopTs
 * @property {number} meterStartWh
 * @property {number} meterStopWh
 * @property {number} energyKwh
 * @property {number} pricePerKwh
 * @property {number} amountVnd
 * @property {string} status
 */

export const OCPP_MESSAGE_TYPES = {
  CALL: 2,
  CALLRESULT: 3,
  CALLERROR: 4
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

export const ERROR_CODES = {
  NO_ERROR: 'NoError',
  CONNECTOR_LOCK_FAILURE: 'ConnectorLockFailure',
  EV_COMMUNICATION_ERROR: 'EVCommunicationError',
  GROUND_FAILURE: 'GroundFailure',
  HIGH_TEMPERATURE: 'HighTemperature',
  INTERNAL_ERROR: 'InternalError',
  LOCAL_LIST_CONFLICT: 'LocalListConflict',
  OTHER_ERROR: 'OtherError',
  OVER_CURRENT_FAILURE: 'OverCurrentFailure',
  POWER_METER_FAILURE: 'PowerMeterFailure',
  POWER_SWITCH_FAILURE: 'PowerSwitchFailure',
  READER_FAILURE: 'ReaderFailure',
  RESET_FAILURE: 'ResetFailure',
  UNDER_VOLTAGE: 'UnderVoltage',
  OVER_VOLTAGE: 'OverVoltage',
  WEAK_SIGNAL: 'WeakSignal'
};

export const AUTHORIZATION_STATUS = {
  ACCEPTED: 'Accepted',
  BLOCKED: 'Blocked',
  EXPIRED: 'Expired',
  INVALID: 'Invalid',
  CONCURRENT_TX: 'ConcurrentTx'
};

export const BOOT_STATUS = {
  ACCEPTED: 'Accepted',
  PENDING: 'Pending',
  REJECTED: 'Rejected'
};

export const MEASURAND = {
  ENERGY_ACTIVE_IMPORT_REGISTER: 'Energy.Active.Import.Register',
  POWER_ACTIVE_IMPORT: 'Power.Active.Import',
  VOLTAGE: 'Voltage',
  CURRENT_IMPORT: 'Current.Import',
  TEMPERATURE: 'Temperature',
  SOC: 'SoC'
};

export const UNIT = {
  WH: 'Wh',
  KWH: 'kWh',
  W: 'W',
  KW: 'kW',
  V: 'V',
  A: 'A',
  CELSIUS: 'Celsius',
  PERCENT: 'Percent'
};
