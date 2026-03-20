import { EventEmitter } from "events";

export interface DocumentStatusEvent {
    documentId: string;
    status: string;
    fileUrl?: string | null;
}

class DocumentEventEmitter extends EventEmitter {}

export const documentEmitter = new DocumentEventEmitter();
documentEmitter.setMaxListeners(100);
