// ═══════════════════════════════════════════════
// src/pages/GroupsPage.jsx — Groups list
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroupsApi, createGroupApi, deleteGroupApi } from '../api/groupApi';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import Button from '../components/common/Button';
import { formatCurrency, formatDate } from '../utils/formatters';

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'bg-green-100 text-green-700'  },
  settled:  { label: 'Settled',  color: 'bg-blue-100 text-blue-700'    },
  closed:   { label: 'Closed',   color: 'bg-gray-100 text-gray-600'    },
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const [groups,        setGroups]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await getGroupsApi();
      setGroups(response.data.groups || []);
    } catch (err) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async (groupData) => {
    const response = await createGroupApi(groupData);
    await fetchGroups();
    // Navigate directly to the new group
    navigate(`/groups/${response.data.group._id}`);
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Delete this group and all its expenses?')) return;
    setDeletingId(groupId);
    try {
      await deleteGroupApi(groupId);
      setGroups(prev => prev.filter((g) => g._id !== groupId));
    } catch (err) {
      setError('Failed to delete group');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2>👥 Bill Splitter</h2>
          <p className="text-gray-500 mt-1">
            Split expenses with friends and groups
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + New Group
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && groups.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">👥</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No groups yet
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Create a group for your next trip or shared expense
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Create your first group
          </Button>
        </div>
      )}

      {/* Groups list */}
      {!loading && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map((group) => {
            const statusConf = STATUS_CONFIG[group.status] || STATUS_CONFIG.active;

            return (
              <div
                key={group._id}
                className="card hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => navigate(`/groups/${group._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {group.tripCategory === 'Travel' ? '✈️' :
                       group.tripCategory === 'Food & Dining' ? '🍽️' :
                       group.tripCategory === 'Entertainment' ? '🎬' : '👥'}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {group.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                        {/* Show this badge if the user is a collaborator not creator */}
                        {!group.isCreator && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full
                            flex-shrink-0 bg-purple-100 text-purple-700">
                            👥 Shared with me
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {group.members?.length || 0} members ·{' '}
                        {group.expenseCount || 0} expenses ·{' '}
                        Created {formatDate(group.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(group.totalAmount || 0)}
                      </p>
                      <p className="text-xs text-gray-400">total spent</p>
                    </div>

                    {/* Delete button */}
                    {group.isCreator && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(group._id); }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={deletingId === group._id}
                    >
                      🗑️
                    </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreate}
      />
    </div>
  );
};

export default GroupsPage;