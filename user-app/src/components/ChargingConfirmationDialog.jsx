import React from 'react'
import { useCharging } from '../contexts/ChargingContext'

const ChargingConfirmationDialog = () => {
  const { confirmationRequest, respondToConfirmationRequest } = useCharging()

  if (!confirmationRequest) return null

  const handleApprove = () => {
    respondToConfirmationRequest(true)
  }

  const handleDeny = () => {
    respondToConfirmationRequest(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Xác nhận yêu cầu sạc
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Có một yêu cầu sạc mới từ trạm:
          </p>
          <div className="bg-gray-50 p-3 rounded-md">
            <p><strong>Trạm:</strong> {confirmationRequest.stationId}</p>
            <p><strong>Connector:</strong> {confirmationRequest.connectorId}</p>
            <p><strong>Thời gian:</strong> {new Date(confirmationRequest.timestamp).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleApprove}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Chấp nhận
          </button>
          <button
            onClick={handleDeny}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChargingConfirmationDialog
