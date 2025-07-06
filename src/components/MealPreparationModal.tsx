import { useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface MealPreparationModalProps {
  mealId: Id<"meals">;
  onClose: () => void;
}

interface CheckedState {
  ingredients: Set<string>;
  steps: Set<number>;
}

export function MealPreparationModal({ mealId, onClose }: MealPreparationModalProps) {
  const [checkedState, setCheckedState] = useState<CheckedState>({
    ingredients: new Set(),
    steps: new Set(),
  });

  // Lade Mahlzeit-Details
  const meal = useQuery(api.meals.getMealById, { mealId });

  const handleIngredientCheck = useCallback((ingredientId: string) => {
    setCheckedState(prev => {
      const newIngredients = new Set(prev.ingredients);
      if (newIngredients.has(ingredientId)) {
        newIngredients.delete(ingredientId);
      } else {
        newIngredients.add(ingredientId);
      }
      return {
        ...prev,
        ingredients: newIngredients,
      };
    });
  }, []);

  const handleStepCheck = useCallback((stepPosition: number) => {
    setCheckedState(prev => {
      const newSteps = new Set(prev.steps);
      if (newSteps.has(stepPosition)) {
        newSteps.delete(stepPosition);
      } else {
        newSteps.add(stepPosition);
      }
      return {
        ...prev,
        steps: newSteps,
      };
    });
  }, []);

  const handleCloseModal = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!meal) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleCloseModal}
      >
        <div className="beos-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
          <div className="beos-icon beos-icon-orange" style={{ margin: '0 auto 24px' }}>
            🍽️
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Lade Mahlzeit...
          </div>
        </div>
      </div>
    );
  }

  const totalIngredients = meal.ingredients.length;
  const checkedIngredients = checkedState.ingredients.size;
  const totalSteps = meal.steps.length;
  const checkedSteps = checkedState.steps.size;

  const ingredientsProgress = totalIngredients > 0 ? (checkedIngredients / totalIngredients) * 100 : 0;
  const stepsProgress = totalSteps > 0 ? (checkedSteps / totalSteps) * 100 : 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleCloseModal}
    >
      <div 
        className="beos-card"
        style={{ 
          padding: '0',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '32px 32px 24px',
          textAlign: 'center',
          backgroundColor: '#ffffff'
        }}>
          <div className="beos-icon beos-icon-orange" style={{ margin: '0 auto 16px' }}>
            🍽️
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            margin: '0 0 8px',
            color: '#1a1a1a'
          }}>
            {meal.title}
          </h2>
          <div style={{ 
            fontSize: '16px', 
            color: '#666666',
            marginBottom: '24px'
          }}>
            Für {meal.portions} {meal.portions === 1 ? 'Person' : 'Personen'}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="beos-button"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '8px 12px',
              fontSize: '14px',
              minWidth: 'auto'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          padding: '0 32px 32px'
        }}>
          {/* Zutaten Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: '0',
                color: '#1a1a1a'
              }}>
                📋 Zutaten sammeln
              </h3>
              <div style={{ 
                fontSize: '14px', 
                color: '#666666',
                fontWeight: '500'
              }}>
                {checkedIngredients} / {totalIngredients}
              </div>
            </div>

            {/* Progress Bar - Zutaten */}
            <div style={{ 
              backgroundColor: '#f5f5f5',
              height: '8px',
              borderRadius: '4px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#22c55e',
                height: '100%',
                width: `${ingredientsProgress}%`,
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>

            {/* Zutaten Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {meal.ingredients.map((ingredient: any) => {
                const isChecked = checkedState.ingredients.has(ingredient._id);
                return (
                  <div
                    key={ingredient._id}
                    onClick={() => handleIngredientCheck(ingredient._id)}
                    className="beos-info-box"
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      backgroundColor: isChecked ? '#f0f9ff' : '#f5f5f5',
                      opacity: isChecked ? 0.7 : 1
                    }}
                  >
                    <div style={{ 
                      fontSize: '18px',
                      color: isChecked ? '#22c55e' : '#666666',
                      minWidth: '20px'
                    }}>
                      {isChecked ? '✅' : '⬜'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '500',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? '#666666' : '#1a1a1a'
                      }}>
                        {ingredient.name}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#666666',
                        marginTop: '2px'
                      }}>
                        {(ingredient.amountPerPortion * meal.portions).toFixed(1)} {ingredient.unit}
                        {ingredient.estimatedKcal && (
                          <span style={{ marginLeft: '8px' }}>
                            (~{Math.round(ingredient.estimatedKcal * meal.portions)} kcal)
                          </span>
                        )}
                      </div>
                    </div>
                    {ingredient.inStock && (
                      <div style={{ 
                        fontSize: '12px',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}>
                        Vorrätig
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zubereitungsschritte Section */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: '0',
                color: '#1a1a1a'
              }}>
                👨‍🍳 Zubereitung
              </h3>
              <div style={{ 
                fontSize: '14px', 
                color: '#666666',
                fontWeight: '500'
              }}>
                {checkedSteps} / {totalSteps}
              </div>
            </div>

            {/* Progress Bar - Schritte */}
            <div style={{ 
              backgroundColor: '#f5f5f5',
              height: '8px',
              borderRadius: '4px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#3b82f6',
                height: '100%',
                width: `${stepsProgress}%`,
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>

            {/* Schritte Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {meal.steps.sort((a: any, b: any) => a.position - b.position).map((step: any) => {
                const isChecked = checkedState.steps.has(step.position);
                return (
                  <div
                    key={step._id}
                    onClick={() => handleStepCheck(step.position)}
                    className="beos-info-box"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      backgroundColor: isChecked ? '#f0f9ff' : '#f5f5f5',
                      opacity: isChecked ? 0.7 : 1
                    }}
                  >
                    <div style={{ 
                      fontSize: '18px',
                      color: isChecked ? '#3b82f6' : '#666666',
                      minWidth: '20px',
                      marginTop: '2px'
                    }}>
                      {isChecked ? '✅' : '⬜'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ 
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Schritt {step.position}
                        </div>
                        {step.estimatedMinutes && (
                          <div style={{ 
                            fontSize: '12px',
                            color: '#666666',
                            fontWeight: '500'
                          }}>
                            📅 ~{step.estimatedMinutes} Min
                          </div>
                        )}
                      </div>
                      <div style={{ 
                        lineHeight: '1.5',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? '#666666' : '#1a1a1a'
                      }}>
                        {step.instructions}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Message */}
          {checkedIngredients === totalIngredients && checkedSteps === totalSteps && (
            <div className="beos-info-box" style={{ 
              marginTop: '24px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f0fdf4'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#22c55e',
                marginBottom: '4px'
              }}>
                Mahlzeit fertig zubereitet!
              </div>
              <div style={{ fontSize: '14px', color: '#666666' }}>
                Guten Appetit! 🍽️
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
