import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, Database, Gavel, Fingerprint } from 'lucide-react';
import './App.css';
import { LoginScreen } from './components/LoginScreen';
import LedgerInspector from './components/LedgerInspector';
import MacroReview from './components/MacroReview';
import ExilePanel from './components/ExilePanel';
import B2BOrchestration from './components/B2BOrchestration';
import HashCollider from './components/HashCollider';
import { getToken } from './services/api';

interface Notification {
  id: number;
  message: string;
  timestamp: Date;
}

function ToastOverlay({ notifications, onDismiss }: { notifications: Notification[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-overlay">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="toast-item"
        >
          <div>
            <div className="system-event-title">SYSTEM EVENT</div>
            <div>{n.message}</div>
            <div className="toast-timestamp">
              {n.timestamp.toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="dismiss-button"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MACRO_QUEUE' | 'TRUTH_LOG' | 'HASH_COLLIDER' | 'EXILE' | 'B2B'>('MACRO_QUEUE');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // SSE connection for real-time updates
  useEffect(() => {
    if (!userId) return;

    const token = getToken();
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`http://localhost:3000/notifications/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) => [
            { id: Date.now(), message: data.message, timestamp: new Date() },
            ...prev.slice(0, 19), // Keep last 20
          ]);
        } catch {
          // Ignore malformed SSE messages
        }
      };

      eventSource.onerror = () => {
        // SSE connection failed — silently reconnect is handled by EventSource
        // No action needed; EventSource auto-reconnects
      };
    } catch {
      // EventSource constructor failed — API may not support SSE yet
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userId]);

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(0, -1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  if (!userId) {
    return <LoginScreen onLogin={setUserId} />;
  }

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <ToastOverlay notifications={notifications} onDismiss={dismissNotification} />

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="gavel-icon-container">
            {React.createElement(Gavel as any, { color: "#000" })}
          </div>
          <div>
            <h1 className="header-title">THE JUDGE</h1>
            <p className="header-subtitle">Styx Protocol - Admin Console</p>
          </div>
        </div>
        <div className="header-right">
          <div className="level-5-badge">
            {React.createElement(Shield as any, { size: 14 })} LEVEL 5 CLEARANCE ACTIVE
          </div>
          <button
            onClick={() => {
              setUserId(null);
              setNotifications([]);
            }}
            className="logout-button"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <div className="layout-grid">
        {/* Sidebar */}
        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveTab('MACRO_QUEUE')}
            className={`nav-button ${activeTab === 'MACRO_QUEUE' ? 'active' : ''}`}
          >
            {React.createElement(Activity as any, { size: 16 })} Dashboard / Queue
          </button>

          <button
            onClick={() => setActiveTab('TRUTH_LOG')}
            className={`nav-button ${activeTab === 'TRUTH_LOG' ? 'active' : ''}`}
          >
            {React.createElement(Database as any, { size: 16 })} Truth Log Inspector
          </button>

          <button
            onClick={() => setActiveTab('HASH_COLLIDER')}
            className={`nav-button ${activeTab === 'HASH_COLLIDER' ? 'active' : ''}`}
          >
            {React.createElement(Fingerprint as any, { size: 16 })} Hash Collider
          </button>

          <div className="nav-divider"></div>

          <button
            onClick={() => setActiveTab('EXILE')}
            className={`nav-button exile-tab ${activeTab === 'EXILE' ? 'active' : ''}`}
          >
            {React.createElement(Shield as any, { size: 16 })} Ban / Exile Entity
          </button>

          <div className="nav-divider"></div>

          <button
            onClick={() => setActiveTab('B2B')}
            className={`nav-button ${activeTab === 'B2B' ? 'active' : ''}`}
          >
            Enterprise B2B Keys
          </button>
        </nav>

        {/* Main Content Pane */}
        <main>
          {activeTab === 'MACRO_QUEUE' && <MacroReview />}
          {activeTab === 'TRUTH_LOG' && <LedgerInspector />}
          {activeTab === 'HASH_COLLIDER' && <HashCollider />}
          {activeTab === 'EXILE' && <ExilePanel />}
          {activeTab === 'B2B' && <B2BOrchestration />}
        </main>
      </div>
    </div>
  );
}
