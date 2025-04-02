import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Title, BarChart, DonutChart } from '@tremor/react';
import { motion } from 'framer-motion';

function Dashboard() {
  const [expenseData, setExpenseData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expensesRes, categoriesRes] = await Promise.all([
          axios.get('/api/expenses/expenses/month'),
          axios.get('/api/expenses/expenses/category-wise')
        ]);

        setExpenseData(expensesRes.data.data);
        setCategoryData(categoriesRes.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Title>Monthly Expenses</Title>
          <BarChart
            data={expenseData}
            index="date"
            categories={["amount"]}
            colors={["blue"]}
            valueFormatter={(number) => `$${number.toFixed(2)}`}
            yAxisWidth={60}
          />
        </Card>

        <Card>
          <Title>Expenses by Category</Title>
          <DonutChart
            data={categoryData}
            category="amount"
            index="category"
            valueFormatter={(number) => `$${number.toFixed(2)}`}
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
          />
        </Card>
      </div>

      <Card>
        <Title>Recent Activity</Title>
        <div className="mt-4">
          {expenseData.slice(-5).map((expense, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-3 border-b last:border-0"
            >
              <span className="text-gray-600">{expense.date}</span>
              <span className="font-medium">${expense.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

export default Dashboard;