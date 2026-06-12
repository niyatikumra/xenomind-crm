import React from 'react';
import { motion } from 'framer-motion';

function InsightCard({ insight, index, onAction }) {
  const priorityColors = {
    high: 'var(--red)',
    medium: 'var(--yellow)',
    low: 'var(--green)',
  };

  const priorityBg = {
    high: 'rgba(255, 77, 106, 0.08)',
    medium: 'rgba(255, 170, 0, 0.08)',
    low: 'rgba(0, 214, 143, 0.08)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Priority glow top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: priorityColors[insight.priority],
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <span style={{ fontSize: '2rem' }}>{insight.emoji}</span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: priorityColors[insight.priority],
          background: priorityBg[insight.priority],
          padding: '0.2rem 0.6rem',
          borderRadius: '20px',
        }}>
          {insight.priority}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
        lineHeight: 1.4,
      }}>
        {insight.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: '1rem',
      }}>
        {insight.description}
      </p>

      {/* Customer count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
      }}>
        <span style={{ fontSize: '0.8rem' }}>👥</span>
        <span style={{
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>
            {insight.customer_count}
          </strong> customers · {insight.suggested_channel}
        </span>
      </div>

      {/* Suggested message preview */}
      <div style={{
        padding: '0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        marginBottom: '1rem',
        borderLeft: `3px solid ${priorityColors[insight.priority]}`,
      }}>
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}>
          "{insight.suggested_message.substring(0, 80)}..."
        </p>
      </div>

      {/* Action button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAction}
        style={{
          width: '100%',
          padding: '0.7rem',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {insight.action} →
      </motion.button>
    </motion.div>
  );
}

export default InsightCard;