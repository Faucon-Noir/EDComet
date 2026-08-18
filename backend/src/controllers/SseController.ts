import type { Readable } from "stream";
import { Controller, Get, Produces, Request, Route, Tags } from "tsoa";
import { journalSseService } from "../services/SseService";

/**
 * Controller to manage SSE (Server-Sent Events) journal stream
 */
@Route("journal")
@Tags("Journal")
export class SseController extends Controller {
  /**
   * Subscribe to journal updates via SSE.
   */
  @Get("stream")
  @Produces("text/event-stream")
  public stream(@Request() request: any): Readable {
    const stream = journalSseService.subscribe();

    request.on("close", () => stream.destroy());
    this.setHeader("Cache-Control", "no-cache, no-transform");
    this.setHeader("Connection", "keep-alive");
    this.setHeader("Content-Type", "text/event-stream");

    return stream;
  }
}
