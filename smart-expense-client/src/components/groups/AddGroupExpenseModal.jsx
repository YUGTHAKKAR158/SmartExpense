// ═══════════════════════════════════════════════
// src/components/groups/AddGroupExpenseModal.jsx
//
// KEY FEATURE: User selects WHICH members
// share this expense — not necessarily all members
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { getTodayForInput } from '../../utils/formatters';

const AddGroupExpenseModal = ({
  isOpen, onClose, onAdd, group, loading,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidByMemberId: '',
    date: getTodayForInput(),
    notes: '',
  });

  // Which members are selected for splitting
  // Default: ALL members selected
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [error, setError] = useState('');

  // When modal opens, pre-select all members
  useEffect(() => {
    if (isOpen && group) {
      setSelectedMemberIds(group.members.map((m) => m._id));
      setFormData((prev) => ({
        ...prev,
        paidByMemberId: group.members[0]?._id || '',
      }));
      setError('');
    }
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Toggle member selection for split
  const toggleMember = (memberId) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        // Don't allow deselecting if only 1 left
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  // Calculate share per selected member
  const amount      = parseFloat(formData.amount) || 0;
  const shareCount  = selectedMemberIds.length;
  const shareAmount = shareCount > 0
    ? Math.round((amount / shareCount) * 100) / 100
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.paidByMemberId) {
      setError('Please select who paid');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }

    try {
      await onAdd({
        ...formData,
        amount: parseFloat(formData.amount),
        splitAmongMemberIds: selectedMemberIds,
      });
      // Reset form
      setFormData({
        description: '', amount: '',
        paidByMemberId: group.members[0]?._id || '',
        date: getTodayForInput(), notes: '',
      });
      setSelectedMemberIds(group.members.map((m) => m._id));
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            ➕ Add Group Expense
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {error && <Alert message={error} type="error" onDismiss={() => setError('')} />}

            {/* Description */}
            <div>
              <label className="label">Description *</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Hotel booking, Dinner, Petrol"
                className="input"
                required
              />
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount (₹) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            {/* Who paid */}
            <div>
              <label className="label">Who Paid? *</label>
              <select
                name="paidByMemberId"
                value={formData.paidByMemberId}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select payer...</option>
                {group.members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split among — KEY FEATURE */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Split Among *</label>
                <span className="text-xs text-gray-400">
                  {selectedMemberIds.length} of {group.members.length} selected
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Select only the members who share this expense
              </p>

              <div className="space-y-2">
                {group.members.map((member) => {
                  const isSelected = selectedMemberIds.includes(member._id);

                  return (
                    <div
                      key={member._id}
                      onClick={() => toggleMember(member._id)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl
                        cursor-pointer transition-all border-2
                        ${isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center
                          justify-center flex-shrink-0
                          ${isSelected
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <span className="text-white text-xs font-bold">✓</span>
                          )}
                        </div>

                        {/* Avatar + name */}
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {member.name}
                        </span>
                      </div>

                      {/* Share amount */}
                      {isSelected && amount > 0 && (
                        <span className="text-sm font-bold text-primary-600">
                          ₹{shareAmount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Split summary */}
              {amount > 0 && selectedMemberIds.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 text-center">
                    ₹{amount} ÷ {selectedMemberIds.length} members = {' '}
                    <span className="font-bold text-gray-800">
                      ₹{shareAmount} each
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (optional)</label>
              <input
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any extra details..."
                className="input"
              />
            </div>

          </div>

          <div className="flex gap-3 p-6 border-t border-gray-100">
            <Button variant="secondary" fullWidth onClick={onClose} disabled={loading} type="button">
              Cancel
            </Button>
            <Button variant="primary" fullWidth loading={loading} type="submit">
              Add Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupExpenseModal;