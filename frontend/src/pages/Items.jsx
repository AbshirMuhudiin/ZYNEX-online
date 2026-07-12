import { useEffect, useState } from 'react'
import api from '../lib/api'
import { getUser } from '../lib/auth'

export default function Items() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const initialForm = { name: '', sku: '', description: '', cost_price: 0, sale_price: 0, quantity: 0, min_quantity: 0 }
  const [formData, setFormData] = useState(initialForm)
  
  const user = getUser()
  const isAdmin = user?.role === 'admin'

  const load = async () => {
    try {
      const { data } = await api.get('/items')
      setItems(data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load items')
    }
  }

  useEffect(() => { load() }, [])

  const openAddModal = () => {
    setEditingId(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const openEditModal = (item, e) => {
    e.stopPropagation()
    setEditingId(item.id)
    setFormData({
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      cost_price: Number(item.cost_price),
      sale_price: Number(item.sale_price),
      quantity: Number(item.quantity),
      min_quantity: Number(item.min_quantity)
    })
    setShowModal(true)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to completely delete this item?')) return
    try {
      await api.delete(`/items/${id}`)
      load()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete item')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, formData)
      } else {
        await api.post('/items', formData)
      }
      setShowModal(false)
      setFormData(initialForm)
      load()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save item')
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Items</h1>
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Add New Item
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100">{error}</div>}

      <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(it => (
          <div key={it.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col group transform hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            
            {isAdmin && (
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-gray-100">
                <button onClick={(e) => openEditModal(it, e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" title="Edit Item">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button onClick={(e) => handleDelete(it.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition" title="Delete Item">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            )}

            <div className="flex justify-between items-start mb-2 pr-12">
              <div className="font-bold text-lg text-gray-800 truncate" title={it.name}>{it.name}</div>
            </div>
            
            <div className="mb-4">
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono border border-gray-200">{it.sku}</span>
            </div>

            {it.description && <p className="text-sm text-gray-500 mb-5 line-clamp-2 leading-relaxed">{it.description}</p>}
            
            <div className="mt-auto grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl">
                <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Sale Price</span>
                <span className="font-black text-gray-800">${Number(it.sale_price).toFixed(2)}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl">
                <span className="block text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Cost</span>
                <span className="font-black text-gray-800">${Number(it.cost_price).toFixed(2)}</span>
              </div>
              <div className={`p-3 rounded-xl col-span-2 flex justify-between items-center border ${it.quantity <= it.min_quantity ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">In Stock</span>
                <span className="font-black text-lg">{it.quantity} <span className="text-xs font-semibold opacity-70">units</span></span>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !error && (
          <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-3">📦</div>
            No items in inventory. {isAdmin && 'Click "Add New Item" to create one.'}
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Item Name</label>
                <input required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SKU (Barcode/ID)</label>
                <input required className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cost Price ($)</label>
                  <input required type="number" step="0.01" className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" value={formData.cost_price} onChange={e=>setFormData({...formData, cost_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sale Price ($)</label>
                  <input required type="number" step="0.01" className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" value={formData.sale_price} onChange={e=>setFormData({...formData, sale_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock Quantity</label>
                  <input required type="number" className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Min Alert Qty</label>
                  <input required type="number" className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" value={formData.min_quantity} onChange={e=>setFormData({...formData, min_quantity: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <textarea className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition" rows="3" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
