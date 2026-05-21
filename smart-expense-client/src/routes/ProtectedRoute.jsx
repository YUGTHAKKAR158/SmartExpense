// ═══════════════════════════════════════════════
// src/routes/ProtectedRoute.jsx
//
// Wraps routes that require authentication.
// If user is not logged in → redirect to /login
// If user IS logged in → render the page
//
// Usage in App.jsx:
// <Route path="/dashboard" element={
//   <ProtectedRoute><Dashboard /></ProtectedRoute>
// } />
// ═══════════════════════════════════════════════

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // useLocation remembers where the user was trying to go
  // So after login, we can redirect them back there
  const location = useLocation();

  // While checking localStorage token on page refresh,
  // don't flash the login page — show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Spinning loader */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  // state={{ from: location }} saves where they came from
  // so after login we can send them back
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated → render the protected page
  return children;
};

export default ProtectedRoute;