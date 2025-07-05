import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { handleConvexError } from "../utils/errorHandling";

export function JoinFamily() {
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinFamily = useMutation(api.myFunctions.joinFamily);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("Bitte geben Sie einen Einladungscode ein.");
      return;
    }

    setIsJoining(true);
    setError(null);

    joinFamily({ inviteCode: inviteCode.trim() })
      .then(() => {
        // Familie erfolgreich beigetreten
      })
      .catch((err) => {
        const errorMessage = handleConvexError(err, "Fehler beim Beitreten zur Familie");
        setError(errorMessage);
      })
      .finally(() => {
        setIsJoining(false);
      });
  };

  return (
    <div className="beos-card">
      {/* Header mit Icon */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div className="beos-icon beos-icon-orange" style={{ margin: '0 auto 24px' }}>🔗</div>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: 'var(--color-text)'
        }}>
          Familie beitreten
        </h2>
        <p style={{ 
          color: 'var(--color-text-subtle)', 
          fontSize: '16px',
          lineHeight: '1.5',
          margin: 0
        }}>
          Haben Sie einen Einladungscode von einem Familienmitglied erhalten? 
          Geben Sie ihn hier ein, um der Familie beizutreten.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <label 
            htmlFor="inviteCode" 
            style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '12px',
              color: 'var(--color-text)'
            }}
          >
            Einladungscode
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="z.B. happy-cat-42"
            className="beos-input"
            style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: '16px' }}
            disabled={isJoining}
          />
        </div>

        {error && (
          <div className="beos-error-box" style={{ marginBottom: '24px' }}>
            <p style={{ fontWeight: '500', marginBottom: '12px', fontSize: '14px' }}>
              {error}
            </p>
            
            {/* Hilfreiche Tipps basierend auf dem Fehlertyp */}
            {error.includes("ungültig") && (
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>Tipps:</p>
                <div style={{ paddingLeft: '16px' }}>
                  <div style={{ marginBottom: '4px' }}>• Überprüfen Sie Tippfehler im Code</div>
                  <div style={{ marginBottom: '4px' }}>• Codes sind groß-/kleinschreibungsabhängig</div>
                  <div>• Verwenden Sie Bindestriche zwischen den Wörtern</div>
                </div>
              </div>
            )}
            
            {error.includes("abgelaufen") && (
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>Lösung:</p>
                <p>Bitten Sie das Familienmitglied, das Sie eingeladen hat, einen neuen Code zu erstellen.</p>
              </div>
            )}
            
            {error.includes("bereits") && (
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>Hinweis:</p>
                <p>Sie können nur zu einer Familie gleichzeitig gehören. Verlassen Sie zuerst Ihre aktuelle Familie, falls nötig.</p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isJoining || !inviteCode.trim()}
          className="beos-button beos-button-primary"
          style={{ 
            width: '100%',
            background: 'var(--color-accent-orange)',
            color: 'white'
          }}
        >
          {isJoining ? "Trete bei..." : "Familie beitreten"}
        </button>
      </form>
    </div>
  );
}
