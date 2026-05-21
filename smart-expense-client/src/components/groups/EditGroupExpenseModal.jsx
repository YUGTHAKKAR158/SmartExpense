import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';

const EditGroupExpenseModal = ({ isOpen, onClose, onSave, expense, group, loading }) => {
  const [formData, setFormData] = useState({
    description: '', amount: '', paidByMemberId: '', date: '', notes: '',
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense && group) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        paidByMemberId: expense.paidByMemberId || '',
        date: expense.date ? expense.date.split('T')[0] : '',
        notes: expense.notes || '',
      });
      setSelectedMemberIds(
        expense.splitAmong?.map((s) => s.memberId) || []
      );
      setError('');
    }
  }, [expense, group]);

  if (!isOpen || !expense || !group) return null;

  const toggleMember = (memberId) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const amount = parseFloat(formData.amount) || 0;
  const shareAmount = selectedMemberIds.length > 0
    ? Math.round((amount / selectedMemberIds.length) * 100) / 100
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) { setError('Description is required'); return; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (selectedMemberIds.length === 0) { setError('Select at least one member'); return; }

    try {
      await onSave(expense._id, {
        ...formData,
        amount: parseFloat(formData.amount),
        splitAmongMemberIds: selectedMemberIds,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expense');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">✏️ Edit Expense</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && <Alert message={error} type="error" onDismiss={() => setError('')} />}

            <div>
              <label className="label">Description *</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                placeholder="e.g. Hotel, Dinner"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount (₹) *</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Who Paid? *</label>
              <select
                value={formData.paidByMemberId}
                onChange={(e) => setFormData(prev => ({ ...prev, paidByMemberId: e.target.value }))}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Split Among *</label>
                <span className="text-xs text-gray-400">
                  {selectedMemberIds.length} of {group.members.length} selected
                </span>
              </div>
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
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{member.name}</span>
                      </div>
                      {isSelected && amount > 0 && (
                        <span className="text-sm font-bold text-primary-600">₹{shareAmount}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {amount > 0 && selectedMemberIds.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    ₹{amount} ÷ {selectedMemberIds.length} members ={' '}
                    <span className="font-bold text-gray-800">₹{shareAmount} each</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <input
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="input"
                placeholder="Any extra details..."
              />
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-100">
            <Button variant="secondary" fullWidth onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" fullWidth loading={loading} type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupExpenseModal;