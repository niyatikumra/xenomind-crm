import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampaigns, getCampaign, fireCampaign, streamCampaign } from '../services/api';
import CampaignCard from '../components/CampaignCard';

function WarRoom() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firing, setFiring] = useState(false);
  const [retryPrompt, setRetryPrompt] = useState(false);
  const eventRef = useRef(null);
  const sseRef = useRef(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign(campaignId);
    }
  }, [campaignId]);

  useEffect(() => {
    if (eventRef.current) {
      eventRef.current.scrollTop = eventRef.current.scrollHeight;
    }
  }, [eventLog]);

  const fetchCampaigns = async () => {
    try {
      const res = await getCampaigns();
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaign = async (id) => {
    try {
      const res = await getCampaign(id);
      setActiveCampaign(res.data);
      setStats(res.data.stats);
      startSSE(id);
    } catch (err) {
      console.error(err);
    }
  };

  const startSSE = (id) => {
    if (sseRef.current) sseRef.current.close();
    sseRef.current = streamCampaign(id, (data) => {
      if (data.type === 'stats_update') {
        setStats(data.stats);
        if (data.event) {
          setEventLog(prev => [{
            ...data.event,
            id: Date.now(),
          }, ...prev].slice(0, 50));

          // Low open rate check
          if (data.stats.total > 10 &&
            data.stats.opened / data.stats.total < 0.2 &&
            data.stats.delivered > 5) {
            setRetryPrompt(true);
          }
        }
      }
    });
  };

  const handleFire = async (id) => {
    setFiring(true);
    try {
      await fireCampaign(id);
      await fetchCampaign(id);
      setEventLog([{
        id: Date.now(),
        event_type: 'fired',
        customer_name: 'System',
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setFiring(false);
    }
  };

  const eventColor = {
    sent: 'var(--text-muted)',
    delivered: 'var(--blue)',
    opened: 'var(--yellow)',
    clicked: 'var(--accent)',
    converted: 'var(--green)',
    failed: 'var(--red)',
    fired: 'var(--green)',
  };

  const eventEmoji = {
    sent: '📨',
    delivered: '📬',
    opened: '👁️',
    clicked: '🖱️',
    converted: '✅',
    failed: '❌',
    fired: '🚀',
  };

  const FunnelBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.4rem',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {label}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
            {value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              ({pct}%)
            </span>
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading War Room...</div>;

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>🔴 Campaign War Room</h1>
        <p>Live campaign performance — powered by XenoMind</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: activeCampaign ? '1fr 1.5fr' : '1fr', gap: '1.5rem' }}>

        {/* Campaign List */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            All Campaigns
          </h2>
          {campaigns.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px dashed var(--border)',
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                No campaigns yet
              </p>
              <button className="btn-primary" onClick={() => navigate('/chat')}>
                Create with AI →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {campaigns.map((c, i) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  index={i}
                  onClick={() => navigate(`/warroom/${c.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Stats */}
        {activeCampaign && stats && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Campaign header */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {activeCampaign.name}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {activeCampaign.channel} · {activeCampaign.segment_tag}
                  </p>
                </div>
                {activeCampaign.status === 'draft' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                    onClick={() => handleFire(activeCampaign.id)}
                    disabled={firing}
                  >
                    {firing ? '🔄 Firing...' : '🚀 Fire Campaign'}
                  </motion.button>
                )}
                {activeCampaign.status === 'fired' && (
                  <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--green)',
                    background: 'rgba(0,214,143,0.1)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontWeight: 600,
                  }}>
                    🟢 LIVE
                  </span>
                )}
              </div>

              {/* Message preview */}
              <div style={{
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--accent)',
              }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                }}>
                  "{activeCampaign.message.substring(0, 100)}..."
                </p>
              </div>
            </div>

            {/* Funnel Stats */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                📊 Live Funnel
              </h3>

              <FunnelBar label="📨 Sent" value={stats.total} total={stats.total} color="var(--text-secondary)" />
              <FunnelBar label="📬 Delivered" value={stats.delivered + stats.opened + stats.clicked + stats.converted} total={stats.total} color="var(--blue)" />
              <FunnelBar label="👁️ Opened" value={stats.opened + stats.clicked + stats.converted} total={stats.total} color="var(--yellow)" />
              <FunnelBar label="🖱️ Clicked" value={stats.clicked + stats.converted} total={stats.total} color="var(--accent)" />
              <FunnelBar label="✅ Converted" value={stats.converted} total={stats.total} color="var(--green)" />
              <FunnelBar label="❌ Failed" value={stats.failed} total={stats.total} color="var(--red)" />
            </div>

            {/* AI Retry Prompt */}
            <AnimatePresence>
              {retryPrompt && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: 'rgba(255,170,0,0.08)',
                    border: '1px solid rgba(255,170,0,0.3)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--yellow)' }}>
                      💡 XenoMind Suggestion
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Open rate is low. Retry unopened on SMS?
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => {
                        navigate('/chat');
                        setRetryPrompt(false);
                      }}
                    >
                      Retry →
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => setRetryPrompt(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Event Log */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
            }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                marginBottom: '1rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                ⚡ Live Event Log
              </h3>
              <div
                ref={eventRef}
                style={{
                  maxHeight: '250px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                {eventLog.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Waiting for events...
                  </p>
                ) : (
                  <AnimatePresence>
                    {eventLog.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.4rem 0.6rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <span>{eventEmoji[event.event_type] || '📌'}</span>
                        <span style={{ color: eventColor[event.event_type] || 'var(--text-muted)', fontWeight: 600 }}>
                          {event.event_type}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {event.customer_name}
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default WarRoom;