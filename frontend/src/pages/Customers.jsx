import { useEffect, useState } from 'react'
import api from '../lib/api'
import { getUser } from '../lib/auth'

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`

/* ─── Extend Due Date Modal ─── */
function ExtendDueDateModal({ order, onClose, onSuccess }) {
  const [newDate, setNewDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExtend = async () => {
    if (!newDate) return setError('Please select a new date')
    setLoading(true); setError('')
    try {
      await api.post('/credit-payments/extend-due-date', { order_id: order.id, new_due_date: newDate })
      onSuccess('Due date extended successfully!')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to extend due date')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Extend Due Date</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-200">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Current Due Date: <span className="font-bold">{order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A'}</span></p>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Due Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50 focus:bg-white"
              value={newDate} onChange={e => setNewDate(e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
          <button onClick={handleExtend} disabled={loading} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700">
            {loading ? 'Saving...' : 'Save Date'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Payment Modal ─── */
function PaymentModal({ order, onClose, onSuccess }) {
  const [amount, setAmount]   = useState('')
  const [note,   setNote]     = useState('')
  const [error,  setError]    = useState('')
  const [loading, setLoading] = useState(false)
  const remaining = Number(order.remaining_amount)

  const handlePay = async () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return setError('Enter a valid amount')
    if (amt > remaining)  return setError(`Cannot exceed remaining balance of ${fmt(remaining)}`)
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/credit-payments', { order_id: order.id, amount: amt, note })
      onSuccess(data.message)
    } catch (e) {
      setError(e?.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800">Record Payment</h2>
            <p className="text-xs text-gray-500">Order #{order.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-red-800">Outstanding Balance</span>
            <span className="text-xl font-black text-red-700">{fmt(remaining)}</span>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Amount <span className="text-red-500">*</span></label>
            <input
              type="number" min="0.01" max={remaining} step="0.01"
              placeholder={`Max: ${fmt(remaining)}`}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50 focus:bg-white transition"
              value={amount} onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text" placeholder="E.g. Cash payment"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none bg-gray-50 focus:bg-white transition"
              value={note} onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
          <button onClick={handlePay} disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
            {loading ? 'Saving...' : '💳 Save Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Customer Detail Modal ─── */
function CustomerDetailModal({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [payingOrder, setPayingOrder] = useState(null)
  const [extendingOrder, setExtendingOrder] = useState(null)
  const [successMsg, setSuccessMsg]   = useState('')
  const user = getUser()

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/customers/${customerId}`)
      setCustomer(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [customerId])

  const handleSuccess = (msg) => {
    setPayingOrder(null)
    setExtendingOrder(null)
    setSuccessMsg(msg)
    load()
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const creditBadge = (cs) => {
    const map = { CASH: 'bg-gray-100 text-gray-600', PARTIAL: 'bg-amber-100 text-amber-700', UNPAID: 'bg-red-100 text-red-700', PAID: 'bg-green-100 text-green-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[cs] || 'bg-gray-100 text-gray-600'}`}>{cs}</span>
  }

  const isOverdue = (dueDate, status) => {
    if (status === 'PAID' || status === 'CASH' || !dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Customer Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Loading...</div>}

          {!loading && customer && (
            <>
              {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl font-medium">✅ {successMsg}</div>}

              {/* Customer info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-2xl">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{customer.name}</p>
                  <p className="text-sm text-gray-500">📞 {customer.phone}</p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Orders</p>
                  <p className="text-xl font-black text-gray-800">{customer.orders.length}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-700 uppercase font-semibold mb-1">Total Paid</p>
                  <p className="text-lg font-black text-green-700">{fmt(customer.orders.reduce((s,o) => s + Number(o.paid_amount),0))}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-700 uppercase font-semibold mb-1">Outstanding</p>
                  <p className="text-lg font-black text-red-700">{fmt(customer.orders.reduce((s,o) => s + Number(o.remaining_amount),0))}</p>
                </div>
              </div>

              {/* Orders list */}
              <div>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Order History</h3>
                <div className="space-y-3">
                  {customer.orders.map(o => {
                    const overdue = isOverdue(o.due_date, o.credit_status);
                    return (
                    <div key={o.id} className={`bg-white border rounded-xl p-4 hover:shadow-sm transition ${overdue ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-gray-700">Order #{o.id}</span>
                          <span className="text-xs text-gray-400 ml-2">{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          {overdue && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">OVERDUE</span>}
                          {creditBadge(o.credit_status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-xs mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div><span className="text-gray-400 block mb-0.5">Total</span><span className="font-semibold">{fmt(o.total_amount)}</span></div>
                        <div><span className="text-gray-400 block mb-0.5">Paid</span><span className="font-semibold text-green-600">{fmt(o.paid_amount)}</span></div>
                        <div><span className="text-gray-400 block mb-0.5">Remaining</span><span className={`font-bold ${Number(o.remaining_amount) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{Number(o.remaining_amount) > 0 ? fmt(o.remaining_amount) : '—'}</span></div>
                        <div><span className="text-gray-400 block mb-0.5">Due Date</span><span className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-700'}`}>{o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}</span></div>
                      </div>
                      
                      {(o.credit_status === 'PARTIAL' || o.credit_status === 'UNPAID') && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => setPayingOrder(o)} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                            + Record Payment
                          </button>
                          {user?.role === 'admin' && (
                            <button onClick={() => setExtendingOrder(o)} className="px-3 bg-purple-100 text-purple-700 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-200 transition">
                              Extend Date
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )})}
                  {customer.orders.length === 0 && (
                    <p className="text-center text-gray-400 py-6">No orders found for this customer.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {payingOrder && <PaymentModal order={payingOrder} onClose={() => setPayingOrder(null)} onSuccess={handleSuccess} />}
      {extendingOrder && <ExtendDueDateModal order={extendingOrder} onClose={() => setExtendingOrder(null)} onSuccess={handleSuccess} />}
    </div>
  )
}

/* ─── Main Customers Page ─── */
export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch]       = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/customers')
      setCustomers(data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  const totalOutstanding = customers.reduce((s, c) => s + Number(c.total_remaining), 0)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Credit Customers</h1>
        <button onClick={load} className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100">{error}</div>}

      {/* Summary Banner */}
      {totalOutstanding > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-5 rounded-xl shadow-md flex justify-between items-center">
          <div>
            <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Total Outstanding Balance</p>
            <p className="text-3xl font-black mt-1">{fmt(totalOutstanding)}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">🔴</div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-400 outline-none transition"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-500 uppercase tracking-wider text-xs">
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Phone</th>
              <th className="px-6 py-4 font-semibold text-center">Orders</th>
              <th className="px-6 py-4 font-semibold text-right">Total Billed</th>
              <th className="px-6 py-4 font-semibold text-right">Total Paid</th>
              <th className="px-6 py-4 font-semibold text-right">Outstanding</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-14 text-center text-gray-400 animate-pulse">Loading customers...</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-blue-50/50 hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-200 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">📞 {c.phone}</td>
                <td className="px-6 py-4 text-center"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">{c.total_orders}</span></td>
                <td className="px-6 py-4 text-right font-medium">{fmt(c.total_billed)}</td>
                <td className="px-6 py-4 text-right text-green-600 font-medium">{fmt(c.total_paid)}</td>
                <td className="px-6 py-4 text-right">
                  {Number(c.total_remaining) > 0 ? <span className="font-black text-red-600">{fmt(c.total_remaining)}</span> : <span className="text-gray-300 font-medium">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedId(c.id)} className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    View Account
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan="7" className="px-6 py-14 text-center text-gray-400">
                {search ? 'No customers match your search.' : 'No credit customers yet.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && <CustomerDetailModal customerId={selectedId} onClose={() => { setSelectedId(null); load() }} />}
    </div>
  )
}
