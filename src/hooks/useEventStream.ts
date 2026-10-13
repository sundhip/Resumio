import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEEvent<T = any> {
  type: string;
  payload?: T;
  id?: string;
  queue?: string;
  progress?: number;
  timestamp?: string;
}

export interface UseEventStreamOptions {
  onEvent?: (event: SSEEvent) => void;
  onJobProgress?: (data: { id: string; queue: string; progress: number }) => void;
  onJobCompleted?: (data: { id: string; queue: string }) => void;
  onNotification?: (notification: any) => void;
  onPresenceUpdate?: (presence: any) => void;
  autoReconnect?: boolean;
}

/**
 * Enterprise Production-Grade React hook for Server-Sent Events (SSE).
 * Connects to /api/events/stream, automatically recovers from network dropouts,
 * and distributes live updates to components.
 */
export function useEventStream(options: UseEventStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    onEvent,
    onJobProgress,
    onJobCompleted,
    onNotification,
    onPresenceUpdate,
    autoReconnect = true,
  } = options;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource('/api/events/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data) as SSEEvent;
          setLastEvent(parsed);

          if (onEvent) onEvent(parsed);

          switch (parsed.type) {
            case 'job:progress':
              if (onJobProgress) onJobProgress(parsed as any);
              break;
            case 'job:completed':
              if (onJobCompleted) onJobCompleted(parsed as any);
              break;
            case 'notification:new':
              if (onNotification) onNotification(parsed.payload);
              break;
            case 'presence:update':
              if (onPresenceUpdate) onPresenceUpdate(parsed.payload);
              break;
          }
        } catch {}
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch {
      setIsConnected(false);
    }
  }, [onEvent, onJobProgress, onJobCompleted, onNotification, onPresenceUpdate, autoReconnect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
  };
}
