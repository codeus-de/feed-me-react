import { useState, useEffect, useRef, useCallback } from 'react';

interface CalendarDay {
  date: Date;
  dayName: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  isPseudo?: boolean;
  pseudoType?: 'load-past' | 'load-future';
}

export function VerticalCalendar() {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const hasScrolledToTodayRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Hilfsfunktion: Tag erstellen
  const createDay = useCallback((date: Date): CalendarDay => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayDate = new Date(date);
    dayDate.setHours(0, 0, 0, 0);
    
    const dayName = dayDate.toLocaleDateString('de-DE', { weekday: 'short' });
    const isToday = dayDate.getTime() === today.getTime();
    const isCurrentMonth = dayDate.getMonth() === today.getMonth();
    
    return {
      date: new Date(dayDate),
      dayName,
      isToday,
      isCurrentMonth
    };
  }, []);

  // Pseudo-Tag für "Mehr laden" erstellen
  const createPseudoDay = useCallback((type: 'load-past' | 'load-future'): CalendarDay => {
    return {
      date: new Date(), // Dummy-Datum
      dayName: '',
      isToday: false,
      isCurrentMonth: true,
      isPseudo: true,
      pseudoType: type
    };
  }, []);

  // Initiale Tage generieren (100 vor heute, heute, 100 nach heute)
  const generateInitialDays = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysArray: CalendarDay[] = [];
    
    // Pseudo-Button für weitere vergangene Tage
    daysArray.push(createPseudoDay('load-past'));
    
    // 100 Tage vor heute
    for (let i = 100; i > 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      daysArray.push(createDay(date));
    }
    
    // Heute
    daysArray.push(createDay(today));
    
    // 100 Tage nach heute
    for (let i = 1; i <= 100; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      daysArray.push(createDay(date));
    }
    
    // Pseudo-Button für weitere zukünftige Tage
    daysArray.push(createPseudoDay('load-future'));
    
    return daysArray;
  }, [createDay, createPseudoDay]);

  // 30 Tage in der Vergangenheit hinzufügen
  const loadMorePastDays = useCallback(() => {
    setDays(prevDays => {
      const newDays = [...prevDays];
      
      // Ersten Pseudo-Tag entfernen
      if (newDays[0]?.isPseudo) {
        newDays.shift();
      }
      
      // Erstes echtes Datum finden
      const firstRealDay = newDays.find(day => !day.isPseudo);
      if (!firstRealDay) return prevDays;
      
      // 30 neue Tage vor dem ersten Tag erstellen
      const newPastDays: CalendarDay[] = [];
      for (let i = 30; i > 0; i--) {
        const date = new Date(firstRealDay.date);
        date.setDate(firstRealDay.date.getDate() - i);
        newPastDays.push(createDay(date));
      }
      
      // Neuen Pseudo-Button und neue Tage am Anfang hinzufügen
      return [createPseudoDay('load-past'), ...newPastDays, ...newDays];
    });
  }, [createDay, createPseudoDay]);

  // 30 Tage in der Zukunft hinzufügen
  const loadMoreFutureDays = useCallback(() => {
    setDays(prevDays => {
      const newDays = [...prevDays];
      
      // Letzten Pseudo-Tag entfernen
      if (newDays[newDays.length - 1]?.isPseudo) {
        newDays.pop();
      }
      
      // Letztes echtes Datum finden
      const lastRealDay = [...newDays].reverse().find(day => !day.isPseudo);
      if (!lastRealDay) return prevDays;
      
      // 30 neue Tage nach dem letzten Tag erstellen
      const newFutureDays: CalendarDay[] = [];
      for (let i = 1; i <= 30; i++) {
        const date = new Date(lastRealDay.date);
        date.setDate(lastRealDay.date.getDate() + i);
        newFutureDays.push(createDay(date));
      }
      
      // Neue Tage und neuen Pseudo-Button am Ende hinzufügen
      return [...newDays, ...newFutureDays, createPseudoDay('load-future')];
    });
  }, [createDay, createPseudoDay]);

  // Komponente initialisieren
  useEffect(() => {
    const initialDays = generateInitialDays();
    setDays(initialDays);
  }, [generateInitialDays]);

  // Zu heute springen
  const jumpToToday = useCallback(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Sichtbarkeit des heutigen Elements überwachen
  useEffect(() => {
    const currentTodayElement = todayRef.current;
    
    if (!currentTodayElement) {
      setShowJumpButton(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Button anzeigen, wenn das heutige Element nicht vollständig sichtbar ist
        setShowJumpButton(!entry.isIntersecting || entry.intersectionRatio < 0.8);
      },
      {
        threshold: [0, 0.8, 1.0],
        rootMargin: '-20px 0px -20px 0px' // Etwas Puffer für bessere UX
      }
    );

    observer.observe(currentTodayElement);

    return () => {
      observer.disconnect();
    };
  }, [days]); // Re-run wenn sich die Tage ändern

  // Nur beim ersten Render zu heute scrollen
  useEffect(() => {
    if (days.length > 0 && todayRef.current && scrollContainerRef.current && !hasScrolledToTodayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'start'
        });
        hasScrolledToTodayRef.current = true; // Markiere als gescrollt
      }, 200);
    }
  }, [days]);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', // Zentriert den Kalender horizontal
      width: '100%'
    }}>
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: '600px',
        width: '100%', // Nimmt verfügbare Breite ein, max 600px
        position: 'relative' // Für absolute Positionierung des Buttons
      }}>
      <div 
        ref={scrollContainerRef}
        className="vertical-calendar-container"
        style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }}
      >
        {days.map((day, index) => {
          // Pseudo-Buttons für "Mehr laden"
          if (day.isPseudo) {
            return (
              <div
                key={`pseudo-${day.pseudoType}-${index}`}
                className="beos-card"
                style={{ 
                  marginBottom: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (day.pseudoType === 'load-past') {
                    loadMorePastDays();
                  } else {
                    loadMoreFutureDays();
                  }
                }}
              >
                <div className={`beos-icon ${day.pseudoType === 'load-past' ? 'beos-icon-blue' : 'beos-icon-green'}`} style={{ margin: '0 auto 16px' }}>
                  {day.pseudoType === 'load-past' ? '⬆️' : '⬇️'}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: 'var(--color-text)',
                  marginBottom: '8px'
                }}>
                  {day.pseudoType === 'load-past' ? 'Frühere Tage laden' : 'Weitere Tage laden'}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--color-text-subtle)'
                }}>
                  +30 Tage {day.pseudoType === 'load-past' ? 'in der Vergangenheit' : 'in der Zukunft'}
                </div>
              </div>
            );
          }

          // Normale Tage
          return (
            <div
              key={day.date.toISOString()}
              ref={day.isToday ? todayRef : undefined}
              className={`beos-card ${day.isToday ? 'today-card' : ''}`}
              style={{ 
                marginBottom: '16px',
                padding: '20px',
                backgroundColor: day.isToday ? 'var(--color-accent-blue)' : 'var(--color-primary)',
                color: day.isToday ? 'white' : 'var(--color-text)',
                opacity: day.isCurrentMonth ? 1 : 0.7
              }}
            >
              {/* Datum-Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    opacity: day.isToday ? 1 : 0.8,
                    marginBottom: '4px'
                  }}>
                    {day.dayName}
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700'
                  }}>
                    {day.date.getDate()}
                  </div>
                </div>
                
                <div style={{ 
                  textAlign: 'right'
                }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600'
                  }}>
                    {day.date.toLocaleDateString('de-DE', { 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  {day.isToday && (
                    <div style={{ 
                      fontSize: '12px', 
                      opacity: 0.9,
                      marginTop: '4px'
                    }}>
                      Heute
                    </div>
                  )}
                </div>
              </div>
              
              {/* Platzhalter für Mahlzeiten */}
              <div style={{
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                opacity: 0.7,
                fontStyle: 'italic'
              }}>
                {day.isToday ? 'Keine Pläne für heute' : 'Keine Pläne'}
              </div>
            </div>
          );
        })}
      </div>

      {/* "Zu Heute" Button - nur anzeigen wenn heute nicht sichtbar ist */}
      {showJumpButton && (
        <div style={{ 
          position: 'absolute',
          bottom: '32px',
          right: '32px',
          zIndex: 1000
        }}>
          <button
            onClick={jumpToToday}
            className="beos-button"
            style={{ 
              padding: '12px 16px',
              borderRadius: '24px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: 'var(--color-accent-blue)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              opacity: showJumpButton ? 1 : 0,
              transform: showJumpButton ? 'translateY(0)' : 'translateY(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-blue-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-blue)';
            }}
          >
            <div style={{ marginRight: '8px' }}>
              📅
            </div>
            <div>
              Heute
            </div>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
