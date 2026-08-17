import React, { useState, useEffect } from 'react'
import { Camera, User } from 'lucide-react'
import { useDriver } from '../context/DriverContext'

export default function DriverAvatar({ driver, size = 64, editable = true, className = '' }) {
  const { uploadDriverPhoto } = useDriver()
  const [imgError, setImgError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)

  const photoUrl = driver?.profile_photo

  // Reset imgError whenever photoUrl changes
  useEffect(() => {
    setImgError(false)
  }, [photoUrl])

  // Format photo URL with cache buster for local uploaded photos
  const getDisplayPhotoUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('/uploads')) {
      return `${url}?t=${driver?.updated_at || Date.now()}`
    }
    return url
  }

  const displayPhotoUrl = getDisplayPhotoUrl(photoUrl)
  const driverName = driver?.full_name || 'Driver'
  const initials = driverName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !driver?.driver_id) return

    setUploading(true)
    setMsg(null)

    const res = await uploadDriverPhoto(driver.driver_id, file)
    setUploading(false)

    if (res.success) {
      setImgError(false)
      setMsg({ type: 'success', text: 'Photo updated' })
      setTimeout(() => setMsg(null), 3000)
    } else {
      setMsg({ type: 'error', text: res.error || 'Failed' })
      setTimeout(() => setMsg(null), 3000)
    }
  }

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    objectFit: 'cover',
  }

  return (
    <div className={`driver-avatar-wrapper ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
      {displayPhotoUrl && !imgError ? (
        <img
          src={displayPhotoUrl}
          alt={driverName}
          style={avatarStyle}
          onError={() => setImgError(true)}
          className="driver-avatar-img"
        />
      ) : (
        <div
          className="driver-avatar-placeholder"
          style={{
            ...avatarStyle,
            background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: `${Math.max(12, size * 0.35)}px`,
            border: '2px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)',
          }}
        >
          {initials || <User size={size * 0.5} />}
        </div>
      )}

      {editable && (
        <label
          className="driver-avatar-upload-btn"
          title="Upload Local Driver Photo"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: `${Math.max(22, size * 0.32)}px`,
            height: `${Math.max(22, size * 0.32)}px`,
            borderRadius: '50%',
            background: '#3b82f6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid #0f172a',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            transition: 'transform 0.2s ease, background 0.2s ease',
          }}
        >
          {uploading ? (
            <span className="spinner" style={{ width: '10px', height: '10px', borderWidth: '2px' }} />
          ) : (
            <Camera size={Math.max(11, size * 0.18)} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      )}

      {msg && (
        <div
          className={`avatar-toast ${msg.type}`}
          style={{
            position: 'absolute',
            top: '-25px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            background: msg.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff',
            zIndex: 10,
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  )
}
