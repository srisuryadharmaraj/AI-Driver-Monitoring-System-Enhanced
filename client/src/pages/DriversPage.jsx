import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import DriverCard from '../components/DriverCard'
import { Plus, Search, UserPlus, X, CheckCircle } from 'lucide-react'

export default function DriversPage() {
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
  })
  const [msg, setMsg] = useState('')

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
          })
          fetchDrivers()
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
        title="DRIVER MANAGEMENT & INTELLIGENCE" 
        subtitle="Manage fleet driver profiles, licence telemetry, and driver skill credentials"
      />

      {msg && (
        <div className="alert-banner" style={{ color: '#22c55e', borderColor: '#22c55e', background: 'rgba(34,197,94,0.1)' }}>
          <CheckCircle size={18} />
          <span>{msg}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setMsg('')}><X size={16} /></button>
        </div>
      )}

      <div className="toolbar-row">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search by driver name, ID, or licence number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} />
          Add New Driver
        </button>
      </div>

      <div className="driver-cards-grid">
        {filtered.map(drv => (
          <DriverCard key={drv.driver_id} driver={drv} />
        ))}
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Driver Profile</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddDriver} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="e.g. Suresh Patel" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" min={18} max={75} value={formData.age} onChange={e => setFormData({ ...formData, age: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input type="number" min={0} max={50} value={formData.years_of_experience} onChange={e => setFormData({ ...formData, years_of_experience: +e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="suresh@fleetai.in" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Licence Number *</label>
                  <input required type="text" value={formData.licence_number} onChange={e => setFormData({ ...formData, licence_number: e.target.value })} placeholder="DL-1420230012345" />
                </div>
                <div className="form-group">
                  <label>Licence Type</label>
                  <input type="text" value={formData.licence_type} onChange={e => setFormData({ ...formData, licence_type: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Driver Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
