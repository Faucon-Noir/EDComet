/// <reference types="jest" />

import { HelloController } from "../controllers/HelloController";
import { getLanguage } from "../utils/utils";
import { getLatestCommander } from "../services/LogInterpreterService";

jest.mock("../utils/utils", () => ({
  getLanguage: jest.fn(),
}));

jest.mock("../services/LogInterpreterService", () => ({
  getLatestCommander: jest.fn(),
}));

const mockedGetLanguage = getLanguage as jest.MockedFunction<typeof getLanguage>;
const mockedGetLatestCommander =
  getLatestCommander as jest.MockedFunction<typeof getLatestCommander>;

describe("HelloController", () => {
  beforeEach(() => {
    mockedGetLanguage.mockReset();
    mockedGetLatestCommander.mockReset();
  });

  it("returns hello payload with the resolved language", async () => {
    mockedGetLanguage.mockReturnValue("fr");
    const controller = new HelloController();

    await expect(controller.getHello()).resolves.toEqual({
      message: "Hello from ED COMET 🚀",
      lang: "fr",
    });
  });

  it("returns language from utility", async () => {
    mockedGetLanguage.mockReturnValue("en");
    const controller = new HelloController();

    await expect(controller.getLanguage()).resolves.toBe("en");
  });

  it("returns commander information when available", async () => {
    mockedGetLatestCommander.mockReturnValue({ Name: "Aisling" } as any);
    const controller = new HelloController();

    await expect(controller.getMeInfo()).resolves.toEqual({ Name: "Aisling" });
  });

  it("returns null when commander information is unavailable", async () => {
    mockedGetLatestCommander.mockReturnValue(null);
    const controller = new HelloController();

    await expect(controller.getMeInfo()).resolves.toBeNull();
  });
});
