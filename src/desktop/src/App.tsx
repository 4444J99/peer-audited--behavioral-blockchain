import React, { useState } from 'react';
import { Shield, Activity, Database, Gavel } from 'lucide-react';
import LedgerInspector from './components/LedgerInspector';
import MacroReview from './components/MacroReview';
import ExilePanel from './components/ExilePanel';
import B2BOrchestration from './components/B2BOrchestration';

export default function App() {
  const [activeTab, setActiveTab] = useState<'MACRO_QUEUE' | 'TRUTH_LOG' | 'EXILE' | 'B2B'>('MACRO_QUEUE');

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#DC2626', width: '3rem', height: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {React.createElement(Gavel as any, { color: "#000" })}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>THE JUDGE</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>Styx Protocol • Admin Console</p>
          </div>
        </div>
        <div style={{ padding: '0.5rem 1rem', border: '1px solid #DC2626', backgroundColor: 'rgba(220,38,38,0.1)', color: '#DC2626', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {React.createElement(Shield as any, { size: 14 })} LEVEL 5 CLEARANCE ACTIVE
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 4fr', gap: '2rem' }}>
        {/* Sidebar */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('MACRO_QUEUE')}
            style={{ 
              backgroundColor: activeTab === 'MACRO_QUEUE' ? '#1A1A1A' : 'transparent', 
              border: '1px solid', borderColor: activeTab === 'MACRO_QUEUE' ? '#333' : 'transparent', 
              color: activeTab === 'MACRO_QUEUE' ? '#fff' : '#666', 
              padding: '1rem', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            {React.createElement(Activity as any, { size: 16 })} Dashboard / Queue
          </button>
          
          <button 
            onClick={() => setActiveTab('TRUTH_LOG')}
            style={{ 
              backgroundColor: activeTab === 'TRUTH_LOG' ? '#1A1A1A' : 'transparent', 
              border: '1px solid', borderColor: activeTab === 'TRUTH_LOG' ? '#333' : 'transparent', 
              color: activeTab === 'TRUTH_LOG' ? '#fff' : '#666', 
              padding: '1rem', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            {React.createElement(Database as any, { size: 16 })} Truth Log Inspector
          </button>

          <div style={{ borderTop: '1px solid #333', margin: '1rem 0' }}></div>

          <button 
            onClick={() => setActiveTab('EXILE')}
            style={{ 
              backgroundColor: activeTab === 'EXILE' ? '#1A1A1A' : 'transparent', 
              border: '1px solid', borderColor: activeTab === 'EXILE' ? '#DC2626' : 'transparent', 
              color: activeTab === 'EXILE' ? '#DC2626' : '#666', 
              padding: '1rem', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            {React.createElement(Shield as any, { size: 16 })} Ban / Exile Entity
          </button>

          <div style={{ borderTop: '1px solid #333', margin: '1rem 0' }}></div>

          <button 
            onClick={() => setActiveTab('B2B')}
            style={{ 
              backgroundColor: activeTab === 'B2B' ? '#1A1A1A' : 'transparent', 
              border: '1px solid', borderColor: activeTab === 'B2B' ? '#333' : 'transparent', 
              color: activeTab === 'B2B' ? '#fff' : '#666', 
              padding: '1rem', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            Enterprise B2B Keys
          </button>
        </nav>

        {/* Main Content Pane */}
        <main>
          {activeTab === 'MACRO_QUEUE' && <MacroReview />}
          {activeTab === 'TRUTH_LOG' && <LedgerInspector />}
          {activeTab === 'EXILE' && <ExilePanel />}
          {activeTab === 'B2B' && <B2BOrchestration />}
        </main>
      </div>
    </div>
  );
}
