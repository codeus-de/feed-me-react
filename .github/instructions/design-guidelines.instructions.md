---
applyTo: '**/*.tsx'
---
# 🎨 Feed Me! Design Guidelines

## Designphilosophie

**BeOS-inspiriertes, border-freies Design mit maximaler Klarheit durch Whitespace und Schatten.**

---

## 🎯 Grundprinzipien

### 1. **ABSOLUT BORDER-FREE**
- ❌ **NIEMALS** `border`, `border-*` oder Outline verwenden
- ✅ Abgrenzung **NUR** durch Schatten und Abstände
- ✅ Alle Komponenten verwenden `border: none`

### 2. **Zwei-Farben-Hierarchie**
- **Weiß** (`#ffffff`): Haupthintergrund, Cards
- **Helles Grau** (`#f5f5f5`): Eingabefelder, Info-Boxen
- **Kein Dunkel-Modus** - Design ist einheitlich hell

### 3. **Kontrastreicher Text**
- **Haupttext**: `#1a1a1a` (sehr dunkel)
- **Subtiler Text**: `#666666` (grau)
- **Niemals** schwachen Kontrast verwenden

---

## 🏗️ Komponenten-Architektur

**Alle CSS-Klassen sind in `src/index.css` definiert. Verwende ausschließlich diese Klassen:**

### **Cards**
- `.beos-card` - Weiße Hauptkarten mit Schatten

### **Buttons**
- `.beos-button` - Standard-Button (grau)
- `.beos-button-primary` - Primäre Aktionen (blau)

### **Input Fields**
- `.beos-input` - Eingabefelder mit Fokus-Effekt

### **Spezial-Boxen**
- `.beos-info-box` - Graue Info-Bereiche
- `.beos-error-box` - Rote Fehlermeldungen

### **Icons**
- `.beos-icon` - Basis-Icon-Container
- `.beos-icon-blue` - Blaue Icons
- `.beos-icon-green` - Grüne Icons  
- `.beos-icon-orange` - Orange Icons
- `.beos-icon-red` - Rote Icons
- `.beos-icon-purple` - Lila Icons

---

## 🎨 Farbpalette

**Alle Farben sind als CSS-Variablen in `src/index.css` definiert:**

### **Basis-Farben**
- `--color-primary` - Weißer Haupthintergrund
- `--color-surface` - Helles Grau für Oberflächen
- `--color-surface-hover` - Dunkleres Grau für Hover

### **Text-Farben**
- `--color-text` - Dunkler Haupttext (hoher Kontrast)
- `--color-text-subtle` - Grauer subtiler Text

### **Akzent-Farben**
- `--color-accent-green` - Primäre Aktionen, Familie
- `--color-accent-blue` - Erfolg
- `--color-accent-orange` - Warnung, Beitreten
- `--color-accent-red` - Fehler
- `--color-accent-purple` - Info, Tipps

---

## 🔲 Icons

### **Größen**
- **Standard**: 56x56px
- **Klein**: 40x32px je nach Kontext
- **Border-radius**: 16px

### **Icon-Klassen**
**Definiert in `src/index.css`:**
- `.beos-icon-blue` - Blauer Hintergrund
- `.beos-icon-green` - Grüner Hintergrund
- `.beos-icon-orange` - Oranger Hintergrund
- `.beos-icon-red` - Roter Hintergrund
- `.beos-icon-purple` - Lila Hintergrund

### **Icon-Verwendung**
- **Familie**: 👨‍👩‍👧‍👦 (grün)
- **E-Mail/Einladung**: 📧 (blau)
- **Info/Tipps**: 💡 (lila)
- **Anmeldung**: 🔐 (blau)
- **Links/Beitreten**: 🔗 (orange)
- **Essen**: 🍽️ (orange)

---

## 📏 Abstände & Größen

### **Abstände**
- **Card-Abstand**: 32px zwischen Cards
- **Interne Abstände**: 24px, 48px für große Bereiche
- **Element-Abstände**: 8px, 12px, 16px für kleine Abstände

### **Border-Radius**
- **Cards**: 20px
- **Buttons/Inputs**: 16px
- **Icons**: 16px

### **Schatten**
**Definiert in `src/index.css` - verwende die CSS-Klassen statt eigene Schatten:**
- Cards: Große, weiche Schatten
- Buttons: Mittlere Schatten mit Hover-Effekt
- Icons: Subtile Schatten für Tiefe

---

## ✅ Do's

1. **Verwende immer CSS-Klassen**: `.beos-card`, `.beos-button`, etc.
2. **Großzügige Abstände**: Mindestens 32px zwischen Hauptbereichen
3. **Poppige Icons**: Bunte, mittlere Icons als visuelle Anker
4. **Schatten für Tiefe**: Statt Borders für Abgrenzung
5. **Konsistente Rundungen**: 16px-20px border-radius
6. **Emoji-Integration**: Für bessere UX und Orientierung

## ❌ Don'ts

1. **NIEMALS Borders verwenden** - auch nicht subtile!
2. **Keine Tailwind-Border-Klassen**: `border-*`, `border`, etc.
3. **Keine schwachen Kontraste**: Text muss gut lesbar sein
4. **Keine dunklen Hintergründe**: Design ist einheitlich hell
5. **Keine kleinen Abstände**: Mindestens 8px zwischen Elementen
6. **Keine inline-styles für Basis-Layout**: Verwende CSS-Klassen

---

## 🛠️ Implementation

### **HTML-Struktur**
```html
<div class="beos-card">
  <div class="beos-icon beos-icon-blue">🔐</div>
  <h2>Titel</h2>
  <input class="beos-input" placeholder="Text eingeben">
  <button class="beos-button beos-button-primary">Aktion</button>
</div>
```

### **Spacing mit inline-styles**
```html
<div style="margin-bottom: 32px">
<div style="gap: 16px">
<div style="padding: 24px">
```

### **Niemals verwenden**
```html
<!-- ❌ FALSCH -->
<div class="border border-gray-200">
<button class="border-2 border-blue-500">
<div style="border: 1px solid #ccc">

<!-- ✅ RICHTIG -->
<div class="beos-card">
<button class="beos-button beos-button-primary">
<div class="beos-info-box">
```

---

## 🎯 Checkliste für neue Komponenten

- [ ] Verwendet `.beos-*` CSS-Klassen
- [ ] Absolut border-free (auch keine subtilen Borders)
- [ ] Nur Weiß/Grau-Hintergründe
- [ ] Kontrastreicher Text (#1a1a1a)
- [ ] Poppiges Icon mit Akzentfarbe
- [ ] Ausreichend Whitespace (min. 32px zwischen Bereichen)
- [ ] Schatten für Tiefe statt Borders
- [ ] 16-20px border-radius

**Wenn alle Punkte erfüllt sind: ✅ BeOS-Design-konform!**
