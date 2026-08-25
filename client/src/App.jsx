import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { 
  Upload, Camera, Settings, ShieldAlert, LayoutDashboard, Users, 
  Route as RouteIcon, Cpu, BarChart2, Sparkles, Building, ArrowRightLeft, 
  Briefcase, FileText, FlaskConical, AlertTriangle 
} from 'lucide-react'

import UploadMode from './components/UploadMode'
import LiveMode from './components/LiveMode'

import CommandCenter from './pages/CommandCenter'
import DriversPage from './pages/DriversPage'
import DriverProfilePage from './pages/DriverProfilePage'
import JourneysPage from './pages/JourneysPage'
import JourneyDetailPage from './pages/JourneyDetailPage'
import DigitalTwinPage from './pages/DigitalTwinPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DrivingCoachPage from './pages/DrivingCoachPage'
import FleetDashboardPage from './pages/FleetDashboardPage'
import DriverComparisonPage from './pages/DriverComparisonPage'
import SuitabilityPage from './pages/SuitabilityPage'
import DriverPassportPage from './pages/DriverPassportPage'
import ModelEvaluationPage from './pages/ModelEvaluationPage'
import IncidentManagementPage from './pages/IncidentManagementPage'

import { DriverProvider } from './context/DriverContext'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [settings, setSettings] = useState({
    speedLimit: 80,
    earThreshold: 0.25,
    skipFrames: 2,
  })

  const navSections = [
    {
      section: 'OVERVIEW',
      items: [
        { path: '/command', label: 'Command Center', icon: <LayoutDashboard size={18} /> },
      ]
    },
    {
      section: 'MONITORING',
      items: [
        { path: '/', label: 'Upload Video', icon: <Upload size={18} /> },
        { path: '/live', label: 'Live Camera', icon: <Camera size={18} /> },
      ]
    },
    {
      section: 'DRIVER INTELLIGENCE',
      items: [
        { path: '/drivers', label: 'Drivers', icon: <Users size={18} /> },
        { path: '/journeys', label: 'Journey History', icon: <RouteIcon size={18} /> },
        { path: '/digital-twin', label: 'Digital Twin', icon: <Cpu size={18} /> },
        { path: '/analytics', label: 'Performance Analytics', icon: <BarChart2 size={18} /> },
        { path: '/coach', label: 'AI Driving Coach', icon: <Sparkles size={18} /> },
      ]
    },
    {
      section: 'ORGANISATION',
      items: [
        { path: '/fleet', label: 'Fleet Intelligence', icon: <Building size={18} /> },
        { path: '/comparison', label: 'Driver Comparison', icon: <ArrowRightLeft size={18} /> },
        { path: '/suitability', label: 'Recruitment Suitability', icon: <Briefcase size={18} /> },
        { path: '/incidents', label: 'Incident Audit Engine', icon: <AlertTriangle size={18} /> },
      ]
    },
    {
      section: 'REPORTS & RESEARCH',
      items: [
        { path: '/passport', label: 'Skill Passport', icon: <FileText size={18} /> },
        { path: '/evaluation', label: 'Model Evaluation', icon: <FlaskConical size={18} /> },
      ]
    }
  ]

  return (
    <DriverProvider>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand" onClick={() => navigate('/command')} style={{ cursor: 'pointer' }}>
            <ShieldAlert size={24} color="#3b82f6" />
            <span>Driver AI Platform</span>
          </div>

          <div className="sidebar-scrollable">
            {navSections.map((sec, idx) => (
              <div key={idx} className="nav-section">
                <div className="nav-section-title">{sec.section}</div>
                {sec.items.map((item) => (
                  <button
                    key={item.path}
                    className={`nav-link ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            ))}

            <div style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
              <div className="nav-link" style={{ cursor: 'default', gap: '0.5rem' }}>
                <Settings size={18} />
                Settings
              </div>
              <div className="settings-group">
                <div className="setting-row">
                  <label>
                    Speed Limit (km/h)
                    <span className="setting-val">{settings.speedLimit}</span>
                  </label>
                  <input
                    type="range" min={30} max={160} step={5}
                    value={settings.speedLimit}
                    onChange={(e) => setSettings(s => ({ ...s, speedLimit: +e.target.value }))}
                  />
                </div>
                <div className="setting-row">
                  <label>
                    EAR Threshold
                    <span className="setting-val">{settings.earThreshold}</span>
                  </label>
                  <input
                    type="range" min={0.15} max={0.35} step={0.01}
                    value={settings.earThreshold}
                    onChange={(e) => setSettings(s => ({ ...s, earThreshold: +e.target.value }))}
                  />
                </div>
                <div className="setting-row">
                  <label>
                    Skip Frames
                    <span className="setting-val">{settings.skipFrames}</span>
                  </label>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={settings.skipFrames}
                    onChange={(e) => setSettings(s => ({ ...s, skipFrames: +e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            AI Driver Behavior & Skill Intelligence Platform v3.0<br />
            OpenCV · MediaPipe · YOLOv8 · React 19
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<UploadMode settings={settings} />} />
            <Route path="/live" element={<LiveMode settings={settings} />} />
            <Route path="/command" element={<CommandCenter />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/driver/:id" element={<DriverProfilePage />} />
            <Route path="/journeys" element={<JourneysPage />} />
            <Route path="/journey/:id" element={<JourneyDetailPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/coach" element={<DrivingCoachPage />} />
            <Route path="/fleet" element={<FleetDashboardPage />} />
            <Route path="/comparison" element={<DriverComparisonPage />} />
            <Route path="/suitability" element={<SuitabilityPage />} />
            <Route path="/passport" element={<DriverPassportPage />} />
            <Route path="/evaluation" element={<ModelEvaluationPage />} />
            <Route path="/incidents" element={<IncidentManagementPage />} />
          </Routes>
        </main>
      </div>
    </DriverProvider>
  )
}
