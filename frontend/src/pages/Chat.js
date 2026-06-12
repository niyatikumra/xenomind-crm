import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, createCampaignFromChat } from '../services/api';

function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm XenoMind 👋 I know your DRIP customer data inside out. Tell me who you want to reach and what you want to say — I'll handle the rest.\n\nTry: *\"Win back customers who haven't shopped in 60 days\"*",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaignPreview, setCampaignPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (location.state?.insight) {
      const insight = location.state.insight;
      setInput(`${insight.action} — segment: ${insight.segment_tag}, ${insight.customer_count} customers`);
    }
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setCampaignPreview(null);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    try {
      const res = await sendChatMessage(userMsg, history);
      const aiResponse = res.data.response;
      const campaignData = res.data.campaign_data;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
      }]);

      setHistory(prev => [
        ...prev,
        { role: 'user', content: userMsg },
        { role: 'assistant', content: aiResponse },
      ]);

      if (campaignData) {
        setCampaignPreview(campaignData);
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I hit an error. Make sure the backend is running and API key is set!",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!campaignPreview) return;
    setCreating(true);
    try {
      const res = await createCampaignFromChat(campaignPreview);
      const campaignId = res.data.campaign_id;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Campaign created! Redirecting to War Room to fire it...`,
      }]);

      setTimeout(() => {
        navigate(`/warroom/${campaignId}`);
      }, 1500);

    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
      setCampaignPreview(null);
    }
  };

  const channelEmoji = {
    whatsapp: '💬',
    sms: '📱',
    email: '📧',
    rcs: '✨',
  };

  const suggestedPrompts = [
    "Win back customers inactive for 60+ days",
    "Send VIP early access to new collection",
    "Nurture first-time buyers with welcome offer",
    "Re-engage at-risk customers before they churn",
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', height: 'calc(100vh - 128px)' }}>

      {/* Chat Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'var(--accent)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
          }}>⚡</div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>XenoMind AI</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--green)' }}>● Online · DRIP data loaded</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '0.875rem 1.125rem',
                  borderRadius: msg.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'var(--accent)'
                    : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: '4px', padding: '0.5rem' }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                  style={{
                    width: '8px',
                    height: '8px',
                    background: 'var(--accent)',
                    borderRadius: '50%',
                  }}
                />
              ))}
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length === 1 && (
          <div style={{
            padding: '0 1.5rem 1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.75rem',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Tell XenoMind who to reach..."
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ padding: '0.75rem 1.25rem' }}
          >
            {loading ? '...' : '→'}
          </motion.button>
        </div>
      </div>

      {/* Campaign Preview Panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>

        <AnimatePresence>
          {campaignPreview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--accent)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 0 30px var(--accent-glow)',
              }}
            >
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--accent)',
                marginBottom: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                ⚡ Campaign Ready
              </h3>

              {[
                { label: 'Campaign', value: campaignPreview.campaign_name },
                { label: 'Segment', value: campaignPreview.segment_tag },
                { label: 'Audience', value: `${campaignPreview.customer_count} customers` },
                { label: 'Channel', value: `${channelEmoji[campaignPreview.channel]} ${campaignPreview.channel}` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}

              {/* Message preview */}
              <div style={{
                margin: '1rem 0',
                padding: '0.875rem',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                borderLeft: '3px solid var(--accent)',
              }}>
                <p style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>Message</p>
                <p style={{
                  fontSize: '0.83rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}>
                  {campaignPreview.message}
                </p>
              </div>

              {/* Reasoning */}
              {campaignPreview.reasoning && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(124,92,252,0.08)',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent)',
                    lineHeight: 1.5,
                  }}>
                    🧠 {campaignPreview.reasoning}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary"
                  onClick={handleApprove}
                  disabled={creating}
                  style={{ flex: 1 }}
                >
                  {creating ? '🔄 Creating...' : '🚀 Approve & Fire'}
                </motion.button>
                <button
                  className="btn-secondary"
                  onClick={() => setCampaignPreview(null)}
                >
                  Edit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips card */}
        {!campaignPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              💡 What XenoMind can do
            </h3>
            {[
              '🎯 Find the right audience from your data',
              '✍️ Write personalized campaign messages',
              '📡 Pick the best channel for each segment',
              '📊 Suggest campaigns based on behavior',
              '🔄 Recommend retries when engagement is low',
            ].map((tip, i) => (
              <p key={i} style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                marginBottom: '0.6rem',
                lineHeight: 1.5,
              }}>
                {tip}
              </p>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Chat;