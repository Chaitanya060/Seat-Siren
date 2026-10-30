import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import './components/components.css'
import Landing from './screens/Landing'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import CreateAlert from './screens/CreateAlert'
import Settings from './screens/Settings'
import AlertDetail from './screens/AlertDetail'

// Route guard: redirects to /auth if not signed in.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="muted">Loading…</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><CreateAlert /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/alert/:id" element={<ProtectedRoute><AlertDetail /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
