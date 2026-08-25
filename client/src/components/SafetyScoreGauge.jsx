import React from 'react'

export default function SafetyScoreGauge({ scoreData }) {
  const score = scoreData?.score || 85
  const rating = scoreData?.rating || 'Good'
  const factors = scoreData?.factors || [
    { name: 'Attention Management', score: 22, max: 25 },
    { name: 'Lane Discipline', score: 23, max: 25 },
    { name: 'Fatigue Control', score: 20, max: 25 },
    { name: 'Risk & Speed Control', score: 20, max: 25 },
  ]

  const getGaugeColor = (val) => {
    if (val >= 90) return 'var(--safe)'
    if (val >= 80) return 'var(--accent)'
    if (val >= 70) return 'var(--warning)'
    return 'var(--danger)'
  }

  const strokeDashoffset = 440 - (440 * score) / 100

  return (
    <div className="command-panel">
      <div className="panel-header">
        <h3>EXPLAINABLE AI SAFETY SCORE BREAKDOWN</h3>
        <span className="badge badge-info">{rating.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        {/* Ring Score Gauge */}
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '0 auto' }}>
          <svg width="140" height="140" viewBox="0 0 160 160">
            <circle
              cx="80" cy="80" r="68"
              stroke="var(--bg-secondary)" strokeWidth="10" fill="transparent"
            />
            <circle
              cx="80" cy="80" r="68"
              stroke={getGaugeColor(score)}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="427"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', display: 'block', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>OVERALL SCORE</span>
          </div>
        </div>

        {/* Explainable AI Performance Modules */}
        <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {factors.map((f, i) => {
            const pct = Math.round((f.score / f.max) * 100)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{f.name.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>+{f.score} / {f.max} pts ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div 
                    style={{ 
                      width: `${pct}%`, 
                      height: '100%', 
                      background: pct >= 85 ? 'var(--safe)' : pct >= 70 ? 'var(--accent)' : 'var(--warning)', 
                      borderRadius: 3,
                      transition: 'width 0.5s ease' 
                    }} 
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
