import { useEffect, useRef } from "react";

export interface DocumentStatusEvent {
  type: "document:status";
  documentId: string;
  status: string;
  fileUrl?: string | null;
}

export type DocumentEvent = DocumentStatusEvent;

export function useDocumentEvents(onEvent: (event: DocumentEvent) => void) {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  });

  useEffect(() => {
    const token = localStorage.getItem("le_token");
    if (!token) return;

    const url = `/api/events?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as DocumentEvent;
        callbackRef.current(event);
      } catch {
        // ignore malformed events
      }
    };

    source.onerror = () => source.close();

    return () => source.close();
  }, []);
}
