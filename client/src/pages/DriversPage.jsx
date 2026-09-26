import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import DriverCard from '../components/DriverCard'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import { useDriver } from '../context/DriverContext'
import { Plus, Search, UserPlus, X, CheckCircle, Users } from 'lucide-react'

export default function DriversPage() {
  const { drivers: contextDrivers, refreshDrivers } = useDriver()
  const [drivers, setDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    age: 30,
    phone: '',
    email: '',
    licence_number: '',
    licence_type: 'Commercial (LMV)',
    years_of_experience: 5,
    availability: 'Available'
  })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (contextDrivers && contextDrivers.length > 0) {
      setDrivers(contextDrivers)
    }
  }, [contextDrivers])

  const fetchDrivers = () => {
    fetch('/api/drivers')
      .then(r => r.json())
      .then(data => setDrivers(data || []))
      .catch(() => {})
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleAddDriver = (e) => {
    e.preventDefault()
    fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(r => r.json())
      .then(res => {
        if (res.driver_id) {
          setMsg('Driver added successfully!')
          setShowModal(false)
          setFormData({
            full_name: '',
            age: 30,
            phone: '',
            email: '',
            licence_number: '',
            licence_type: 'Commercial (LMV)',
            years_of_experience: 5,
            availability: 'Available'
          })
          fetchDrivers()
          if (refreshDrivers) refreshDrivers()
        } else {
          setMsg(res.detail || 'Error adding driver')
        }
      })
  }

  const filtered = drivers.filter(d => 
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.driver_id?.toLowerCase().includes(search.toLowerCase()) ||
    d.licence_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — DRIVER INTELLIGENCE REGISTRY" 
        subtitle="Verified Fleet Driver Credentials, Performance Telemetry & Licence Registry"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {msg && (
        <div className="card card-safe mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem' }}>
          <CheckCircle size={18} color="var(--safe)" />
          <span style={{ color: 'var(--safe)', fontWeight: 700 }}>{msg}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setMsg('')}><X size={16} /></button>
        </div>
      )}

      {/* Toolbar Search & Add Action */}
      <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 260 }}>
          <Search size={18} color="var(--accent-secondary)" />
          <input 
            type="text" 
            placeholder="Search driver by name, driver ID, or licence number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} />
          ADD NEW DRIVER PROFILE
        </button>
      </div>

      <div className="section-header-row">
        <h2 className="section-title">FLEET DRIVER CREDENTIAL ROSTER ({filtered.length})</h2>
      </div>

      <div className="driver-cards-grid">
        {filtered.map(drv => (
          <DriverCard key={drv.driver_id} driver={drv} />
        ))}
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content card" style={{ maxWidth: 560, width: '100%', background: 'var(--surface)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>ADD NEW DRIVER PROFILE</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>FULL NAME *</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="e.g. Suresh Patel" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>AGE</label>
                  <input type="number" min={18} max={75} value={formData.age} onChange={e => setFormData({ ...formData, age: +e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>EXPERIENCE (YEARS)</label>
                  <input type="number" min={0} max={50} value={formData.years_of_experience} onChange={e => setFormData({ ...formData, years_of_experience: +e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>PHONE NUMBER *</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>EMAIL *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="suresh@fleetai.in" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>LICENCE NUMBER *</label>
                  <input required type="text" value={formData.licence_number} onChange={e => setFormData({ ...formData, licence_number: e.target.value })} placeholder="DL-1420230012345" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>AVAILABILITY STATUS</label>
                  <select value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} style={{ width: '100%', height: 38, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, color: '#fff', padding: '0 0.5rem' }}>
                    <option value="Available">🟢 Available</option>
                    <option value="Busy">🔴 Busy</option>
                    <option value="On Leave">🟡 On Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Driver Credential</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
