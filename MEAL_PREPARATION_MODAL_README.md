# 🍳 Meal Preparation Modal - Zubereitungsansicht

## Übersicht

Das **Meal Preparation Modal** ist eine neue Funktion, die es Benutzern ermöglicht, eine strukturierte Zubereitungsansicht für bereits erstellte Mahlzeiten zu öffnen. Es dient als digitale Koch-Hilfe mit abhakbaren Listen.

## 🎯 Funktionen

### ✅ Abhakbare Zutaten-Liste
- **Sammeln der Zutaten**: Alle benötigten Zutaten mit Mengenangaben pro Gesamtportion
- **Vorrats-Status**: Zeigt an, welche Zutaten als "vorrätig" markiert sind
- **Kalorien-Info**: Optionale Kalorien-Anzeige pro Zutat
- **Fortschritts-Balken**: Visueller Fortschritt beim Sammeln der Zutaten

### 👨‍🍳 Abhakbare Zubereitungsschritte
- **Strukturierte Anleitung**: Schrittweise Zubereitungsanweisungen
- **Zeit-Schätzungen**: Optionale Zeitangaben pro Schritt
- **Nummerierte Schritte**: Klare Reihenfolge der Arbeitsschritte
- **Fortschritts-Balken**: Visueller Fortschritt bei der Zubereitung

### 🎉 Abschluss-Feier
- **Completion Message**: Gratulations-Nachricht wenn alle Schritte abgehakt sind
- **Motivierende UI**: Freundliche Emoji-Unterstützung

## 🚀 Verwendung

### Zugriff
1. Im **VerticalCalendar** auf eine bestehende Mahlzeit klicken
2. Das Modal öffnet sich automatisch mit den Mahlzeit-Details

### Bedienung
1. **Zutaten sammeln**: Klick auf Zutat hakt sie ab/entfernt Häkchen
2. **Schritte abarbeiten**: Klick auf Schritt markiert ihn als erledigt
3. **Modal schließen**: X-Button oder Klick außerhalb des Modals

## 🎨 Design

### BeOS-Konform
- ✅ Verwendet ausschließlich `.beos-*` CSS-Klassen
- ✅ Border-free Design mit Schatten
- ✅ Konsistente Farbpalette (weiß/grau)
- ✅ Responsive Layout mit maximaler Höhe

### UX-Features
- **Hover-Effekte**: Interaktive Feedback für klickbare Elemente
- **Smooth Transitions**: Weiche Übergänge beim Abhaken
- **Progress Bars**: Visuelle Fortschritts-Anzeige
- **Color Coding**: Grün für Zutaten, Blau für Schritte

## 📂 Dateien

### Neue Komponente
- `src/components/MealPreparationModal.tsx` - Haupt-Modal-Komponente

### Erweiterte Convex-Funktionen
- `convex/meals.ts` - Neue `getMealById` Query hinzugefügt

### Integration
- `src/components/VerticalCalendar.tsx` - Modal-Integration, klickbare Mahlzeiten

## 🔧 Technische Details

### State-Management
```typescript
interface CheckedState {
  ingredients: Set<string>;  // IDs der abgehakten Zutaten
  steps: Set<number>;        // Positionen der abgehakten Schritte
}
```

### Convex-Query
```typescript
// Lädt eine einzelne Mahlzeit mit allen Details
const meal = useQuery(api.meals.getMealById, { mealId });
```

### Event-Handling
- **onClick**: Toggle-Funktion für Abhaken/Enthaken
- **onClose**: Modal schließen und State zurücksetzen

## 🎯 Anwendungsfälle

1. **Aktive Zubereitung**: Während des Kochens als digitale Checkliste
2. **Einkaufsliste**: Zutaten-Sammlung vor dem Kochen
3. **Kochanleitung**: Schritt-für-Schritt Führung durch das Rezept
4. **Familienkochen**: Aufgabenverteilung bei mehreren Personen

## 🔮 Erweiterungsmöglichkeiten

### Potentielle Features
- **Timer-Integration**: Automatische Timer für geschätzte Zeiten
- **Einkaufsliste-Export**: Nicht vorrätige Zutaten exportieren
- **Fortschritt speichern**: Abhak-Status zwischen Sessions beibehalten
- **Kommentare**: Persönliche Notizen zu Schritten hinzufügen
- **Fotos**: Schritt-Fotos für visuelle Hilfe

### Performance-Optimierungen
- **Lazy Loading**: Nur Details laden wenn Modal geöffnet
- **State Persistence**: Local Storage für Abhak-Status
- **Offline Support**: Caching für verfügbare Rezepte

---

Das **Meal Preparation Modal** vervollständigt die Koch-Experience in Feed Me! und macht das Zubereiten von Mahlzeiten zu einem strukturierten, angenehmen Erlebnis. 🍽️✨
