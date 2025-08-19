import { useEffect, useRef, useState } from 'react'

export function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stream = null
    let animationId = null

    const startCamera = async () => {
      try {
        setError(null)
        setIsScanning(true)

        // Request camera permission
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()

          // Start scanning after video is ready
          videoRef.current.onloadedmetadata = () => {
            scanQRCode()
          }
        }
      } catch (err) {
        console.error('Camera access error:', err)
        setError('Không thể truy cập camera. Vui lòng cấp quyền camera.')
        setIsScanning(false)
        onError?.(err)
      }
    }

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          // Try to decode QR code using a simple pattern matching approach
          // In a real implementation, you would use a QR code library like jsQR
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          
          // Mock QR detection - replace with actual QR library
          // For demo purposes, we'll simulate finding a QR code after 3 seconds
          setTimeout(() => {
            if (isScanning) {
              // Mock QR code result
              const mockStationId = 'STATION' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
              onScan?.(mockStationId)
              setIsScanning(false)
            }
          }, 3000)
        } catch (err) {
          console.error('QR scan error:', err)
        }
      }

      if (isScanning) {
        animationId = requestAnimationFrame(scanQRCode)
      }
    }

    startCamera()

    return () => {
      setIsScanning(false)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [onScan, onError])

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Lỗi camera
        </h3>
        <p className="text-gray-600 text-sm">
          {error}
        </p>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="btn-outline text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Video Feed */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover"
          playsInline
          muted
        />
        
        {/* QR Scanner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scanner Frame */}
            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
              
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-0 h-1 bg-green-400 animate-pulse"></div>
            </div>
            
            {/* Instructions */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                Hướng QR code vào khung vuông
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Status */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isScanning ? 'Đang quét...' : 'Đã dừng quét'}
          </span>
        </div>
        
        {isScanning && (
          <p className="text-xs text-gray-500 mt-2">
            💡 Giữ camera ổn định và đảm bảo QR code rõ nét
          </p>
        )}
      </div>

      {/* Demo Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-center">
        <p className="text-sm text-yellow-800">
          🚧 Demo: Sẽ tự động "phát hiện" QR code sau 3 giây
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          Trong ứng dụng thực tế, cần tích hợp thư viện jsQR hoặc tương tự
        </p>
      </div>
    </div>
  )
}
