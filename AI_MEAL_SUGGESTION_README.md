# AI Meal Suggestion Feature

Diese neue Funktion ermöglicht es Familien, sich von einer KI Mahlzeiten vorschlagen zu lassen.

## Neue Komponenten

### `AISuggestionModal.tsx`
- **Zweck**: Modal für KI-basierte Mahlzeitvorschläge
- **Features**:
  - Familienmitglieder-Auswahl mit Berücksichtigung ihrer Präferenzen
  - Mahlzeit-Typ Auswahl (große Mahlzeit vs. kleiner Snack)
  - Optionale Eingabe für spezielle Wünsche
  - Optionale Eingabe für verfügbare Zutaten die aufgebraucht werden sollen
  - Einstellung für Abwechslung (vermeidet die letzten X Mahlzeiten)
  - Loading-Animation während der KI-Generierung
  - Anzeige des generierten Vorschlags mit Zutaten und Zubereitungsschritten
  - Speichern oder neuen Vorschlag anfordern

### `aiSuggestions.ts` (Convex)
- **Zweck**: Convex Action für OpenAI Integration
- **Features**:
  - Aufbau des Prompts basierend auf Familienpräferenzen
  - OpenAI API Aufruf mit GPT-4o
  - Validierung und Verarbeitung der AI-Antwort
  - Rückgabe im korrekten Mahlzeit-Datenformat

## Integration in VerticalCalendar

- Neue Buttons "KI-Vorschlag" neben den bestehenden "Manuell" Buttons
- Verwendung der lila Akzentfarbe (--color-accent-purple) für AI-Features
- Emoji 🤖 für visuelle Kennzeichnung

## Benötigte Umgebungsvariablen

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Design Guidelines Compliance

- ✅ Border-free Design
- ✅ BeOS-inspirierte CSS-Klassen (.beos-card, .beos-button, etc.)
- ✅ Korrekte Farbhierarchie (Weiß/Grau Hintergründe)
- ✅ Kontrastreicher Text
- ✅ Poppige Icons mit Akzentfarben
- ✅ Großzügige Abstände (32px zwischen Bereichen)
- ✅ Schatten für Tiefe statt Borders
- ✅ 16-20px border-radius

## Verwendung

1. Nutzer klickt auf "KI-Vorschlag" Button in einem Kalendertag
2. Modal öffnet sich mit Parameter-Einstellungen
3. Nutzer wählt Familienmitglieder und Einstellungen
4. Klick auf "Vorschlag generieren" startet AI-Generierung
5. Nach Loading wird der Vorschlag angezeigt
6. Nutzer kann den Vorschlag speichern oder einen neuen anfordern

## Technische Details

- **Framework**: React mit TypeScript
- **State Management**: React Hooks (useState, useCallback, useEffect)
- **Backend**: Convex mit Actions
- **AI Provider**: OpenAI GPT-4o
- **Design System**: Custom BeOS-inspired CSS classes

## Zukünftige Erweiterungen

- [ ] Integration der echten Mahlzeit-Speicherfunktion
- [ ] Berücksichtigung der letzten Mahlzeiten für bessere Abwechslung
- [ ] Verbesserung der Prompt-Erstellung basierend auf Nutzerfeedback
- [ ] Caching von AI-Vorschlägen für bessere Performance
- [ ] Bewertungssystem für generierte Vorschläge
