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
    <div className="max-w-lg mx-auto">
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-4 mb-6">
        <h3 className="font-bold text-orange-900 dark:text-orange-100 mb-2">
          Einer Familie beitreten
        </h3>
        <p className="text-orange-700 dark:text-orange-300 text-sm">
          Haben Sie einen Einladungscode von einem Familienmitglied erhalten? 
          Geben Sie ihn hier ein, um der Familie beizutreten.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="inviteCode" 
            className="block text-sm font-medium mb-2"
          >
            Einladungscode
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="z.B. happy-cat-42"
            className="w-full bg-light dark:bg-dark text-dark dark:text-light rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-orange-500 dark:focus:border-orange-400 outline-none font-mono"
            disabled={isJoining}
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-3">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium mb-2">{error}</p>
            
            {/* Hilfreiche Tipps basierend auf dem Fehlertyp */}
            {error.includes("ungültig") && (
              <div className="text-red-600 dark:text-red-400 text-xs">
                <p className="font-medium mb-1">Tipps:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Überprüfen Sie Tippfehler im Code</li>
                  <li>Codes sind groß-/kleinschreibungsabhängig</li>
                  <li>Verwenden Sie Bindestriche zwischen den Wörtern</li>
                </ul>
              </div>
            )}
            
            {error.includes("abgelaufen") && (
              <div className="text-red-600 dark:text-red-400 text-xs">
                <p className="font-medium mb-1">Lösung:</p>
                <p>Bitten Sie das Familienmitglied, das Sie eingeladen hat, einen neuen Code zu erstellen.</p>
              </div>
            )}
            
            {error.includes("bereits") && (
              <div className="text-red-600 dark:text-red-400 text-xs">
                <p className="font-medium mb-1">Hinweis:</p>
                <p>Sie können nur zu einer Familie gleichzeitig gehören. Verlassen Sie zuerst Ihre aktuelle Familie, falls nötig.</p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isJoining || !inviteCode.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
        >
          {isJoining ? "Trete bei..." : "Familie beitreten"}
        </button>
      </form>
    </div>
  );
}
