import type { Response } from "express";
import { journalSseService } from "../services/SseService";

/**
 * Controller to manage SSE (Server-Sent Events) journal stream
 * Note: Endpoint is registered directly in index.ts as tsoa doesn't support streaming responses
 */
export class SseController {
	/**
	 * Subscribe a response to journal updates via SSE
	 * @param response Express Response object
	 * @returns Cleanup function to close the stream
	 */
	public subscribe(response: Response): () => void {
		return journalSseService.subscribe(response);
	}
}

export const sseController = new SseController();

