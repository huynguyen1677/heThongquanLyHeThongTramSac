import React from 'react';

function ChargingConfirmationDialog({ confirmationRequest, onRespond }) {
  console.log("Dialog confirmationRequest:", confirmationRequest);
  
  if (!confirmationRequest) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 rounded-xl p-8 min-w-[320px] shadow-2xl text-center">
        <h3 className="text-lg font-semibold mb-4">Yêu cầu xác nhận sạc</h3>
        <p className="mb-6">
          Trạm <b>{confirmationRequest.stationId}</b> - Cổng <b>{confirmationRequest.connectorId}</b> muốn bắt đầu sạc.<br />
          Bạn có đồng ý không?
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onRespond(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Đồng ý
          </button>
          <button
            onClick={() => onRespond(false)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChargingConfirmationDialog;