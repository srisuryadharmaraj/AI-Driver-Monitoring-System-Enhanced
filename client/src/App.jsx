import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { 
  Upload, Camera, Settings, ShieldAlert, LayoutDashboard, Users, 
  Route as RouteIcon, Cpu, BarChart2, Sparkles, Building, ArrowRightLeft, 
  Briefcase, FileText, FlaskConical, AlertTriangle, ChevronLeft, ChevronRight 
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
import logoImg from './assets/ssd-driveai-logo.png.png'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

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
        { path: '/profile', label: 'Driver Profile', icon: <FileText size={18} /> },
        { path: '/evaluation', label: 'Model Evaluation', icon: <FlaskConical size={18} /> },
      ]
    }
  ]

  return (
    <DriverProvider>
      <div className="app-layout">
        {/* Automotive AI Cockpit Sidebar */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand" onClick={() => navigate('/command')} style={{ cursor: 'pointer' }}>
            <div className="sidebar-brand-logo">
              <img src={logoImg} alt="SSD DriveAI Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">SSD DRIVEAI</span>
              <span className="sidebar-brand-subtitle">SMART • SAFE • CONNECTED</span>
            </div>
            <button 
              className="sidebar-toggle-btn"
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed(!collapsed)
              }}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <div className="sidebar-scrollable">
            {navSections.map((sec, idx) => (
              <div key={idx} className="nav-section">
                <div className="nav-section-title">{sec.section}</div>
                {sec.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                  return (
                    <button
                      key={item.path}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => navigate(item.path)}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            ))}

            {!collapsed && (
              <div className="sidebar-settings-panel">
                <div className="settings-header">
                  <Settings size={14} />
                  <span>Telemetry Config</span>
                </div>
                <div className="settings-group">
                  <div className="setting-row">
                    <label>
                      Speed Limit
                      <span className="setting-val">{settings.speedLimit} km/h</span>
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
            )}
          </div>

          <div className="sidebar-footer">
            AI Driver Monitoring & Skill Intelligence<br />
            OpenCV · MediaPipe · YOLOv8
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
            <Route path="/profile" element={<DriverPassportPage />} />
            <Route path="/evaluation" element={<ModelEvaluationPage />} />
            <Route path="/incidents" element={<IncidentManagementPage />} />
          </Routes>
        </main>
      </div>
    </DriverProvider>
  )
}
