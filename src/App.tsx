"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { CreateFamily } from "./components/CreateFamily";
import { VerticalCalendar } from "./components/VerticalCalendar";
import { FamilyHomeContent } from "./components/FamilyDisplay";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import logoImage from "./assets/koobi-96.png";

export default function App() {
  const [activeView, setActiveView] = useState<'calendar' | 'settings'>('calendar');
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <Authenticated>
        <HeaderWithNavigation activeView={activeView} setActiveView={setActiveView} />
        <main style={{ 
          flex: 1,
          overflow: 'hidden'
        }}>
          <Content activeView={activeView} />
        </main>
      </Authenticated>
      <Unauthenticated>
        <header style={{ 
          background: 'rgb(0 0 0 / 48%)', 
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          flexShrink: 0
        }}>
          <img 
            src={logoImage} 
            alt="Koobi Logo" 
            style={{ 
              objectFit: 'contain'
            }} 
          />
        </header>
        <main style={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <SignInForm />
        </main>
      </Unauthenticated>
      <PWAInstallPrompt />
    </div>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <button
          className="beos-button"
          onClick={() => void signOut()}
          style={{ 
            padding: '0px 0px 2px 0px', 
            fontSize: '16px',
            minWidth: 'auto',
            width: '46px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Abmelden"
        >
          ⏻
        </button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ padding: '32px', overflow: 'auto' }}>
      <div className="beos-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="beos-icon beos-icon-blue" style={{ margin: '0 auto 16px' }}>🔐</div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          Anmelden
        </h2>
        <p style={{ color: 'var(--color-text-subtle)', margin: 0 }}>
          Melde dich an, um deine Familie zu verwalten
        </p>
      </div>
      
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            setError(error.message);
          });
        }}
      >
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '8px',
            color: 'var(--color-text)'
          }}>
            E-Mail
          </label>
          <input
            className="beos-input"
            type="email"
            name="email"
            placeholder="deine@email.com"
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '8px',
            color: 'var(--color-text)'
          }}>
            Passwort
          </label>
          <input
            className="beos-input"
            type="password"
            name="password"
            placeholder="Dein Passwort"
          />
        </div>

        <button
          className="beos-button beos-button-primary"
          type="submit"
        >
          {flow === "signIn" ? "Anmelden" : "Registrieren"}
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--color-text-subtle)', fontSize: '14px' }}>
            {flow === "signIn"
              ? "Noch kein Konto?"
              : "Bereits registriert?"}
          </span>
          {" "}
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-green)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Jetzt registrieren" : "Hier anmelden"}
          </button>
        </div>
        
        {error && (
          <div className="beos-error-box">
            Fehler beim Anmelden: {error}
          </div>
        )}
      </form>
    </div>
    </div>
  );
}

function Content({ activeView }: { activeView: 'calendar' | 'settings' }) {
  const currentUserData = useQuery(api.myFunctions.getCurrentUser);

  if (currentUserData === undefined) {
    return (
      <div style={{ padding: '32px' }}>
        <div className="mx-auto">
          <p>loading... (consider a loading skeleton)</p>
        </div>
      </div>
    );
  }

  // Wenn der User nicht zu einer Familie gehört, zeige CreateFamily
  if (!currentUserData?.family) {
    return (
      <div style={{ overflow: 'auto', height: '100%' }}>
        <CreateFamily />
      </div>
    );
  }

  // Content basierend auf aktiver Ansicht
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      {activeView === 'calendar' && (
        <VerticalCalendar familyId={currentUserData.family._id} />
      )}
      
      {activeView === 'settings' && (
        <div style={{ 
          height: '100%',
          overflow: 'auto'
        }}>
          <FamilyHomeContent 
            family={currentUserData.family} 
            userEmail={currentUserData.user?.email} 
          />
        </div>
      )}
    </div>
  );
}

function HeaderWithNavigation({ activeView, setActiveView }: {
  activeView: 'calendar' | 'settings';
  setActiveView: (view: 'calendar' | 'settings') => void;
}) {
  const navItems = [
    {
      id: 'calendar' as const,
      label: 'Kalender',
      icon: '📅',
      color: 'var(--color-accent-purple)'
    },
    {
      id: 'settings' as const,
      label: 'Einstellungen',
      icon: '⚙️',
      color: 'var(--color-accent-green)'
    }
  ];

  return (
    <header style={{ 
      background: 'rgb(0 0 0 / 48%)', 
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      flexShrink: 0,
      gap: '24px'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={logoImage} 
          alt="Koobi Logo" 
          style={{ 
            objectFit: 'contain'
          }} 
        />
      </div>

      {/* Navigation */}
      <nav style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        justifyContent: 'center'
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: activeView === item.id 
                ? 'var(--color-surface)' 
                : 'transparent',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              color: 'var(--color-text)',
              fontSize: '16px',
              fontWeight: activeView === item.id ? '600' : '500'
            }}
            onMouseEnter={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== item.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span className="nav-label" style={{
              // Auf mobilen Geräten Labels ausblenden
              display: 'none'
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Abmelden Button */}
      <SignOutButton />
    </header>
  );
}
