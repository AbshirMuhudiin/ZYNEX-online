import { useEffect, useState } from 'react'
import api from '../lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function Reports() {
  const [summary, setSummary] = useState(null)
  const [itemStats, setItemStats] = useState([])
  const [chartData, setChartData] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6') // Default 6 months

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      let query = ''
      if (period !== 'all') {
        const d = new Date()
        d.setMonth(d.getMonth() - parseInt(period))
        const fromStr = d.toISOString().split('T')[0]
        query = `?from=${fromStr}`
      }

      const [a, b] = await Promise.all([
        api.get(`/reports/sales${query}`),
        api.get(`/reports/items${query}`)
      ])
      setSummary(a.data)
      setItemStats(b.data)
      setChartData(b.data.slice(0, 10).map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        'Units Sold': Number(item.units_sold),
        'Revenue': Number(item.revenue),
        'Profit': Number(item.profit)
      })))
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ 
    load() 
  }, [period])

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <div className="flex items-center gap-3">
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

          <button onClick={load} className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100">{error}</div>}
      
      {loading ? (
         <div className="text-gray-500 py-10 text-center animate-pulse">Loading reports...</div>
      ) : (
        <>
          {summary && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-md text-white flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
                <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Total Revenue</div>
                <div className="text-3xl font-bold">${Number(summary.total_revenue || 0).toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-xl shadow-md text-white flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
                <div className="text-rose-100 text-sm font-medium uppercase tracking-wider mb-2">Total Cost</div>
                <div className="text-3xl font-bold">${Number(summary.total_cost || 0).toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-xl shadow-md text-white flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
                <div className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-2">Net Profit</div>
                <div className="text-3xl font-bold">${Number(summary.total_profit || 0).toFixed(2)}</div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Top 10 Best Selling Items (Units Sold)</h2>
            <div className="h-[350px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fill: '#6B7280', fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Units Sold" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No sales data available for this period
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Item Performance Detail</h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">Sorted by Units Sold</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Rank</th>
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold text-center">Units Sold</th>
                    <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                    <th className="px-6 py-4 font-semibold text-right">Cost</th>
                    <th className="px-6 py-4 font-semibold text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {itemStats.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                      <td className="px-6 py-4">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{r.name}</td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{r.units_sold}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600 font-medium">${Number(r.revenue).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-red-500 font-medium">${Number(r.cost).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-bold">${Number(r.profit).toFixed(2)}</td>
                    </tr>
                  ))}
                  {itemStats.length === 0 && !error && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No sales data found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
