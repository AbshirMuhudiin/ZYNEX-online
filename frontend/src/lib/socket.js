import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false
})

export function connectSocket(user) {
  if (!socket.connected) {
    socket.connect()
    socket.emit('join', { role: user?.role, userId: user?.id })
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect()
  }
}

export default socket
