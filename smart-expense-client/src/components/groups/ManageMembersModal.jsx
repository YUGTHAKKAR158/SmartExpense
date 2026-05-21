// ═══════════════════════════════════════════════
// src/components/groups/ManageMembersModal.jsx
// Add or remove members from an active group
// ═══════════════════════════════════════════════

import { useState } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';

const ManageMembersModal = ({
  isOpen, onClose, group,
  onAddMember, onDeleteMember, onEditMember,
  loading,
}) => {
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [adding, setAdding]       = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError]         = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen || !group) return null;

  const handleAdd = async () => {
    setError('');
    if (!newMember.name.trim()) {
      setError('Name is required');
      return;
    }
    setAdding(true);
    try {
      await onAddMember(newMember);
      setNewMember({ name: '', email: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    setDeletingId(memberId);
    try {
      await onDeleteMember(memberId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            👥 Manage Members
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">

          {error && (
            <Alert message={error} type="error" onDismiss={() => setError('')} />
          )}

          {/* Current members list */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Current Members ({group.members?.length || 0})
            </p>

            <div className="space-y-2">
              {group.members?.map((member) => {
                const isCreator = member.userId &&
                  member.userId === group.createdBy;

                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {member.name}
                          {isCreator && (
                            <span className="ml-2 text-xs text-primary-600 font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                        {member.email && (
                          <p className="text-xs text-gray-400">{member.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {/* Edit button */}
                      <button
                        onClick={() => onEditMember(member)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit member"
                      >
                        ✏️
                      </button>

                      {/* Delete button — hidden for creator */}
                      {!isCreator && (
                        <button
                          onClick={() => handleDelete(member._id)}
                          disabled={deletingId === member._id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          {deletingId === member._id ? '...' : '🗑️'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Add member section */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              ➕ Add New Member
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-sm font-semibold text-primary-800">
                Add New Member
              </p>

              <div>
                <label className="label">Name *</label>
                <input
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Member name"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Email (optional)</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="member@email.com"
                  className="input"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMember({ name: '', email: '' });
                    setError('');
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAdd}
                  loading={adding}
                  type="button"
                >
                  Add Member
                </Button>
              </div>
            </div>
          )}

          {/* Note about removal restriction */}
          <p className="text-xs text-gray-400 text-center">
            ⚠️ Members involved in expenses cannot be removed
          </p>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ManageMembersModal;