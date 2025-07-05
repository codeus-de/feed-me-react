import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UserPreferencesProps {
  className?: string;
}

export function UserPreferences({ className }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Aktuelle Nutzerpräferenzen laden
  const userPreferences = useQuery(api.userPreferences.getUserPreferences);
  const updatePreferences = useMutation(api.userPreferences.updateUserPreferences);

  // Lokale States mit geladenen Daten synchronisieren
  useEffect(() => {
    if (userPreferences) {
      setPreferences(userPreferences.preferences || "");
      setDislikes(userPreferences.dislikes || "");
      setAllergies(userPreferences.allergies || "");
      setHasChanges(false);
    }
  }, [userPreferences]);

  // Änderungen verfolgen
  const handleChange = (field: 'preferences' | 'dislikes' | 'allergies', value: string) => {
    if (field === 'preferences') setPreferences(value);
    if (field === 'dislikes') setDislikes(value);
    if (field === 'allergies') setAllergies(value);
    
    // Prüfe ob Änderungen vorliegen
    const hasCurrentChanges = 
      value !== (userPreferences?.[field] || "") ||
      (field !== 'preferences' && preferences !== (userPreferences?.preferences || "")) ||
      (field !== 'dislikes' && dislikes !== (userPreferences?.dislikes || "")) ||
      (field !== 'allergies' && allergies !== (userPreferences?.allergies || ""));
    
    setHasChanges(hasCurrentChanges);
    setSaveStatus('idle');
  };

  // Speichern
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    
    try {
      setSaveStatus('saving');
      await updatePreferences({
        preferences: preferences.trim() || undefined,
        dislikes: dislikes.trim() || undefined,
        allergies: allergies.trim() || undefined,
      });
      setSaveStatus('saved');
      setHasChanges(false);
      
      // "Gespeichert"-Status nach 2 Sekunden zurücksetzen
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Fehler beim Speichern der Präferenzen:', error);
      setSaveStatus('error');
    }
  }, [hasChanges, updatePreferences, preferences, dislikes, allergies]);

  // Auto-Save nach 3 Sekunden Inaktivität
  useEffect(() => {
    if (!hasChanges) return;
    
    const timer = setTimeout(() => {
      void handleSave();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [preferences, dislikes, allergies, hasChanges, handleSave]);

  if (userPreferences === undefined) {
    return (
      <div className={`beos-card ${className}`} style={{ padding: '24px' }}>
        <div className="beos-icon beos-icon-purple" style={{ margin: '0 auto 16px' }}>
          ⏳
        </div>
        <div style={{ textAlign: 'center', color: 'var(--color-text-subtle)' }}>
          Lade deine Präferenzen...
        </div>
      </div>
    );
  }

  return (
    <div className={`beos-card ${className}`} style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <div className="beos-icon beos-icon-purple" style={{ marginRight: '16px' }}>
          💭
        </div>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '700',
            color: 'var(--color-text)'
          }}>
            Meine Essensvorlieben
          </h2>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '14px',
            color: 'var(--color-text-subtle)'
          }}>
            Diese Angaben helfen bei der Mahlzeitplanung für deine Familie
          </p>
        </div>
      </div>

      {/* Eingabefelder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Meine Vorlieben */}
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '8px'
          }}>
            <span style={{ marginRight: '8px' }}>🍀</span>
            Meine Vorlieben
          </label>
          <textarea
            className="beos-input"
            value={preferences}
            onChange={(e) => handleChange('preferences', e.target.value)}
            placeholder="Was isst du gerne? z.B. italienische Küche, vegetarische Gerichte, Pasta, Salate..."
            rows={4}
            style={{ 
              width: '100%',
              resize: 'vertical',
              minHeight: '100px'
            }}
          />
        </div>

        {/* Mag ich nicht so gerne */}
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '8px'
          }}>
            <span style={{ marginRight: '8px' }}>😐</span>
            Mag ich nicht so gerne
          </label>
          <textarea
            className="beos-input"
            value={dislikes}
            onChange={(e) => handleChange('dislikes', e.target.value)}
            placeholder="Was magst du weniger gerne? z.B. scharfes Essen, Fisch, Rosenkohl..."
            rows={3}
            style={{ 
              width: '100%',
              resize: 'vertical',
              minHeight: '80px'
            }}
          />
        </div>

        {/* Allergien */}
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '8px'
          }}>
            <span style={{ marginRight: '8px' }}>⚠️</span>
            Allergien & Unverträglichkeiten
          </label>
          <textarea
            className="beos-input"
            value={allergies}
            onChange={(e) => handleChange('allergies', e.target.value)}
            placeholder="Allergien oder Unverträglichkeiten? z.B. Nüsse, Laktose, Gluten..."
            rows={3}
            style={{ 
              width: '100%',
              resize: 'vertical',
              minHeight: '80px'
            }}
          />
        </div>
      </div>

      {/* Status und Speichern-Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '24px'
      }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-subtle)' }}>
          {saveStatus === 'saving' && '💾 Speichere...'}
          {saveStatus === 'saved' && '✅ Gespeichert'}
          {saveStatus === 'error' && '❌ Fehler beim Speichern'}
          {saveStatus === 'idle' && hasChanges && '📝 Ungespeicherte Änderungen'}
          {saveStatus === 'idle' && !hasChanges && ''}
        </div>
        
        {hasChanges && (
          <button
            className="beos-button beos-button-primary"
            onClick={() => void handleSave()}
            disabled={saveStatus === 'saving'}
            style={{ opacity: saveStatus === 'saving' ? 0.7 : 1 }}
          >
            {saveStatus === 'saving' ? 'Speichere...' : 'Jetzt speichern'}
          </button>
        )}
      </div>

      {/* Info-Box */}
      <div className="beos-info-box" style={{ marginTop: '24px', padding: '16px' }}>
        <div style={{ 
          fontSize: '14px',
          color: 'var(--color-text-subtle)',
          lineHeight: '1.5'
        }}>
          <strong>💡 Tipp:</strong> Diese Angaben werden automatisch gespeichert und später verwendet, 
          um personalisierte Mahlzeitvorschläge für deine Familie zu erstellen. 
          Du kannst sie jederzeit ändern.
        </div>
      </div>
    </div>
  );
}
