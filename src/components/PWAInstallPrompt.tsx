import React, { useState, useEffect } from 'react';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Prüfe ob es sich um ein iOS-Gerät handelt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone;
    
    // Zeige Prompt nur auf iOS-Geräten, die noch nicht im PWA-Modus sind
    if (isIOS && !isInStandaloneMode) {
      // Warte etwas, bevor der Prompt angezeigt wird
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    // Event Listener für Android/Desktop PWA Install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Android/Desktop Installation
      deferredPrompt.prompt().then(() => {
        return deferredPrompt.userChoice;
      }).then((result: any) => {
        console.log(`User response to the install prompt: ${result.outcome}`);
        setDeferredPrompt(null);
      });
    }
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
    if (onClose) onClose();
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="beos-card max-w-md mx-auto">
        <div className="flex items-start gap-4">
          <div className="beos-icon beos-icon-green flex-shrink-0">
            📱
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold mb-2">Koobi als App installieren</h3>
            {isIOS ? (
              <p className="text-sm text-gray-300 mb-4">
                Tippen Sie auf <strong>Teilen</strong> in Safari und dann auf 
                <strong> "Zum Home-Bildschirm"</strong> um Koobi wie eine native App zu nutzen.
              </p>
            ) : (
              <p className="text-sm text-gray-300 mb-4">
                Installieren Sie Koobi auf Ihrem Gerät für eine bessere App-Erfahrung.
              </p>
            )}
            <div className="flex gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="beos-button beos-button-primary text-sm px-4 py-2"
                >
                  Installieren
                </button>
              )}
              <button
                onClick={handleClose}
                className="beos-button text-sm px-4 py-2"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
