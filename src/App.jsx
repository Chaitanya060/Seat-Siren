import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import './components/components.css'
import Landing from './screens/Landing'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import CreateAlert from './screens/CreateAlert'
import Settings from './screens/Settings'
import AlertDetail from './screens/AlertDetail'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <span className="mono muted-text" style={{ fontSize: 14 }}>
          Authenticating SeatSiren…
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      {/* Authenticated Dashboard */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Create Alert Wizard */}
      <Route
        path="/app/alerts/new"
        element={
          <ProtectedRoute>
            <CreateAlert />
          </ProtectedRoute>
        }
      />
      <Route path="/new" element={<Navigate to="/app/alerts/new" replace />} />

      {/* Settings */}
      <Route
        path="/app/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

      {/* Alert Detail */}
      <Route
        path="/app/alerts/:id"
        element={
          <ProtectedRoute>
            <AlertDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/alert/:id" element={<Navigate to="/app/alerts/:id" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
