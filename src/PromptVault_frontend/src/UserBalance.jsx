import React, { useState, useEffect } from "react";
import { Wallet, RefreshCw } from "lucide-react";

const UserBalance = ({ user, icpAgent }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [ledgerBalance, setLedgerBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && icpAgent) {
      fetchLedgerBalance();
    }
  }, [user, icpAgent]);

  const fetchLedgerBalance = async () => {
    if (!user || !icpAgent) return;

    try {
      setLoading(true);
      const response = await icpAgent.getUserLedgerBalance(user.id);
      if (response.success) {
        setLedgerBalance(response.data);
      } else {
        console.error("Failed to fetch ledger balance:", response.error);
      }
    } catch (err) {
      console.error("Failed to fetch ledger balance:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount) => {
    if (amount === null || amount === undefined) return "0.00000000";
    return (Number(amount) / 100_000_000).toFixed(8);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0.00";
    const icpPrice = 12.5; // Example price in USD
    return ((Number(amount) / 100_000_000) * icpPrice).toFixed(2);
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center text-gray-500">
          <Wallet className="w-8 h-8 mr-2" />
          <span>Please sign in to view balance</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Your Balance</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLedgerBalance}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {/* Main Balance */}
      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-800">
            {loading
              ? "Loading..."
              : showBalance
              ? formatBalance(ledgerBalance)
              : "••••••••"}
          </span>
          <span className="text-sm text-gray-600 ml-2">ICP</span>
        </div>
        <div className="text-sm text-gray-500">
          ≈ $
          {loading
            ? "Loading..."
            : showBalance
            ? formatCurrency(ledgerBalance)
            : "••••"}{" "}
          USD
        </div>
        <div className="text-xs text-blue-600 mt-1">
          💡 Real-time balance from Internet Computer ledger
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Platform Activity
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Earned</p>
            <p className="text-lg font-semibold text-green-600">
              {showBalance ? formatBalance(user.total_earnings) : "••••••••"}{" "}
              ICP
            </p>
            <p className="text-xs text-gray-400">
              ≈ ${showBalance ? formatCurrency(user.total_earnings) : "••••"}{" "}
              USD
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-lg font-semibold text-red-600">
              {showBalance ? formatBalance(user.total_spent) : "••••••••"} ICP
            </p>
            <p className="text-xs text-gray-400">
              ≈ ${showBalance ? formatCurrency(user.total_spent) : "••••"} USD
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Deposit
        </button>
        <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default UserBalance;
