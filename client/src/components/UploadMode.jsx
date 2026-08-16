import React, { useState, useRef, useCallback } from 'react'
import { Upload, Play, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react'
import RiskGauge from './RiskGauge'
import TimelineChart from './TimelineChart'
import useAlarm from '../hooks/useAlarm'

export default function UploadMode({ settings }) {
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
      const wsUrl = `${proto}://${host}/ws/process/${job_id}?speed_limit=${settings.speedLimit}&skip_frames=${settings.skipFrames}&ear_threshold=${settings.earThreshold}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data)

        if (msg.type === 'frame') {
          setProgress(msg.frame_idx / msg.total_frames)
          setCurrentFrame(msg.image ? `data:image/jpeg;base64,${msg.image}` : null)
          setFrameData(msg)
          // Play alarm sound in browser when alarm is triggered
          if (msg.alarm) playAlarm()
        } else if (msg.type === 'summary') {
          setSummary(msg)
          setStatus('done')
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
  }, [file, settings, playAlarm])

  const riskBadge = (level) => {
    const cls = level === 'High' ? 'badge-high' : level === 'Medium' ? 'badge-medium' : 'badge-low'
    return <span className={`badge ${cls}`}>{level}</span>
  }

  return (
    <div>
      <div className="page-header">
        <h1>📤 Upload Video Analysis</h1>
        <p>Upload a dashcam / cabin video and get a full behaviour, obstacle &amp; safety report.</p>
      </div>

      {/* Upload Zone */}
      {!videoUrl && (
        <div
          className="upload-zone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="icon"><Upload size={48} strokeWidth={1.5} color="#64748b" /></div>
          <p><strong>Click or drag &amp; drop</strong> a video file</p>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>MP4, AVI, MOV, MKV</p>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* File info + button */}
      {file && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            📁 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </span>
          <button
            className="btn btn-primary"
            onClick={analyse}
            disabled={status === 'uploading' || status === 'processing'}
          >
            {status === 'uploading' && <><Loader2 size={16} className="spin" /> Uploading…</>}
            {status === 'processing' && <><Loader2 size={16} className="spin" /> Processing…</>}
            {(status === 'idle' || status === 'done' || status === 'error') && <><Play size={16} /> Analyse Video</>}
          </button>
          <button className="btn btn-outline" onClick={() => { setFile(null); setVideoUrl(null); setSummary(null); setCurrentFrame(null); setStatus('idle') }}>
            Clear
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="alert-banner"><AlertTriangle size={18} /> {errorMsg}</div>
      )}

      {/* Progress */}
      {status === 'processing' && (
        <div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${(progress * 100).toFixed(1)}%` }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {(progress * 100).toFixed(0)}% complete
          </p>
        </div>
      )}

      {/* Alarm banner while processing */}
      {frameData?.alarm && status === 'processing' && (
        <div className="alarm-banner">
          <ShieldAlert size={20} />
          <div>
            <strong>ALARM</strong>
            <div className="alarm-reasons">
              {(frameData.alarm_reasons || []).map((r, i) => <span key={i}>• {r}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Annotated frame preview */}
      {currentFrame && status === 'processing' && (
        <div className={`video-frame ${frameData?.alarm ? 'frame-alarm' : ''}`}>
          <img src={currentFrame} alt="Processing frame" />
        </div>
      )}

      {/* Live metrics while processing */}
      {frameData && status === 'processing' && (
        <div className="metric-grid">
          <div className="card">
            <div className="card-title">Speed</div>
            <div className="card-value">{frameData.speed_kmph?.toFixed(0)} <small>km/h</small></div>
          </div>
          <div className="card">
            <div className="card-title">EAR</div>
            <div className="card-value">{frameData.ear?.toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="card-title">Fatigue</div>
            <div className="card-value">{frameData.fatigue ? '😴 YES' : '✅ No'}</div>
          </div>
          <div className="card">
            <div className="card-title">Obstacles</div>
            <div className="card-value" style={{ color: frameData.obstacle_count > 0 ? '#f59e0b' : '#22c55e' }}>
              {frameData.obstacle_count ?? 0}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Collision Risk</div>
            <div className="card-value" style={{ color: frameData.collision_risk ? '#ef4444' : '#22c55e' }}>
              {frameData.collision_risk ? '⚠️ YES' : '✅ No'}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Risk</div>
            <div className="card-value">{riskBadge(frameData.risk_level)}</div>
          </div>
        </div>
      )}

      {/* ══ SUMMARY DASHBOARD ═══════════════════════════════════════════════ */}
      {summary && status === 'done' && (
        <div>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#22c55e', fontWeight: 600 }}>
            ✅ Done — {summary.total_frames} frames @ {summary.fps?.toFixed(0)} FPS · {summary.duration_sec}s
          </div>

          {/* KPI Cards */}
          <div className="metric-grid">
            <div className="card">
              <div className="card-title">Duration</div>
              <div className="card-value">{summary.duration_sec}s</div>
            </div>
            <div className="card">
              <div className="card-title">Max Speed</div>
              <div className="card-value" style={{ color: summary.max_speed > settings.speedLimit ? '#ef4444' : '#22c55e' }}>
                {summary.max_speed?.toFixed(0)} <small>km/h</small>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Fatigue Frames</div>
              <div className="card-value">{summary.fatigue_frames}</div>
            </div>
            <div className="card">
              <div className="card-title">Distraction Frames</div>
              <div className="card-value">{summary.distraction_frames}</div>
            </div>
            <div className="card">
              <div className="card-title">Collision Warnings</div>
              <div className="card-value" style={{ color: summary.collision_warnings > 0 ? '#ef4444' : '#22c55e' }}>
                {summary.collision_warnings}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Obstacle Frames</div>
              <div className="card-value">{summary.obstacle_frames}</div>
            </div>
            <div className="card">
              <div className="card-title">Total Alarms</div>
              <div className="card-value" style={{ color: summary.total_alarms > 0 ? '#ef4444' : '#22c55e' }}>
                {summary.total_alarms}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Avg Risk</div>
              <div className="card-value">{summary.avg_risk?.toFixed(2)}</div>
            </div>
          </div>

          {/* Risk Gauge */}
          <div className="card" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <RiskGauge score={summary.avg_risk} />
          </div>

          {/* Timeline Charts */}
          <div className="chart-grid">
            <TimelineChart data={summary.speed_timeline} title="Speed Over Time" yLabel="km/h" dangerLine={settings.speedLimit} color="#3b82f6" />
            <TimelineChart data={summary.risk_timeline} title="Risk Score Over Time" yLabel="Score" dangerLine={0.6} color="#f59e0b" />
          </div>
          <div className="chart-grid">
            <TimelineChart data={summary.ear_timeline} title="Eye Aspect Ratio (EAR)" yLabel="EAR" dangerLine={settings.earThreshold} color="#22c55e" />
            <TimelineChart data={summary.danger_timeline} title="Collision Danger Score" yLabel="Danger" dangerLine={0.5} color="#ef4444" />
          </div>

          {/* Plates Table */}
          {summary.plates_detected?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>🔢 Detected License Plates</h3>
              <table className="data-table">
                <thead>
                  <tr><th>Plate</th><th>Speed (km/h)</th><th>Time (s)</th></tr>
                </thead>
                <tbody>
                  {summary.plates_detected.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.text}</td>
                      <td>{p.speed?.toFixed(0)}</td>
                      <td>{p.time?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Alert / Alarm Moments */}
          {summary.alert_moments?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>🚨 Alarm Moments</h3>
              <table className="data-table">
                <thead>
                  <tr><th>Frame</th><th>Time (s)</th><th>Risk</th><th>Reasons</th></tr>
                </thead>
                <tbody>
                  {summary.alert_moments.slice(0, 50).map((a, i) => (
                    <tr key={i}>
                      <td>{a.frame}</td>
                      <td>{a.time?.toFixed(1)}</td>
                      <td><span className="badge badge-high">{a.score?.toFixed(2)}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{(a.reasons || []).join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
