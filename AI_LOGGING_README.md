# AI Suggestion Logging - Debugging Guide

## Was wurde hinzugefügt?

### 1. Schema-Erweiterung (`convex/schema.ts`)
Eine neue Tabelle `aiSuggestionLogs` wurde hinzugefügt, die folgende Informationen für jede AI-Anfrage speichert:
- Alle Input-Parameter (familyId, mealType, preferences, etc.)
- Den generierten Prompt
- Die Rohausgabe von OpenAI
- Das geparste Ergebnis
- Erfolg/Fehler-Status
- Timestamp für chronologische Sortierung

### 2. Logging-Funktionen (`convex/aiSuggestions.ts`)
- **`logAISuggestion`**: Interne Mutation zum Speichern der Logs
- **`getUserByEmail`**: Hilfsfunktion um User-ID zu ermitteln
- **`getAISuggestionLogs`**: Query um Logs zu durchsuchen
- **`getAISuggestionLogDetail`**: Query für detaillierte Log-Ansicht

### 3. Enhanced `generateMealSuggestion`
Die Hauptfunktion wurde erweitert um:
- Vollständiges Error-Handling mit try/catch
- Logging aller Anfragen (erfolgreiche und fehlgeschlagene)
- Detaillierte Speicherung der OpenAI-Antworten

### 4. Debug-Komponente (`src/components/AISuggestionLogsViewer.tsx`)
Eine React-Komponente zur Visualisierung der Logs mit:
- Liste aller Logs mit Status-Anzeige
- Detailansicht für einzelne Logs
- Filter-Optionen (nur erfolgreiche anzeigen)
- Vollständige Prompt-Anzeige für Debugging

## Wie verwenden?

### 1. Schema-Update anwenden
```bash
# Convex Dev Server neustarten, damit das neue Schema geladen wird
npx convex dev
```

### 2. Logs einsehen (Programmmatisch)
```typescript
// Alle letzten 50 Logs abrufen
const logs = useQuery(api.aiSuggestions.getAISuggestionLogs, {
  limit: 50,
  includeSuccessOnly: false,
});

// Nur erfolgreiche Logs einer bestimmten Familie
const successLogs = useQuery(api.aiSuggestions.getAISuggestionLogs, {
  familyId: myFamilyId,
  includeSuccessOnly: true,
});

// Detailansicht eines spezifischen Logs
const logDetail = useQuery(api.aiSuggestions.getAISuggestionLogDetail, {
  logId: selectedLogId,
});
```

### 3. Debug-Komponente einbinden
```tsx
import { AISuggestionLogsViewer } from "./components/AISuggestionLogsViewer";

// Irgendwo in Ihrer App (z.B. als Debug-Tab)
<AISuggestionLogsViewer />
```

### 4. Convex Dashboard nutzen
Im Convex Dashboard können Sie auch direkt auf die `aiSuggestionLogs`-Tabelle zugreifen:
1. Öffnen Sie das Convex Dashboard
2. Gehen Sie zu "Data" → "aiSuggestionLogs"
3. Dort sehen Sie alle Log-Einträge

## Debugging-Workflow

### 1. Problem identifizieren
- Nutzen Sie die Logs-Komponente oder das Dashboard
- Filtern Sie nach fehlgeschlagenen Requests
- Prüfen Sie die `errorMessage` Felder

### 2. Prompt-Optimierung
- Schauen Sie sich den `generatedPrompt` an
- Vergleichen Sie erfolgreiche vs. fehlgeschlagene Prompts
- Testen Sie Änderungen an der `buildPrompt`-Funktion

### 3. OpenAI-Response analysieren
- Prüfen Sie die `openaiResponse` auf unerwartete Formate
- Schauen Sie, ob OpenAI Markdown-Blöcke oder andere Formatierungen verwendet
- Verbessern Sie das Response-Parsing falls nötig

### 4. Input-Parameter verstehen
- Analysieren Sie die `familyPreferences`, `recentMeals`, etc.
- Optimieren Sie die Prompt-Generierung basierend auf realen Daten

## Monitoring & Analytics

Die Logs ermöglichen Ihnen:
- **Erfolgsrate messen**: Wie viele Requests schlagen fehl?
- **Performance tracking**: Welche Parameter führen zu besseren Ergebnissen?
- **Prompt-Verbesserung**: A/B-Testing verschiedener Prompt-Strategien
- **Error-Patterns**: Häufige Fehlerursachen identifizieren

## Datenschutz-Hinweis

Die Logs enthalten alle Input-Parameter und OpenAI-Responses. Stellen Sie sicher, dass:
- Logs regelmäßig bereinigt werden (z.B. nach 30 Tagen)
- Nur autorisierte Benutzer Zugriff auf die Debug-Komponente haben
- Sensible Daten in den Logs entsprechend behandelt werden

## Performance-Überlegungen

- Logs werden asynchron gespeichert und blockieren nicht die Haupt-Funktion
- Begrenzen Sie die Anzahl der abgerufenen Logs in der UI (Standard: 50)
- Erwägen Sie regelmäßige Bereinigung alter Logs über eine Cron-Job

## Nächste Schritte

1. Starten Sie `npx convex dev` neu
2. Testen Sie einige AI-Suggestions
3. Schauen Sie sich die Logs im Dashboard oder in der Komponente an
4. Iterieren Sie über die Prompt-Optimierung basierend auf den Logs
