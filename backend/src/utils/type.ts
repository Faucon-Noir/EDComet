import { EventEnum } from "ed-shared";

// SSE batching: accumulate changes over 1 second
export type EventChangeMap = Record<EventEnum, string>;

export interface JournalFileChangeEvent {
  fileName: string;
  filePath: string;
  change: "created" | "updated";
  type: "journal-switched" | "support-file";
}

export interface JournalSseMessage {
  id: string;
  events: EventEnum[];
  files?: JournalFileChangeEvent[];
  timestamp: string;
}