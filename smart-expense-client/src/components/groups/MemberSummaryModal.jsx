// ═══════════════════════════════════════════════
// src/components/groups/MemberSummaryModal.jsx
// Shows a single member's full expense breakdown
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { getMemberSummaryApi } from '../../api/groupApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MemberSummaryModal = ({ isOpen, onClose, groupId, member }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (isOpen && groupId && member) {
      fetchSummary();
    }
  }, [isOpen, groupId, member]);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMemberSummaryApi(groupId, member._id);
      setSummary(response.data);
    } catch (err) {
      setError('Failed to load member summary');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {member.name}
              </h3>
              <p className="text-xs text-gray-400">Expense Summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="text-sm text-gray-400 mt-3">Loading summary...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && summary && (
          <div className="p-6 space-y-6">

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(summary.totalPaid)}
                </p>
                <p className="text-xs text-blue-500 mt-0.5">Total Paid</p>
                <p className="text-xs text-blue-400">
                  {summary.paidCount} expense{summary.paidCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-lg font-bold text-orange-700">
                  {formatCurrency(summary.totalOwed)}
                </p>
                <p className="text-xs text-orange-500 mt-0.5">Total Share</p>
                <p className="text-xs text-orange-400">
                  {summary.involvedCount} expense{summary.involvedCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className={`text-center p-3 rounded-xl border ${
                summary.netBalance > 0
                  ? 'bg-green-50 border-green-100'
                  : summary.netBalance < 0
                  ? 'bg-red-50 border-red-100'
                  : 'bg-gray-50 border-gray-100'
              }`}>
                <p className={`text-lg font-bold ${
                  summary.netBalance > 0 ? 'text-green-700' :
                  summary.netBalance < 0 ? 'text-red-700' :
                  'text-gray-500'
                }`}>
                  {summary.netBalance > 0
                    ? `+${formatCurrency(summary.netBalance)}`
                    : summary.netBalance < 0
                    ? `-${formatCurrency(Math.abs(summary.netBalance))}`
                    : '₹0'
                  }
                </p>
                <p className={`text-xs mt-0.5 ${
                  summary.netBalance > 0 ? 'text-green-500' :
                  summary.netBalance < 0 ? 'text-red-500' :
                  'text-gray-400'
                }`}>
                  Net Balance
                </p>
                <p className={`text-xs ${
                  summary.netBalance > 0 ? 'text-green-400' :
                  summary.netBalance < 0 ? 'text-red-400' :
                  'text-gray-300'
                }`}>
                  {summary.netBalance > 0
                    ? 'gets back'
                    : summary.netBalance < 0
                    ? 'owes'
                    : 'settled'
                  }
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Expense breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Expense Breakdown ({summary.expenseBreakdown.length})
              </h4>

              {summary.expenseBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-gray-400 text-sm">
                    {member.name} is not part of any expense yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.expenseBreakdown.map((item) => (
                    <div
                      key={item.expenseId}
                      className={`p-4 rounded-xl border ${
                        item.iPaid
                          ? 'bg-blue-50 border-blue-100'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">
                              {item.description}
                            </p>
                            {/* Badge */}
                            {item.iPaid ? (
                              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                You paid
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                {item.paidByMemberName} paid
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(item.date)} · Split among {item.splitCount} members
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-700 flex-shrink-0 ml-2">
                          {formatCurrency(item.totalAmount)}
                        </p>
                      </div>

                      {/* Share row */}
                      <div className="flex items-center justify-between pt-2 border-t border-white">
                        <p className="text-xs text-gray-500">
                          {member.name}'s share
                        </p>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">
                            {formatCurrency(item.myShare)}
                          </p>
                          {/* Net effect on this expense */}
                          <p className={`text-xs font-medium ${
                            item.myNetOnThisExpense > 0
                              ? 'text-green-600'
                              : item.myNetOnThisExpense < 0
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }`}>
                            {item.myNetOnThisExpense > 0
                              ? `gets back ${formatCurrency(item.myNetOnThisExpense)}`
                              : item.myNetOnThisExpense < 0
                              ? `owes ${formatCurrency(Math.abs(item.myNetOnThisExpense))}`
                              : 'settled'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Who else is in this expense */}
                      <div className="mt-2 pt-2 border-t border-white">
                        <p className="text-xs text-gray-400 mb-1">
                          Split with:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.splitAmong
                            .filter((s) => s.memberId.toString() !== member._id)
                            .map((s) => (
                              <span
                                key={s.memberId}
                                className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200"
                              >
                                {s.memberName} (₹{s.shareAmount})
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default MemberSummaryModal;