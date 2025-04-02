import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Title } from '@tremor/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function Budget() {
  const [budget, setBudget] = useState({ total_amount: '', manual_allocations: {} });
  const [alerts, setAlerts] = useState({});
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const [alertsRes, adviceRes] = await Promise.all([
        axios.get('/api/budgets/alerts'),
        axios.get('/api/budgets/advice?period=month')
      ]);

      setAlerts(alertsRes.data.alerts);
      setAdvice(adviceRes.data.advice);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast.error('Failed to load budget data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/budgets/set', budget);
      toast.success('Budget set successfully');
      fetchBudgetData();
    } catch (error) {
      console.error('Error setting budget:', error);
      toast.error('Failed to set budget');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Title>Set Monthly Budget</Title>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="total_amount" className="label">Total Budget Amount</label>
            <input
              type="number"
              id="total_amount"
              className="input"
              value={budget.total_amount}
              onChange={(e) => setBudget({ ...budget, total_amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Set Budget
          </button>
        </form>
      </Card>

      {Object.keys(alerts).length > 0 && (
        <Card>
          <Title>Budget Alerts</Title>
          <div className="mt-4 space-y-2">
            {Object.entries(alerts).map(([category, message]) => (
              <div
                key={category}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-700">{message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {advice && (
        <Card>
          <Title>AI Financial Advice</Title>
          <div className="mt-4 prose">
            <p className="text-gray-700 whitespace-pre-line">{advice}</p>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

export default Budget;