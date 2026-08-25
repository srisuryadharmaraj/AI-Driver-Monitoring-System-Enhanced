import React from 'react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts'

export default function SkillRadarChart({ twin }) {
  const data = [
    { subject: 'Attention', value: Math.round(twin?.attention_score || 85), fullMark: 100 },
    { subject: 'Fatigue Mgmt', value: Math.round(twin?.fatigue_score || 85), fullMark: 100 },
    { subject: 'Lane Discipline', value: Math.round(twin?.lane_score || 85), fullMark: 100 },
    { subject: 'Risk Control', value: Math.round(twin?.risk_control_score || 85), fullMark: 100 },
    { subject: 'Consistency', value: Math.round(twin?.consistency_score || 85), fullMark: 100 },
  ]

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          <PolarAngleAxis dataKey="subject" stroke="#8c9ba8" tick={{ fontSize: 11, fill: '#8c9ba8', fontFamily: 'var(--font-mono)' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#3b4856" tick={false} />
          <Radar
            name="Driver Skill Matrix"
            dataKey="value"
            stroke="#00f0ff"
            fill="#0066ff"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
