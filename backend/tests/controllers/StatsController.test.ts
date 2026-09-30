/// <reference types="jest" />

import { StatsController } from "../../src/controllers/StatsController";
import { getLatestStats } from "../../src/services/StatsService";

jest.mock("../../src/services/StatsService", () => ({
  getLatestStats: jest.fn(),
}));

const mockedGetLatestStats = getLatestStats as jest.MockedFunction<
  typeof getLatestStats
>;

describe("StatsController", () => {
  beforeEach(() => {
    mockedGetLatestStats.mockReset();
  });

  it("returns the latest stats", async () => {
    const stats = { event: "Statistics" } as any;
    mockedGetLatestStats.mockReturnValue(stats);

    await expect(new StatsController().getLatestStats()).resolves.toBe(stats);
  });
});