import { useState } from 'react';
import { VerticalCalendar } from './VerticalCalendar';

interface TabNavigationProps {
  family: {
    _id: string;
    name: string;
    inviteCode?: string;
    inviteCodeExpiresAt?: number;
  };
  userEmail?: string;
  homeContent: React.ReactNode;
}

type TabType = 'home' | 'calendar';

export function TabNavigation({ family, userEmail: _userEmail, homeContent }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Startseite',
      icon: '🏠',
      color: 'beos-icon-green'
    },
    {
      id: 'calendar' as TabType,
      label: 'Kalender',
      icon: '📅',
      color: 'beos-icon-purple'
    }
  ];

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px',
        flexShrink: 0,
        justifyContent: 'space-evenly'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'beos-button beos-button-primary' : 'beos-button'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              minWidth: 'auto',
              transition: 'all 0.2s ease',
              boxShadow: 'none'
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'home' && (
          <div style={{ 
            flex: 1,
            overflow: 'auto'
          }}>
            {homeContent}
          </div>
        )}
        
        {activeTab === 'calendar' && (
          <VerticalCalendar familyId={family._id} />
        )}
      </div>
    </div>
  );
}
