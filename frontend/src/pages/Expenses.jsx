import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'
import { getUser } from '../lib/auth'

const CATEGORIES = ['Rent', 'Salary', 'Utilities', 'Transport', 'Fuel', 'Office Supplies', 'Maintenance', 'Tax', 'Other']
const PAYMENT_METHODS = ['Cash', 'Bank', 'Mobile Money']

const CATEGORY_COLORS = {
  Rent: '#6366f1', Salary: '#8b5cf6', Utilities: '#3b82f6', Transport: '#06b6d4',
  Fuel: '#f59e0b', 'Office Supplies': '#10b981', Maintenance: '#ef4444', Tax: '#f97316', Other: '#6b7280'
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Receipt Preview Modal ────────────────────────────────────────────────────
function ReceiptModal({ url, onClose }) {
  const isPdf = url?.toLowerCase().endsWith('.pdf')
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Receipt Preview</h3>
          <div className="flex items-center gap-2">
            <a href={`${API_BASE}${url}`} download className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </a>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50">
          {isPdf
            ? <iframe src={`${API_BASE}${url}`} className="w-full" style={{ height: '60vh' }} title="Receipt PDF" />
            : <img src={`${API_BASE}${url}`} alt="Receipt" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
          }
        </div>
      </div>
    </div>
  )
}

// ─── Expense Form Modal ───────────────────────────────────────────────────────
function ExpenseModal({ expense, onClose, onSaved }) {
  const isEdit = !!expense
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    title: expense?.title || '',
    category: expense?.category || CATEGORIES[0],
    amount: expense?.amount || '',
    payment_method: expense?.payment_method || PAYMENT_METHODS[0],
    expense_date: expense?.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
    description: expense?.description || '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(expense?.receipt_path ? `${API_BASE}${expense.receipt_path}` : null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(f.type)) { setError('Invalid file type. Use JPG, PNG, WEBP, or PDF.'); return }
    if (f.size > 5 * 1024 * 1024) { setError('File too large. Max 5 MB.'); return }
    setFile(f)
    setError('')
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
    else setPreview('pdf')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.category || !form.amount || !form.payment_method || !form.expense_date) {
      setError('All required fields must be filled.'); return
    }
    if (!isEdit && !file) { setError('Receipt upload is required.'); return }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (file) fd.append('receipt', file)

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/expenses/${expense.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{isEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" /></svg>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              placeholder="e.g. Monthly Rent" required />
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) <span className="text-red-500">*</span></label>
              <input type="number" min="0.01" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="0.00" required />
            </div>
          </div>

          {/* Payment Method + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method <span className="text-red-500">*</span></label>
              <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" required />
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / Supporting Document {!isEdit && <span className="text-red-500">*</span>}</label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [f] } }) } }}
            >
              {preview ? (
                preview === 'pdf'
                  ? <div className="flex flex-col items-center gap-2 text-gray-600">
                      <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                      <p className="text-sm">{file?.name || 'PDF file selected'}</p>
                      <p className="text-xs text-gray-400">Click to replace</p>
                    </div>
                  : <div className="flex flex-col items-center gap-2">
                      <img src={preview} alt="Receipt preview" className="max-h-32 rounded-lg object-contain mx-auto" />
                      <p className="text-xs text-gray-400">Click to replace</p>
                    </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 py-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-sm font-medium text-gray-600">Click or drag to upload receipt</p>
                  <p className="text-xs">JPG, PNG, WEBP, PDF · Max 5 MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFile} className="hidden" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 text-xs">(optional)</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              placeholder="Additional notes about this expense..." />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>}
              {saving ? 'Saving...' : isEdit ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ expense, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/expenses/${expense.id}`)
      onDeleted()
      onClose()
    } catch {
      setDeleting(false)
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Expense?</h3>
        <p className="text-sm text-gray-500 mb-6">This will permanently delete <strong>"{expense.title}"</strong> and its receipt. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-60">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Expenses Page ───────────────────────────────────────────────────────
export default function Expenses() {
  const user = getUser()
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [deleteExpense, setDeleteExpense] = useState(null)
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [filters, setFilters] = useState({ category: '', payment_method: '', from: '', to: '' })
  const [search, setSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.payment_method) params.append('payment_method', filters.payment_method)
      if (filters.from) params.append('from', filters.from)
      if (filters.to) params.append('to', filters.to)

      const [expRes, sumRes] = await Promise.all([
        api.get(`/expenses?${params}`),
        api.get('/expenses/summary'),
      ])
      setExpenses(expRes.data)
      setSummary(sumRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filters])

  const filtered = expenses.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.recorded_by_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all business expenses</p>
        </div>
        <button
          onClick={() => { setEditExpense(null); setShowForm(true) }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 text-sm shadow-md shadow-violet-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Today', value: summary.today, color: 'from-blue-500 to-blue-600' },
            { label: 'This Week', value: summary.week, color: 'from-violet-500 to-violet-600' },
            { label: 'This Month', value: summary.month, color: 'from-indigo-500 to-indigo-600' },
            { label: 'This Year', value: summary.year, color: 'from-rose-500 to-rose-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-md`}>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-bold">{formatCurrency(value)}</p>
              <p className="text-white/60 text-xs mt-0.5">$</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input
            type="text" placeholder="Search expenses..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="col-span-2 md:col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.payment_method} onChange={e => setFilters(f => ({ ...f, payment_method: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700">
            <option value="">All Payment Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700" />
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-700" />
        </div>
        {(filters.category || filters.payment_method || filters.from || filters.to) && (
          <button onClick={() => setFilters({ category: '', payment_method: '', from: '', to: '' })}
            className="mt-3 text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="font-semibold text-gray-800">Expenses</h2>
            <p className="text-xs text-gray-400">{filtered.length} records · Total: <span className="font-semibold text-gray-700">$ {formatCurrency(totalFiltered)}</span></p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 animate-pulse">Loading expenses...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-4m-5 4l3-3m0 0l3 3m-3-3v8" /></svg>
            </div>
            <p className="text-gray-500 font-medium">No expenses found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first expense to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">Title</th>
                  <th className="px-6 py-3 text-left font-semibold">Category</th>
                  <th className="px-6 py-3 text-left font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold">Payment</th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Recorded By</th>
                  <th className="px-6 py-3 text-left font-semibold">Receipt</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800 max-w-[160px] truncate">{exp.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ background: CATEGORY_COLORS[exp.category] || '#6b7280' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(exp.amount)}</td>
                    <td className="px-6 py-4 text-gray-600">{exp.payment_method}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                    <td className="px-6 py-4 text-gray-500">{exp.recorded_by_name || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setReceiptUrl(exp.receipt_path)}
                        className="text-violet-600 hover:text-violet-800 flex items-center gap-1 text-xs font-medium hover:underline">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditExpense(exp); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => setDeleteExpense(exp)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* By Category breakdown */}
      {summary?.byCategory?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Expenses by Category (All Time)</h3>
          <div className="space-y-3">
            {summary.byCategory.map(({ category, total }) => {
              const maxVal = Math.max(...summary.byCategory.map(b => Number(b.total)))
              const pct = maxVal > 0 ? (Number(total) / maxVal) * 100 : 0
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-gray-600 font-medium truncate flex-shrink-0">{category}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: CATEGORY_COLORS[category] || '#6b7280' }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-24 text-right flex-shrink-0">SOS {formatCurrency(total)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {(showForm || editExpense) && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => { setShowForm(false); setEditExpense(null) }}
          onSaved={loadData}
        />
      )}
      {deleteExpense && (
        <DeleteConfirm
          expense={deleteExpense}
          onClose={() => setDeleteExpense(null)}
          onDeleted={loadData}
        />
      )}
      {receiptUrl && <ReceiptModal url={receiptUrl} onClose={() => setReceiptUrl(null)} />}
    </div>
  )
}
