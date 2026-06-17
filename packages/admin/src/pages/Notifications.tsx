import { useState } from 'react'
import { api } from '../lib/api'

export default function Notifications() {
  const [form, setForm] = useState({
    target: 'all',
    role: '',
    userId: '',
    title: '',
    message: '',
    type: 'info',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const payload: Record<string, string> = {
        title: form.title,
        message: form.message,
        type: form.type,
        target: form.target,
      }
      if (form.target === 'role') payload.role = form.role
      if (form.target === 'user') payload.userId = form.userId

      const res = await api.post('/superadmin/notify', payload)
      setResult({ success: true, message: `Sent to ${res.sent ?? 0} user(s).` })
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Failed to send notification.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>
        Send Notification
      </h2>

      {result && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 8,
            background: result.success ? '#dcfce7' : '#fee2e2',
            color: result.success ? '#166534' : '#991b1b',
            fontSize: 14,
          }}
        >
          {result.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Target</label>
          <select
            value={form.target}
            onChange={e => setForm({ ...form, target: e.target.value })}
            style={inputStyle}
          >
            <option value="all">All Users</option>
            <option value="role">By Role</option>
            <option value="user">Specific User</option>
          </select>
        </div>

        {form.target === 'role' && (
          <div>
            <label style={labelStyle}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={inputStyle}
            >
              <option value="">Select role</option>
              <option value="customer">Customer</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}

        {form.target === 'user' && (
          <div>
            <label style={labelStyle}>User ID</label>
            <input
              value={form.userId}
              onChange={e => setForm({ ...form, userId: e.target.value })}
              placeholder="Enter user ID"
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>Type</label>
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            style={inputStyle}
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Title</label>
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Notification title"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="Your message..."
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#94a3b8' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
}
