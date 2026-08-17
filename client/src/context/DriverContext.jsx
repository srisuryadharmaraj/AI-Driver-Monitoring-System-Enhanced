import React, { createContext, useContext, useState, useEffect } from 'react'

const DriverContext = createContext(null)

export function DriverProvider({ children }) {
  const [drivers, setDrivers] = useState([])
  const [activeDriverId, setActiveDriverId] = useState('')
  const [activeDriverDetail, setActiveDriverDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    preset: 'all', // '7d', '30d', '90d', 'all', 'custom'
    fromDate: '',
    toDate: ''
  })

  // Helper to compute ISO dates based on preset
  const getComputedDates = (range) => {
    if (range.preset === 'custom') {
      return { start_date: range.fromDate || null, end_date: range.toDate || null }
    }
    if (range.preset === 'all') {
      return { start_date: null, end_date: null }
    }
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
    const days = daysMap[range.preset]
    if (!days) return { start_date: null, end_date: null }

    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    }
  }

  // Fetch driver list
  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setDrivers(data)
        if (!activeDriverId || !data.some(d => d.driver_id === activeDriverId)) {
          setActiveDriverId(data[0].driver_id)
        }
      }
    } catch (err) {
      console.error('[DriverContext] Failed to load drivers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  // Fetch detailed active driver telemetry whenever activeDriverId or dateRange changes
  useEffect(() => {
    if (!activeDriverId) return
    let isMounted = true

    const fetchDetail = async () => {
      try {
        const { start_date, end_date } = getComputedDates(dateRange)
        let url = `/api/drivers/${activeDriverId}`
        const params = new URLSearchParams()
        if (start_date) params.append('start_date', start_date)
        if (end_date) params.append('end_date', end_date)
        if (params.toString()) url += `?${params.toString()}`

        const res = await fetch(url)
        const data = await res.json()
        if (isMounted && data && !data.detail) {
          setActiveDriverDetail(data)
        }
      } catch (err) {
        console.error('[DriverContext] Failed to fetch active driver detail:', err)
      }
    }

    fetchDetail()
    return () => { isMounted = false }
  }, [activeDriverId, dateRange])

  // Upload local profile photo
  const uploadDriverPhoto = async (driverId, file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/drivers/${driverId}/photo`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.profile_photo) {
        setDrivers(prev => prev.map(d => d.driver_id === driverId ? { ...d, profile_photo: data.profile_photo } : d))
        if (driverId === activeDriverId) {
          setActiveDriverDetail(prev => prev ? { ...prev, profile_photo: data.profile_photo } : prev)
        }
        await fetchDrivers()
        return { success: true, photoUrl: data.profile_photo }
      }
      return { success: false, error: data.detail || 'Upload failed' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const activeDriver = drivers.find(d => d.driver_id === activeDriverId) || drivers[0] || null

  return (
    <DriverContext.Provider
      value={{
        drivers,
        activeDriverId,
        setActiveDriverId,
        activeDriver,
        activeDriverDetail,
        loading,
        dateRange,
        setDateRange,
        uploadDriverPhoto,
        refreshDrivers: fetchDrivers
      }}
    >
      {children}
    </DriverContext.Provider>
  )
}

export function useDriver() {
  const context = useContext(DriverContext)
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider')
  }
  return context
}
