import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CreateFamily() {
  const [familyName, setFamilyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(err instanceof Error ? err.message : "Fehler beim Erstellen der Familie");
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Familie erstellen</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sie gehören noch zu keiner Familie. Erstellen Sie eine neue Familie, um zu beginnen!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label 
            htmlFor="familyName" 
            className="block text-sm font-medium mb-2"
          >
            Familienname
          </label>
          <input
            id="familyName"
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="z.B. Familie Schmidt"
            className="w-full bg-light dark:bg-dark text-dark dark:text-light rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 outline-none"
            disabled={isCreating}
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-3">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || !familyName.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
        >
          {isCreating ? "Wird erstellt..." : "Familie erstellen"}
        </button>
      </form>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Was passiert als nächstes?
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Sie werden automatisch Mitglied der neuen Familie</li>
          <li>• Sie können andere Familienmitglieder einladen</li>
          <li>• Alle Familienmitglieder können gemeinsam Daten verwalten</li>
        </ul>
      </div>
    </div>
  );
}
