import { useState } from 'react';

export function SafetyCheckDemo() {
  const [safetySteps, setSafetySteps] = useState([
    { id: 1, name: 'Kiểm tra xe đậu đúng vị trí', completed: false, icon: '🚗' },
    { id: 2, name: 'Cắm dây sạc vào xe', completed: false, icon: '🔌' },
    { id: 3, name: 'Xác nhận mã an toàn', completed: false, icon: '🔑' },
    { id: 4, name: 'Chuyển sang trạng thái Preparing', completed: false, icon: '🟡' },
    { id: 5, name: 'Cập nhật realtime lên Firebase', completed: false, icon: '🔥' },
    { id: 6, name: 'Bắt đầu quá trình sạc', completed: false, icon: '⚡' }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const runDemo = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setCurrentStep(0);
    
    // Reset all steps
    setSafetySteps(prev => prev.map(step => ({ ...step, completed: false })));

    // Simulate safety check process
    for (let i = 0; i < safetySteps.length; i++) {
      setCurrentStep(i);
      
      // Simulate delay for each step
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSafetySteps(prev => prev.map(step => 
        step.id === i + 1 ? { ...step, completed: true } : step
      ));

      // Log step completion
      console.log(`✅ Step ${i + 1} completed: ${safetySteps[i].name}`);
    }

    setIsRunning(false);
    setCurrentStep(-1);
  };

  const resetDemo = () => {
    setSafetySteps(prev => prev.map(step => ({ ...step, completed: false })));
    setCurrentStep(0);
    setIsRunning(false);
  };

  return (
    <div className="safety-check-demo" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        🔒 Demo: Safety Check Flow
      </h2>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Quy trình kiểm tra an toàn:</h3>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Simulator thực hiện safety check</li>
          <li>Gửi StatusNotification (Preparing) qua OCPP</li>
          <li>CSMS nhận và cập nhật Firebase Realtime DB</li>
          <li>Driver app nhận update realtime</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {safetySteps.map((step, index) => (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              margin: '8px 0',
              background: step.completed ? '#d4edda' : 
                         currentStep === index ? '#fff3cd' : '#f8f9fa',
              border: `2px solid ${step.completed ? '#28a745' : 
                                   currentStep === index ? '#ffc107' : '#dee2e6'}`,
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '24px', marginRight: '12px' }}>
              {step.icon}
            </span>
            
            <span style={{ 
              flex: 1, 
              fontWeight: currentStep === index ? 'bold' : 'normal',
              color: step.completed ? '#155724' : 
                     currentStep === index ? '#856404' : '#6c757d'
            }}>
              {step.name}
            </span>
            
            <span style={{ fontSize: '20px' }}>
              {step.completed ? '✅' : currentStep === index ? '⏳' : '⏸️'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={runDemo}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: isRunning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s ease'
          }}
        >
          {isRunning ? '⏳ Đang chạy...' : '🚀 Chạy Demo'}
        </button>

        <button
          onClick={resetDemo}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          🔄 Reset
        </button>
      </div>

      {isRunning && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#d1ecf1', 
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <strong>🔄 Đang mô phỏng quy trình safety check...</strong>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#0c5460' }}>
            Bước {currentStep + 1}/{safetySteps.length}: {safetySteps[currentStep]?.name}
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#e7f3ff', 
        border: '1px solid #b3d9ff',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        <strong>💡 Lưu ý:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Simulator gửi dữ liệu qua OCPP protocol</li>
          <li>CSMS xử lý và cập nhật Firebase</li>
          <li>Không có kết nối trực tiếp Firebase từ simulator</li>
          <li>Tất cả data flow qua CSMS để đảm bảo tính nhất quán</li>
        </ul>
      </div>
    </div>
  );
}

export default SafetyCheckDemo;
