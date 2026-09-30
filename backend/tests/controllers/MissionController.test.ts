/// <reference types="jest" />

import { MissionController } from "../../src/controllers/MissionController";
import { getAllMissions } from "../../src/services/MissionService";
import { EventEnum } from "ed-shared";

jest.mock("../../src/services/MissionService", () => ({
  getAllMissions: jest.fn(),
}));

const mockedGetAllMissions = getAllMissions as jest.MockedFunction<
  typeof getAllMissions
>;

describe("MissionController", () => {
  beforeEach(() => {
    mockedGetAllMissions.mockReset();
  });

  it("returns latest missions", async () => {
    const missions = {
      event: EventEnum.Missions,
      Active: [],
      Failed: [],
      Complete: [],
    } as any;
    mockedGetAllMissions.mockReturnValue(missions);

    const controller = new MissionController();
    await expect(controller.getMissions()).resolves.toBe(missions);
  });

  it("returns null when missions are unavailable", async () => {
    mockedGetAllMissions.mockReturnValue(null);

    const controller = new MissionController();
    await expect(controller.getMissions()).resolves.toBeNull();
  });
});
