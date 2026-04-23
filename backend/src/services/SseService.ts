import type { Response } from "express";
import {
	onJournalUpdate,
	type JournalUpdate,
} from "./LogInterpreterService";

export interface JournalSseMessage extends JournalUpdate {
	id: string;
}

class JournalSseService {
	private clients = new Set<Response>();
	private nextEventId = 1;

	constructor() {
		onJournalUpdate((update) => {
			this.broadcast(update);
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

	private broadcast(update: JournalUpdate): void {
		const message: JournalSseMessage = {
			id: String(this.nextEventId++),
			...update,
		};

		const chunk = [
			`id: ${message.id}`,
			`event: ${message.event}`,
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