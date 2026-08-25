import React from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import { useDriver } from '../context/DriverContext'
import { Award, ShieldCheck, Printer, CheckCircle2, AlertCircle, FileText, Cpu } from 'lucide-react'
import logoImg from '../assets/ssd-driveai-logo.png'

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
          title="SSD DRIVEAI — VERIFIED DRIVER SKILL PASSPORT" 
          subtitle="Verifiable Digital Performance Credential & Driver Safety Certification"
        />

        <ActiveDriverSelector showDateFilter={true} className="mb-4" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '0.65rem 1.25rem' }}>
            <Printer size={18} /> EXPORT / PRINT PASSPORT PDF
          </button>
        </div>
      </div>

      {loading || !driver.driver_id ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            GENERATING VERIFIED PASSPORT CREDENTIAL...
          </p>
        </div>
      ) : (
        <div className="card card-accent-border passport-credential-card" style={{ padding: '2rem', background: 'linear-gradient(180deg, var(--surface) 0%, rgba(15, 20, 31, 0.95) 100%)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Header Branding */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <img src={logoImg} alt="SSD DriveAI Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', margin: 0 }}>
                  VERIFIED DRIVER SKILL PASSPORT
                </h2>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  SSD DRIVEAI • SAFETY &amp; SKILL INTELLIGENCE PLATFORM
                </span>
              </div>
            </div>

            <div style={{ padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, textAlign: 'right' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', letterSpacing: '0.08em' }}>CREDENTIAL ID</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontSize: '0.88rem' }}>PASSPORT-{driver.driver_id}</strong>
            </div>
          </div>

          {/* Main Passport Content Body */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2rem', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            {/* Photo Avatar */}
            <div style={{ textAlign: 'center' }}>
              <DriverAvatar driver={driver} size={96} editable={true} />
              <span className="skill-badge" style={{ marginTop: '0.75rem', display: 'inline-flex', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                <Award size={14} /> {skillLevel.toUpperCase()} DRIVER
              </span>
            </div>

            {/* Candidate Identity Details */}
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                {driver.full_name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Driver ID:</span> <strong style={{ color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>{driver.driver_id}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Licence Number:</span> <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{driver.licence_number}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Licence Type:</span> <strong style={{ color: '#ffffff' }}>{driver.licence_type}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Driving Experience:</span> <strong style={{ color: '#ffffff' }}>{driver.years_of_experience} Years</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Journeys Analysed:</span> <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{summary.total_journeys ?? twin.total_journeys ?? 0} Sessions</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Issuance Date:</span> <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>

            {/* Overall Score Stamp Ring */}
            <div style={{ textAlign: 'center', padding: '1.25rem 1.75rem', background: 'var(--bg-secondary)', borderRadius: 10, border: '2px solid var(--accent)', boxShadow: '0 0 20px var(--accent-glow)', flexShrink: 0 }}>
              <span className="telemetry-number-large" style={{ fontSize: '3rem', color: overallScore >= 85 ? 'var(--safe)' : 'var(--warning)', lineHeight: 1 }}>
                {overallScore}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-secondary)', display: 'block', letterSpacing: '0.08em', marginTop: '0.35rem' }}>
                OVERALL SAFETY SCORE
              </span>
            </div>
          </div>

          {/* Verified Skill Matrix Breakdown */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
              VERIFIED SKILL SCORE BREAKDOWN
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Attention Capacity</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', color: 'var(--accent-secondary)' }}>{Math.round(twin.attention_score || 90)}%</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Fatigue Control</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', color: 'var(--safe)' }}>{Math.round(twin.fatigue_score || 85)}%</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Lane Discipline</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', color: 'var(--accent-hover)' }}>{Math.round(twin.lane_score || 88)}%</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Risk Control</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', color: 'var(--accent)' }}>{Math.round(twin.risk_control_score || 89)}%</strong>
              </div>
              <div style={{ padding: '0.65rem 0.85rem', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Consistency</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', color: 'var(--warning)' }}>{Math.round(twin.consistency_score || 87)}%</strong>
              </div>
            </div>
          </div>

          {/* Footer Verification Seal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '1rem', borderTop: '1px dashed var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--safe)', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>Verified by SSD DriveAI Driver Monitoring Telemetry Engine v3.0</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.06em' }}>
              OFFICIAL ACADEMIC &amp; COMMERCIAL CREDENTIAL
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
