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
      default: return 'badge-low'
    }
  }

  const getStatusBadgeClass = (st) => {
    switch ((st || '').toLowerCase()) {
      case 'resolved': return 'badge-success'
      case 'under review': return 'badge-warning'
      default: return 'badge-secondary'
    }
  }

  return (
    <div className="page-container">
      <TopBar 
        title="INCIDENT RESPONSE & SAFETY RISK AUDIT ENGINE" 
        subtitle="Real-time Telemetry Hazard Audit, Risk Mitigation & Supervisor Resolution Workflow"
      />

      {/* KPI Row */}
      <div className="kpi-grid mb-4">
        <div className="kpi-card">
          <div className="kpi-icon icon-blue"><AlertTriangle size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-title">TOTAL INCIDENTS</span>
            <span className="kpi-value">{summary?.total_incidents ?? 0}</span>
            <span className="kpi-subtext">Logged Telemetry Hazards</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon icon-amber"><ShieldAlert size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-title">CRITICAL INCIDENTS</span>
            <span className="kpi-value">{summary?.critical_incidents ?? 0}</span>
            <span className="kpi-subtext">Immediate Escalation Flagged</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon icon-cyan"><Clock size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-title">OPEN / UNDER REVIEW</span>
            <span className="kpi-value">
              {(summary?.open_incidents ?? 0) + (summary?.under_review_incidents ?? 0)}
            </span>
            <span className="kpi-subtext">
              {summary?.open_incidents ?? 0} Open · {summary?.under_review_incidents ?? 0} Reviewing
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon icon-green"><CheckCircle2 size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-title">RESOLUTION RATE</span>
            <span className="kpi-value">{summary?.resolution_rate_pct ?? 0}%</span>
            <span className="kpi-subtext">{summary?.resolved_incidents ?? 0} Incidents Resolved</span>
          </div>
        </div>
      </div>

      {/* Control & Multi-Filter Bar */}
      <div className="chart-card mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
              <Filter size={16} /> FILTERS:
            </div>

            <select 
              className="form-control" 
              style={{ width: 'auto', minWidth: 130, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              className="form-control" 
              style={{ width: 'auto', minWidth: 140, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              value={selectedEventType}
              onChange={e => setSelectedEventType(e.target.value)}
            >
              <option value="">All Event Types</option>
              <option value="Fatigue">Fatigue</option>
              <option value="Distraction">Distraction</option>
              <option value="Lane Deviation">Lane Deviation</option>
              <option value="Obstacle Hazard">Obstacle Hazard</option>
              <option value="Overspeed">Overspeed</option>
            </select>

            <select 
              className="form-control" 
              style={{ width: 'auto', minWidth: 130, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select 
              className="form-control" 
              style={{ width: 'auto', minWidth: 150, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
            >
              <option value="">All Drivers</option>
              {drivers.map(d => (
                <option key={d.driver_id} value={d.driver_id}>{d.full_name}</option>
              ))}
            </select>

            <div style={{ position: 'relative', minWidth: 200 }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="Search incidents..."
                style={{ paddingLeft: '2.2rem', padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleExportCSV}
            disabled={!filteredIncidents.length}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Download size={15} /> EXPORT AUDIT LOG (CSV)
          </button>
        </div>
      </div>

      {/* Main Incident Audit Table */}
      <div className="chart-card">
        {loading ? (
          <div className="loading-container"><p>LOADING SAFETY INCIDENT TELEMETRY...</p></div>
        ) : filteredIncidents.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <AlertCircle size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', margin: 0 }}>No safety incidents found matching the selected criteria.</p>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>Safety events will automatically record during live or video monitoring runs.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>EVENT ID</th>
                  <th>DATE & TIME</th>
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
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>
                      {inc.event_id || 'N/A'}
                    </td>
                    <td>
                      <div>{inc.journey_date || 'N/A'}</div>
                      <small style={{ color: '#64748b' }}>{inc.timestamp_sec != null ? `${inc.timestamp_sec}s into trip` : 'N/A'}</small>
                    </td>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                      {inc.driver_name || 'N/A'}
                      {inc.licence_number && <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>{inc.licence_number}</div>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{inc.event_type || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadgeClass(inc.severity)}`}>
                        {inc.severity || 'N/A'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: (inc.risk_score || 0) > 0.6 ? '#ef4444' : '#f59e0b' }}>
                      {inc.risk_score != null ? inc.risk_score.toFixed(2) : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(inc.resolution_status)}`}>
                        {inc.resolution_status || 'Open'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => handleOpenModal(inc)}
                      >
                        <Edit3 size={13} /> Review & Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Resolution Modal */}
      {activeModalIncident && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
            width: '90%', maxWidth: '540px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f8fafc' }}>
                <ShieldAlert size={20} color="#3b82f6" /> Incident Review & Action
              </h3>
              <button 
                onClick={() => setActiveModalIncident(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Incident Summary Fields */}
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div><span style={{ color: '#64748b' }}>Event ID:</span> <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{activeModalIncident.event_id || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Journey ID:</span> <strong style={{ color: '#e2e8f0' }}>{activeModalIncident.journey_id || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Driver Name:</span> <strong style={{ color: '#e2e8f0' }}>{activeModalIncident.driver_name || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Date / Timestamp:</span> <strong style={{ color: '#e2e8f0' }}>{activeModalIncident.journey_date || 'N/A'} ({activeModalIncident.timestamp_sec ?? 'N/A'}s)</strong></div>
                <div><span style={{ color: '#64748b' }}>Event Type:</span> <strong style={{ color: '#e2e8f0' }}>{activeModalIncident.event_type || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Severity:</span> <strong style={{ color: '#f59e0b' }}>{activeModalIncident.severity || 'N/A'}</strong></div>
              </div>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #334155' }}>
                <span style={{ color: '#64748b' }}>Description:</span>
                <p style={{ margin: '0.2rem 0 0 0', color: '#cbd5e1' }}>{activeModalIncident.description || 'N/A'}</p>
              </div>
            </div>

            {/* Workflow Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  RESOLUTION STATUS WORKFLOW
                </label>
                <select 
                  className="form-control"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                >
                  <option value="Open">Open (Pending Review)</option>
                  <option value="Under Review">Under Review (Investigation Active)</option>
                  <option value="Resolved">Resolved (Action Completed)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  SUPERVISOR AUDIT & ACTION NOTES
                </label>
                <textarea 
                  className="form-control"
                  rows={3}
                  placeholder="Enter supervisor findings, corrective coaching notes, or resolution confirmation..."
                  value={supervisorNotes}
                  onChange={e => setSupervisorNotes(e.target.value)}
                />
              </div>

              {activeModalIncident.reviewed_at && (
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Last Reviewed: {activeModalIncident.reviewed_at}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
