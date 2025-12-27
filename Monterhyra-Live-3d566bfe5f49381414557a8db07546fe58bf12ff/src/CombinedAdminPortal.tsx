import React, { useState } from 'react';
import AdminPortal from './AdminPortal';
import ExhibitorAdmin from './ExhibitorAdmin';

const CombinedAdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'exhibitors'>('orders');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%'
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        backgroundColor: '#2c3e50',
        borderBottom: '2px solid #34495e',
        padding: 0,
        margin: 0
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: activeTab === 'orders' ? '#3498db' : '#2c3e50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
        >
          📦 Beställningar
        </button>
        <button
          onClick={() => setActiveTab('exhibitors')}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: activeTab === 'exhibitors' ? '#3498db' : '#2c3e50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
        >
          🎪 Utställare
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px'
      }}>
        {activeTab === 'orders' && (
          <AdminPortal />
        )}
        {activeTab === 'exhibitors' && (
          <ExhibitorAdmin />
        )}
      </div>
    </div>
  );
};

export default CombinedAdminPortal;
