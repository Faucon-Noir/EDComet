/// <reference types="jest" />

import { EventEnum } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestStatsState,
  setLatestStats,
} from "../../src/services/LogInterpreterService";

import { getLatestConstructionDepot } from "../../src/services/ColonisationService";
import { calculateActualPurchaseCost } from "../../src/services/MarketService";
import { getLoadout } from "../../src/services/ShipService";
import {
  calculateLatestSiteStats,
  getLatestStats,
} from "../../src/services/StatsService";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getCurrentJournalLines: jest.fn(),
  getLatestStatsState: jest.fn(),
  setLatestStats: jest.fn(),
}));

jest.mock("../../src/services/ColonisationService", () => ({
  getLatestConstructionDepot: jest.fn(),
}));

jest.mock("../../src/services/MarketService", () => ({
  calculateActualPurchaseCost: jest.fn(),
}));

jest.mock("../../src/services/ShipService", () => ({
  getLoadout: jest.fn(),
}));

const mockedGetLatestConstructionDepot =
  getLatestConstructionDepot as jest.MockedFunction<
    typeof getLatestConstructionDepot
  >;
const mockedGetLoadout = getLoadout as jest.MockedFunction<typeof getLoadout>;
const mockedCalculateActualPurchaseCost =
  calculateActualPurchaseCost as jest.MockedFunction<
    typeof calculateActualPurchaseCost
  >;
const mockedGetCurrentJournalLines =
  getCurrentJournalLines as jest.MockedFunction<typeof getCurrentJournalLines>;
const mockedGetLatestStatsState = getLatestStatsState as jest.MockedFunction<
  typeof getLatestStatsState
>;
const mockedSetLatestStats = setLatestStats as jest.MockedFunction<
  typeof setLatestStats
>;

describe("StatsService", () => {
  beforeEach(() => {
    mockedGetCurrentJournalLines.mockReset().mockReturnValue([]);
    mockedGetLatestStatsState.mockReset().mockReturnValue(null);
    mockedSetLatestStats.mockReset();
    mockedGetLatestConstructionDepot.mockReset();
    mockedGetLoadout.mockReset();
    mockedCalculateActualPurchaseCost.mockReset();
  });

  describe("getLatestStats", () => {
    it("returns the cached stats", () => {
      const stats = { event: EventEnum.Stats } as any;
      mockedGetLatestStatsState.mockReturnValue(stats);

      expect(getLatestStats()).toBe(stats);
      expect(mockedGetCurrentJournalLines).not.toHaveBeenCalled();
    });

    it("returns and caches the latest event, skipping malformed lines", () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const latestStats = { event: EventEnum.Stats, timestamp: "latest" };
      mockedGetCurrentJournalLines.mockReturnValue([
        "not-json",
        JSON.stringify({ event: EventEnum.Loadout }),
        JSON.stringify({ event: EventEnum.Stats, timestamp: "earlier" }),
        JSON.stringify(latestStats),
      ]);

      expect(getLatestStats()).toEqual(latestStats);
      expect(mockedSetLatestStats).toHaveBeenCalledWith(latestStats);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("returns null when stats are absent or journal reading fails", () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      mockedGetCurrentJournalLines.mockReturnValue([
        JSON.stringify({ event: EventEnum.Loadout }),
      ]);
      expect(getLatestStats()).toBeNull();

      mockedGetCurrentJournalLines.mockImplementation(() => {
        throw new Error("journal unavailable");
      });
      expect(getLatestStats()).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("calculateLatestSiteStats", () => {
    it("returns null when depot is missing", () => {
      mockedGetLatestConstructionDepot.mockReturnValue(null);
      mockedGetLoadout.mockReturnValue({ CargoCapacity: 100 } as any);
      mockedCalculateActualPurchaseCost.mockReturnValue(0);

      expect(calculateLatestSiteStats()).toBeNull();
    });

    it("returns null when loadout is missing", () => {
      mockedGetLatestConstructionDepot.mockReturnValue({
        event: EventEnum.ColonisationConstructionDepot,
        ResourcesRequired: [],
      } as any);
      mockedGetLoadout.mockReturnValue(null);
      mockedCalculateActualPurchaseCost.mockReturnValue(0);

      expect(calculateLatestSiteStats()).toBeNull();
    });

    it("returns null when cargo capacity is zero or less", () => {
      mockedGetLatestConstructionDepot.mockReturnValue({
        event: EventEnum.ColonisationConstructionDepot,
        ResourcesRequired: [
          {
            Name: "resource_1",
            Name_Localised: "Resource 1",
            RequiredAmount: 100,
            ProvidedAmount: 10,
            Payment: 50,
          },
        ],
      } as any);
      mockedGetLoadout.mockReturnValue({ CargoCapacity: 0 } as any);
      mockedCalculateActualPurchaseCost.mockReturnValue(0);

      expect(calculateLatestSiteStats()).toBeNull();
    });

    it("computes colonisation stats correctly", () => {
      mockedGetLatestConstructionDepot.mockReturnValue({
        event: EventEnum.ColonisationConstructionDepot,
        ResourcesRequired: [
          {
            Name: "resource_1",
            Name_Localised: "Resource 1",
            RequiredAmount: 100,
            ProvidedAmount: 20,
            Payment: 10,
          },
          {
            Name: "resource_2",
            Name_Localised: "Resource 2",
            RequiredAmount: 40,
            ProvidedAmount: 10,
            Payment: 25,
          },
        ],
      } as any);
      mockedGetLoadout.mockReturnValue({ CargoCapacity: 30 } as any);
      mockedCalculateActualPurchaseCost.mockReturnValue(200);

      expect(calculateLatestSiteStats()).toEqual({
        travels: 5,
        estimatedPayment: 2000,
        actualPurchaseCost: 200,
        estimatedProfit: 1800,
        totalUnitsRequired: 140,
        remainingTravels: 4,
      });
    });

    it("handles absent resources and resources already fully provided", () => {
      mockedGetLatestConstructionDepot.mockReturnValue({
        ResourcesRequired: null,
      } as any);
      mockedGetLoadout.mockReturnValue({ CargoCapacity: 10 } as any);
      mockedCalculateActualPurchaseCost.mockReturnValue(0);
      expect(calculateLatestSiteStats()).toEqual({
        travels: 0,
        estimatedPayment: 0,
        actualPurchaseCost: 0,
        estimatedProfit: 0,
        totalUnitsRequired: 0,
        remainingTravels: 0,
      });

      mockedGetLatestConstructionDepot.mockReturnValue({
        ResourcesRequired: [
          { RequiredAmount: 10, ProvidedAmount: 10, Payment: 5 },
        ],
      } as any);
      expect(calculateLatestSiteStats()).toEqual({
        travels: 1,
        estimatedPayment: 50,
        actualPurchaseCost: 0,
        estimatedProfit: 50,
        totalUnitsRequired: 10,
        remainingTravels: 0,
      });
    });

    it("returns null when a dependency throws", () => {
      mockedGetLatestConstructionDepot.mockImplementation(() => {
        throw new Error("boom");
      });

      expect(calculateLatestSiteStats()).toBeNull();
    });
  });
});
