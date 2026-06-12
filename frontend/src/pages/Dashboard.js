import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getInsights, getCampaigns } from '../services/api';
import InsightCard from '../components/InsightCard';
import CampaignCard from '../components/CampaignCard';

function Dashboard() {
  const [insights, setInsights] = useState([]);
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [insightsRes, campaignsRes] = await Promise.all([
        getInsights(),
        getCampaigns(),
      ]);
      setInsights(insightsRes.data.insights);
      setStats(insightsRes.data.stats);
      setCampaigns(campaignsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading XenoMind...</div>;

  return (
    <div>
      {/* Page Header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>Good morning, Ayesha 👋</h1>
        <p>Here's what XenoMind found for DRIP today</p>
      </motion.div>

      {/* Stats Row */}
      {stats && (
        <motion.div
          className="stats-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {[
            { label: 'Total Customers', value: stats.total_customers, icon: '👥' },
            { label: 'Campaigns Fired', value: stats.fired_campaigns, icon: '🚀' },
            { label: 'At Risk', value: stats.segments.at_risk + stats.segments.churned, icon: '⚠️' },
            { label: 'VIP Customers', value: stats.segments.vip, icon: '👑' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ scale: 1.03 }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              🧠 XenoMind Insights
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              AI-detected opportunities in your customer base
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => navigate('/chat')}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            + Custom Campaign
          </button>
        </div>

        <div className="grid-3">
          {insights.map((insight, i) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              index={i}
              onAction={() => navigate('/chat', { state: { insight } })}
            />
          ))}
        </div>
      </motion.div>

      {/* Recent Campaigns */}
      {campaigns.length > 0 && (
        <motion.div
          style={{ marginTop: '2rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              🚀 Recent Campaigns
            </h2>
            <button
              className="btn-secondary"
              onClick={() => navigate('/warroom')}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              View War Room →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.map((campaign, i) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                index={i}
                onClick={() => navigate(`/warroom/${campaign.id}`)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {campaigns.length === 0 && (
        <motion.div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px dashed var(--border)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            No campaigns yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Let XenoMind create your first campaign
          </p>
          <button className="btn-primary" onClick={() => navigate('/chat')}>
            Start with AI →
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;