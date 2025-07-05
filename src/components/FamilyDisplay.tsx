import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { handleConvexError } from "../utils/errorHandling";

interface FamilyDisplayProps {
  family: {
    _id: string;
    name: string;
    inviteCode?: string;
    inviteCodeExpiresAt?: number;
  };
  userEmail?: string;
}

export function FamilyDisplay({ family, userEmail }: FamilyDisplayProps) {
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
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      {/* Familie Header */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
        <h2 className="text-green-800 dark:text-green-200 font-bold text-xl mb-2">
          Familie: {family.name}
        </h2>
        <p className="text-green-700 dark:text-green-300 text-sm">
          Willkommen {userEmail ?? "Anonymous"}!
        </p>
      </div>

      {/* Einladungscode Sektion */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
          Familienmitglieder einladen
        </h3>
        
        {isCodeValid ? (
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-bold text-blue-800 dark:text-blue-200">
                    {family.inviteCode}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {family.inviteCodeExpiresAt && formatTimeRemaining(family.inviteCodeExpiresAt)}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {copiedCode ? "Kopiert!" : "Kopieren"}
                </button>
              </div>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Teilen Sie diesen Code mit Familienmitgliedern, damit sie beitreten können.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              {family.inviteCode 
                ? "Der Einladungscode ist abgelaufen. Erstellen Sie einen neuen Code." 
                : "Erstellen Sie einen Einladungscode, um neue Mitglieder einzuladen."
              }
            </p>
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {isGenerating ? "Wird erstellt..." : "Neuen Code erstellen"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-500/20 border border-red-500/50 rounded-md p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md p-4">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
          So funktioniert's:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Einladungscodes sind 1 Stunde gültig</li>
          <li>• Neue Mitglieder können den Code verwenden, um beizutreten</li>
          <li>• Sie können jederzeit einen neuen Code erstellen</li>
        </ul>
      </div>
    </div>
  );
}
