import React from 'react';
import { motion } from 'framer-motion';

function CampaignCard({ campaign, index, onClick }) {
  const statusColors = {
    draft: 'var(--text-muted)',
    fired: 'var(--green)',
    sending: 'var(--yellow)',
  };

  const statusBg = {
    draft: 'rgba(85, 85, 112, 0.15)',
    fired: 'rgba(0, 214, 143, 0.15)',
    sending: 'rgba(255, 170, 0, 0.15)',
  };

  const channelEmoji = {
    whatsapp: '💬',
    sms: '📱',
    email: '📧',
    rcs: '✨',
  };

  const stats = campaign.stats || {};
  const total = stats.total || 0;
  const delivered = stats.delivered || 0;
  const opened = stats.opened || 0;
  const clicked = stats.clicked || 0;
  const failed = stats.failed || 0;
  const converted = stats.converted || 0;

  const openRate = total > 0
    ? Math.round(((opened + clicked + converted) / total) * 100)
    : 0;

  const deliveryRate = total > 0
    ? Math.round(((delivered + opened + clicked + converted) / total) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Channel icon */}
      <div style={{
        width: '44px',
        height: '44px',
        background: 'var(--bg-secondary)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.3rem',
        flexShrink: 0,
      }}>
        {channelEmoji[campaign.channel] || '📨'}
      </div>

      {/* Campaign info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.3rem',
        }}>
          <h3 style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {campaign.name}
          </h3>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: statusColors[campaign.status] || 'var(--text-muted)',
            background: statusBg[campaign.status] || 'transparent',
            padding: '0.15rem 0.5rem',
            borderRadius: '20px',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {campaign.status}
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}>
          <span>segment: <strong style={{
            color: 'var(--text-secondary)'
          }}>{campaign.segment_tag}</strong></span>
          {total > 0 && (
            <>
              <span>📨 {total} sent</span>
              <span>📬 {deliveryRate}% delivered</span>
              <span>👁️ {openRate}% opened</span>
              {converted > 0 && (
                <span style={{ color: 'var(--green)' }}>
                  ✅ {converted} converted
                </span>
              )}
              {failed > 0 && (
                <span style={{ color: 'var(--red)' }}>
                  ❌ {failed} failed
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        color: 'var(--text-muted)',
        fontSize: '1.2rem',
        flexShrink: 0,
      }}>→</div>
    </motion.div>
  );
}

export default CampaignCard;