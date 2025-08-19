import { BrowserRouter as Router } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from './services/firebase'
import { AuthRoutes } from './routes/AuthRoutes'
import AppRoutes from './routes/AppRoutes'
import './app.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="spinner mb-4"></div>
          <h2 className="text-2xl font-bold heading-gradient mb-2">
            EV Driver App ⚡
          </h2>
          <p className="text-gray-600">Đang khởi tạo ứng dụng...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        {user ? <AppRoutes user={user} /> : <AuthRoutes />}
      </div>
    </Router>
  )
}

export default App
