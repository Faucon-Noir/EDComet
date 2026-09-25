/// <reference types="jest" />

import { PassThrough } from "stream";
import { EventEnum } from "ed-shared";

type UpdateCallback = (events: EventEnum[], changes: Record<EventEnum, string>) => void;
type FileCallback = (changes: Array<{
  fileName: string;
  filePath: string;
  change: "created" | "updated";
  type: "journal-switched" | "support-file";
}>) => void;

describe("journalSseService", () => {
  const subscribedStreams: PassThrough[] = [];

  beforeEach(() => {
    jest.resetModules();
    subscribedStreams.length = 0;
  });

  afterEach(() => {
    for (const stream of subscribedStreams) {
      if (!stream.destroyed) {
        stream.destroy();
      }
    }
  });

  function setupModule(): {
    service: { subscribe: () => PassThrough };
    getUpdateCallback: () => UpdateCallback;
    getFileCallback: () => FileCallback;
  } {
    let updateCallback: UpdateCallback | undefined;
    let fileCallback: FileCallback | undefined;

    jest.doMock("../../src/services/LogInterpreterService", () => ({
      onJournalUpdate: jest.fn((cb: UpdateCallback) => {
        updateCallback = cb;
      }),
      onJournalFileChange: jest.fn((cb: FileCallback) => {
        fileCallback = cb;
      }),
    }));

    const mod = require("../../src/services/SseService") as {
      journalSseService: { subscribe: () => PassThrough };
    };

    return {
      service: mod.journalSseService,
      getUpdateCallback: () => {
        if (!updateCallback) {
          throw new Error("Update callback not registered");
        }
        return updateCallback;
      },
      getFileCallback: () => {
        if (!fileCallback) {
          throw new Error("File callback not registered");
        }
        return fileCallback;
      },
    };
  }

  it("writes retry header on subscribe", () => {
    const { service } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);

    const initialChunk = stream.read()?.toString() ?? "";

    expect(initialChunk).toContain("retry: 5000");
  });

  it("writes a heartbeat while the subscribed stream is active", () => {
    jest.useFakeTimers();
    const { service } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    const writeSpy = jest.spyOn(stream, "write");

    jest.advanceTimersByTime(30000);

    expect(writeSpy).toHaveBeenCalledWith(": keep-alive\n\n");
    jest.useRealTimers();
  });

  it("stops heartbeats when the subscriber closes", () => {
    jest.useFakeTimers();
    const { service } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    const writeSpy = jest.spyOn(stream, "write");

    stream.emit("close");
    jest.advanceTimersByTime(30000);

    expect(writeSpy).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("removes a destroyed client before broadcasting", () => {
    const { service, getUpdateCallback } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    stream.destroy();

    getUpdateCallback()([EventEnum.Loadout], {} as Record<EventEnum, string>);

    expect(stream.writableEnded || stream.destroyed).toBe(true);
  });

  it("broadcasts valid journal events", () => {
    const { service, getUpdateCallback } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    const writeSpy = jest.spyOn(stream, "write");

    const onUpdate = getUpdateCallback();

    onUpdate([EventEnum.Loadout], {} as Record<EventEnum, string>);

    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining("event: journal-update"),
    );
    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining(`\"events\":[\"${EventEnum.Loadout}\"]`),
    );
  });

  it("ignores invalid journal events", () => {
    const { service, getUpdateCallback } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    const writeSpy = jest.spyOn(stream, "write");

    const onUpdate = getUpdateCallback();

    onUpdate(["InvalidEvent" as EventEnum], {} as Record<EventEnum, string>);

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("broadcasts file changes even without journal events", () => {
    const { service, getFileCallback } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    const writeSpy = jest.spyOn(stream, "write");

    const onFileChange = getFileCallback();

    onFileChange([
      {
        fileName: "Journal.01.log",
        filePath: "C:/logs/Journal.01.log",
        change: "updated",
        type: "journal-switched",
      },
    ]);

    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining("event: journal-update"),
    );
    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining("Journal.01.log"),
    );
  });

  it("does not broadcast when both events and files are empty", () => {
    const { service, getUpdateCallback } = setupModule();
    const stream = service.subscribe();
    subscribedStreams.push(stream);
    const writeSpy = jest.spyOn(stream, "write");

    getUpdateCallback()([], {} as Record<EventEnum, string>);

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
