import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface Appointment {
  id: string
  userId: string
  userEmail?: string
  userName?: string
  deviceType: string
  issueDescription: string
  status: string
  scheduledAt: string
  createdAt: string
  technicianId?: string
  technicianName?: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#fef9c3', text: '#854d0e' },
  confirmed:  { bg: '#dbeafe', text: '#1d4ed8' },
  in_progress:{ bg: '#ede9fe', text: '#6d28d9' },
  completed:  { bg: '#dcfce7', text: '#166534' },
  cancelled:  { bg: '#fee2e2', text: '#991b1b' },
}

export default function Appointments() {
  const [list, setList] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (filter !== 'all') params.set('status', filter)
      const data = await api.get(`/superadmin/appointments?${params}`)
      setList(data.appointments || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/superadmin/appointments/${id}`, { status })
    load()
  }

  const filtered = list.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (a.userEmail || '').toLowerCase().includes(q) ||
      (a.userName || '').toLowerCase().includes(q) ||
      a.deviceType.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
          Appointments
          <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', marginLeft: 10 }}>
            ({filtered.length})
          </span>
        </h2>
        <button onClick={load} style={btnRefresh}>↻ Refresh</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by email, name, device..."
          style={{
            flex: 1, minWidth: 200, padding: '9px 12px',
            border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
          }}
        />
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1) }}
          style={{
            padding: '9px 12px', border: '1px solid #e2e8f0',
            borderRadius: 8, fontSize: 14, background: '#fff',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      ) : paged.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: 16 }}>No appointments found.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Customer', 'Device', 'Issue', 'Scheduled', 'Status', 'Actions'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(a => {
                  const sc = statusColors[a.status] || { bg: '#f1f5f9', text: '#475569' }
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {a.userName || 'N/A'}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.userEmail}</div>
                      </td>
                      <td style={td}>{a.deviceType}</td>
                      <td style={{ ...td, maxWidth: 200 }}>
                        <div style={{
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', color: '#475569',
                        }}>
                          {a.issueDescription}
                        </div>
                      </td>
                      <td style={td}>
                        {a.scheduledAt
                          ? new Date(a.scheduledAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td style={td}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 12,
                          fontWeight: 600, background: sc.bg, color: sc.text,
                        }}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={td}>
                        <select
                          value={a.status}
                          onChange={e => updateStatus(a.id, e.target.value)}
                          style={{
                            padding: '5px 8px', borderRadius: 6,
                            border: '1px solid #e2e8f0', fontSize: 12,
                            background: '#fff', cursor: 'pointer',
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pageBtn}
              >
                ←
              </button>
              <span style={{ fontSize: 14, color: '#475569', padding: '6px 12px' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={pageBtn}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 12,
  fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const td: React.CSSProperties = {
  padding: '12px 14px', color: '#334155', verticalAlign: 'middle',
}
const btnRefresh: React.CSSProperties = {
  padding: '8px 16px', background: '#f1f5f9', color: '#475569',
  border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: 'pointer',
}
const pageBtn: React.CSSProperties = {
  padding: '6px 14px', background: '#f1f5f9', color: '#475569',
  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, cursor: 'pointer',
}
