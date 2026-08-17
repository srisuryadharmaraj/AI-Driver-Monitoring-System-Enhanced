import React from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import { useDriver } from '../context/DriverContext'
import { Award, ShieldCheck, Printer, CheckCircle2, AlertCircle, FileText } from 'lucide-react'

export default function DriverPassportPage() {
  const [searchParams] = useSearchParams()
  const driverIdParam = searchParams.get('driver_id')
  const { activeDriverId, setActiveDriverId, activeDriverDetail, loading } = useDriver()

  React.useEffect(() => {
    if (driverIdParam && driverIdParam !== activeDriverId) {
      setActiveDriverId(driverIdParam)
    }
  }, [driverIdParam])

  const driver = activeDriverDetail || {}
  const twin = driver?.digital_twin || {}
  const summary = driver?.telemetry_summary || {}

  const overallScore = Math.round(summary.avg_safety_score ?? twin.historical_safety_score ?? 88)
  const skillLevel = twin.skill_level || 'Advanced'

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="page-container printable-page">
      <div className="no-print">
        <TopBar 
          title="DRIVER SKILL PASSPORT CREDENTIAL" 
          subtitle="Verifiable Digital Performance Credential & Safety Certification"
        />

        <ActiveDriverSelector showDateFilter={true} className="mb-4" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Export / Print Passport PDF
          </button>
        </div>
      </div>

      {loading || !driver.driver_id ? (
        <div className="loading-container"><p>GENERATING VERIFIED PASSPORT CREDENTIAL...</p></div>
      ) : (
        <div className="passport-credential-card">
          <div className="passport-header">
            <div className="passport-logo-area">
              <ShieldCheck size={36} color="#3b82f6" />
              <div>
                <h2>VERIFIED DRIVER SKILL PASSPORT</h2>
                <p>AI DRIVER SAFETY & SKILL INTELLIGENCE PLATFORM</p>
              </div>
            </div>
            <div className="passport-credential-id">
              <span>CREDENTIAL ID</span>
              <strong>PASSPORT-{driver.driver_id}</strong>
            </div>
          </div>

          <div className="passport-body">
            <div className="passport-photo-col">
              <DriverAvatar driver={driver} size={90} editable={true} />
              <div className="passport-level-tag" style={{ marginTop: '0.75rem' }}>{skillLevel.toUpperCase()} DRIVER</div>
            </div>

            <div className="passport-details-col">
              <h3 className="passport-driver-name">{driver.full_name}</h3>
              <div className="passport-detail-grid">
                <div><span>Driver ID:</span> <strong>{driver.driver_id}</strong></div>
                <div><span>Licence Number:</span> <strong>{driver.licence_number}</strong></div>
                <div><span>Licence Type:</span> <strong>{driver.licence_type}</strong></div>
                <div><span>Driving Experience:</span> <strong>{driver.years_of_experience} Years</strong></div>
                <div><span>Journeys Analysed:</span> <strong>{summary.total_journeys ?? twin.total_journeys ?? 0} Sessions</strong></div>
                <div><span>Issuance Date:</span> <strong>{new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>

            <div className="passport-score-badge">
              <span className="psb-num">{overallScore}</span>
              <span className="psb-lbl">OVERALL SAFETY SCORE</span>
            </div>
          </div>

          <div className="passport-skill-matrix">
            <h4>VERIFIED SKILL SCORE BREAKDOWN</h4>
            <div className="passport-matrix-grid">
              <div className="pm-item"><span>Attention Capacity</span><strong>{Math.round(twin.attention_score || 90)}%</strong></div>
              <div className="pm-item"><span>Fatigue Control</span><strong>{Math.round(twin.fatigue_score || 85)}%</strong></div>
              <div className="pm-item"><span>Lane Discipline</span><strong>{Math.round(twin.lane_score || 88)}%</strong></div>
              <div className="pm-item"><span>Risk Control</span><strong>{Math.round(twin.risk_control_score || 89)}%</strong></div>
              <div className="pm-item"><span>Performance Consistency</span><strong>{Math.round(twin.consistency_score || 87)}%</strong></div>
            </div>
          </div>

          <div className="passport-footer">
            <div className="pf-verified">
              <CheckCircle2 size={16} color="#22c55e" />
              <span>Verified by AI Driver Behavior Monitoring Telemetry Engine v3.0</span>
            </div>
            <div className="pf-seal">OFFICIAL MCA ACADEMIC PROJECT DEMONSTRATION</div>
          </div>
        </div>
      )}
    </div>
  )
}
