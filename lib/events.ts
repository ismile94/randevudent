// Real-time event system for cross-component communication
// This allows updates to be reflected across all open tabs/pages without refresh

export type EventType = 
  | 'appointment:created'
  | 'appointment:updated'
  | 'appointment:deleted'
  | 'patient:created'
  | 'patient:updated'
  | 'patient:deleted'
  | 'staff:created'
  | 'staff:updated'
  | 'staff:deleted'
  | 'clinic:updated'
  | 'clinic:settings:updated'
  | 'review:created'
  | 'review:updated'
  | 'review:deleted';

export interface EventData {
  type: EventType;
  payload: any;
  timestamp: string;
}

// Dispatch an event that will be received by all listeners
export function dispatchEvent(type: EventType, payload: any): void {
  if (typeof window === 'undefined') return;
  
  const eventData: EventData = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  // Dispatch custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent('randevudent:update', { detail: eventData }));

  // Also store in localStorage for cross-tab communication
  localStorage.setItem('randevudent_last_event', JSON.stringify(eventData));
  
  // Trigger storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'randevudent_last_event',
    newValue: JSON.stringify(eventData),
  }));
}

// Subscribe to events
export function subscribeToEvents(callback: (data: EventData) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleEvent = (e: Event) => {
    let eventData: EventData | null = null;

    if (e instanceof CustomEvent && e.detail) {
      eventData = e.detail;
    } else if (e instanceof StorageEvent && e.key === 'randevudent_last_event' && e.newValue) {
      try {
        eventData = JSON.parse(e.newValue);
      } catch (err) {
        console.error('Error parsing event data:', err);
      }
    }

    if (eventData) {
      callback(eventData);
    }
  };

  // Listen to custom events (same tab)
  window.addEventListener('randevudent:update', handleEvent);
  
  // Listen to storage events (other tabs)
  window.addEventListener('storage', handleEvent);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('randevudent:update', handleEvent);
    window.removeEventListener('storage', handleEvent);
  };
}

