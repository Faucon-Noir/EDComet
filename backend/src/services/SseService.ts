import { PassThrough } from "stream";
import { EventEnum } from "ed-shared";
import {
  onJournalFileChange,
  onJournalUpdate,
  type JournalFileChangeEvent,
} from "./LogInterpreterService";

export interface JournalSseMessage {
  id: string;
  events: EventEnum[];
  files?: JournalFileChangeEvent[];
  timestamp: string;
}

class JournalSseService {
  private clients = new Set<PassThrough>();
  private nextEventId = 1;

  constructor() {
    onJournalUpdate((events) => {
      this.broadcast(events);
    });

    onJournalFileChange((files) => {
      this.broadcast([], files);
    });
  }

  public subscribe(): PassThrough {
    const stream = new PassThrough();
    stream.write("retry: 5000\n\n");
    this.clients.add(stream);

    const heartbeat = setInterval(() => {
      if (!stream.destroyed) {
        stream.write(": keep-alive\n\n");
      }
    }, 30000);

    stream.on("close", () => {
      clearInterval(heartbeat);
      this.clients.delete(stream);
    });

    return stream;
  }

  private isValidEventEnum(eventType: unknown): eventType is EventEnum {
    return Object.values(EventEnum).includes(eventType as EventEnum);
  }

  private broadcast(
    events: EventEnum[],
    files: JournalFileChangeEvent[] = [],
  ): void {
    // Filter and validate events against EventEnum
    const validEvents = events.filter((eventType) => {
      if (!this.isValidEventEnum(eventType)) {
        console.warn(`⚠️ Invalid event type received: ${eventType}`);
        return false;
      }
      console.log(`📤 Broadcasting event: ${eventType}`);
      return true;
    });

    // Only broadcast if there are valid events
    if (validEvents.length === 0 && files.length === 0) {
      return;
    }

    const message: JournalSseMessage = {
      id: String(this.nextEventId++),
      events: validEvents,
      files,
      timestamp: new Date().toISOString(),
    };

    const chunk = [
      `id: ${message.id}`,
      `event: journal-update`,
      `data: ${JSON.stringify(message)}`,
      "",
    ].join("\n");

    for (const client of this.clients) {
      if (client.destroyed || client.writableEnded) {
        this.clients.delete(client);
        continue;
      }

      client.write(`${chunk}\n`);
    }
  }
}

export const journalSseService = new JournalSseService();
