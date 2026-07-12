import { useEffect, useState } from 'react'
import api from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function Dashboard() {
  const [me, setMe] = useState(null)
  const [summary, setSummary] = useState(null)
  const [expenseSummary, setExpenseSummary] = useState(null)
  const [itemStats, setItemStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6') // Default 6 months

  const loadData = async () => {
    setLoading(true)
    try {
      let query = ''
      if (period !== 'all') {
        const d = new Date()
        d.setMonth(d.getMonth() - parseInt(period))
        const fromStr = d.toISOString().split('T')[0]
        query = `?from=${fromStr}`
      }

      const [userRes, salesRes, itemsRes, expRes] = await Promise.all([
        api.get('/auth/me'),
        api.get(`/reports/sales${query}`),
        api.get(`/reports/items${query}`),
        api.get('/expenses/summary').catch(() => ({ data: null }))
      ])
      setMe(userRes.data)
      setSummary(salesRes.data)
      setExpenseSummary(expRes.data)
      // Get top 5 items for the chart
      setItemStats(itemsRes.data.slice(0, 5).map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        'Units Sold': Number(item.units_sold),
        'Revenue': Number(item.revenue),
        'Profit': Number(item.profit)
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [period])

  const isAdmin = me?.role === 'admin'

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {me && <span className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 font-medium">Welcome back, {me.name}</span>}
          
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Last 1 Month</option>
            <option value="2">Last 2 Months</option>
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-10 animate-pulse">Loading dashboard data...</div>
      ) : (
        <>
          {summary && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-blue-600">${Number(summary.total_revenue || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Total Cost of Goods</div>
                <div className="text-3xl font-bold text-red-500">${Number(summary.total_cost || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Total Expenses</div>
                <div className="text-3xl font-bold text-orange-500">SOS {Number(expenseSummary?.month || 0).toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">This month</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Net Profit</div>
                <div className={`text-3xl font-bold ${
                  (Number(summary.total_profit || 0) - Number(expenseSummary?.month || 0)) >= 0
                    ? 'text-green-500' : 'text-red-500'
                }`}>
                  ${(Number(summary.total_profit || 0) - Number(expenseSummary?.month || 0)).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 mt-1">Gross profit − expenses</div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Top 5 Best Selling Items (Units Sold)</h2>
              <div className="h-[300px] w-full">
                {itemStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: '#F3F4F6'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                      />
                      <Legend wrapperStyle={{paddingTop: '20px'}} />
                      <Bar dataKey="Units Sold" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No sales data available for this period
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 flex-1">
                {isAdmin && (
                  <a href="/items" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer border border-transparent hover:border-blue-100">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-blue-600 mr-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-800 group-hover:text-blue-700">Add New Item</span>
                      <span className="text-xs text-gray-500">Update inventory stock</span>
                    </div>
                  </a>
                )}
                
                <a href="/orders" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors group cursor-pointer border border-transparent hover:border-green-100">
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-green-600 mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800 group-hover:text-green-700">Create Order</span>
                    <span className="text-xs text-gray-500">Record a new sale</span>
                  </div>
                </a>

                <a href="/expenses" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-violet-50 hover:text-violet-700 transition-colors group cursor-pointer border border-transparent hover:border-violet-100">
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-violet-600 mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800 group-hover:text-violet-700">Add Expense</span>
                    <span className="text-xs text-gray-500">Record a business expense</span>
                  </div>
                </a>

                {isAdmin && (
                  <a href="/reports" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition-colors group cursor-pointer border border-transparent hover:border-purple-100">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-purple-600 mr-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-800 group-hover:text-purple-700">View Reports</span>
                      <span className="text-xs text-gray-500">Detailed financial analysis</span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
