/// <reference types="jest" />

import { ShipController } from "../../src/controllers/ShipController";
import { getLoadout } from "../../src/services/LogInterpreterService";
import { EventEnum } from "ed-shared";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getLoadout: jest.fn(),
}));

const mockedGetLoadout = getLoadout as jest.MockedFunction<typeof getLoadout>;

describe("ShipController", () => {
  beforeEach(() => {
    mockedGetLoadout.mockReset();
  });

  it("returns latest ship loadout", async () => {
    const loadout = {
      event: EventEnum.Loadout,
      Ship: "KraitMkII",
      CargoCapacity: 96,
    } as any;
    mockedGetLoadout.mockReturnValue(loadout);

    const controller = new ShipController();
    await expect(controller.getShipLoadout()).resolves.toBe(loadout);
  });

  it("returns null when loadout is unavailable", async () => {
    mockedGetLoadout.mockReturnValue(null);

    const controller = new ShipController();
    await expect(controller.getShipLoadout()).resolves.toBeNull();
  });
});
