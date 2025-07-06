import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function AISuggestionLogsViewer() {
  const [selectedLogId, setSelectedLogId] = useState<Id<"aiSuggestionLogs"> | null>(null);
  const [familyId, setFamilyId] = useState<Id<"families"> | null>(null);
  const [showSuccessOnly, setShowSuccessOnly] = useState(false);

  const logs = useQuery(api.aiSuggestions.getAISuggestionLogs, {
    familyId: familyId || undefined,
    limit: 50,
    includeSuccessOnly: showSuccessOnly,
  });

  const selectedLog = useQuery(
    api.aiSuggestions.getAISuggestionLogDetail,
    selectedLogId ? { logId: selectedLogId } : "skip"
  );

  if (!logs) return <div>Lade Logs...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">AI Suggestion Logs (Debugging)</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSuccessOnly}
              onChange={(e) => setShowSuccessOnly(e.target.checked)}
            />
            Nur erfolgreiche Anfragen
          </label>
          <button
            onClick={() => setSelectedLogId(null)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Details schließen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Letzte Anfragen ({logs.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  log.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                } ${selectedLogId === log._id ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedLogId(log._id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {log.parsedSuggestion.title || "Unbekannt"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {log.mealType === "large" ? "Große Mahlzeit" : "Snack"} •{" "}
                      {log.selectedUserCount} Person{log.selectedUserCount !== 1 ? "en" : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    log.success 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {log.success ? "✓ Erfolg" : "✗ Fehler"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed View */}
        <div className="bg-white border rounded-lg">
          {selectedLog ? (
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">Log Details</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Status</h4>
                  <p className={`text-sm ${selectedLog.success ? "text-green-600" : "text-red-600"}`}>
                    {selectedLog.success ? "Erfolgreich" : `Fehler: ${selectedLog.errorMessage}`}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700">Parameter</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Typ: {selectedLog.mealType === "large" ? "Große Mahlzeit" : "Snack"}</li>
                    <li>Personen: {selectedLog.selectedUserCount}</li>
                    {selectedLog.customHints && (
                      <li>Hinweise: {selectedLog.customHints}</li>
                    )}
                    {selectedLog.availableIngredients && (
                      <li>Verfügbare Zutaten: {selectedLog.availableIngredients}</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700">Familienpräferenzen</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {selectedLog.familyPreferences.map((pref, idx) => (
                      <div key={idx} className="border-l-2 border-gray-200 pl-2">
                        <p className="font-medium">{pref.name || `Person ${idx + 1}`}</p>
                        {pref.preferences && <p>Mag: {pref.preferences}</p>}
                        {pref.dislikes && <p>Mag nicht: {pref.dislikes}</p>}
                        {pref.allergies && <p>Allergien: {pref.allergies}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700">Kürzliche Mahlzeiten</h4>
                  <div className="text-sm text-gray-600">
                    {selectedLog.recentMeals.map((meal, idx) => (
                      <p key={idx}>• {meal.title} ({meal.date})</p>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700">Generierter Prompt</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {selectedLog.generatedPrompt}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700">OpenAI Response</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {selectedLog.openaiResponse}
                  </pre>
                </div>

                {selectedLog.success && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Parsed Suggestion</h4>
                    <div className="text-sm space-y-2">
                      <p><strong>Titel:</strong> {selectedLog.parsedSuggestion.title}</p>
                      <p><strong>Portionen:</strong> {selectedLog.parsedSuggestion.portions}</p>
                      <div>
                        <strong>Schritte:</strong>
                        <ol className="list-decimal list-inside ml-4">
                          {selectedLog.parsedSuggestion.steps.map((step, idx) => (
                            <li key={idx} className="text-xs">
                              {step.instructions}
                              {step.estimatedMinutes && ` (${step.estimatedMinutes} Min.)`}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <strong>Zutaten:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {selectedLog.parsedSuggestion.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="text-xs">
                              {ingredient.name}: {ingredient.amountPerPortion} {ingredient.unit}
                              {ingredient.inStock && " ✓"}
                              {ingredient.estimatedKcal && ` (${ingredient.estimatedKcal} kcal)`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Wählen Sie einen Log-Eintrag aus der Liste aus
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
