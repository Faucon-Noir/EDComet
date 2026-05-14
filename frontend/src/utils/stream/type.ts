import { EventEnum } from "ed-shared";

export interface JournalWatchedFileEvent {
    fileName: string;
    filePath: string;
    change: "created" | "updated";
    type: "journal-switched" | "support-file";
}

export type JournalStreamStatus =
    | "connecting"
    | "connected"
    | "disconnected";

export interface JournalStreamEvent {
    id: string;
    events: EventEnum[];
    files?: JournalWatchedFileEvent[];
    timestamp: string;
}

export interface JournalStreamContextValue {
    status: JournalStreamStatus;
    lastEvent: JournalStreamEvent | null;
}