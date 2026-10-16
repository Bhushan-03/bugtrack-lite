
import { useCallback, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import Dashboard from './components/Dashboard'

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const token = localStorage.getItem('bugtrack_token')
      const user = JSON.parse(localStorage.getItem('bugtrack_user') || 'null')
      return token && user ? { token, user } : null
    } catch {
      return null
    }
  })

  function handleAuthSuccess(data) {
    localStorage.setItem('bugtrack_token', data.token)
    localStorage.setItem('bugtrack_user', JSON.stringify(data.user))
    setSession({ token: data.token, user: data.user })
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('bugtrack_token')
    localStorage.removeItem('bugtrack_user')
    setSession(null)
  }, [])

  if (!session) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
  }

  return <Dashboard session={session} onLogout={handleLogout} />
}
