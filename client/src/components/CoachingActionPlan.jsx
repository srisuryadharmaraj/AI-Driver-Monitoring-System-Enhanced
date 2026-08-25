import React from 'react'
import { Target, CheckCircle2, Award, ArrowRight, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react'

export default function CoachingActionPlan({ actionPlan, driverName }) {
  if (!actionPlan) return null

  const goals = actionPlan.target_goals || []
  const actions = actionPlan.action_items || []
  const modules = actionPlan.recommended_modules || []
  const status = actionPlan.plan_status || 'Target Action Plan Active'
  const targetScore = actionPlan.target_score_goal || 95

  return (
    <div className="command-panel" style={{ marginTop: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={18} color="var(--accent)" /> PERSONALIZED AI COACHING ACTION PLAN
        </h3>
        <span className="badge badge-info">{status.toUpperCase()}</span>
      </div>

      <div style={{ padding: '1.25rem 0 0 0' }}>
        {/* Target Safety Score Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.15rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.85rem 1.25rem', background: 'var(--surface)', border: '2px solid var(--safe)', borderRadius: 8, textAlign: 'center', flexShrink: 0 }}>
            <span className="telemetry-number" style={{ fontSize: '2rem', color: 'var(--safe)', lineHeight: 1 }}>{targetScore}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', letterSpacing: '0.08em', marginTop: '0.2rem' }}>TARGET SCORE</span>
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
              Action Plan for {driverName || 'Driver'}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Targeted safety interventions and defensive driving habits recommended based on monitored telemetry patterns.
            </p>
          </div>
        </div>

        {/* 3-Column Plan Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Key Safety Goals */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--safe)', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} /> Key Safety Goals
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {goals.map((g, idx) => (
                <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--safe)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Daily Practice Actions */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowRight size={16} /> Daily Practice Actions
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {actions.map((act, idx) => (
                <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(0, 102, 255, 0.2)', color: 'var(--accent-hover)', fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, fontFamily: 'var(--font-mono)' }}>
                    {idx + 1}
                  </span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Refresher Modules */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={16} /> Refresher Modules
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {modules.map((m, idx) => (
                <li key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Award size={15} color="var(--accent-violet)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
