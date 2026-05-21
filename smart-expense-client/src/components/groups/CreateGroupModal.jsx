// ═══════════════════════════════════════════════
// src/components/groups/CreateGroupModal.jsx
// Form to create a new group with members
// ═══════════════════════════════════════════════

import { useState } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { useAuth } from '../../context/AuthContext';

const TRIP_CATEGORIES = [
  'Travel', 'Food & Dining', 'Entertainment', 'Shopping', 'Other',
];

const CreateGroupModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '', description: '', tripCategory: 'Travel',
  });
  const [members, setMembers]     = useState([{ name: '', email: '' }]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMemberChange = (index, field, value) => {
    setMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMemberRow = () => {
    setMembers(prev => [...prev, { name: '', email: '' }]);
  };

  const removeMemberRow = (index) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    // Filter out empty member rows
    const validMembers = members.filter((m) => m.name.trim() !== '');

    setLoading(true);
    try {
      await onCreated({
        ...formData,
        members: validMembers,
      });

      // Reset form
      setFormData({ name: '', description: '', tripCategory: 'Travel' });
      setMembers([{ name: '', email: '' }]);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create group'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            👥 Create New Group
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {error && <Alert message={error} type="error" onDismiss={() => setError('')} />}

            {/* Group name */}
            <div>
              <label className="label">Group Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Goa Trip 2024"
                className="input"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="label">Description (optional)</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Friends trip to Goa"
                className="input"
              />
            </div>

            {/* Trip category */}
            <div>
              <label className="label">Category</label>
              <select
                name="tripCategory"
                value={formData.tripCategory}
                onChange={handleChange}
                className="input"
              >
                {TRIP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                When group is closed, your share will be added to this category
              </p>
            </div>

            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Members</label>
                <button
                  type="button"
                  onClick={addMemberRow}
                  className="text-xs text-primary-600 font-medium hover:text-primary-700"
                >
                  + Add Member
                </button>
              </div>

              {/* Creator (you) — readonly */}
              <div className="flex items-center gap-3 mb-3 p-3 bg-primary-50 rounded-lg">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email} · You (creator)</p>
                </div>
              </div>

              {/* Other members */}
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder={`Member ${index + 1} name`}
                      className="input flex-1"
                    />
                    <input
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      placeholder="Email (optional)"
                      className="input flex-1"
                      type="email"
                    />
                    <button
                      type="button"
                      onClick={() => removeMemberRow(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                You can add more members later
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-100">
            <Button variant="secondary" fullWidth onClick={onClose} disabled={loading} type="button">
              Cancel
            </Button>
            <Button variant="primary" fullWidth loading={loading} type="submit">
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;