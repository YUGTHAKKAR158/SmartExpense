import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicSummaryApi } from '../api/groupApi';
import { formatCurrency, formatDate } from '../utils/formatters';

const PublicGroupPage = () => {
  const { token } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPublicSummaryApi(token);
        setData(res.data);
        // Auto-select first member
        if (res.data.memberSummaries?.length > 0) {
          setSelectedMember(res.data.memberSummaries[0]);
        }
      } catch {
        setError('This link is invalid or has been revoked.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔗</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link Not Found</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { group, settlements, memberSummaries } = data;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header banner */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
            <p className="text-xs text-gray-400">
              {group.members.length} members · {formatCurrency(group.totalAmount)} total
            </p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            👁 Read Only
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">

        {/* Settlement summary */}
        {settlements?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              💸 Settlements ({settlements.length} transactions)
            </h3>
            <div className="space-y-3">
              {settlements.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-700">
                    {s.from.memberName.charAt(0)}
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(s.amount)}
                    </p>
                    <p className="text-xs text-gray-400">→</p>
                  </div>
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                    {s.to.memberName.charAt(0)}
                  </div>
                  <div className="text-right text-xs text-gray-500 min-w-fit">
                    <p><span className="font-medium">{s.from.memberName}</span> pays</p>
                    <p><span className="font-medium">{s.to.memberName}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member selector */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            👤 Member Summaries
          </h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {memberSummaries.map((ms) => (
              <button
                key={ms.member._id}
                onClick={() => setSelectedMember(ms)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                  font-medium transition-colors border
                  ${selectedMember?.member._id === ms.member._id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-primary-300'
                  }
                `}
              >
                <span className="w-5 h-5 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-xs font-bold">
                  {ms.member.name.charAt(0)}
                </span>
                {ms.member.name}
              </button>
            ))}
          </div>

          {/* Selected member detail */}
          {selectedMember && (
            <div className="space-y-4">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-base font-bold text-blue-700">
                    {formatCurrency(selectedMember.totalPaid)}
                  </p>
                  <p className="text-xs text-blue-500">Paid</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-base font-bold text-orange-700">
                    {formatCurrency(selectedMember.totalOwed)}
                  </p>
                  <p className="text-xs text-orange-500">Share</p>
                </div>
                <div className={`text-center p-3 rounded-xl ${
                  selectedMember.netBalance > 0 ? 'bg-green-50' :
                  selectedMember.netBalance < 0 ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <p className={`text-base font-bold ${
                    selectedMember.netBalance > 0 ? 'text-green-700' :
                    selectedMember.netBalance < 0 ? 'text-red-700' : 'text-gray-500'
                  }`}>
                    {selectedMember.netBalance > 0
                      ? `+${formatCurrency(selectedMember.netBalance)}`
                      : selectedMember.netBalance < 0
                      ? `-${formatCurrency(Math.abs(selectedMember.netBalance))}`
                      : '₹0'
                    }
                  </p>
                  <p className={`text-xs ${
                    selectedMember.netBalance > 0 ? 'text-green-500' :
                    selectedMember.netBalance < 0 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {selectedMember.netBalance > 0 ? 'gets back' :
                     selectedMember.netBalance < 0 ? 'owes' : 'settled'}
                  </p>
                </div>
              </div>

              {/* Expense breakdown */}
              <div className="space-y-3">
                {selectedMember.expenseBreakdown.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">
                    Not part of any expense
                  </p>
                ) : (
                  selectedMember.expenseBreakdown.map((item) => (
                    <div
                      key={item.expenseId}
                      className={`p-4 rounded-xl border ${
                        item.iPaid
                          ? 'bg-blue-50 border-blue-100'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">
                              {item.description}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.iPaid
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {item.iPaid ? 'Paid by them' : `Paid by ${item.paidByMemberName}`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(item.date)} · {item.splitCount} people
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-700">
                          {formatCurrency(item.totalAmount)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white">
                        <p className="text-xs text-gray-500">Their share</p>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">
                            {formatCurrency(item.myShare)}
                          </p>
                          <p className={`text-xs font-medium ${
                            item.myNetOnThisExpense > 0 ? 'text-green-600' :
                            item.myNetOnThisExpense < 0 ? 'text-red-500' : 'text-gray-400'
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
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pb-6">
          Shared via Smart Expense · Read only view
        </p>
      </div>
    </div>
  );
};

export default PublicGroupPage;