import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { JoinFamily } from "./JoinFamily";
import { UserPreferences } from "./UserPreferences";
import { handleConvexError } from "../utils/errorHandling";

export function CreateFamily() {
  const [familyName, setFamilyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinOption, setShowJoinOption] = useState(false);
  const createFamily = useMutation(api.myFunctions.createFamily);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setError("Bitte geben Sie einen Familiennamen ein.");
      return;
    }

    setIsCreating(true);
    setError(null);

    createFamily({ name: familyName.trim() })
      .then(() => {
        // Familie wurde erfolgreich erstellt
      })
      .catch((err) => {
        const errorMessage = handleConvexError(err, "Fehler beim Erstellen der Familie");
        setError(errorMessage);
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  if (showJoinOption) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '32px',
        maxWidth: '1000px', 
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <JoinFamily />
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
              onClick={() => setShowJoinOption(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent-green)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ← Zurück zur Familienerstellung
            </button>
          </div>
        </div>

        {/* Nutzerpräferenzen */}
        <UserPreferences />
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px',
      maxWidth: '1000px', 
      margin: '0 auto',
      padding: '0 16px'
    }}>
      {/* Familie erstellen/beitreten */}
      <div className="beos-card">
        {/* Header mit Icon */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="beos-icon beos-icon-green" style={{ margin: '0 auto 24px' }}>👨‍👩‍👧‍👦</div>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: 'var(--color-text)'
          }}>
            Familie erstellen
          </h2>
          <p style={{ 
            color: 'var(--color-text-subtle)', 
            fontSize: '16px',
            lineHeight: '1.5',
            margin: 0
          }}>
            Sie gehören noch zu keiner Familie. Erstellen Sie eine neue Familie oder treten Sie einer bestehenden bei!
          </p>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '32px' }}>
            <label 
              htmlFor="familyName" 
              style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '12px',
                color: 'var(--color-text)'
              }}
            >
              Familienname
            </label>
            <input
              id="familyName"
              type="text"
              className="beos-input"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="z.B. Familie Müller"
              disabled={isCreating}
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || !familyName.trim()}
            className="beos-button beos-button-primary"
            style={{ 
              width: '100%', 
              marginBottom: '24px',
              opacity: (isCreating || !familyName.trim()) ? 0.7 : 1
            }}
          >
            {isCreating ? "Erstelle Familie..." : "Familie erstellen"}
          </button>

          {error && (
            <div className="beos-error-box">
              {error}
            </div>
          )}
        </form>

        {/* Oder-Trenner */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ 
            flex: 1, 
            height: '1px', 
            backgroundColor: 'var(--color-surface-hover)' 
          }}></div>
          <span style={{ 
            color: 'var(--color-text-subtle)', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ODER
          </span>
          <div style={{ 
            flex: 1, 
            height: '1px', 
            backgroundColor: 'var(--color-surface-hover)' 
          }}></div>
        </div>

        {/* Beitreten Button */}
        <button
          type="button"
          onClick={() => setShowJoinOption(true)}
          className="beos-button"
          style={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '48px'
          }}
        >
          <span className="beos-icon beos-icon-orange" style={{ 
            width: '32px', 
            height: '32px', 
            fontSize: '16px',
            marginBottom: 0
          }}>🔗</span>
          <span>Einer bestehenden Familie beitreten</span>
        </button>

        {/* Info Box */}
        <div className="beos-info-box">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <div className="beos-icon beos-icon-purple" style={{ 
              width: '40px', 
              height: '40px', 
              fontSize: '16px',
              marginBottom: 0,
              flexShrink: 0
            }}>
              ℹ️
            </div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--color-text)',
                margin: '0 0 12px 0'
              }}>
                Was passiert als nächstes?
              </h3>
            </div>
          </div>
          
          <div style={{ paddingLeft: '44px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--color-accent-green)', fontSize: '16px' }}>✓</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                  Sie werden automatisch Mitglied der neuen Familie
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--color-accent-green)', fontSize: '16px' }}>✓</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                  Sie können andere Familienmitglieder einladen
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--color-accent-green)', fontSize: '16px' }}>✓</span>
                <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                  Alle Familienmitglieder können gemeinsam Daten verwalten
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nutzerpräferenzen */}
      <UserPreferences />
    </div>
  );
}
