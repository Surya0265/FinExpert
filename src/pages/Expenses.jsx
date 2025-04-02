import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Title } from '@tremor/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ amount: '', category: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses/getexpenses');
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/expenses/addexpenses', newExpense);
      toast.success('Expense added successfully');
      setNewExpense({ amount: '', category: '' });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      await axios.delete(`/api/expenses/expenses/${expenseId}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
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
        <Title>Add New Expense</Title>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="amount" className="label">Amount</label>
            <input
              type="number"
              id="amount"
              className="input"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select
              id="category"
              className="input"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              <option value="Food">Food</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Add Expense
          </button>
        </form>
      </Card>

      <Card>
        <Title>Expense History</Title>
        <div className="mt-4 space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.expense_id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
            >
              <div>
                <p className="font-medium">{expense.category}</p>
                <p className="text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold">${expense.amount.toFixed(2)}</span>
                <button
                  onClick={() => handleDelete(expense.expense_id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

export default Expenses;