/**
 * Hilfsfunktion um technische Convex-Fehlermeldungen zu bereinigen
 * und nur die benutzerfreundliche Nachricht zu zeigen
 */
export function cleanErrorMessage(error: Error): string {
  let message = error.message;
  
  // Entferne Convex-spezifische Präfixe und technische Details
  const patterns = [
    /\[CONVEX.*?\]\s*/g,           // [CONVEX M(myFunctions:joinFamily)] [Request ID: xxx]
    /\[Request ID:.*?\]\s*/g,      // [Request ID: 7272f10e52df7100]
    /Server Error\s*/g,            // Server Error
    /Uncaught Error:\s*/g,         // Uncaught Error:
    /\s+at\s+.*$/gm,              // Stack trace lines
    /\s+Called by.*$/gm,          // Called by client
  ];
  
  patterns.forEach(pattern => {
    message = message.replace(pattern, '');
  });
  
  return message.trim() || "Ein unbekannter Fehler ist aufgetreten.";
}

/**
 * Wrapper-Funktion für Convex Mutation Fehlerbehandlung
 */
export function handleConvexError(error: unknown, fallbackMessage = "Ein unbekannter Fehler ist aufgetreten."): string {
  if (error instanceof Error) {
    return cleanErrorMessage(error);
  }
  return fallbackMessage;
}
