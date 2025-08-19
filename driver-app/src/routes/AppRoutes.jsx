import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import FindStation from '../pages/FindStation'
import { StationDetail } from '../pages/StationDetail'
import ChargingSession from '../pages/ChargingSession'
import Receipt from '../pages/Receipt'
import History from '../pages/History'
import Profile from '../pages/Profile'

export default function AppRoutes({ user }) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/find-station" element={<FindStation />} />
      <Route path="/station/:id" element={<StationDetail />} />
      <Route path="/charging/:stationId/:connectorId" element={<ChargingSession />} />
      <Route path="/charging/:sessionId" element={<ChargingSession />} />
      <Route path="/receipt/:sessionId" element={<Receipt />} />
      <Route path="/history" element={<History />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
