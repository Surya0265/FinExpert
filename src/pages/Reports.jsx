import React, { useState } from 'react';
import axios from 'axios';
import { Card, Title } from '@tremor/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function Reports() {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/report/download-report?days=${days}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Financial_Report_${days}days.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReport = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/report/send-report', { email, days });
      toast.success('Report sent to your email');
      setEmail('');
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Failed to send report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Title>Download Report</Title>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="days" className="label">Number of Days</label>
            <select
              id="days"
              className="input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Downloading...' : 'Download PDF Report'}
          </button>
        </div>
      </Card>

      <Card>
        <Title>Email Report</Title>
        <form onSubmit={handleEmailReport} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <input
              type="email"
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="emailDays" className="label">Number of Days</label>
            <select
              id="emailDays"
              className="input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Sending...' : 'Send Report to Email'}
          </button>
        </form>
      </Card>
    </motion.div>
  );
}

export default Reports;