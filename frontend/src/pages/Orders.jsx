import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`

const CREDIT_STATUS = {
  CASH: { label: 'Cash', bg: 'bg-gray-100   text-gray-700   border-gray-200', dot: 'bg-gray-400', icon: '💵' },
  PARTIAL: { label: 'Partial', bg: 'bg-amber-50   text-amber-700  border-amber-200', dot: 'bg-amber-400', icon: '⏳' },
  UNPAID: { label: 'Unpaid', bg: 'bg-red-50     text-red-700    border-red-200', dot: 'bg-red-500', icon: '🔴' },
  PAID: { label: 'Paid', bg: 'bg-green-50   text-green-700  border-green-200', dot: 'bg-green-500', icon: '✅' },
}

const ORDER_STATUS = {
  CREATED: { label: 'Created', bg: 'bg-blue-50    text-blue-700   border-blue-200', dot: 'bg-blue-500', icon: '📋' },
  PAID: { label: 'Paid', bg: 'bg-green-50   text-green-700  border-green-200', dot: 'bg-green-500', icon: '✅' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: '✔️' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50     text-red-700    border-red-200', dot: 'bg-red-400', icon: '❌' },
}

function StatusBadge({ status, map = ORDER_STATUS }) {
  const cfg = map[status] || { label: status, bg: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', icon: '•' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon} {cfg.label}
    </span>
  )
}

/* ─── Receipt (printable) ────────────────────────────── */
function Receipt({ data }) {
  if (!data) return null
  const total = data.total_amount ?? data.items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0)
  const paid = Number(data.paid_amount ?? total)
  const remaining = Number(data.remaining_amount ?? 0)

  return (
    <div className="font-mono text-gray-800 bg-white p-8 w-full">
      {/* Header */}
      <div className="text-center mb-5 pb-5 border-b-2 border-dashed border-gray-300">
        <div className="text-2xl font-black tracking-widest text-gray-900 uppercase">ZYNEX online store</div>
        <div className="text-xs text-gray-400 mt-1">Official Sales Receipt</div>
      </div>

      {/* Meta */}
      <table className="w-full text-xs mb-5 pb-5 border-b border-dashed border-gray-300">
        <tbody>
          <tr><td className="text-gray-500 py-0.5 w-28">Order #</td><td className="font-bold text-right">#{data.orderId}</td></tr>
          <tr><td className="text-gray-500 py-0.5">Date</td><td className="font-medium text-right">{data.date || new Date().toLocaleString()}</td></tr>
          <tr><td className="text-gray-500 py-0.5">Customer</td><td className="font-bold text-right uppercase">{data.customerName}</td></tr>
          {data.customerPhone && <tr><td className="text-gray-500 py-0.5">Phone</td><td className="text-right">{data.customerPhone}</td></tr>}
        </tbody>
      </table>

      {/* Items */}
      <table className="w-full text-xs mb-5 pb-5 border-b border-dashed border-gray-300">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="text-left py-1.5 font-semibold">Item</th>
            <th className="text-center py-1.5 font-semibold w-10">Qty</th>
            <th className="text-right py-1.5 font-semibold w-16">Price</th>
            <th className="text-right py-1.5 font-semibold w-16">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-2 pr-2">{it.name || it.item_name}</td>
              <td className="py-2 text-center">{it.quantity}</td>
              <td className="py-2 text-right">{fmt(it.unit_price)}</td>
              <td className="py-2 text-right font-medium">{fmt(Number(it.unit_price) * Number(it.quantity))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <table className="w-full text-xs mb-6">
        <tbody>
          <tr>
            <td className="py-0.5 text-gray-500">Subtotal</td>
            <td className="text-right font-medium">{fmt(total)}</td>
          </tr>
          <tr>
            <td className="py-0.5 text-gray-500">Paid</td>
            <td className="text-right font-medium text-green-700">{fmt(paid)}</td>
          </tr>
          {remaining > 0 && (
            <tr className="border-t border-gray-200">
              <td className="py-1 font-black text-red-700 uppercase tracking-wide">Balance Due</td>
              <td className="text-right font-black text-red-700 text-base">{fmt(remaining)}</td>
            </tr>
          )}
          {remaining <= 0 && (
            <tr className="border-t border-gray-200">
              <td className="py-1 font-black uppercase tracking-wide">Total Due</td>
              <td className="text-right font-black text-xl">{fmt(total)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {remaining > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 text-center mb-6 font-medium">
          ⚠️ CREDIT SALE — Outstanding Balance: {fmt(remaining)}
        </div>
      )}

      <div className="text-center text-xs text-gray-400 pt-4 border-t border-dashed border-gray-200">
        <p className="font-medium mb-0.5">Thank you for shopping at ZYNEX online store!</p>
        <p>Please come again 😊</p>
      </div>
    </div>
  )
}

/* ─── Receipt Modal ─────────────────────────────────── */
function ReceiptModal({ data, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || ''
    const win = window.open('', '_blank', 'width=440,height=750')
    win.document.write(`
      <html><head><title>Receipt #${data.orderId}</title>
      <style>
        body{font-family:'Courier New',monospace;font-size:12px;margin:0;padding:0;}
        *{box-sizing:border-box;}
        table{width:100%;border-collapse:collapse;}
        th,td{padding:3px 0;}
      </style></head><body>${content}</body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">Invoice / Receipt #{data.orderId}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto" ref={printRef}>
          <Receipt data={data} />
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition">
            Close
          </button>
          <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition flex justify-center items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Credit Sale Modal ──────────────────────────────── */
function CreditSaleModal({ cartTotal, paidAmount, onConfirm, onCancel, loading }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [err, setErr] = useState('')
  const remaining = cartTotal - paidAmount

  const handleSave = () => {
    if (!name.trim()) return setErr('Customer name is required')
    if (!phone.trim()) return setErr('Phone number is required')
    setErr('')
    onConfirm({ name: name.trim(), phone: phone.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <h2 className="font-bold text-amber-900">Credit Sale</h2>
            <p className="text-xs text-amber-700">Customer details required for outstanding balance</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
            <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span className="font-bold">{fmt(cartTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Paid Now</span><span className="font-semibold text-green-700">{fmt(paidAmount)}</span></div>
            <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 mt-2">
              <span className="font-bold text-red-700">Remaining Balance</span>
              <span className="font-black text-red-700 text-base">{fmt(remaining)}</span>
            </div>
          </div>

          {err && <div className="bg-red-50 text-red-600 border border-red-200 text-sm p-3 rounded-lg">{err}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 outline-none bg-gray-50 focus:bg-white transition"
              placeholder="E.g. Ahmed Ali"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 outline-none bg-gray-50 focus:bg-white transition"
              placeholder="E.g. 0612345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Phone number is used to identify returning customers.</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
            Back
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition flex justify-center items-center gap-2">
            {loading ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : '💾'}
            Save Credit Sale
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Orders Page ───────────────────────────────── */
export default function Orders() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [showCredit, setShowCredit] = useState(false)
  const [creditLoading, setCreditLoading] = useState(false)

  // New Order form state
  const [cart, setCart] = useState([])
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [paidAmount, setPaidAmount] = useState('')

  const cartTotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  // helper to compute totals
  const cartCostTotal = cart.reduce((s, i) => s + (i.cost_price * i.quantity), 0)
  const cartProfit = cartTotal - cartCostTotal

  const loadOrders = async () => {
    try { setOrders((await api.get('/orders')).data) }
    catch (e) { setError(e?.response?.data?.message || 'Failed to load orders') }
  }
  const loadItems = async () => {
    try { setItems((await api.get('/items')).data) }
    catch (e) { console.error(e) }
  }

  useEffect(() => { loadOrders(); loadItems() }, [])

  const addToCart = () => {
    if (!selectedItem || quantity < 1) return
    const item = items.find(i => i.id.toString() === selectedItem)
    if (!item) return
    const existing = cart.find(c => c.item_id === item.id)
    if (existing) {
      setCart(cart.map(c => c.item_id === item.id ? { ...c, quantity: c.quantity + Number(quantity) } : c))
    } else {
      setCart([...cart, {
        item_id: item.id,
        name: item.name,
        unit_price: item.sale_price,   // editable sale price
        default_price: item.sale_price,
        cost_price: Number(item.cost_price) || 0, // store cost for profit calc
        quantity: Number(quantity)
      }])
    }
    setSelectedItem(''); setQuantity(1)
  }

  const updateCartPrice = (item_id, newPrice) => {
    setCart(cart.map(c => c.item_id === item_id ? { ...c, unit_price: Number(newPrice) || 0 } : c))
  }

  const removeFromCart = (id) => setCart(cart.filter(c => c.item_id !== id))

  const resetModal = () => { setCart([]); setCustomerName(''); setPaidAmount(''); setShowModal(false); setShowCredit(false) }

  /* Called when user clicks "Place Order" */
  const handlePlaceOrder = () => {
    if (cart.length === 0) return
    const paid = paidAmount === '' ? cartTotal : Number(paidAmount)
    if (paid > cartTotal) return alert('Paid amount cannot exceed total amount')

    if (paid < cartTotal) {
      // Show credit sale popup
      setShowCredit(true)
    } else {
      // Full cash payment — submit directly
      finishOrder({ customer_name: customerName.trim() || 'Walk-in Customer', paid_amount: paid, customer_id: null })
    }
  }

  /* Called from CreditSaleModal after customer info entered */
  const handleCreditConfirm = async ({ name, phone }) => {
    setCreditLoading(true)
    try {
      // Find or create customer
      const { data: customer } = await api.post('/customers/find-or-create', { name, phone })
      const paid = paidAmount === '' ? cartTotal : Number(paidAmount)
      await finishOrder({ customer_id: customer.id, customer_name: customer.name, paid_amount: paid })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to process credit sale')
    } finally {
      setCreditLoading(false)
    }
  }

  const finishOrder = async ({ customer_id = null, customer_name = 'Walk-in Customer', paid_amount }) => {
    try {
      const res = await api.post('/orders', {
        customer_id,
        customer_name,
        paid_amount,
        items: cart,
      })
      const pAmt = Number(res.data.paid_amount)
      const rAmt = Number(res.data.remaining_amount)
      setReceiptData({
        orderId: res.data.id,
        items: [...cart],
        customerName: customer_name,
        total_amount: cartTotal,
        paid_amount: pAmt,
        remaining_amount: rAmt,
        date: new Date().toLocaleString(),
      })
      resetModal()
      loadOrders()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to place order')
    }
  }

  const openOrderInvoice = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`)
      setReceiptData({
        orderId: data.id,
        items: data.items.map(i => ({ ...i, name: i.item_name })),
        customerName: data.customer_name || 'Walk-in Customer',
        total_amount: data.total_amount,
        paid_amount: data.paid_amount,
        remaining_amount: data.remaining_amount,
        date: new Date(data.created_at).toLocaleString(),
      })
    } catch (e) { alert('Failed to load order details') }
  }

  const displayPaid = paidAmount === '' ? cartTotal : Number(paidAmount)
  const displayRemaining = Math.max(0, cartTotal - displayPaid)
  const isCreditSale = paidAmount !== '' && Number(paidAmount) < cartTotal

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Order
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100">{error}</div>}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-500 uppercase tracking-wider text-xs">
              <th className="px-6 py-4 font-semibold">Order #</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Paid</th>
              <th className="px-6 py-4 font-semibold">Remaining</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-gray-700 group-hover:text-blue-600">#{o.id}</td>
                <td className="px-6 py-4 text-gray-600 font-medium">{o.customer_name || 'Walk-in'}</td>
                <td className="px-6 py-4 font-semibold">{fmt(o.total_amount)}</td>
                <td className="px-6 py-4 text-green-600 font-semibold">{fmt(o.paid_amount)}</td>
                <td className="px-6 py-4">
                  {Number(o.remaining_amount) > 0
                    ? <span className="text-red-600 font-bold">{fmt(o.remaining_amount)}</span>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4"><StatusBadge status={o.credit_status || 'CASH'} map={CREDIT_STATUS} /></td>
                <td className="px-6 py-4 text-gray-500 text-xs">{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openOrderInvoice(o.id)}
                    className="inline-flex items-center gap-1 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Invoice
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && !error && (
              <tr><td colSpan="8" className="px-6 py-14 text-center text-gray-400">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── New Order Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Create New Order</h2>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">✕</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Customer Name <span className="text-gray-400 font-normal">(optional for cash sales)</span></label>
                <input type="text" placeholder="E.g. Ahmed Ali or leave blank for walk-in"
                  className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition"
                  value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>

              {/* Add items row */}
              <div className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Item</label>
                  <select className="w-full border border-gray-200 p-2.5 rounded-lg bg-white" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                    <option value="">-- Choose item --</option>
                    {items.filter(i => i.quantity > 0).map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({fmt(i.sale_price)}) — Stock: {i.quantity}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-24">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Qty</label>
                  <input type="number" min="1" className="w-full border border-gray-200 p-2.5 rounded-lg bg-white" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <button onClick={addToCart} disabled={!selectedItem}
                  className="w-full sm:w-auto bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-40 transition">
                  + Add
                </button>
              </div>

              {/* Cart */}
              {cart.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {cart.map(c => (
                        <tr key={c.item_id} className="border-b border-gray-50">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={c.unit_price}
                              onChange={e => updateCartPrice(c.item_id, e.target.value)}
                              className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-center"><span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{c.quantity}</span></td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">{fmt(c.unit_price * c.quantity)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeFromCart(c.item_id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 w-7 h-7 flex items-center justify-center rounded-lg transition">✕</button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-4 py-2 text-left" colSpan="2">Estimated {cartProfit >= 0 ? 'Profit' : 'Loss'} (USD)</td>
                        <td className="px-4 py-2 text-right" colSpan="2" style={{ color: cartProfit >= 0 ? '#10B981' : '#EF4444' }}>{cartProfit.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="text-4xl mb-2">🛒</div>
                  Cart is empty — add items above.
                </div>
              )}

              {/* Payment section */}
              {cart.length > 0 && (
                <div className={`rounded-xl border p-4 space-y-3 ${isCreditSale ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-100'}`}>
                  <div className="flex justify-between font-semibold text-gray-700 text-sm">
                    <span>Order Total</span>
                    <span className="text-lg font-black">{fmt(cartTotal)}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Paid Amount <span className="text-gray-400 font-normal">(leave blank = full payment)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={cartTotal}
                      step="0.01"
                      placeholder={`${cartTotal.toFixed(2)} (full payment)`}
                      className={`w-full border p-2.5 rounded-lg focus:ring-2 outline-none transition ${isCreditSale ? 'border-amber-300 bg-white focus:ring-amber-400' : 'border-green-200 bg-white focus:ring-green-400'}`}
                      value={paidAmount}
                      onChange={e => setPaidAmount(e.target.value)}
                    />
                  </div>
                  {isCreditSale && (
                    <div className="flex justify-between text-sm border-t border-amber-200 pt-2">
                      <span className="font-semibold text-amber-800">⏳ Remaining Balance</span>
                      <span className="font-black text-red-700 text-base">{fmt(displayRemaining)}</span>
                    </div>
                  )}
                  {isCreditSale && (
                    <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                      💡 A credit sale popup will appear to capture customer details for tracking the outstanding balance.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
              <button onClick={resetModal} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handlePlaceOrder} disabled={cart.length === 0}
                className={`flex-1 py-3 rounded-xl font-bold disabled:opacity-40 transition flex justify-center items-center gap-2 ${isCreditSale ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                {isCreditSale ? '⏳ Save Credit Sale' : '✓ Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* ─── Credit Sale Customer Modal ─── */}
      {
        showCredit && (
          <CreditSaleModal
            cartTotal={cartTotal}
            paidAmount={displayPaid}
            loading={creditLoading}
            onConfirm={handleCreditConfirm}
            onCancel={() => setShowCredit(false)}
          />
        )
      }

      {/* ─── Receipt Modal ─── */}
      {receiptData && <ReceiptModal data={receiptData} onClose={() => setReceiptData(null)} />}
    </div >
  )
}
