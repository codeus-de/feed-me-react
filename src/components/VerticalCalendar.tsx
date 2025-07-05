import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CreateMeal } from './CreateMeal';

interface CalendarDay {
  date: Date;
  dayName: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  isPseudo?: boolean;
  pseudoType?: 'load-past' | 'load-future';
}

interface Meal {
  _id: string;
  date: string;
  title: string;
  portions: number;
  createdAt: number;
  createdBy: string;
  familyId: string;
  _creationTime: number;
  steps: Array<{
    _id: string;
    position: number;
    instructions: string;
    estimatedMinutes?: number;
    mealId: string;
    _creationTime: number;
  }>;
  ingredients: Array<{
    _id: string;
    name: string;
    amountPerPortion: number;
    unit: string;
    inStock: boolean;
    estimatedKcal?: number;
    mealId: string;
    _creationTime: number;
  }>;
}

interface VerticalCalendarProps {
  familyId: string;
}

export function VerticalCalendar({ familyId }: VerticalCalendarProps) {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [loadedDateRanges, setLoadedDateRanges] = useState<Set<string>>(new Set());
  const [visibleDates, setVisibleDates] = useState<Set<string>>(new Set());
  const [scrollDebounceTimer, setScrollDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [allMeals, setAllMeals] = useState<Record<string, Meal[]>>({});
  const hasScrolledToTodayRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const dateElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sichtbare Datumsbereiche für Mahlzeiten-Query (nur nicht-geladene Daten)
  const datesToLoad = Array.from(visibleDates).filter(date => 
    !loadedDateRanges.has(date)
  );
  
  // Mahlzeiten für sichtbare Tage laden
  const mealsData = useQuery(
    api.meals.getMealsForDates, 
    datesToLoad.length > 0 ? { 
      familyId: familyId as any, 
      dates: datesToLoad 
    } : "skip"
  );

  // Debug-Logging
  useEffect(() => {
    console.log('📊 VerticalCalendar State:', {
      visibleDates: Array.from(visibleDates),
      datesToLoad,
      loadedDateRanges: Array.from(loadedDateRanges),
      mealsDataLength: mealsData?.length || 0,
      allMealsKeys: Object.keys(allMeals)
    });
  }, [visibleDates, datesToLoad, loadedDateRanges, mealsData, allMeals]);

  // Neue Mahlzeiten-Daten in den persistenten State integrieren
  useEffect(() => {
    if (mealsData !== undefined && datesToLoad.length > 0) {
      console.log('🍽️ Mahlzeiten-Daten erhalten:', mealsData);
      
      // Markiere die Datumsbereiche als geladen
      setLoadedDateRanges(prev => {
        const newSet = new Set(prev);
        datesToLoad.forEach((date: string) => newSet.add(date));
        return newSet;
      });
      
      if (mealsData && mealsData.length > 0) {
        setAllMeals(prev => {
          const updated = { ...prev };
          
          // Gruppiere neue Mahlzeiten nach Datum
          mealsData.forEach(meal => {
            if (!updated[meal.date]) {
              updated[meal.date] = [];
            }
            // Prüfe ob Mahlzeit bereits existiert (by ID)
            const existingIndex = updated[meal.date].findIndex(m => m._id === meal._id);
            if (existingIndex >= 0) {
              // Aktualisiere existierende Mahlzeit
              updated[meal.date][existingIndex] = meal;
            } else {
              // Füge neue Mahlzeit hinzu
              updated[meal.date].push(meal);
            }
          });
          
          console.log('📝 Aktualisierte Mahlzeiten:', updated);
          return updated;
        });
      }
    }
  }, [mealsData, datesToLoad]);

  // Hilfsfunktion: Datum zu String (lokale Zeitzone)
  const dateToString = useCallback((date: Date): string => {
    // Verwende lokale Zeitzone statt UTC um Zeitzone-Verschiebungen zu vermeiden
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD
  }, []);

  // Sichtbare Datumselemente überwachen
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    const observeElement = (element: HTMLDivElement, dateStr: string) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setVisibleDates(prev => {
            const newSet = new Set(prev);
            if (entry.isIntersecting) {
              newSet.add(dateStr);
            } else {
              newSet.delete(dateStr);
            }
            return newSet;
          });
        },
        {
          root: scrollContainerRef.current,
          threshold: 0.1,
          rootMargin: '100px 0px 100px 0px' // Früh laden für bessere UX
        }
      );
      
      observer.observe(element);
      observers.push(observer);
    };

    // Alle Datumselemente beobachten
    dateElementRefs.current.forEach((element, dateStr) => {
      observeElement(element, dateStr);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [days]);

  // Scroll-Debouncing für Batch-Loading
  const handleScroll = useCallback(() => {
    if (scrollDebounceTimer) {
      clearTimeout(scrollDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      // Hier könnte zusätzliche Logik für optimiertes Laden stehen
      // Die Intersection Observer handhaben bereits das meiste
    }, 300); // 300ms Debounce
    
    setScrollDebounceTimer(timer);
  }, [scrollDebounceTimer]);

  // Mahlzeit-Dialog öffnen
  const openCreateMeal = useCallback((date?: string) => {
    setSelectedDate(date);
    setShowCreateMeal(true);
  }, []);

  // Mahlzeit-Dialog schließen
  const closeCreateMeal = useCallback(() => {
    setShowCreateMeal(false);
    setSelectedDate(undefined);
  }, []);

  // Nach Mahlzeit-Erstellung
  const handleMealCreated = useCallback(() => {
    closeCreateMeal();
    // Lösche die geladenen Datumsbereiche, damit die Daten neu geladen werden
    setLoadedDateRanges(new Set());
    setAllMeals({});
    console.log('🔄 Mahlzeit erstellt - lade Daten neu');
  }, [closeCreateMeal]);

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

  // Initiales Laden der Daten für heute und umliegende Tage
  useEffect(() => {
    const today = new Date();
    const initialDates: string[] = [];
    
    // Lade Daten für heute und die nächsten/vorherigen 7 Tage
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      initialDates.push(dateToString(date));
    }
    
    console.log('🚀 Initiales Laden für Daten:', initialDates);
    setVisibleDates(new Set(initialDates));
  }, [dateToString]);

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
        onScroll={handleScroll}
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
          const dateStr = dateToString(day.date);
          const dayMeals = allMeals[dateStr] || [];

          return (
            <div
              key={day.date.toISOString()}
              ref={(el) => {
                if (day.isToday) {
                  todayRef.current = el;
                }
                if (el) {
                  dateElementRefs.current.set(dateStr, el);
                } else {
                  dateElementRefs.current.delete(dateStr);
                }
              }}
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
              
              {/* Mahlzeiten für diesen Tag */}
              <div style={{ minHeight: '60px' }}>
                {dayMeals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dayMeals.map((meal) => (
                      <div
                        key={meal._id}
                        style={{
                          backgroundColor: day.isToday ? 'rgba(255,255,255,0.15)' : 'var(--color-surface)',
                          borderRadius: '12px',
                          padding: '12px',
                          border: 'none'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: day.isToday ? 'white' : 'var(--color-text)'
                          }}>
                            🍽️ {meal.title}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: day.isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-text-subtle)',
                            backgroundColor: day.isToday ? 'rgba(255,255,255,0.1)' : 'var(--color-primary)',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: 'none'
                          }}>
                            {meal.portions} {meal.portions === 1 ? 'Portion' : 'Portionen'}
                          </div>
                        </div>
                        
                        {/* Zutaten-Preview */}
                        {meal.ingredients.length > 0 && (
                          <div style={{
                            fontSize: '12px',
                            color: day.isToday ? 'rgba(255,255,255,0.9)' : 'var(--color-text-subtle)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            {meal.ingredients.slice(0, 3).map((ingredient, idx) => (
                              <span
                                key={ingredient._id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span style={{ opacity: ingredient.inStock ? 1 : 0.5 }}>
                                  {ingredient.inStock ? '✅' : '❌'}
                                </span>
                                {ingredient.name}
                                {idx < Math.min(meal.ingredients.length, 3) - 1 && ' •'}
                              </span>
                            ))}
                            {meal.ingredients.length > 3 && (
                              <span style={{ opacity: 0.7 }}>
                                +{meal.ingredients.length - 3} weitere
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Mahlzeit hinzufügen Button */}
                    <button
                      onClick={() => openCreateMeal(dateStr)}
                      className="beos-button"
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        marginTop: '8px',
                        backgroundColor: day.isToday ? 'rgba(255,255,255,0.1)' : 'var(--color-surface)',
                        color: day.isToday ? 'white' : 'var(--color-text)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <span>➕</span>
                      <span>Mahlzeit hinzufügen</span>
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60px',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      opacity: 0.7,
                      fontStyle: 'italic'
                    }}>
                      {day.isToday ? 'Keine Pläne für heute' : 'Keine Pläne'}
                    </div>
                    
                    {/* Mahlzeit hinzufügen Button für leere Tage */}
                    <button
                      onClick={() => openCreateMeal(dateStr)}
                      className="beos-button beos-button-primary"
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: day.isToday ? 'rgba(255,255,255,0.2)' : 'var(--color-accent-blue)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <span>➕</span>
                      <span>Mahlzeit planen</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button für neue Mahlzeit */}
      <div style={{ 
        position: 'absolute',
        bottom: showJumpButton ? '88px' : '32px',
        right: '32px',
        zIndex: 1000,
        transition: 'bottom 0.3s ease'
      }}>
        <button
          onClick={() => openCreateMeal(dateToString(new Date()))}
          className="beos-button beos-button-primary"
          style={{ 
            padding: '16px',
            borderRadius: '50%',
            fontSize: '24px',
            fontWeight: '600',
            backgroundColor: 'var(--color-accent-orange)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
          title="Neue Mahlzeit planen"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = 'var(--color-accent-orange)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'var(--color-accent-orange)';
          }}
        >
          🍽️
        </button>
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

      {/* Mahlzeit erstellen Modal */}
      {showCreateMeal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-primary)',
            borderRadius: '20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: '100%',
            maxWidth: '800px',
            position: 'relative'
          }}>
            <CreateMeal 
              familyId={familyId}
              selectedDate={selectedDate}
              onMealCreated={handleMealCreated}
              onCancel={closeCreateMeal}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
