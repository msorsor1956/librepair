import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  active: boolean
  createdAt: string
}

const typeColors: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
}

export default function Announcements() {
  const [list, setList] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: '', message: '', type: 'info', active: true })

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/superadmin/announcements')
      setList(data.announcements || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ title: '', message: '', type: 'info', active: true })
    setShowForm(true)
  }

  const openEdit = (a: Announcement) => {
    setEditItem(a)
    setForm({ title: a.title, message: a.message, type: a.type, active: a.active })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/superadmin/announcements/${editItem.id}`, form)
      } else {
        await api.post('/superadmin/announcements', form)
      }
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`/superadmin/announcements/${id}`)
    load()
  }

  const toggleActive = async (a: Announcement) => {
    await api.patch(`/superadmin/announcements/${a.id}`, { active: !a.active })
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Announcements</h2>
        <button onClick={openCreate} style={btnPrimary}>+ New Announcement</button>
      </div>

      {showForm && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>
              {editItem ? 'Edit Announcement' : 'New Announcement'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  style={inputStyle}
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Announcement body..."
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                />
                <label htmlFor="active" style={{ fontSize: 14, color: '#475569' }}>Active (visible on site)</label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={saving} style={btnPrimary}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: 16 }}>No announcements yet.</p>
          <p style={{ fontSize: 13 }}>Create one to display a banner on the customer site.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(a => (
            <div
              key={a.id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: typeColors[a.type] || '#94a3b8',
                  marginTop: 7,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{a.title}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: typeColors[a.type] + '22',
                      color: typeColors[a.type] || '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    {a.type}
                  </span>
                  {!a.active && (
                    <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>inactive</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{a.message}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => toggleActive(a)} style={btnSmall}>
                  {a.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => openEdit(a)} style={btnSmall}>Edit</button>
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{ ...btnSmall, color: '#ef4444', borderColor: '#fecaca' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#f1f5f9',
  color: '#475569',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}
const btnSmall: React.CSSProperties = {
  padding: '6px 12px',
  background: '#f8fafc',
  color: '#475569',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
}
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
}
const modalBox: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 28,
  width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, outline: 'none',
  background: '#fff', boxSizing: 'border-box',
}
