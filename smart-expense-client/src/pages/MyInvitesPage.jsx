import { useState, useEffect } from 'react';
import { getMyInvitesApi, acceptInviteApi, declineInviteApi } from '../api/groupApi';
import { useNavigate } from 'react-router-dom';
import { useInvites } from '../context/InviteContext';

const MyInvitesPage = () => {
  const { refreshInviteCount } = useInvites();
  const [invites,  setInvites]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actionId, setActionId] = useState(null);
  const navigate = useNavigate();

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await getMyInvitesApi();
      setInvites(res.data.invites || []);
      refreshInviteCount(); //  keeps badge in sync
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvites(); }, []);

  const handleAccept = async (groupId) => {
    setActionId(groupId);
    try {
      await acceptInviteApi(groupId);
      refreshInviteCount();
      await fetchInvites();
      navigate(`/groups/${groupId}`);
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (groupId) => {
    setActionId(groupId);
    try {
      await declineInviteApi(groupId);
      refreshInviteCount();
      setInvites(prev => prev.filter(i => i.groupId !== groupId));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2>📨 My Invites</h2>
        <p className="text-gray-500 mt-1">
          Groups you've been invited to
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-28" />)}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No pending invites</h3>
          <p className="text-gray-400 text-sm">
            When a friend invites you to a group, it'll appear here
          </p>
        </div>
      )}

      <div className="space-y-4">
        {invites.map((invite) => (
          <div key={invite.groupId} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {invite.tripCategory === 'Travel' ? '✈️' :
                   invite.tripCategory === 'Food & Dining' ? '🍽️' : '👥'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{invite.groupName}</h3>
                  {invite.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{invite.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Invited by <span className="font-medium">{invite.createdBy}</span>
                    {' · '}{invite.memberCount} members
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleDecline(invite.groupId)}
                disabled={actionId === invite.groupId}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleAccept(invite.groupId)}
                disabled={actionId === invite.groupId}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {actionId === invite.groupId ? 'Joining...' : '✓ Accept & Join'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyInvitesPage;