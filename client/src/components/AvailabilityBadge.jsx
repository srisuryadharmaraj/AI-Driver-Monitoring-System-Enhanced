import React from 'react'

export default function AvailabilityBadge({ status = 'Available', style = {} }) {
  const s = status || 'Available'
  let icon = '🟢'
  let textColor = '#00e676'
  let bg = 'rgba(0, 230, 118, 0.12)'
  let border = 'rgba(0, 230, 118, 0.3)'

  if (s === 'Busy') {
    icon = '🔴'
    textColor = '#ff5252'
    bg = 'rgba(255, 82, 82, 0.12)'
    border = 'rgba(255, 82, 82, 0.3)'
  } else if (s === 'On Leave') {
    icon = '🟡'
    textColor = '#ffd600'
    bg = 'rgba(255, 214, 0, 0.12)'
    border = 'rgba(255, 214, 0, 0.3)'
  }

  return (
    <span 
      className="availability-badge" 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: textColor,
        background: bg,
        border: `1px solid ${border}`,
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{icon}</span>
      <span>{s}</span>
    </span>
  )
}
