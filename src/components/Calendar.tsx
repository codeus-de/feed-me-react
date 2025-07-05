import { useState, useEffect, useRef, useCallback } from 'react';

interface CalendarDay {
  date: Date;
  dayName: string;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarWeek {
  weekId: string;
  days: CalendarDay[];
  weekNumber: number;
}

export function Calendar() {
  const [weeks, setWeeks] = useState<CalendarWeek[]>([]);
  const [_currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const weekRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Konstanten für das Window-System
  const WINDOW_SIZE = 7; // Anzahl der Wochen im DOM
  const BUFFER_SIZE = 3; // Puffer-Wochen vor/nach der sichtbaren Woche
  
  // Hilfsfunktion: Woche erstellen
  const createWeek = useCallback((startDate: Date): CalendarWeek => {
    const week: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
      const isToday = date.getTime() === today.getTime();
      const isCurrentMonth = date.getMonth() === today.getMonth();
      
      week.push({
        date: new Date(date),
        dayName,
        isToday,
        isCurrentMonth
      });
    }
    
    const weekId = `week-${startDate.getTime()}`;
    const weekNumber = getWeekNumber(startDate);
    
    return { weekId, days: week, weekNumber };
  }, []);
  
  // Hilfsfunktion: Wochennummer berechnen
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  
  // Hilfsfunktion: Montag einer Woche finden
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  // Initiale Wochen generieren
  const generateInitialWeeks = useCallback(() => {
    const today = new Date();
    const currentMonday = getMonday(today);
    const weeksArray: CalendarWeek[] = [];
    
    // Aktuelle Woche finden
    const currentIndex = BUFFER_SIZE;
    
    // Wochen vor der aktuellen Woche
    for (let i = BUFFER_SIZE; i > 0; i--) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() - (i * 7));
      weeksArray.push(createWeek(weekStart));
    }
    
    // Aktuelle Woche
    weeksArray.push(createWeek(currentMonday));
    
    // Wochen nach der aktuellen Woche
    for (let i = 1; i <= BUFFER_SIZE; i++) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() + (i * 7));
      weeksArray.push(createWeek(weekStart));
    }
    
    return { weeks: weeksArray, currentIndex };
  }, [createWeek]);
  
  // Neue Woche am Anfang hinzufügen
  const prependWeek = useCallback(() => {
    setWeeks(prevWeeks => {
      if (prevWeeks.length === 0) return prevWeeks;
      
      const firstWeek = prevWeeks[0];
      const newWeekStart = new Date(firstWeek.days[0].date);
      newWeekStart.setDate(newWeekStart.getDate() - 7);
      
      const newWeek = createWeek(newWeekStart);
      const newWeeks = [newWeek, ...prevWeeks];
      
      // Window-Größe beibehalten
      if (newWeeks.length > WINDOW_SIZE) {
        newWeeks.pop();
      }
      
      return newWeeks;
    });
    
    setCurrentWeekIndex(prev => prev + 1);
  }, [createWeek]);
  
  // Neue Woche am Ende hinzufügen
  const appendWeek = useCallback(() => {
    setWeeks(prevWeeks => {
      if (prevWeeks.length === 0) return prevWeeks;
      
      const lastWeek = prevWeeks[prevWeeks.length - 1];
      const newWeekStart = new Date(lastWeek.days[0].date);
      newWeekStart.setDate(newWeekStart.getDate() + 7);
      
      const newWeek = createWeek(newWeekStart);
      const newWeeks = [...prevWeeks, newWeek];
      
      // Window-Größe beibehalten
      if (newWeeks.length > WINDOW_SIZE) {
        newWeeks.shift();
        setCurrentWeekIndex(prev => prev - 1);
      }
      
      return newWeeks;
    });
  }, [createWeek]);
  
  // Intersection Observer Setup
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          
          const weekId = entry.target.getAttribute('data-week-id');
          if (!weekId) return;
          
          const weekIndex = weeks.findIndex(week => week.weekId === weekId);
          if (weekIndex === -1) return;
          
          // Erste Woche sichtbar -> neue Woche davor laden
          if (weekIndex === 0) {
            prependWeek();
          }
          // Letzte Woche sichtbar -> neue Woche danach laden
          else if (weekIndex === weeks.length - 1) {
            appendWeek();
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px', // Früh laden für flüssiges Scrollen
        threshold: 0.1
      }
    );
    
    // Alle Wochen beobachten
    weekRefs.current.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [weeks, prependWeek, appendWeek]);
  
  // Komponente initialisieren
  useEffect(() => {
    const { weeks: initialWeeks, currentIndex } = generateInitialWeeks();
    setWeeks(initialWeeks);
    setCurrentWeekIndex(currentIndex);
  }, [generateInitialWeeks]);
  
  // Week Ref Callback
  const setWeekRef = useCallback((weekId: string) => (element: HTMLDivElement | null) => {
    if (element) {
      weekRefs.current.set(weekId, element);
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      const existing = weekRefs.current.get(weekId);
      if (existing && observerRef.current) {
        observerRef.current.unobserve(existing);
      }
      weekRefs.current.delete(weekId);
    }
  }, []);
  
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <div 
        ref={scrollContainerRef}
        className="calendar-container"
        style={{ flex: 1 }}
      >
        {weeks.map((week) => (
          <div
            key={week.weekId}
            ref={setWeekRef(week.weekId)}
            data-week-id={week.weekId}
            className="calendar-week"
          >
            {/* Wochen-Header - sticky */}
            <div className="calendar-week-header">
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--color-text-subtle)',
                fontWeight: '500'
              }}>
                KW {week.weekNumber}
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: 'var(--color-text)'
              }}>
                {week.days[0].date.toLocaleDateString('de-DE', { 
                  day: '2-digit', 
                  month: 'short' 
                })} - {week.days[6].date.toLocaleDateString('de-DE', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </div>
            </div>
            
            {/* Scrollbarer Tage-Container */}
            <div className="calendar-days-container">
              {/* Tage der Woche */}
              {week.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`calendar-day ${day.isToday ? 'today' : ''}`}
                style={{
                  color: day.isToday ? 'white' : 'var(--color-text)',
                  opacity: day.isCurrentMonth ? 1 : 0.6
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    opacity: day.isToday ? 1 : 0.8
                  }}>
                    {day.dayName}
                  </span>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '700'
                  }}>
                    {day.date.getDate()}
                  </span>
                </div>
                
                {/* Platzhalter für Mahlzeiten */}
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.7,
                  fontStyle: 'italic'
                }}>
                  {day.isToday ? 'Heute' : 'Keine Pläne'}
                </div>
              </div>
            ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
