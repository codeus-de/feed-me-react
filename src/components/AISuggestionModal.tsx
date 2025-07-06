import { useState, useCallback, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface AISuggestionModalProps {
  familyId: Id<"families">;
  selectedDate?: string; // YYYY-MM-DD
  onMealCreated?: () => void;
  onCancel?: () => void;
}

interface MealSuggestion {
  title: string;
  portions: number;
  steps: Array<{
    instructions: string;
    estimatedMinutes?: number;
  }>;
  ingredients: Array<{
    name: string;
    amountPerPortion: number;
    unit: string;
    inStock: boolean;
    estimatedKcal?: number;
  }>;
}

type ViewState = 'parameters' | 'loading' | 'result';

export function AISuggestionModal({ familyId, selectedDate, onMealCreated, onCancel }: AISuggestionModalProps) {
  const [viewState, setViewState] = useState<ViewState>('parameters');
  const [selectedUserIds, setSelectedUserIds] = useState<Id<"users">[]>([]);
  const [mealType, setMealType] = useState<'large' | 'small'>('large');
  const [customHints, setCustomHints] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState('');
  const [excludeLastMealsCount, setExcludeLastMealsCount] = useState(5);
  const [generatedSuggestion, setGeneratedSuggestion] = useState<MealSuggestion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const familyMembers = useQuery(api.userPreferences.getFamilyPreferences, { familyId });
  const generateSuggestion = useAction(api.aiSuggestions.generateMealSuggestion);

  // Auto-select all family members initially
  useEffect(() => {
    if (familyMembers && familyMembers.length > 0 && selectedUserIds.length === 0) {
      setSelectedUserIds(familyMembers.map(member => member.userId));
    }
  }, [familyMembers, selectedUserIds.length]);

  const handleUserSelection = useCallback((userId: Id<"users">, isSelected: boolean) => {
    setSelectedUserIds(prev => {
      if (isSelected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  }, []);

  const handleGenerateSuggestion = useCallback(async () => {
    if (selectedUserIds.length === 0) {
      setErrorMessage('Bitte wähle mindestens eine Person aus.');
      return;
    }

    setViewState('loading');
    setErrorMessage(null);

    try {
      // Prepare family preferences for selected users
      const selectedFamilyPreferences = (familyMembers || [])
        .filter(member => selectedUserIds.includes(member.userId))
        .map(member => ({
          name: member.name,
          preferences: member.preferences,
          dislikes: member.dislikes,
          allergies: member.allergies,
        }));

      // Get recent meals (simplified - in real app you'd fetch this)
      const recentMeals: Array<{ title: string; date: string }> = [];

      const suggestion = await generateSuggestion({
        familyId,
        selectedUserIds,
        mealType,
        customHints: customHints.trim() || undefined,
        availableIngredients: availableIngredients.trim() || undefined,
        excludeLastMealsCount,
        familyPreferences: selectedFamilyPreferences,
        recentMeals,
      });

      setGeneratedSuggestion(suggestion);
      setViewState('result');
    } catch (error) {
      console.error('Error generating suggestion:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      setViewState('parameters');
    }
  }, [
    selectedUserIds,
    familyMembers,
    familyId,
    mealType,
    customHints,
    availableIngredients,
    excludeLastMealsCount,
    generateSuggestion,
  ]);

  const handleSaveMeal = useCallback(async () => {
    if (!generatedSuggestion || !selectedDate) {
      return;
    }

    try {
      // For now, we'll just trigger the meal created callback
      // In the real implementation, you would call the createMeal mutation
      console.log('Would create meal:', {
        familyId,
        date: selectedDate,
        title: generatedSuggestion.title,
        portions: generatedSuggestion.portions,
        steps: generatedSuggestion.steps,
        ingredients: generatedSuggestion.ingredients,
      });

      onMealCreated?.();
    } catch (error) {
      console.error('Error saving meal:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Fehler beim Speichern');
    }
  }, [generatedSuggestion, selectedDate, familyId, onMealCreated]);

  const handleNewSuggestion = useCallback(() => {
    setViewState('parameters');
    setGeneratedSuggestion(null);
    setErrorMessage(null);
  }, []);

  if (!familyMembers) {
    return (
      <div className="beos-card" style={{ padding: '48px', textAlign: 'center' }}>
        <div className="beos-icon beos-icon-blue" style={{ margin: '0 auto 24px' }}>
          🤖
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Lade Familiendaten...
        </div>
      </div>
    );
  }

  return (
    <div className="beos-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '32px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="beos-icon beos-icon-purple">
            🤖
          </div>
          <div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: 'var(--color-text)',
              margin: 0 
            }}>
              KI-Mahlzeit Vorschlag
            </h2>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--color-text-subtle)',
              marginTop: '4px' 
            }}>
              Lass dir eine passende Mahlzeit vorschlagen
            </div>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="beos-button"
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✖️</span>
          <span>Schließen</span>
        </button>
      </div>

      {errorMessage && (
        <div className="beos-error-box" style={{ marginBottom: '24px' }}>
          {errorMessage}
        </div>
      )}

      {/* Parameters View */}
      {viewState === 'parameters' && (
        <div>
          {/* Family Member Selection */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              👨‍👩‍👧‍👦 Wer isst mit?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {familyMembers.map((member) => (
                <label
                  key={member.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(member.userId)}
                    onChange={(e) => handleUserSelection(member.userId, e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: 'var(--color-text)' 
                    }}>
                      {member.name || 'Unbenanntes Mitglied'}
                    </div>
                    {(member.preferences || member.dislikes || member.allergies) && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--color-text-subtle)',
                        marginTop: '4px' 
                      }}>
                        {member.preferences && `Mag: ${member.preferences.slice(0, 50)}${member.preferences.length > 50 ? '...' : ''} | `}
                        {member.allergies && `Allergien: ${member.allergies.slice(0, 30)}${member.allergies.length > 30 ? '...' : ''}`}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Meal Type Selection */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              🍽️ Art der Mahlzeit
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor: mealType === 'large' ? 'var(--color-accent-green)' : 'var(--color-surface)',
                  color: mealType === 'large' ? 'white' : 'var(--color-text)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <input
                  type="radio"
                  name="mealType"
                  value="large"
                  checked={mealType === 'large'}
                  onChange={(e) => setMealType(e.target.value as 'large')}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍳</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Große Mahlzeit</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  Mit Kochen, Hauptgericht
                </div>
              </label>

              <label
                style={{
                  flex: 1,
                  padding: '20px',
                  backgroundColor: mealType === 'small' ? 'var(--color-accent-orange)' : 'var(--color-surface)',
                  color: mealType === 'small' ? 'white' : 'var(--color-text)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <input
                  type="radio"
                  name="mealType"
                  value="small"
                  checked={mealType === 'small'}
                  onChange={(e) => setMealType(e.target.value as 'small')}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥪</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Kleiner Snack</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                  Leichte Mahlzeit, schnell
                </div>
              </label>
            </div>
          </div>

          {/* Custom Hints */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              💡 Spezielle Wünsche (optional)
            </h3>
            <textarea
              className="beos-input"
              value={customHints}
              onChange={(e) => setCustomHints(e.target.value)}
              placeholder="z.B. 'Etwas mit Pasta', 'Vegetarisch', 'Schnell zubereitet'..."
              style={{
                width: '100%',
                minHeight: '80px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Available Ingredients */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              🥕 Verfügbare Zutaten (optional)
            </h3>
            <textarea
              className="beos-input"
              value={availableIngredients}
              onChange={(e) => setAvailableIngredients(e.target.value)}
              placeholder="z.B. 'Tomaten, Zwiebeln, Hackfleisch' - Diese Zutaten sollen verwendet werden"
              style={{
                width: '100%',
                minHeight: '80px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Exclude Recent Meals */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              🔄 Abwechslung
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '16px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
            }}>
              <label style={{ 
                fontSize: '16px', 
                color: 'var(--color-text)',
                flex: 1 
              }}>
                Vermeide die letzten {excludeLastMealsCount} Mahlzeiten:
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={excludeLastMealsCount}
                onChange={(e) => setExcludeLastMealsCount(parseInt(e.target.value))}
                style={{ width: '120px' }}
              />
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: 'var(--color-text)',
                minWidth: '30px',
                textAlign: 'center' 
              }}>
                {excludeLastMealsCount}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => void handleGenerateSuggestion()}
            className="beos-button beos-button-primary"
            disabled={selectedUserIds.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <span>🤖</span>
            <span>Vorschlag generieren</span>
          </button>
        </div>
      )}

      {/* Loading View */}
      {viewState === 'loading' && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px' 
        }}>
          <div className="beos-icon beos-icon-purple" style={{ 
            width: '80px', 
            height: '80px',
            animation: 'pulse 2s infinite' 
          }}>
            🤖
          </div>
          <div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '8px' 
            }}>
              KI erstellt deinen Vorschlag...
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--color-text-subtle)' 
            }}>
              Das kann einen Moment dauern
            </div>
          </div>
          
          {/* Simple Loading Animation */}
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: '30%',
              backgroundColor: 'var(--color-accent-purple)',
              borderRadius: '2px',
              animation: 'slideRight 2s infinite ease-in-out',
            }} />
          </div>
        </div>
      )}

      {/* Result View */}
      {viewState === 'result' && generatedSuggestion && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            marginBottom: '24px' 
          }}>
            <div className="beos-icon beos-icon-green">
              ✨
            </div>
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700',
                color: 'var(--color-text)',
                margin: 0 
              }}>
                {generatedSuggestion.title}
              </h3>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--color-text-subtle)',
                marginTop: '4px' 
              }}>
                Für {generatedSuggestion.portions} {generatedSuggestion.portions === 1 ? 'Portion' : 'Portionen'}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              🛒 Zutaten
            </h4>
            <div style={{ 
              display: 'grid', 
              gap: '8px' 
            }}>
              {generatedSuggestion.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    <span style={{ opacity: ingredient.inStock ? 1 : 0.5 }}>
                      {ingredient.inStock ? '✅' : '❌'}
                    </span>
                    <span style={{ 
                      fontSize: '14px',
                      color: 'var(--color-text)' 
                    }}>
                      {ingredient.name}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-text)' 
                  }}>
                    {ingredient.amountPerPortion * generatedSuggestion.portions} {ingredient.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '16px' 
            }}>
              👨‍🍳 Zubereitung
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {generatedSuggestion.steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{
                    minWidth: '32px',
                    height: '32px',
                    backgroundColor: 'var(--color-accent-blue)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: 1.5 
                    }}>
                      {step.instructions}
                    </div>
                    {step.estimatedMinutes && (
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--color-text-subtle)',
                        marginTop: '8px' 
                      }}>
                        ⏱️ ca. {step.estimatedMinutes} Min.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            justifyContent: 'center' 
          }}>
            <button
              onClick={handleNewSuggestion}
              className="beos-button"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🔄</span>
              <span>Neuer Vorschlag</span>
            </button>

            <button
              onClick={() => void handleSaveMeal()}
              className="beos-button beos-button-primary"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💾</span>
              <span>Mahlzeit speichern</span>
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          
          @keyframes slideRight {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(333%); }
          }
        `}
      </style>
    </div>
  );
}
