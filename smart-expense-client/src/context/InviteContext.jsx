// ═══════════════════════════════════════════════
// src/context/InviteContext.jsx
//
// Provides invite count globally so the sidebar
// badge stays updated without prop drilling
// ═══════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyInvitesApi } from '../api/groupApi';
import { useAuth } from './AuthContext';

const InviteContext = createContext();

export const InviteProvider = ({ children }) => {
  const { user } = useAuth();
  const [inviteCount, setInviteCount] = useState(0);

  const refreshInviteCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getMyInvitesApi();
      setInviteCount(res.data.invites?.length || 0);
    } catch {
      // silently fail — badge just won't show
    }
  }, [user]);

  // Poll every 30 seconds while logged in
  useEffect(() => {
    if (!user) return;
    refreshInviteCount();
    const interval = setInterval(refreshInviteCount, 30000);
    return () => clearInterval(interval);
  }, [user, refreshInviteCount]);

  return (
    <InviteContext.Provider value={{ inviteCount, refreshInviteCount }}>
      {children}
    </InviteContext.Provider>
  );
};

export const useInvites = () => useContext(InviteContext);