import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { handleConvexError } from "../utils/errorHandling";
import { TabNavigation } from "./TabNavigation";
import { UserPreferences } from "./UserPreferences";

interface FamilyDisplayProps {
  family: {
    _id: string;
    name: string;
    inviteCode?: string;
    inviteCodeExpiresAt?: number;
  };
  userEmail?: string;
}

export function FamilyHomeContent({ family, userEmail }: FamilyDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const generateInviteCode = useMutation(api.myFunctions.generateInviteCode);

  // Check if invite code is still valid
  const isCodeValid = family.inviteCode && 
    family.inviteCodeExpiresAt && 
    family.inviteCodeExpiresAt > Date.now();

  const handleGenerateCode = () => {
    setIsGenerating(true);
    setError(null);

    generateInviteCode({})
      .then(() => {
        // Code wurde erfolgreich generiert
      })
      .catch((err) => {
        const errorMessage = handleConvexError(err, "Fehler beim Generieren des Codes");
        setError(errorMessage);
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  const handleCopyCode = () => {
    if (family.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode)
        .then(() => {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy code:", err);
        });
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const timeLeft = expiresAt - Date.now();
    const minutes = Math.floor(timeLeft / (1000 * 60));
    
    if (minutes <= 0) return "Abgelaufen";
    if (minutes < 60) return `${minutes} Min verbleibend`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m verbleibend`;
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px',
      padding: '32px'
    }}>
      {/* Familie Header */}
      <div className="beos-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div className="beos-icon beos-icon-green">👨‍👩‍👧‍👦</div>
          <div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              margin: '0 0 8px 0',
              color: 'var(--color-text)'
            }}>
              Familie: {family.name}
            </h2>
            <p style={{ 
              color: 'var(--color-text-subtle)', 
              fontSize: '16px',
              margin: 0
            }}>
              Willkommen {userEmail ?? "Anonymous"}!
            </p>
          </div>
        </div>
      </div>

      {/* Einladungscode Sektion */}
      <div className="beos-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div className="beos-icon beos-icon-blue" style={{ marginBottom: 0 }}>📧</div>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            margin: 0,
            color: 'var(--color-text)'
          }}>
            Familienmitglieder einladen
          </h3>
        </div>
        
        {isCodeValid ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="beos-info-box" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--color-text-subtle)', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Einladungscode
                    </span>
                  </div>
                  <p style={{ 
                    fontFamily: 'Monaco, Consolas, monospace', 
                    fontSize: '20px', 
                    fontWeight: '700',
                    color: 'var(--color-text)',
                    margin: '0 0 8px 0',
                    letterSpacing: '1px'
                  }}>
                    {family.inviteCode}
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--color-accent-blue)',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {family.inviteCodeExpiresAt && formatTimeRemaining(family.inviteCodeExpiresAt)}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="beos-button beos-button-primary"
                  style={{ 
                    padding: '12px 20px',
                    fontSize: '14px',
                    background: copiedCode ? 'var(--color-accent-green)' : 'var(--color-accent-blue)'
                  }}
                >
                  {copiedCode ? "✓ Kopiert!" : "📋 Kopieren"}
                </button>
              </div>
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--color-text-subtle)',
              margin: 0,
              textAlign: 'center'
            }}>
              Teilen Sie diesen Code mit Familienmitgliedern, damit sie beitreten können.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <p style={{ 
              color: 'var(--color-text-subtle)', 
              fontSize: '16px',
              margin: 0,
              textAlign: 'center'
            }}>
              {family.inviteCode 
                ? "Der Einladungscode ist abgelaufen. Erstellen Sie einen neuen Code." 
                : "Erstellen Sie einen Einladungscode, um neue Mitglieder einzuladen."
              }
            </p>
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="beos-button beos-button-primary"
              style={{ 
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>🔗</span>
              {isGenerating ? "Wird erstellt..." : "Neuen Code erstellen"}
            </button>
          </div>
        )}

        {error && (
          <div className="beos-error-box" style={{ marginTop: '24px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="beos-info-box">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div className="beos-icon beos-icon-purple" style={{ 
            width: '40px', 
            height: '40px', 
            fontSize: '20px',
            marginBottom: 0,
            flexShrink: 0
          }}>
            💡
          </div>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--color-text)',
            margin: 0
          }}>
            So funktioniert's:
          </h4>
        </div>
        
        <div style={{ paddingLeft: '56px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--color-accent-blue)', fontSize: '16px' }}>⏰</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                Einladungscodes sind 1 Stunde gültig
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--color-accent-green)', fontSize: '16px' }}>👥</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                Neue Mitglieder können den Code verwenden, um beizutreten
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--color-accent-orange)', fontSize: '16px' }}>🔄</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                Sie können jederzeit einen neuen Code erstellen
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nutzerpräferenzen */}
      <UserPreferences />
    </div>
  );
}

export function FamilyDisplay({ family, userEmail }: FamilyDisplayProps) {
  const homeContent = <FamilyHomeContent family={family} userEmail={userEmail} />;
  
  return (
    <TabNavigation 
      family={family}
      userEmail={userEmail}
      homeContent={homeContent}
    />
  );
}
