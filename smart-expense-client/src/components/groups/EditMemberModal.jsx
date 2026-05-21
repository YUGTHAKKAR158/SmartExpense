import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Alert from '../common/Alert';

const EditMemberModal = ({ isOpen, onClose, onSave, member, loading }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({ name: member.name || '', email: member.email || '' });
      setError('');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await onSave(member._id, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">✏️ Edit Member</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && <Alert message={error} type="error" onDismiss={() => setError('')} />}

            <div>
              <label className="label">Name *</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="Member name"
                required
              />
            </div>

            <div>
              <label className="label">Email (optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input"
                placeholder="member@email.com"
              />
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-100">
            <Button variant="secondary" fullWidth onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" fullWidth loading={loading} type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;