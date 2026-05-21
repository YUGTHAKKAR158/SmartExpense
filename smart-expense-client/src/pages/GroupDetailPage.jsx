// ═══════════════════════════════════════════════
// src/pages/GroupDetailPage.jsx
// Individual group view with expenses + settlements
// ═══════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getGroupApi, addGroupExpenseApi,
  deleteGroupExpenseApi, closeGroupApi,
  updateMemberApi, updateGroupExpenseApi,
  addMemberApi, deleteMemberApi,
  inviteFriendApi, generateShareLinkApi,
  revokeShareLinkApi, removeCollaboratorApi,
} from '../api/groupApi';
import AddGroupExpenseModal from '../components/groups/AddGroupExpenseModal';
import SettlementView from '../components/groups/SettlementView';
import Button from '../components/common/Button';
import { formatCurrency, formatDate } from '../utils/formatters';
import EditMemberModal      from '../components/groups/EditMemberModal';
import EditGroupExpenseModal from '../components/groups/EditGroupExpenseModal';
import ManageMembersModal from '../components/groups/ManageMembersModal';
import MemberSummaryModal   from '../components/groups/MemberSummaryModal';
import { getMemberSummaryApi } from '../api/groupApi'; // already in groupApi
import InviteFriendModal from '../components/groups/InviteFriendModal';
import ShareLinkModal    from '../components/groups/ShareLinkModal';

const GroupDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user } = useAuth();

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [addModalOpen,  setAddModalOpen]  = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [closing,       setClosing]       = useState(false);
  const [error,         setError]         = useState('');
  const [closeSuccess,  setCloseSuccess]  = useState('');
  const [activeTab,     setActiveTab]     = useState('expenses'); // expenses | settlements

  const [editMemberOpen,   setEditMemberOpen]   = useState(false);
  const [editingMember,    setEditingMember]    = useState(null);
  const [savingMember,     setSavingMember]     = useState(false);

  const [editExpenseOpen,  setEditExpenseOpen]  = useState(false);
  const [editingExpense,   setEditingExpense]   = useState(null);
  const [savingExpense,    setSavingExpense]    = useState(false);

  const [manageMembersOpen, setManageMembersOpen] = useState(false);

  const [summaryModalOpen,  setSummaryModalOpen]  = useState(false);
  const [summaryMember,     setSummaryMember]     = useState(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareModalOpen,  setShareModalOpen]  = useState(false);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getGroupApi(id);
      setData(response.data);
    } catch (err) {
      setError('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const handleAddExpense = async (expenseData) => {
    setAddingExpense(true);
    try {
      await addGroupExpenseApi(id, expenseData);
      await fetchGroup();
      setAddModalOpen(false);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Remove this expense?')) return;
    try {
      await deleteGroupExpenseApi(id, expenseId);
      await fetchGroup();
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  const handleCloseGroup = async () => {
    if (!window.confirm(
      'Close this group? Your share will be automatically added to your expenses. This cannot be undone.'
    )) return;

    setClosing(true);
    try {
      const response = await closeGroupApi(id);
      setCloseSuccess(response.message);
      await fetchGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close group');
    } finally {
      setClosing(false);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setEditMemberOpen(true);
  };

  const handleSaveMember = async (memberId, memberData) => {
    setSavingMember(true);
    try {
      await updateMemberApi(id, memberId, memberData);
      await fetchGroup();
      setEditMemberOpen(false);
    } finally {
      setSavingMember(false);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditExpenseOpen(true);
  };

  const handleSaveExpense = async (expenseId, expenseData) => {  
    setSavingExpense(true);
    try {
      await updateGroupExpenseApi(id, expenseId, expenseData);
      await fetchGroup();
      setEditExpenseOpen(false);
    } finally {
      setSavingExpense(false);
    }
  };

  const handleAddMember = async (memberData) => {
    await addMemberApi(id, memberData);
    await fetchGroup();
  };

  const handleDeleteMember = async (memberId) => {
    await deleteMemberApi(id, memberId);
    await fetchGroup();
  };

  const handleViewMemberSummary = (member) => {
    setSummaryMember(member);
    setSummaryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
      </div>
    );
  }

  if (!data) return null;

  const { group, expenses, settlements, netBalances } = data;
  const isCreator =
    group.collaborators
      ? !group.collaborators.some(
          (c) => c.userId?.toString() === user?._id?.toString()
        )
      : true;

  const isActive = group.status === 'active';
  const isClosed = group.status === 'closed';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <div>
            <h2>{group.name}</h2>
            {group.description && (
              <p className="text-gray-500 text-sm mt-0.5">{group.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isActive && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddModalOpen(true)}
              >
                + Add Expense
              </Button>
              {/* Only creator sees these */}
              {isCreator && (
              <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCloseGroup}
                loading={closing}
              >
                🔒 Close Group
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setInviteModalOpen(true)}>
                📨 Invite
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShareModalOpen(true)}>
                🔗 Share
              </Button>
              </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success message */}
      {closeSuccess && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-green-800 text-sm font-medium">✅ {closeSuccess}</p>
          <p className="text-green-600 text-xs mt-1">
            Check your Expenses page to see the auto-added entry.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Closed banner */}
      {isClosed && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-xl text-center">
          <p className="text-gray-600 font-medium">
            🔒 This group is closed · Settled on {formatDate(group.closedAt)}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Your share was automatically added to your expenses
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Spent', value: formatCurrency(group.totalAmount || 0), icon: '💰' },
          { label: 'Members',     value: group.members?.length || 0,             icon: '👥' },
          { label: 'Expenses',    value: expenses?.length || 0,                  icon: '📋' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center py-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Members ({group.members?.length || 0})
          </h3>
          {isActive && isCreator &&(
            <button
              onClick={() => setManageMembersOpen(true)}
              className="text-xs text-primary-600 font-medium hover:text-primary-700"
            >
              ⚙️ Manage Members
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {group.members?.map((member) => (
            <div
              key={member._id}
              onClick={() => handleViewMemberSummary(member)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full cursor-pointer hover:bg-primary-100 hover:border-primary-300 border border-transparent transition-colors group"
            >
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 group-hover:text-primary-700">
                {member.name}
              </span>
              <span className="text-xs text-gray-400 group-hover:text-primary-500">
                👁
              </span>
              {isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditMember(member); }}
                  className="text-gray-400 hover:text-primary-600 text-xs ml-1"
                >
                  ✏️
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['expenses', 'settlements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {tab === 'expenses' ? `📋 Expenses (${expenses?.length || 0})` : '💸 Settlements'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card">

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <>
            {expenses?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-400 text-sm">No expenses yet</p>
                {isActive && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAddModalOpen(true)}
                    className="mt-4"
                  >
                    Add first expense
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {expenses.map((expense) => (
                  <div key={expense._id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Description + amount */}
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {expense.description}
                          </p>
                          <p className="font-bold text-gray-900 flex-shrink-0 ml-3">
                            {formatCurrency(expense.amount)}
                          </p>
                        </div>

                        {/* Paid by */}
                        <p className="text-sm text-gray-500 mb-2">
                          Paid by{' '}
                          <span className="font-medium text-gray-700">
                            {expense.paidByMemberName}
                          </span>
                          {' · '}{formatDate(expense.date)}
                        </p>

                        {/* Split among */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-gray-400">Split among:</span>
                          {expense.splitAmong?.map((share) => (
                            <span
                              key={share.memberId}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                            >
                              {share.memberName} (₹{share.shareAmount})
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Edit + Delete button */}
                      {isActive && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            🗑️
                          </button>
                        </div>  
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SETTLEMENTS TAB */}
        {activeTab === 'settlements' && (
          <SettlementView
            settlements={settlements}
            netBalances={netBalances}
          />
        )}

      </div>

      {/* Add expense modal */}
      <AddGroupExpenseModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddExpense}
        group={group}
        loading={addingExpense}
      />

      {/* Edit member modal */}
      <EditMemberModal
        isOpen={editMemberOpen}
        onClose={() => setEditMemberOpen(false)}
        onSave={handleSaveMember}
        member={editingMember}
        loading={savingMember}
      />

      {/* Edit expense modal */}
      <EditGroupExpenseModal
        isOpen={editExpenseOpen}
        onClose={() => setEditExpenseOpen(false)}
        onSave={handleSaveExpense}
        expense={editingExpense}
        group={group}
        loading={savingExpense}
      />

      {/* Manage member modal */}
      <ManageMembersModal
        isOpen={manageMembersOpen}
        onClose={() => setManageMembersOpen(false)}
        group={group}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        onEditMember={(member) => {
          setManageMembersOpen(false); // close this first
          setEditingMember(member);
          setEditMemberOpen(true);
        }}
        loading={false}
      />
      
      {/* Member summary modal */}
      <MemberSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        groupId={id}
        member={summaryMember}
      />

      <InviteFriendModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        groupId={id}
        group={group}
      />

      <ShareLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        groupId={id}
        group={group}
        onRefresh={fetchGroup}
      />
    </div>
  );
};

export default GroupDetailPage;