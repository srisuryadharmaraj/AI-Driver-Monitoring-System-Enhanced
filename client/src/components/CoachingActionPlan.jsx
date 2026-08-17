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
    <div className="command-panel action-plan-card" style={{ marginTop: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>
          <Target size={18} color="#3b82f6" /> PERSONALIZED AI COACHING ACTION PLAN
        </h3>
        <span className="action-plan-status-badge">{status}</span>
      </div>

      <div className="action-plan-body">
        {/* Header Metric */}
        <div className="action-plan-hero">
          <div className="hero-target-box">
            <span className="target-num">{targetScore}/100</span>
            <span className="target-lbl">TARGET SAFETY GOAL</span>
          </div>
          <div className="hero-desc">
            <h4>Action Plan for {driverName || 'Driver'}</h4>
            <p>Targeted safety interventions and defensive driving habits recommended based on monitored telemetry patterns.</p>
          </div>
        </div>

        <div className="action-plan-grid">
          {/* Target Goals Column */}
          <div className="plan-col">
            <h4 className="col-title">
              <ShieldCheck size={16} color="#22c55e" /> Key Safety Goals
            </h4>
            <ul className="plan-list">
              {goals.map((g, idx) => (
                <li key={idx} className="plan-item">
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Items Column */}
          <div className="plan-col">
            <h4 className="col-title">
              <ArrowRight size={16} color="#3b82f6" /> Daily Practice Actions
            </h4>
            <ul className="plan-list">
              {actions.map((act, idx) => (
                <li key={idx} className="plan-item">
                  <div className="action-step-num">{idx + 1}</div>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Training Modules Column */}
          <div className="plan-col">
            <h4 className="col-title">
              <BookOpen size={16} color="#8b5cf6" /> Recommended Refresher Modules
            </h4>
            <ul className="plan-list">
              {modules.map((m, idx) => (
                <li key={idx} className="plan-item module-item">
                  <Award size={15} color="#8b5cf6" />
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
