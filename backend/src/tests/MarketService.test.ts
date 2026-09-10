/// <reference types="jest" />

import {
  getLatestConstructionDepot,
  getLoadout,
  getMarketBuys,
} from "../services/LogInterpreterService";
import { calculateLatestSiteStats } from "../services/MarketService";
import { EventEnum } from "ed-shared";

jest.mock("../services/LogInterpreterService", () => ({
  getLatestConstructionDepot: jest.fn(),
  getLoadout: jest.fn(),
  getMarketBuys: jest.fn(),
}));

const mockedGetLatestConstructionDepot =
  getLatestConstructionDepot as jest.MockedFunction<
    typeof getLatestConstructionDepot
  >;
const mockedGetLoadout = getLoadout as jest.MockedFunction<typeof getLoadout>;
const mockedGetMarketBuys =
  getMarketBuys as jest.MockedFunction<typeof getMarketBuys>;

describe("calculateLatestSiteStats", () => {
  beforeEach(() => {
    mockedGetLatestConstructionDepot.mockReset();
    mockedGetLoadout.mockReset();
    mockedGetMarketBuys.mockReset();
  });

  it("returns null when depot is missing", () => {
    mockedGetLatestConstructionDepot.mockReturnValue(null);
    mockedGetLoadout.mockReturnValue({ CargoCapacity: 100 } as any);
    mockedGetMarketBuys.mockReturnValue([]);

    expect(calculateLatestSiteStats()).toBeNull();
  });

  it("returns null when loadout is missing", () => {
    mockedGetLatestConstructionDepot.mockReturnValue({
      event: EventEnum.ColonisationConstructionDepot,
      ResourcesRequired: [],
    } as any);
    mockedGetLoadout.mockReturnValue(null);
    mockedGetMarketBuys.mockReturnValue([]);

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
    mockedGetMarketBuys.mockReturnValue([]);

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
    mockedGetMarketBuys.mockReturnValue([
      { event: EventEnum.MarketBuy, TotalCost: 150 } as any,
      { event: EventEnum.MarketBuy, TotalCost: 50 } as any,
    ]);

    expect(calculateLatestSiteStats()).toEqual({
      travels: 5,
      estimatedPayment: 2000,
      actualPurchaseCost: 200,
      estimatedProfit: 1800,
      totalUnitsRequired: 140,
      remainingTravels: 4,
    });
  });

  it("returns null when a dependency throws", () => {
    mockedGetLatestConstructionDepot.mockImplementation(() => {
      throw new Error("boom");
    });

    expect(calculateLatestSiteStats()).toBeNull();
  });
});
