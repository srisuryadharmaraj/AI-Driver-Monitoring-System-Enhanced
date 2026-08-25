import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, Filter, Download, 
  Eye, Edit3, Save, X, Search, AlertCircle, FileText 
} from 'lucide-react'

export default function IncidentManagementPage() {
  const [incidents, setIncidents] = useState([])
  const [summary, setSummary] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState('')
  const [selectedEventType, setSelectedEventType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [activeModalIncident, setActiveModalIncident] = useState(null)
  const [newStatus, setNewStatus] = useState('Open')
  const [supervisorNotes, setSupervisorNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const queryParams = new URLSearchParams()
      if (selectedSeverity) queryParams.append('severity', selectedSeverity)
      if (selectedEventType) queryParams.append('event_type', selectedEventType)
      if (selectedStatus) queryParams.append('status', selectedStatus)
      if (selectedDriver) queryParams.append('driver_id', selectedDriver)

      const [incRes, sumRes, drvRes] = await Promise.all([
        fetch(`/api/incidents?${queryParams.toString()}`).then(r => r.json()),
        fetch('/api/incidents/summary').then(r => r.json()),
        fetch('/api/drivers').then(r => r.json()).catch(() => [])
      ])

      setIncidents(incRes || [])
      setSummary(sumRes || null)
      setDrivers(drvRes || [])
    } catch (err) {
      console.error('Failed to load incident data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedSeverity, selectedEventType, selectedStatus, selectedDriver])

  const handleOpenModal = (inc) => {
    setActiveModalIncident(inc)
    setNewStatus(inc.resolution_status || 'Open')
    setSupervisorNotes(inc.supervisor_notes || '')
  }

  const handleUpdateStatus = async () => {
    if (!activeModalIncident) return
    try {
      setUpdating(true)
      const res = await fetch(`/api/incidents/${activeModalIncident.event_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          supervisor_notes: supervisorNotes,
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      setActiveModalIncident(null)
      fetchData()
    } catch (err) {
      alert(`Failed to update incident: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleExportCSV = () => {
    if (!filteredIncidents.length) return
    const headers = ['Event ID', 'Journey ID', 'Date', 'Time (s)', 'Driver', 'License', 'Event Type', 'Severity', 'Risk Score', 'Status', 'Supervisor Notes']
    const rows = filteredIncidents.map(i => [
      i.event_id,
      i.journey_id,
      i.journey_date || 'N/A',
      i.timestamp_sec ?? 'N/A',
      `"${i.driver_name || 'N/A'}"`,
      i.licence_number || 'N/A',
      i.event_type || 'N/A',
      i.severity || 'N/A',
      i.risk_score ?? 'N/A',
      i.resolution_status || 'Open',
      `"${(i.supervisor_notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `safety_incidents_audit_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredIncidents = incidents.filter(inc => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (inc.event_id || '').toLowerCase().includes(q) ||
      (inc.driver_name || '').toLowerCase().includes(q) ||
      (inc.event_type || '').toLowerCase().includes(q) ||
      (inc.description || '').toLowerCase().includes(q)
    )
  })

  const getSeverityBadgeClass = (sev) => {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return 'badge-danger'
      case 'high': return 'badge-warning'
      case 'medium': return 'badge-info'
      default: return 'badge-safe'
    }
  }

  const getStatusBadgeClass = (st) => {
    switch ((st || '').toLowerCase()) {
      case 'resolved': return 'badge-safe'
      case 'under review': return 'badge-warning'
      default: return 'badge-info'
    }
  }

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — INCIDENT RESPONSE & SAFETY AUDIT CENTER" 
        subtitle="Real-time Telemetry Hazard Audit, Risk Mitigation & Supervisor Resolution Workflow"
      />

      {/* KPI Summary Row */}
      <div className="metric-grid mb-4">
        <div className="kpi-card card-accent-border">
          <span className="kpi-title">TOTAL INCIDENTS</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number">{summary?.total_incidents ?? 0}</span>
          </div>
          <span className="kpi-subtext">Logged Telemetry Hazards</span>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">CRITICAL INCIDENTS</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: 'var(--danger)' }}>{summary?.critical_incidents ?? 0}</span>
          </div>
          <span className="kpi-subtext">Immediate Escalation Flagged</span>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">OPEN / UNDER REVIEW</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: 'var(--warning)' }}>
              {(summary?.open_incidents ?? 0) + (summary?.under_review_incidents ?? 0)}
            </span>
          </div>
          <span className="kpi-subtext">
            {summary?.open_incidents ?? 0} Open · {summary?.under_review_incidents ?? 0} Reviewing
          </span>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">RESOLUTION RATE</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: 'var(--safe)' }}>{summary?.resolution_rate_pct ?? 0}%</span>
          </div>
          <span className="kpi-subtext">{summary?.resolved_incidents ?? 0} Incidents Resolved</span>
        </div>
      </div>

      {/* Control & Multi-Filter Bar */}
      <div className="card mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              <Filter size={15} /> FILTERS:
            </div>

            <select 
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              style={{ width: 'auto', minWidth: 130, padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: 32 }}
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              value={selectedEventType}
              onChange={e => setSelectedEventType(e.target.value)}
              style={{ width: 'auto', minWidth: 140, padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: 32 }}
            >
              <option value="">All Event Types</option>
              <option value="Fatigue">Fatigue</option>
              <option value="Distraction">Distraction</option>
              <option value="Lane Deviation">Lane Deviation</option>
              <option value="Obstacle Hazard">Obstacle Hazard</option>
              <option value="Overspeed">Overspeed</option>
            </select>

            <select 
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ width: 'auto', minWidth: 130, padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: 32 }}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select 
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
              style={{ width: 'auto', minWidth: 150, padding: '0.35rem 0.6rem', fontSize: '0.78rem', height: 32 }}
            >
              <option value="">All Drivers</option>
              {drivers.map(d => (
                <option key={d.driver_id} value={d.driver_id}>{d.full_name}</option>
              ))}
            </select>

            <div style={{ position: 'relative', minWidth: 200 }}>
              <input 
                type="text" 
                placeholder="Search incidents..."
                style={{ paddingLeft: '2.2rem', height: 32, fontSize: '0.78rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleExportCSV}
            disabled={!filteredIncidents.length}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', height: 32 }}
          >
            <Download size={15} /> EXPORT AUDIT LOG (CSV)
          </button>
        </div>
      </div>

      {/* Main Incident Audit Table */}
      {loading ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            LOADING SAFETY INCIDENT TELEMETRY...
          </p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>NO SAFETY INCIDENTS FOUND</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            No incident records match the selected filter criteria. Safety events automatically record during live or video monitoring runs.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>EVENT ID</th>
                <th>DATE &amp; TIME</th>
                <th>DRIVER NAME</th>
                <th>EVENT TYPE</th>
                <th>SEVERITY</th>
                <th>RISK SCORE</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => (
                <tr key={inc.event_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                    {inc.event_id || 'N/A'}
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{inc.journey_date || 'N/A'}</div>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      {inc.timestamp_sec != null ? `${inc.timestamp_sec}s into trip` : 'N/A'}
                    </small>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {inc.driver_name || 'N/A'}
                    {inc.licence_number && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{inc.licence_number}</div>}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{inc.event_type || 'N/A'}</span>
                  </td>
                  <td>
                    <span className={`badge ${getSeverityBadgeClass(inc.severity)}`}>
                      {inc.severity || 'N/A'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: (inc.risk_score || 0) > 0.6 ? 'var(--danger)' : 'var(--warning)' }}>
                    {inc.risk_score != null ? inc.risk_score.toFixed(2) : 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(inc.resolution_status)}`}>
                      {inc.resolution_status || 'Open'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => handleOpenModal(inc)}
                    >
                      <Edit3 size={13} /> Review &amp; Action
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review & Resolution Modal */}
      {activeModalIncident && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content card" style={{ maxWidth: 560, width: '100%', background: 'var(--surface)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="var(--accent)" /> Incident Review &amp; Resolution
              </h3>
              <button 
                onClick={() => setActiveModalIncident(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Incident Details Summary Box */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Event ID:</span> <strong style={{ color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>{activeModalIncident.event_id || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Journey ID:</span> <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{activeModalIncident.journey_id || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Driver Name:</span> <strong style={{ color: '#ffffff' }}>{activeModalIncident.driver_name || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Timestamp:</span> <strong style={{ color: '#ffffff' }}>{activeModalIncident.journey_date || 'N/A'} ({activeModalIncident.timestamp_sec ?? 'N/A'}s)</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Event Type:</span> <strong style={{ color: '#ffffff' }}>{activeModalIncident.event_type || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Severity:</span> <strong style={{ color: 'var(--warning)' }}>{activeModalIncident.severity || 'N/A'}</strong></div>
              </div>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Description:</span>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)' }}>{activeModalIncident.description || 'N/A'}</p>
              </div>
            </div>

            {/* Workflow Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  RESOLUTION STATUS WORKFLOW
                </label>
                <select 
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Open">Open (Pending Review)</option>
                  <option value="Under Review">Under Review (Investigation Active)</option>
                  <option value="Resolved">Resolved (Action Completed)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  SUPERVISOR AUDIT &amp; ACTION NOTES
                </label>
                <textarea 
                  rows={3}
                  placeholder="Enter supervisor findings, corrective coaching notes, or resolution confirmation..."
                  value={supervisorNotes}
                  onChange={e => setSupervisorNotes(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.6rem 0.85rem', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              {activeModalIncident.reviewed_at && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Last Reviewed: {activeModalIncident.reviewed_at}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary" onClick={() => setActiveModalIncident(null)} disabled={updating}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={15} /> {updating ? 'SAVING...' : 'SAVE RESOLUTION'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
