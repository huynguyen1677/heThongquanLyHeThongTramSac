import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Stations from './pages/Stations'
import ChargingSession from './pages/ChargingSession'
import History from './pages/History'
import Profile from './pages/Profile'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { ChargingProvider } from './contexts/ChargingContext'

function App() {
  return (
    <AuthProvider>
      <ChargingProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/stations" element={<Stations />} />
                <Route path="/stations/:stationId" element={<ChargingSession />} />
                <Route path="/stations/:stationId/:connectorId" element={<ChargingSession />} />
                <Route path="/charging/:stationId/:connectorId" element={<ChargingSession />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ChargingProvider>
    </AuthProvider>
  )
}

export default App
