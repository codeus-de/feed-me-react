import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface MealMenuProps {
  mealId: Id<"meals">;
  mealTitle: string;
  onMealDeleted: () => void;
}

export function MealMenu({ mealId, mealTitle, onMealDeleted }: MealMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteMealMutation = useMutation(api.meals.deleteMeal);

  // Schließe das Menü wenn außerhalb geklickt wird
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDeleteMeal = async () => {
    try {
      await deleteMealMutation({ mealId });
      onMealDeleted();
      setIsOpen(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Fehler beim Löschen der Mahlzeit:', error);
      alert('Fehler beim Löschen der Mahlzeit. Bitte versuchen Sie es erneut.');
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Verhindert, dass das Meal-Click Event ausgelöst wird
    setIsOpen(!isOpen);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    void handleDeleteMeal();
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', zIndex: 10 }}>
      {/* Drei-Punkte-Button */}
      <button
        onClick={handleMenuClick}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 8px',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: '16px',
          lineHeight: 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        ⋮
      </button>

      {/* Dropdown-Menü */}
      {isOpen && !showDeleteConfirm && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '4px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            border: 'none',
            minWidth: '160px',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <button
            onClick={handleDeleteClick}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'var(--color-accent-red)',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            🗑️ Mahlzeit löschen
          </button>
        </div>
      )}

      {/* Bestätigungsdialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '4px',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            border: 'none',
            minWidth: '240px',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div style={{ 
            marginBottom: '12px',
            fontSize: '14px',
            color: 'var(--color-text)',
            lineHeight: 1.4
          }}>
            Möchten Sie "{mealTitle}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
          
          <div style={{ 
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleCancelDelete}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              }}
            >
              Abbrechen
            </button>
            
            <button
              onClick={handleConfirmDelete}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'var(--color-accent-red)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#aa0000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-accent-red)';
              }}
            >
              Löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
