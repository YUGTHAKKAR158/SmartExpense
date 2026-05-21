import { useState } from 'react';
import Button from '../common/Button';
import { generateShareLinkApi, revokeShareLinkApi } from '../../api/groupApi';

const ShareLinkModal = ({ isOpen, onClose, groupId, group, onRefresh }) => {
  const [loading,  setLoading]  = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [error,    setError]    = useState('');

  if (!isOpen) return null;

  const shareUrl = group?.shareToken
    ? `${window.location.origin}/share/${group.shareToken}`
    : null;

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      await generateShareLinkApi(groupId);
      await onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Revoke this link? Anyone with it will lose access.')) return;
    setLoading(true); setError('');
    try {
      await revokeShareLinkApi(groupId);
      await onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">🔗 Share Link</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Anyone with this link can view the group — no login needed
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!shareUrl ? (
            /* No link yet */
            <div className="text-center py-6">
              <p className="text-4xl mb-3">🔗</p>
              <p className="text-gray-600 text-sm mb-2 font-medium">
                No share link created yet
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Generate a link so anyone can view member summaries and settlements without logging in.
              </p>
              <Button variant="primary" fullWidth onClick={handleGenerate} loading={loading}>
                Generate Share Link
              </Button>
            </div>
          ) : (
            /* Link exists */
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-400 mb-2 font-medium">Share this link</p>
                <p className="text-sm text-gray-700 break-all font-mono">{shareUrl}</p>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleCopy}
              >
                {copied ? '✅ Copied!' : '📋 Copy Link'}
              </Button>

              {/* What they can see */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <p className="text-xs font-semibold text-blue-800">
                  👁 Read-only access includes:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 ml-2">
                  <li>✓ All member individual summaries</li>
                  <li>✓ Who paid what and how much</li>
                  <li>✓ Settlement transactions</li>
                  <li>✓ Net balances for each member</li>
                  <li>✗ Cannot make any changes</li>
                </ul>
              </div>

              <button
                onClick={handleRevoke}
                disabled={loading}
                className="w-full py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                🗑️ Revoke Link
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <Button variant="secondary" fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;