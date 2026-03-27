import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertStore, type Alert } from '../../stores/alertStore';
import styles from './AlertBadge.module.css';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function alertIcon(type: Alert['type']): string {
  switch (type) {
    case 'favorite-batting': return '\u26BE';
    case 'close-game': return '\u{1F525}';
    case 'game-ended': return '\u{1F3C1}';
  }
}

export function AlertBadge() {
  const navigate = useNavigate();
  const alerts = useAlertStore((s) => s.alerts);
  const isDropdownOpen = useAlertStore((s) => s.isDropdownOpen);
  const toggleDropdown = useAlertStore((s) => s.toggleDropdown);
  const closeDropdown = useAlertStore((s) => s.closeDropdown);
  const markAsRead = useAlertStore((s) => s.markAsRead);
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead);
  const dismissAlert = useAlertStore((s) => s.dismissAlert);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen, closeDropdown]);

  const handleAlertClick = (alert: Alert) => {
    markAsRead(alert.id);
    closeDropdown();
    navigate(`/game/${alert.gamePk}`);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {unreadCount > 0 && (
        <button className={styles.badge} onClick={toggleDropdown} type="button" aria-label={`${unreadCount} alerts`}>
          {unreadCount}
        </button>
      )}
      {isDropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Alerts</span>
            {unreadCount > 0 && (
              <button className={styles.markAll} onClick={markAllAsRead} type="button">
                Mark all read
              </button>
            )}
          </div>
          {alerts.length === 0 ? (
            <p className={styles.empty}>No alerts</p>
          ) : (
            <div className={styles.alertList}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`${styles.alertRow} ${alert.isRead ? styles.read : ''}`}
                  onClick={() => handleAlertClick(alert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAlertClick(alert);
                  }}
                >
                  <span className={styles.alertIcon}>{alertIcon(alert.type)}</span>
                  <div className={styles.alertContent}>
                    <span className={styles.alertMessage}>{alert.message}</span>
                    <span className={styles.alertTime}>{timeAgo(alert.timestamp)}</span>
                  </div>
                  <button
                    className={styles.dismiss}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissAlert(alert.id);
                    }}
                    type="button"
                    aria-label="Dismiss"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
