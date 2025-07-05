import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { JoinFamily } from "./JoinFamily";
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
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <JoinFamily />
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={() => setShowJoinOption(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-blue)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ← Zurück zur Familienerstellung
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="beos-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
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
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="z.B. Familie Schmidt"
            className="beos-input"
            disabled={isCreating}
          />
        </div>

        {error && (
          <div className="beos-error-box" style={{ marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || !familyName.trim()}
          className="beos-button beos-button-primary"
          style={{ width: '100%', marginBottom: '32px' }}
        >
          {isCreating ? "Wird erstellt..." : "Familie erstellen"}
        </button>
      </form>

      {/* Alternative Option */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{ 
          color: 'var(--color-text-subtle)', 
          fontSize: '14px', 
          marginBottom: '16px'
        }}>
          oder
        </p>
        <button
          onClick={() => setShowJoinOption(true)}
          className="beos-button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🔗</span>
          Einer bestehenden Familie beitreten
        </button>
      </div>

      {/* Info-Bereich */}
      <div className="beos-info-box">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div className="beos-icon beos-icon-blue" style={{ 
            width: '32px', 
            height: '32px', 
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
  );
}
