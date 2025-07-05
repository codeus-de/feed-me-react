import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface CreateMealProps {
  familyId: string;
  selectedDate?: string; // YYYY-MM-DD
  onMealCreated?: () => void;
  onCancel?: () => void;
}

interface Step {
  instructions: string;
  estimatedMinutes?: number;
}

interface Ingredient {
  name: string;
  amountPerPortion: number;
  unit: string;
  inStock: boolean;
  estimatedKcal?: number;
}

export function CreateMeal({ familyId, selectedDate, onMealCreated, onCancel }: CreateMealProps) {
  const [title, setTitle] = useState('');
  // Verwende die gleiche Datumsformatierung wie in VerticalCalendar
  const [date, setDate] = useState(selectedDate || (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })());
  const [portions, setPortions] = useState(2);
  const [steps, setSteps] = useState<Step[]>([{ instructions: '' }]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amountPerPortion: 0, unit: 'g', inStock: true }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMeal = useMutation(api.meals.createMeal);

  const addStep = () => {
    setSteps([...steps, { instructions: '' }]);
  };

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const newSteps = [...steps];
    if (field === 'estimatedMinutes') {
      newSteps[index][field] = value as number || undefined;
    } else {
      newSteps[index][field] = value as string;
    }
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amountPerPortion: 0, unit: 'g', inStock: true }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number | boolean) => {
    const newIngredients = [...ingredients];
    if (field === 'amountPerPortion') {
      newIngredients[index][field] = value as number || 0;
    } else if (field === 'estimatedKcal') {
      newIngredients[index][field] = (value as number) || undefined;
    } else if (field === 'inStock') {
      newIngredients[index][field] = value as boolean;
    } else {
      newIngredients[index][field] = value as string;
    }
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Bitte gib einen Namen für die Mahlzeit ein');
      return;
    }

    if (steps.every(step => !step.instructions.trim())) {
      alert('Bitte füge mindestens einen Zubereitungsschritt hinzu');
      return;
    }

    if (ingredients.every(ing => !ing.name.trim())) {
      alert('Bitte füge mindestens eine Zutat hinzu');
      return;
    }

    setIsSubmitting(true);

    const submitMeal = async () => {
      try {
        const validSteps = steps.filter(step => step.instructions.trim());
        const validIngredients = ingredients.filter(ing => ing.name.trim());

        await createMeal({
          familyId: familyId as any,
          date,
          title: title.trim(),
          portions,
          steps: validSteps,
          ingredients: validIngredients,
        });

        onMealCreated?.();
      } catch (error) {
        console.error('Fehler beim Erstellen der Mahlzeit:', error);
        alert('Fehler beim Erstellen der Mahlzeit. Bitte versuche es erneut.');
      } finally {
        setIsSubmitting(false);
      }
    };

    void submitMeal();
  };

  return (
    <div className="beos-card" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div className="beos-icon beos-icon-orange" style={{ margin: '0 auto 16px' }}>
          🍽️
        </div>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: 'var(--color-text)',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          Neue Mahlzeit planen
        </h2>
        <p style={{ 
          color: 'var(--color-text-subtle)', 
          textAlign: 'center',
          fontSize: '16px'
        }}>
          Erstelle einen neuen Essensplan für deine Familie
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Grunddaten */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>
                Name der Mahlzeit
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Spaghetti Bolognese"
                className="beos-input"
                style={{ width: '100%' }}
                required
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="beos-input"
                style={{ width: '100%' }}
                required
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>
                Portionen
              </label>
              <input
                type="number"
                value={portions}
                onChange={(e) => setPortions(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                className="beos-input"
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Zutaten */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--color-text)',
            marginBottom: '16px'
          }}>
            Zutaten
          </h3>
          
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="beos-info-box"
              style={{ 
                marginBottom: '12px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto auto',
                gap: '12px',
                alignItems: 'end'
              }}
            >
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: 'var(--color-text)',
                  marginBottom: '4px'
                }}>
                  Zutat
                </label>
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  placeholder="z.B. Hackfleisch"
                  className="beos-input"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: 'var(--color-text)',
                  marginBottom: '4px'
                }}>
                  Menge/Portion
                </label>
                <input
                  type="number"
                  value={ingredient.amountPerPortion || ''}
                  onChange={(e) => updateIngredient(index, 'amountPerPortion', parseFloat(e.target.value))}
                  placeholder="250"
                  className="beos-input"
                  style={{ width: '100%' }}
                  step="0.1"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: 'var(--color-text)',
                  marginBottom: '4px'
                }}>
                  Einheit
                </label>
                <select
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="beos-input"
                  style={{ width: '100%' }}
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="Stück">Stück</option>
                  <option value="EL">EL</option>
                  <option value="TL">TL</option>
                  <option value="Prise">Prise</option>
                </select>
              </div>
              
              <button
                type="button"
                onClick={() => updateIngredient(index, 'inStock', !ingredient.inStock)}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
                title={ingredient.inStock ? 'Vorrätig' : 'Nicht vorrätig'}
              >
                {ingredient.inStock ? '✅' : '❌'}
              </button>
              
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length <= 1}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  cursor: ingredients.length > 1 ? 'pointer' : 'not-allowed',
                  fontSize: '18px',
                  opacity: ingredients.length > 1 ? 1 : 0.5
                }}
              >
                🗑️
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addIngredient}
            className="beos-button"
            style={{ marginTop: '8px' }}
          >
            + Zutat hinzufügen
          </button>
        </div>

        {/* Zubereitungsschritte */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--color-text)',
            marginBottom: '16px'
          }}>
            Zubereitung
          </h3>
          
          {steps.map((step, index) => (
            <div
              key={index}
              className="beos-info-box"
              style={{ 
                marginBottom: '12px',
                padding: '16px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  backgroundColor: 'var(--color-accent-blue)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <input
                  type="number"
                  value={step.estimatedMinutes || ''}
                  onChange={(e) => updateStep(index, 'estimatedMinutes', parseInt(e.target.value))}
                  placeholder="Minuten"
                  className="beos-input"
                  style={{ width: '100px' }}
                />
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  disabled={steps.length <= 1}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    cursor: steps.length > 1 ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    opacity: steps.length > 1 ? 1 : 0.5
                  }}
                >
                  🗑️
                </button>
              </div>
              
              <textarea
                value={step.instructions}
                onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                placeholder="Beschreibe diesen Zubereitungsschritt..."
                className="beos-input"
                style={{ 
                  width: '100%',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                rows={3}
              />
            </div>
          ))}
          
          <button
            type="button"
            onClick={addStep}
            className="beos-button"
            style={{ marginTop: '8px' }}
          >
            + Schritt hinzufügen
          </button>
        </div>

        {/* Aktionen */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          justifyContent: 'center',
          marginTop: '32px'
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="beos-button"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
          )}
          <button
            type="submit"
            className="beos-button beos-button-primary"
            disabled={isSubmitting}
            style={{ minWidth: '120px' }}
          >
            {isSubmitting ? 'Erstelle...' : 'Mahlzeit erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}
