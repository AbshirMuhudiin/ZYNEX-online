import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { isLoggedIn, getUser, logout } from './lib/auth'
import { disconnectSocket } from './lib/socket'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Orders from './pages/Orders'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Users from './pages/Users'
import Customers from './pages/Customers'
import Expenses from './pages/Expenses'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const loggedIn = isLoggedIn()

  const handleLogout = () => {
    logout()
    disconnectSocket()
    navigate('/login')
  }

  if (!loggedIn) return null

  // Base links available to all roles
  let navLinks = [
    { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/items', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { path: '/orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { path: '/customers', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { path: '/notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { path: '/expenses', label: 'Expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ]

  // Add Admin-only links
  if (user?.role === 'admin') {
    navLinks.push({ path: '/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    navLinks.push({ path: '/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
  }

  return (
    <div className="w-64 bg-white shadow-lg h-screen sticky top-0 flex flex-col border-r border-gray-100">
      <div className="p-6 border-b border-gray-50 flex justify-center items-center">
        <Link to="/">
          <img src="/logo.png" alt="ZYNEX Online Store" className="w-48 h-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</p>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
              </svg>
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-gray-50">
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const loggedIn = isLoggedIn()
  const user = getUser()
  const isAdmin = user?.role === 'admin'

  return (
    <div className={`min-h-screen bg-gray-50 ${loggedIn ? 'flex' : ''}`}>
      <Sidebar />
      <main
        className={loggedIn ? 'flex-1 p-8 overflow-y-auto' : ''}
        style={!loggedIn ? { width: '100vw', minHeight: '100vh', padding: 0 } : {}}
      >
        <div className={loggedIn ? "max-w-6xl mx-auto" : ""}>
          <Routes>
            {/* Public routes - Login kaliya */}
            <Route path="/login" element={loggedIn ? <Navigate to="/" replace /> : <Login />} />

            {/* Haddii /register la galo, u dir /login */}
            <Route path="/register" element={<Navigate to="/login" replace />} />

            {/* Protected routes - Login lazim */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            
            {/* Dhammaan users-ka la fasaxay */}
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

            {/* Admin kaliya */}
            <Route path="/reports" element={<ProtectedRoute>{isAdmin ? <Reports /> : <Navigate to="/" replace />}</ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute>{isAdmin ? <Users /> : <Navigate to="/" replace />}</ProtectedRoute>} />

            {/* Catch all - haddii route uusan jirin */}
            <Route path="*" element={<Navigate to={loggedIn ? "/" : "/login"} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
