import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { 
  ShieldCheck, AlertTriangle, Cpu, Play, Download, CheckCircle2, 
  Clock, Activity, Layers, FileSpreadsheet, Eye, HelpCircle 
} from 'lucide-react'

export default function ModelEvaluationPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/evaluation/results')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const handleRunBenchmark = async () => {
    try {
      setRunning(true)
      const res = await fetch('/api/evaluation/run', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setReport(data.report || data)
    } catch (err) {
      alert(`Benchmark execution failed: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  const handleExportJSON = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evaluation_report_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const fatigue = report?.fatigue_evaluation || {}
  const instFatigue = fatigue.frame_level_eye_closure || {}
  const distraction = report?.distraction_evaluation || {}
  const obstacle = report?.obstacle_evaluation || {}
  const lane = report?.lane_evaluation || {}
  const metadata = report?.evaluation_metadata || {}

  return (
    <div className="page-container">
      <TopBar 
        title="MODEL & RESEARCH EVALUATION BENCHMARK" 
        subtitle="Empirical Ground-Truth Validation, Confusion Matrix Metrics & Operational Benchmarks"
      />

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ 
            background: 'rgba(34, 197, 94, 0.15)', 
            color: '#22c55e', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <ShieldCheck size={16} /> REAL DATASET EVALUATION (168 SAMPLES)
          </span>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Last Evaluated: {metadata.evaluation_date || 'Pending'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleRunBenchmark} 
            disabled={running}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Play size={16} /> {running ? 'RUNNING BENCHMARK...' : 'RUN BENCHMARK EVALUATION'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportJSON}
            disabled={!report}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} /> EXPORT RESULTS (JSON)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><p>LOADING EVALUATION BENCHMARK DATA...</p></div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* PHASE 1: FATIGUE DETECTION EVALUATION                        */}
          {/* ============================================================ */}
          <div className="chart-card mb-4" style={{ borderLeft: '4px solid #22c55e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={20} color="#22c55e" /> PHASE 1: DRIVER FATIGUE DETECTION EVALUATION
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Evaluated against 168 ground-truth image frames (Alert: 29, Drowsy: 139) using dlib Eye Aspect Ratio (EAR &lt; 0.25)
                </p>
              </div>
              <span className="badge badge-success">COMPLETED & VERIFIED</span>
            </div>

            {/* Primary Metrics (Imbalanced Dataset Focused) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>PRECISION</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#22c55e', marginTop: '0.25rem' }}>
                  {((instFatigue.precision || 0) * 100).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Positive Predictive Value</div>
              </div>

              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>RECALL / SENSITIVITY</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.25rem' }}>
                  {((instFatigue.recall || 0) * 100).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>True Positive Rate</div>
              </div>

              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>F1-SCORE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a855f7', marginTop: '0.25rem' }}>
                  {((instFatigue.f1_score || 0) * 100).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Harmonic Mean (P & R)</div>
              </div>

              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>BALANCED ACCURACY</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
                  {((instFatigue.balanced_accuracy || 0) * 100).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>(Recall + Specificity) / 2</div>
              </div>

              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>OVERALL ACCURACY</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#cbd5e1', marginTop: '0.25rem' }}>
                  {((instFatigue.accuracy || 0) * 100).toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Secondary Metric</div>
              </div>

              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>INFERENCE LATENCY</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>
                  {fatigue.avg_inference_ms || 0} ms
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>{fatigue.approx_fps || 0} FPS Throughput</div>
              </div>
            </div>

            {/* Grid layout for Confusion Matrix & Class Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              {/* Confusion Matrix Table */}
              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} color="#3b82f6" /> Empirical Confusion Matrix
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                  <div></div>
                  <div style={{ fontWeight: 600, color: '#94a3b8' }}>PREDICTED ALERT</div>
                  <div style={{ fontWeight: 600, color: '#94a3b8' }}>PREDICTED DROWSY</div>

                  <div style={{ fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                    ACTUAL ALERT
                  </div>
                  <div style={{ background: '#166534', color: '#86efac', padding: '1rem', borderRadius: '6px', fontWeight: 700, fontSize: '1.2rem' }}>
                    TN = {instFatigue.tn ?? 0}
                  </div>
                  <div style={{ background: '#991b1b', color: '#fca5a5', padding: '1rem', borderRadius: '6px', fontWeight: 700, fontSize: '1.2rem' }}>
                    FP = {instFatigue.fp ?? 0}
                  </div>

                  <div style={{ fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                    ACTUAL DROWSY
                  </div>
                  <div style={{ background: '#991b1b', color: '#fca5a5', padding: '1rem', borderRadius: '6px', fontWeight: 700, fontSize: '1.2rem' }}>
                    FN = {instFatigue.fn ?? 0}
                  </div>
                  <div style={{ background: '#166534', color: '#86efac', padding: '1rem', borderRadius: '6px', fontWeight: 700, fontSize: '1.2rem' }}>
                    TP = {instFatigue.tp ?? 0}
                  </div>
                </div>
              </div>

              {/* Class Breakdown & Categories */}
              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileSpreadsheet size={16} color="#a855f7" /> Dataset Sequence Detection Breakdown
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {Object.entries(fatigue.per_category_detection_rate || {}).map(([cat, rate]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{cat} ({fatigue.category_counts?.[cat] || 0} frames):</span>
                      <span style={{ fontWeight: 600, color: cat === 'driver_no_sleep' ? '#22c55e' : '#38bdf8' }}>
                        {(rate * 100).toFixed(1)}% {cat === 'driver_no_sleep' ? 'Correct Alert' : 'Eye Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* PHASE 2 & 3: PENDING MODULES WITH REQUIRED ANNOTATIONS       */}
          {/* ============================================================ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            {/* Phase 2: Distraction Evaluation */}
            <div className="chart-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={18} color="#f59e0b" /> PHASE 2: DISTRACTION EVALUATION
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>MediaPipe Head Pose & Iris Gaze Estimation</p>
                </div>
                <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
                  GROUND TRUTH REQUIRED
                </span>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong style={{ color: '#f59e0b' }}>Strict Ground-Truth Protection:</strong> Distraction accuracy/F1 metrics are marked pending to prevent circular evaluation (deriving ground truth from model outputs).
              </div>

              <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>Required Manual Annotations:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.6' }}>
                {(distraction.required_annotations || []).map((ann, idx) => (
                  <li key={idx}>{ann}</li>
                ))}
              </ul>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #334155', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Yaw Thresh: {distraction.operational_stats?.yaw_threshold_deg}°</span>
                <span>Pitch Thresh: {distraction.operational_stats?.pitch_threshold_deg}°</span>
                <span>Gaze Thresh: {distraction.operational_stats?.gaze_ratio_threshold}</span>
              </div>
            </div>

            {/* Phase 3: YOLO Object Detection */}
            <div className="chart-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Cpu size={18} color="#3b82f6" /> PHASE 3: YOLO OBJECT DETECTION
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Forward Collision & Obstacle Tracking (yolov8n.pt)</p>
                </div>
                <span className="badge badge-warning" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', whiteSpace: 'nowrap' }}>
                  BOUNDING BOX GT REQUIRED
                </span>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong style={{ color: '#3b82f6' }}>Operational Runtime Statistics (Non-Accuracy):</strong> Below are real runtime parameters across test frames. mAP@0.5 requires manual bounding boxes.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: '#1e293b', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Detections / Frame</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{obstacle.operational_stats?.avg_detections_per_frame || 0}</div>
                </div>
                <div style={{ background: '#1e293b', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Avg Confidence</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>{((obstacle.operational_stats?.avg_confidence_score || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Inference Latency: <strong>{obstacle.operational_stats?.avg_inference_latency_ms || 0} ms</strong> ({obstacle.operational_stats?.approx_throughput_fps || 0} FPS)
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* PHASE 4: LANE DETECTION OPERATIONAL EVALUATION               */}
          {/* ============================================================ */}
          <div className="chart-card" style={{ borderLeft: '4px solid #a855f7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={18} color="#a855f7" /> PHASE 4: LANE DETECTION OPERATIONAL EVALUATION
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                  Canny Edge Detection + Probabilistic Hough Transform Tracking Performance
                </p>
              </div>
              <span className="badge badge-info" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                OPERATIONAL METRICS
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Availability Rate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e', marginTop: '0.2rem' }}>
                  {lane.operational_stats?.lane_detection_availability_rate_pct || 0}%
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tracking Dropout Rate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444', marginTop: '0.2rem' }}>
                  {lane.operational_stats?.lane_tracking_dropout_rate_pct || 0}%
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mean Center Offset</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                  {lane.operational_stats?.mean_absolute_center_offset_px || 0} px
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Offset Variance (σ²)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.2rem' }}>
                  {lane.operational_stats?.center_offset_variance || 0}
                </div>
              </div>

              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processing Latency</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7', marginTop: '0.2rem' }}>
                  {lane.operational_stats?.avg_processing_latency_ms || 0} ms
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>({lane.operational_stats?.approx_throughput_fps || 0} FPS)</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
