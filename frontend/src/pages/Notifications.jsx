import { useEffect, useState } from 'react'
import api from '../lib/api'
import socket, { connectSocket } from '../lib/socket'

export default function Notifications() {
  const [items, setItems] = useState([])

  const load = async () => {
    const { data } = await api.get('/notifications')
    setItems(data)
  }

  useEffect(() => {
    load()
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user) connectSocket(user)
    const onMessage = (n) => setItems((prev)=> [n, ...prev])
    socket.on('notification', onMessage)
    return () => socket.off('notification', onMessage)
  }, [])

  const markRead = async () => {
    const unread = items.filter(i=>!i.is_read).map(i=>i.id)
    if (unread.length === 0) return
    await api.post('/notifications/mark-read', { ids: unread })
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button onClick={markRead} className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-sm">Mark all read</button>
      </div>
      <div className="bg-white rounded shadow divide-y">
        {items.map(n => (
          <div key={n.id} className="p-3 flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${n.is_read ? 'bg-gray-100' : 'bg-yellow-100'}`}>{n.type}</span>
            <span>{n.message}</span>
            <span className="ml-auto text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="p-4 text-gray-500">No notifications</div>
        )}
      </div>
    </div>
  )
}



