import type { Response } from "express";
import { EventEnum } from "ed-shared";
import {
	onJournalUpdate,
} from "./LogInterpreterService";

export interface JournalSseMessage {
	id: string;
	events: EventEnum[];
	timestamp: string;
}

class JournalSseService {
	private clients = new Set<Response>();
	private nextEventId = 1;

	constructor() {
		onJournalUpdate((events) => {
			this.broadcast(events);
		});
	}

	public subscribe(response: Response): () => void {
		response.setHeader("Content-Type", "text/event-stream");
		response.setHeader("Cache-Control", "no-cache, no-transform");
		response.setHeader("Connection", "keep-alive");
		response.flushHeaders?.();
		response.write("retry: 5000\n\n");

		this.clients.add(response);

		const heartbeat = setInterval(() => {
			if (!response.writableEnded) {
				response.write(": keep-alive\n\n");
			}
		}, 30000);

		return () => {
			clearInterval(heartbeat);
			this.clients.delete(response);
			if (!response.writableEnded) {
				response.end();
			}
		};
	}

	private isValidEventEnum(eventType: unknown): eventType is EventEnum {
		return Object.values(EventEnum).includes(eventType as EventEnum);
	}

	private broadcast(events: EventEnum[]): void {
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
		if (validEvents.length === 0) {
			return;
		}

		const message: JournalSseMessage = {
			id: String(this.nextEventId++),
			events: validEvents,
			timestamp: new Date().toISOString(),
		};

		const chunk = [
			`id: ${message.id}`,
			`event: journal-update`,
			`data: ${JSON.stringify(message)}`,
			"",
		].join("\n");

		for (const client of this.clients) {
			if (client.writableEnded) {
				this.clients.delete(client);
				continue;
			}

			client.write(`${chunk}\n`);
		}
	}
}

export const journalSseService = new JournalSseService();