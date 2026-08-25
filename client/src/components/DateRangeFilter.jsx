import React from 'react'
import { Calendar } from 'lucide-react'
import { useDriver } from '../context/DriverContext'

export default function DateRangeFilter({ className = '' }) {
  const { dateRange, setDateRange } = useDriver()

  const handlePreset = (preset) => {
    setDateRange(prev => ({
      ...prev,
      preset,
    }))
  }

  const handleCustomDate = (field, val) => {
    setDateRange(prev => ({
      ...prev,
      preset: 'custom',
      [field]: val,
    }))
  }

  return (
    <div className={`date-range-filter-card ${className}`}>
      <div className="date-filter-title">
        <Calendar size={15} color="#00f0ff" />
        <span>Date Range</span>
      </div>

      <div className="date-preset-pills">
        <button
          className={`preset-pill ${dateRange.preset === '7d' ? 'active' : ''}`}
          onClick={() => handlePreset('7d')}
        >
          7 Days
        </button>
        <button
          className={`preset-pill ${dateRange.preset === '30d' ? 'active' : ''}`}
          onClick={() => handlePreset('30d')}
        >
          30 Days
        </button>
        <button
          className={`preset-pill ${dateRange.preset === '90d' ? 'active' : ''}`}
          onClick={() => handlePreset('90d')}
        >
          90 Days
        </button>
        <button
          className={`preset-pill ${dateRange.preset === 'all' ? 'active' : ''}`}
          onClick={() => handlePreset('all')}
        >
          All Time
        </button>
      </div>

      <div className="custom-date-inputs">
        <label className="date-input-wrap">
          <span>From</span>
          <input
            type="date"
            value={dateRange.fromDate || ''}
            onChange={(e) => handleCustomDate('fromDate', e.target.value)}
          />
        </label>
        <label className="date-input-wrap">
          <span>To</span>
          <input
            type="date"
            value={dateRange.toDate || ''}
            onChange={(e) => handleCustomDate('toDate', e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
