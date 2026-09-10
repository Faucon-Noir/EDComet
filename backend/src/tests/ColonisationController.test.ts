/// <reference types="jest" />

import { ColonisationController } from "../controllers/ColonisationController";
import {
  getLatestConstructionDepot,
  getLatestMarket,
} from "../services/LogInterpreterService";
import { calculateLatestSiteStats } from "../services/MarketService";
import { EventEnum } from "ed-shared";

jest.mock("../services/LogInterpreterService", () => ({
  getLatestConstructionDepot: jest.fn(),
  getLatestMarket: jest.fn(),
}));

jest.mock("../services/MarketService", () => ({
  calculateLatestSiteStats: jest.fn(),
}));

const mockedGetLatestConstructionDepot =
  getLatestConstructionDepot as jest.MockedFunction<
    typeof getLatestConstructionDepot
  >;
const mockedGetLatestMarket =
  getLatestMarket as jest.MockedFunction<typeof getLatestMarket>;
const mockedCalculateLatestSiteStats =
  calculateLatestSiteStats as jest.MockedFunction<typeof calculateLatestSiteStats>;

describe("ColonisationController", () => {
  beforeEach(() => {
    mockedGetLatestConstructionDepot.mockReset();
    mockedGetLatestMarket.mockReset();
    mockedCalculateLatestSiteStats.mockReset();
  });

  it("returns latest construction depot", async () => {
    const depot = {
      event: EventEnum.ColonisationConstructionDepot,
      MarketID: 42,
      ConstructionProgress: 0.5,
      ConstructionComplete: false,
      ConstructionFailed: false,
      ResourcesRequired: [],
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
    } as any;
    mockedGetLatestConstructionDepot.mockReturnValue(depot);

    const controller = new ColonisationController();
    await expect(controller.getLatestSite()).resolves.toBe(depot);
  });

  it("returns latest construction stats", async () => {
    mockedCalculateLatestSiteStats.mockReturnValue({
      travels: 3,
      estimatedPayment: 300,
      actualPurchaseCost: 100,
      estimatedProfit: 200,
      totalUnitsRequired: 120,
      remainingTravels: 2,
    });

    const controller = new ColonisationController();
    await expect(controller.getLatestSiteStats()).resolves.toEqual({
      travels: 3,
      estimatedPayment: 300,
      actualPurchaseCost: 100,
      estimatedProfit: 200,
      totalUnitsRequired: 120,
      remainingTravels: 2,
    });
  });

  it("returns latest market", async () => {
    const market = {
      event: EventEnum.Market,
      Items: [],
      MarketID: 99,
      StationName: "Jameson Memorial",
      StationType: "Coriolis",
      StarSystem: "Shinrarta Dezhra",
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
    } as any;
    mockedGetLatestMarket.mockReturnValue(market);

    const controller = new ColonisationController();
    await expect(controller.getLatestMarket()).resolves.toBe(market);
  });
});
