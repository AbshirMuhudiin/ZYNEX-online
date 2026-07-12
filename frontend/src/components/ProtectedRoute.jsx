import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../lib/auth'

/**
 * ProtectedRoute - Difaaca dhammaan route-yada private ah.
 * Haddii user-ku login ma ahan, wuxuu u diri doonaa /login page-ka.
 * Markuu login sameeyo, wuxuu ku noqon doonaa halka uu ka yimid.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!isLoggedIn()) {
    // U dir login page, xusi halka user-ku raray si markuu login ku noqdo
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
