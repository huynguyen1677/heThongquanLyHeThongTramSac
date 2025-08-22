import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { CheckCircle, XCircle, AlertCircle, Wifi } from 'lucide-react';

const FirebaseConnectionTest = () => {
  const [authStatus, setAuthStatus] = useState('checking');
  const [firestoreStatus, setFirestoreStatus] = useState('checking');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Test Auth connection
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthStatus('connected');
      console.log('Auth state:', user ? 'User logged in' : 'No user');
    }, (error) => {
      setAuthStatus('error');
      console.error('Auth error:', error);
    });

    // Test Firestore connection
    const testFirestore = async () => {
      try {
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        setFirestoreStatus('connected');
        console.log('Firestore connection successful');
      } catch (error) {
        setFirestoreStatus('error');
        console.error('Firestore error:', error);
      }
    };

    testFirestore();

    // Show current config
    setConfig({
      projectId: auth.app.options.projectId,
      authDomain: auth.app.options.authDomain,
      apiKey: auth.app.options.apiKey ? 'Present' : 'Missing'
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      case 'checking':
      default:
        return <AlertCircle className="text-yellow-500" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Kết nối thành công';
      case 'error':
        return 'Kết nối thất bại';
      case 'checking':
      default:
        return 'Đang kiểm tra...';
    }
  };

  return (
    <div className="firebase-test bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-4">
        <Wifi className="text-blue-500 mr-2" size={20} />
        <h4 className="font-medium text-gray-900">Firebase Connection Status</h4>
      </div>

      <div className="space-y-3">
        {/* Authentication Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Firebase Authentication:</span>
          <div className="flex items-center">
            {getStatusIcon(authStatus)}
            <span className="ml-2 text-sm">{getStatusText(authStatus)}</span>
          </div>
        </div>

        {/* Firestore Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Firestore Database:</span>
          <div className="flex items-center">
            {getStatusIcon(firestoreStatus)}
            <span className="ml-2 text-sm">{getStatusText(firestoreStatus)}</span>
          </div>
        </div>

        {/* Configuration Info */}
        {config && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Project ID: <span className="font-mono">{config.projectId}</span></div>
              <div>Auth Domain: <span className="font-mono">{config.authDomain}</span></div>
              <div>API Key: <span className="font-mono">{config.apiKey}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseConnectionTest;
