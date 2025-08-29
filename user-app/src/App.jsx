import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ChargingConfirmationDialog from './components/ChargingConfirmationDialog'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import FindStation from './pages/FindStation'
import History from './pages/History'
import Settings from './pages/Settings'
import ChargingSession from './pages/ChargingSession'
import Profile from './pages/Profile'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { ChargingProvider } from './contexts/ChargingContext'
import StationList from "./components/StationList";

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
                <Route path="/find" element={<FindStation />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/stations" element={<StationList />} />
                <Route path="/stations/:stationId" element={<ChargingSession />} />
                <Route path="/stations/:stationId/:connectorId" element={<ChargingSession />} />
                <Route path="/charging/:stationId/:connectorId" element={<ChargingSession />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>
            <ChargingConfirmationDialog />
          </div>
        </Router>
      </ChargingProvider>
    </AuthProvider>
  )
}

export default App
