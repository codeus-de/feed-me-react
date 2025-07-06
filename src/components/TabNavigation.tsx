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
  headerContent?: React.ReactNode; // New prop for header content in mobile landscape
}

type TabType = 'home' | 'calendar';

export function TabNavigation({ family, userEmail: _userEmail, homeContent, headerContent }: TabNavigationProps) {
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
      flexDirection: 'row' // Default: Desktop Layout
    }}
    className="tab-container">
      {/* Left Sidebar Navigation - Desktop/Tablet */}
      <div style={{ 
        width: '200px',
        background: 'rgb(0 0 0 / 75%)',
        borderRight: 'none',
        boxShadow: '2px 0 12px rgba(0, 0, 0, 0.08)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexShrink: 0
      }}
      className="desktop-nav">
        {/* Header Content - Only shown in mobile landscape */}
        <div className="sidebar-header" style={{
          display: 'none', // Hidden by default, shown in mobile landscape via CSS
          paddingBottom: '16px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--color-border)'
        }}>
          {headerContent}
        </div>
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              textAlign: 'left',
              width: '100%'
            }}
          >
            {/* Icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              background: activeTab === tab.id 
                ? (tab.id === 'home' ? 'var(--color-accent-green)' : 'var(--color-accent-purple)')
                : 'var(--color-surface)',
              color: activeTab === tab.id ? 'white' : 'var(--color-text)',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id 
                ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
              flexShrink: 0
            }}>
              {tab.icon}
            </div>
            
            {/* Label */}
            <span style={{
              fontSize: '16px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-subtle)',
              transition: 'all 0.2s ease'
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="main-content">
        {activeTab === 'home' && (
          <div style={{ 
            flex: 1,
            overflow: 'auto'
          }}>
            {homeContent}
          </div>
        )}
        
        {activeTab === 'calendar' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <VerticalCalendar familyId={family._id} />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - Fixed bottom area on mobile portrait */}
      <div style={{ 
        background: 'rgb(0 0 0 / 75%)',
        borderTop: 'none',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        flexShrink: 0
      }}
      className="mobile-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px',
              outline: 'none'
            }}
          >
            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              background: activeTab === tab.id 
                ? (tab.id === 'home' ? 'var(--color-accent-green)' : 'var(--color-accent-purple)')
                : 'var(--color-surface)',
              color: activeTab === tab.id ? 'white' : 'var(--color-text)',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id 
                ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
                : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              {tab.icon}
            </div>
            
            {/* Label */}
            <span style={{
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-subtle)',
              transition: 'all 0.2s ease'
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
