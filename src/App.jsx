import { Routes, Route } from 'react-router-dom'
import './components/components.css'
import Landing from './screens/Landing'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import CreateAlert from './screens/CreateAlert'
import Settings from './screens/Settings'
import AlertDetail from './screens/AlertDetail'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/new" element={<CreateAlert />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/alert/:id" element={<AlertDetail />} />
      </Routes>
    </div>
  )
}
