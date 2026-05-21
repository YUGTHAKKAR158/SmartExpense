// ═══════════════════════════════════════════════
// src/components/groups/SettlementView.jsx
// Shows who owes who with minimum transactions
// ═══════════════════════════════════════════════

import { formatCurrency } from '../../utils/formatters';

const SettlementView = ({ settlements, netBalances }) => {
  if (!settlements || settlements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-gray-500 text-sm font-medium">
          Everyone is settled up!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Net balances */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Net Balances
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {netBalances?.map((person) => (
            <div
              key={person.memberId}
              className={`
                p-3 rounded-lg text-center
                ${person.balance > 0
                  ? 'bg-green-50 border border-green-200'
                  : person.balance < 0
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
                }
              `}
            >
              <p className="text-xs text-gray-500 mb-1">{person.memberName}</p>
              <p className={`text-sm font-bold ${
                person.balance > 0 ? 'text-green-600' :
                person.balance < 0 ? 'text-red-600' :
                'text-gray-500'
              }`}>
                {person.balance > 0
                  ? `+${formatCurrency(person.balance)}`
                  : person.balance < 0
                  ? `-${formatCurrency(Math.abs(person.balance))}`
                  : 'Settled'
                }
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {person.balance > 0 ? 'gets back' :
                 person.balance < 0 ? 'owes' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Settlement transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Settle Up — {settlements.length} Transaction{settlements.length !== 1 ? 's' : ''}
          </h4>
          <span className="text-xs text-gray-400">
            Minimum possible
          </span>
        </div>

        <div className="space-y-3">
          {settlements.map((settlement, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl"
            >
              {/* Payer */}
              <div className="text-center flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-700 mx-auto mb-1">
                  {settlement.from.memberName.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-gray-600 font-medium max-w-16 truncate">
                  {settlement.from.memberName}
                </p>
              </div>

              {/* Arrow + amount */}
              <div className="flex-1 text-center">
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {formatCurrency(settlement.amount)}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <div className="h-px flex-1 bg-primary-300" />
                  <span className="text-primary-600 text-sm">→</span>
                  <div className="h-px flex-1 bg-primary-300" />
                </div>
              </div>

              {/* Receiver */}
              <div className="text-center flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700 mx-auto mb-1">
                  {settlement.to.memberName.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-gray-600 font-medium max-w-16 truncate">
                  {settlement.to.memberName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SettlementView;