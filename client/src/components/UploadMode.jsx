import React, { useState, useRef, useCallback } from 'react'
import { Upload, Play, Loader2, AlertTriangle, ShieldAlert, UserCheck, Cpu, Activity, ShieldCheck, Eye, Compass, Car, Zap } from 'lucide-react'
import TopBar from './TopBar'
import RiskGauge from './RiskGauge'
import TimelineChart from './TimelineChart'
import useAlarm from '../hooks/useAlarm'
import { useDriver } from '../context/DriverContext'

export default function UploadMode({ settings }) {
  const { activeDriver, activeDriverId, refreshDrivers } = useDriver()
  const [file, setFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(null)
  const [summary, setSummary] = useState(null)
  const [frameData, setFrameData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef()
  const wsRef = useRef(null)
  const playAlarm = useAlarm()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setVideoUrl(URL.createObjectURL(f))
      setSummary(null)
      setStatus('idle')
      setProgress(0)
      setCurrentFrame(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      setFile(f)
      setVideoUrl(URL.createObjectURL(f))
      setSummary(null)
      setStatus('idle')
      setProgress(0)
      setCurrentFrame(null)
    }
  }

  const analyse = useCallback(async () => {
    if (!file) return

    if (!activeDriverId || !activeDriver) {
      setErrorMsg('Please select a driver before starting monitoring.')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { job_id } = await res.json()

      setStatus('processing')
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host = window.location.host
      const wsUrl = `${proto}://${host}/ws/process/${job_id}?speed_limit=${settings.speedLimit}&skip_frames=${settings.skipFrames}&ear_threshold=${settings.earThreshold}&driver_id=${activeDriverId}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data)

        if (msg.type === 'frame') {
          setProgress(msg.frame_idx / msg.total_frames)
          setCurrentFrame(msg.image ? `data:image/jpeg;base64,${msg.image}` : null)
          setFrameData(msg)
          if (msg.alarm) playAlarm()
        } else if (msg.type === 'summary') {
          setSummary(msg)
          setStatus('done')
          if (refreshDrivers) refreshDrivers()
        } else if (msg.error) {
          setErrorMsg(msg.error)
          setStatus('error')
        }
      }

      ws.onerror = () => {
        setErrorMsg('WebSocket connection failed')
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }, [file, settings, playAlarm, activeDriverId, activeDriver, refreshDrivers])

  const riskBadge = (level) => {
    const cls = level === 'High' ? 'badge-danger' : level === 'Medium' ? 'badge-warning' : 'badge-safe'
    return <span className={`badge ${cls}`}>{level}</span>
  }

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — AI DRIVE ANALYSIS BAY" 
        subtitle="Computer Vision Telemetry & Driver Safety Analysis Station"
      />

      {/* Active Session Driver Identity Bar */}
      <div className="card card-accent-border mb-4" style={{ padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src={activeDriver?.profile_photo || "https://api.dicebear.com/7.x/bottts/svg?seed=driver"} 
            alt={activeDriver?.full_name} 
            style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border-accent)', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <UserCheck size={14} color="#00f0ff" /> Monitoring Session Driver
            </div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeDriver ? activeDriver.full_name : <span style={{ color: 'var(--danger)' }}>No Driver Selected</span>}
              {activeDriver && (
                <span className="driver-id-pill">{activeDriver.driver_id}</span>
              )}
            </div>
          </div>
        </div>
        <span className={`badge ${activeDriver ? 'badge-info' : 'badge-danger'}`}>
          {activeDriver ? activeDriver.licence_type || 'Commercial' : 'Action Required'}
        </span>
      </div>

      {/* BEFORE ANALYSIS: Diagnostic Input Bay */}
      {!videoUrl && (
        <div className="diagnostic-bay-card card mb-4">
          <div
            className="upload-zone"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{ border: '2px dashed var(--border-accent)', background: 'var(--bg-secondary)', borderRadius: 10, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
          >
            <div className="icon" style={{ width: 64, height: 64, margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(0,102,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-accent)' }}>
              <Upload size={32} color="#00f0ff" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
              DRIVE ANALYSIS INPUT BAY
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Click or drag &amp; drop dashcam / cabin video file to commence analysis
            </p>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Supported Formats: MP4 · AVI · MOV · MKV
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </div>

          {/* AI Analysis Capabilities Modules Bar */}
          <div className="module-indicator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div className="module-pill">
              <Eye size={15} color="#00e676" />
              <span>Fatigue Detection (EAR)</span>
            </div>
            <div className="module-pill">
              <Compass size={15} color="#00f0ff" />
              <span>Distraction (Pose &amp; Gaze)</span>
            </div>
            <div className="module-pill">
              <Car size={15} color="#ffb300" />
              <span>Obstacle (YOLOv8)</span>
            </div>
            <div className="module-pill">
              <Zap size={15} color="#ff334b" />
              <span>Collision Risk Alarm</span>
            </div>
          </div>
        </div>
      )}

      {/* File Selected Controls & Action */}
      {file && (
        <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff', fontSize: '0.9rem', fontWeight: 700 }}>
              📁 {file.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={analyse}
              disabled={status === 'uploading' || status === 'processing'}
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', letterSpacing: '0.04em' }}
            >
              {status === 'uploading' && <><Loader2 size={16} className="spin" /> Uploading Telemetry…</>}
              {status === 'processing' && <><Loader2 size={16} className="spin" /> Analysing Video Frame by Frame…</>}
              {(status === 'idle' || status === 'done' || status === 'error') && <><Play size={16} /> ANALYSE DRIVE</>}
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={() => { setFile(null); setVideoUrl(null); setSummary(null); setCurrentFrame(null); setStatus('idle') }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card card-danger mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>
          <AlertTriangle size={20} /> {errorMsg}
        </div>
      )}

      {/* DURING PROCESSING: Progress & Frame Telemetry */}
      {status === 'processing' && (
        <div className="mb-4">
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>CV ANALYSIS PROGRESS</span>
              <span style={{ color: '#ffffff', fontWeight: 800 }}>{(progress * 100).toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(progress * 100).toFixed(1)}%`, height: '100%', background: 'linear-gradient(90deg, #0066ff, #00f0ff)', borderRadius: 3, transition: 'width 0.1s ease' }} />
            </div>
          </div>

          {/* Alarm Banner */}
          {frameData?.alarm && (
            <div className="card card-danger mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <ShieldAlert size={24} color="#ff334b" />
              <div>
                <strong style={{ color: '#ff334b', fontSize: '0.95rem', letterSpacing: '0.04em' }}>COLLISION / SAFETY HAZARD ALARM TRIGGERED</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {(frameData.alarm_reasons || []).map((r, i) => <span key={i} style={{ marginRight: '0.75rem' }}>• {r}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* Annotated Processing Frame */}
          {currentFrame && (
            <div className="card mb-4" style={{ padding: '0.5rem', background: '#000000', border: frameData?.alarm ? '2px solid var(--danger)' : '1px solid var(--border-accent)' }}>
              <img src={currentFrame} alt="Processing frame" style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: 4 }} />
            </div>
          )}

          {/* Real-Time Processing Metrics Grid */}
          {frameData && (
            <div className="metric-grid">
              <div className="kpi-card card-accent-border">
                <span className="kpi-title">Current Speed</span>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number">{frameData.speed_kmph?.toFixed(0)}</span>
                  <span className="kpi-unit">km/h</span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <span className="kpi-title">Eye Aspect Ratio</span>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number">{frameData.ear?.toFixed(2)}</span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <span className="kpi-title">Fatigue State</span>
                <div className="kpi-value-wrap">
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: frameData.fatigue ? 'var(--danger)' : 'var(--safe)' }}>
                    {frameData.fatigue ? '😴 DROWSY' : '✅ ALERT'}
                  </span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <span className="kpi-title">Obstacles</span>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number" style={{ color: frameData.obstacle_count > 0 ? 'var(--warning)' : 'var(--safe)' }}>
                    {frameData.obstacle_count ?? 0}
                  </span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <span className="kpi-title">Collision Warning</span>
                <div className="kpi-value-wrap">
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: frameData.collision_risk ? 'var(--danger)' : 'var(--safe)' }}>
                    {frameData.collision_risk ? '🚨 HAZARD' : '✅ CLEAR'}
                  </span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <span className="kpi-title">Current Risk</span>
                <div className="kpi-value-wrap">
                  {riskBadge(frameData.risk_level)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AFTER ANALYSIS: Full Telemetry Report */}
      {summary && status === 'done' && (
        <div className="mb-4">
          <div className="card card-safe mb-4" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--safe)', letterSpacing: '0.04em', fontSize: '0.9rem' }}>
              ✅ DRIVE TELEMETRY ANALYSIS COMPLETE — {summary.total_frames} FRAMES PROCESSED @ {summary.fps?.toFixed(0)} FPS
            </span>
            <span className="badge badge-safe">{summary.duration_sec}s Duration</span>
          </div>

          {/* Instrument Cluster Metric Cards */}
          <div className="metric-grid mb-4">
            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Duration</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{summary.duration_sec}</span>
                <span className="kpi-unit">sec</span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Max Speed</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: summary.max_speed > settings.speedLimit ? 'var(--danger)' : '#ffffff' }}>
                  {summary.max_speed?.toFixed(0)}
                </span>
                <span className="kpi-unit">km/h</span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Fatigue Frames</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{summary.fatigue_frames}</span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Distraction Frames</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{summary.distraction_frames}</span>
              </div>
            </div>

            {/* Prominent Collision Warning Telemetry Box */}
            <div className={`kpi-card card-accent-border ${summary.collision_warnings > 0 ? 'card-danger' : ''}`}>
              <span className="kpi-title">Collision Warnings</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: summary.collision_warnings > 0 ? 'var(--danger)' : 'var(--safe)' }}>
                  {summary.collision_warnings}
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Obstacle Frames</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{summary.obstacle_frames}</span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Total Alarms</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: summary.total_alarms > 0 ? 'var(--danger)' : 'var(--safe)' }}>
                  {summary.total_alarms}
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Average Risk</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: '#00f0ff' }}>
                  {summary.avg_risk?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Digital Instrument Cluster Risk Gauge */}
          <div className="card mb-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>OVERALL DRIVE RISK INDEX</h3>
            <RiskGauge score={summary.avg_risk} />
          </div>

          {/* Automotive Telemetry Timeline Graphs */}
          <div className="chart-grid">
            <TimelineChart data={summary.speed_timeline} title="Speed Telemetry Over Time" yLabel="km/h" dangerLine={settings.speedLimit} color="#0066ff" />
            <TimelineChart data={summary.risk_timeline} title="Risk Score Profile Over Time" yLabel="Score" dangerLine={0.6} color="#ffb300" />
          </div>
          <div className="chart-grid">
            <TimelineChart data={summary.ear_timeline} title="Eye Aspect Ratio (EAR) Fatigue Tracking" yLabel="EAR" dangerLine={settings.earThreshold} color="#00e676" />
            <TimelineChart data={summary.danger_timeline} title="Collision Danger Index" yLabel="Danger" dangerLine={0.5} color="#ff334b" />
          </div>

          {/* Detected License Plates Data Table */}
          {summary.plates_detected?.length > 0 && (
            <div className="card mb-4">
              <h3 className="card-title" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>🔢 DETECTED LICENSE PLATES</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Plate Number</th><th>Speed (km/h)</th><th>Timestamp (s)</th></tr>
                  </thead>
                  <tbody>
                    {summary.plates_detected.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-secondary)' }}>{p.text}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.speed?.toFixed(0)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.time?.toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alarm Moments Data Table */}
          {summary.alert_moments?.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>🚨 RECORDED ALARM MOMENTS</h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Frame #</th><th>Timestamp</th><th>Risk Score</th><th>Alarm Reasons</th></tr>
                  </thead>
                  <tbody>
                    {summary.alert_moments.slice(0, 50).map((a, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{a.frame}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{a.time?.toFixed(1)}s</td>
                        <td><span className="badge badge-danger">{a.score?.toFixed(2)}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(a.reasons || []).join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
