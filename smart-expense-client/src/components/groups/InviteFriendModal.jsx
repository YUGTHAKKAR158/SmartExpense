import { useState } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { inviteFriendApi } from '../../api/groupApi';

const InviteFriendModal = ({ isOpen, onClose, groupId, group }) => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!email.trim()) { setError('Email is required'); return; }

    setLoading(true);
    try {
      const res = await inviteFriendApi(groupId, email.trim());
      setSuccess(`✅ Invite sent to ${email}! They'll see it when they log in.`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📨 Invite a Friend
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              They must have an account to get full access
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error   && <Alert message={error}   type="error"   onDismiss={() => setError('')}   />}
          {success && <Alert message={success} type="success" onDismiss={() => setSuccess('')} />}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="label">Friend's Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@email.com"
                className="input"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                They'll get full access — add/edit/delete expenses, manage members
              </p>
            </div>
            <Button variant="primary" fullWidth loading={loading} type="submit">
              Send Invite
            </Button>
          </form>

          {/* Existing collaborators */}
          {group?.collaborators?.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                People with access ({group.collaborators.length})
              </p>
              <div className="space-y-2">
                {group.collaborators.map((c) => (
                  <div key={c.userId} className="flex items-center gap-3 p-2.5 bg-green-50 rounded-lg border border-green-100">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">✓ Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending invites */}
          {group?.invites?.filter(i => i.status === 'pending').length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Pending Invites
              </p>
              <div className="space-y-2">
                {group.invites.filter(i => i.status === 'pending').map((inv, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {inv.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{inv.email}</p>
                    </div>
                    <span className="text-xs text-yellow-600 font-medium">⏳ Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <Button variant="secondary" fullWidth onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default InviteFriendModal;