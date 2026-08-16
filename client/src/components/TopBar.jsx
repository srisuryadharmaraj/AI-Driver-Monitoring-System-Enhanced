import React from 'react'
import { ShieldCheck, Activity, Cpu } from 'lucide-react'

export default function TopBar({ title, subtitle }) {
  return (
    <header className="top-bar">
      <div className="top-bar-title">
        <h1>{title || 'AI Command Center'}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="top-bar-status">
        <div className="status-chip chip-online">
          <span className="status-dot"></span>
          <Cpu size={14} />
          <span>AI ENGINE READY</span>
        </div>

        <div className="status-chip chip-telemetry">
          <Activity size={14} />
          <span>TELEMETRY ONLINE</span>
        </div>

        <div className="status-chip chip-safety">
          <ShieldCheck size={14} />
          <span>SAFETY SHIELD ACTIVE</span>
        </div>
      </div>
    </header>
  )
}
