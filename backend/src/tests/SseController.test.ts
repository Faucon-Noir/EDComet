/// <reference types="jest" />

import { PassThrough } from "stream";
import { SseController } from "../controllers/SseController";
import { journalSseService } from "../services/SseService";

jest.mock("../services/SseService", () => ({
  journalSseService: {
    subscribe: jest.fn(),
  },
}));

const mockedSubscribe = journalSseService
  .subscribe as jest.MockedFunction<typeof journalSseService.subscribe>;

describe("SseController", () => {
  beforeEach(() => {
    mockedSubscribe.mockReset();
  });

  it("subscribes and sets SSE headers", () => {
    const controller = new SseController();
    const stream = new PassThrough();
    const requestHandlers: Record<string, () => void> = {};
    const request = {
      on: jest.fn((event: string, callback: () => void) => {
        requestHandlers[event] = callback;
      }),
    };
    const setHeaderSpy = jest.spyOn(controller as any, "setHeader");

    mockedSubscribe.mockReturnValue(stream);

    const result = controller.stream(request as any);

    expect(result).toBe(stream);
    expect(mockedSubscribe).toHaveBeenCalledTimes(1);
    expect(request.on).toHaveBeenCalledWith("close", expect.any(Function));
    expect(setHeaderSpy).toHaveBeenCalledWith(
      "Cache-Control",
      "no-cache, no-transform",
    );
    expect(setHeaderSpy).toHaveBeenCalledWith("Connection", "keep-alive");
    expect(setHeaderSpy).toHaveBeenCalledWith(
      "Content-Type",
      "text/event-stream",
    );

    requestHandlers.close();
    expect(stream.destroyed).toBe(true);
  });
});
