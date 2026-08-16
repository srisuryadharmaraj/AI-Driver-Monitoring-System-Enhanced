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
    if (val >= 90) return '#22c55e'
    if (val >= 80) return '#3b82f6'
    if (val >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const strokeDashoffset = 440 - (440 * score) / 100

  return (
    <div className="safety-score-gauge-card">
      <div className="gauge-main-section">
        <svg className="score-ring-svg" width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80" cy="80" r="70"
            className="ring-bg"
            stroke="#1e293b" strokeWidth="12" fill="transparent"
          />
          <circle
            cx="80" cy="80" r="70"
            className="ring-fill"
            stroke={getGaugeColor(score)}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="gauge-center-text">
          <span className="big-score">{score}</span>
          <span className="max-score">/ 100</span>
          <span className="rating-tag" style={{ color: getGaugeColor(score) }}>{rating}</span>
        </div>
      </div>

      <div className="gauge-factors-section">
        <h4>WHY THIS SCORE? (EXPLAINABLE AI BREAKDOWN)</h4>
        <div className="factors-grid">
          {factors.map((f, i) => (
            <div key={i} className="factor-row">
              <div className="factor-info">
                <span>{f.name}</span>
                <span className="factor-score">+{f.score} / {f.max} pts</span>
              </div>
              <div className="factor-bar-track">
                <div 
                  className="factor-bar-fill"
                  style={{ width: `${(f.score / f.max) * 100}%`, background: getGaugeColor(score) }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
