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
import { TabNavigation } from "./components/TabNavigation";
import { FamilyHomeContent } from "./components/FamilyDisplay";
import logoImage from "./assets/koobi-96.png";

export default function App() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <header style={{ 
        background: 'rgb(0 0 0 / 48%)', 
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        flexShrink: 0
      }}
      className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src={logoImage} 
            alt="Koobi Logo" 
            style={{ 
              objectFit: 'contain'
            }} 
          />
        </div>
        <SignOutButton />
      </header>
      <main style={{ 
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
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
            width: '40px',
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

function HeaderContent() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src={logoImage} 
          alt="Koobi Logo" 
          style={{ 
            objectFit: 'contain',
            width: '32px',
            height: '32px'
          }} 
        />
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--color-text)',
          margin: 0
        }}>
          Koobi
        </h1>
      </div>
      <SignOutButton />
    </div>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ padding: '32px' }}>
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

function Content() {
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
      <div style={{ padding: '32px' }}>
        <CreateFamily />
      </div>
    );
  }

  // Ansonsten zeige die Familienansicht (TabNavigation)
  return (
    <TabNavigation 
      family={currentUserData.family} 
      userEmail={currentUserData.user?.email}
      homeContent={<FamilyHomeContent family={currentUserData.family} userEmail={currentUserData.user?.email} />}
      headerContent={<HeaderContent />}
    />
  );
}
