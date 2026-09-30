/// <reference types="jest" />

import { EventEnum } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestMissionsState,
  setLatestMissions,
} from "../../src/services/LogInterpreterService";
import { getAllMissions } from "../../src/services/MissionService";

jest.mock("../../src/services/LogInterpreterService", () => ({
  getCurrentJournalLines: jest.fn(),
  getLatestMissionsState: jest.fn(),
  setLatestMissions: jest.fn(),
}));

const mockedGetCurrentJournalLines =
  getCurrentJournalLines as jest.MockedFunction<typeof getCurrentJournalLines>;
const mockedGetLatestMissionsState =
  getLatestMissionsState as jest.MockedFunction<typeof getLatestMissionsState>;
const mockedSetLatestMissions = setLatestMissions as jest.MockedFunction<
  typeof setLatestMissions
>;

describe("getAllMissions", () => {
  beforeEach(() => {
    mockedGetCurrentJournalLines.mockReset().mockReturnValue([]);
    mockedGetLatestMissionsState.mockReset().mockReturnValue(null);
    mockedSetLatestMissions.mockReset();
  });

  it("returns the cached missions without rereading the journal", () => {
    const missions = {
      event: EventEnum.Missions,
      Active: [],
      Failed: [],
      Complete: [],
    } as any;
    mockedGetLatestMissionsState.mockReturnValue(missions);

    expect(getAllMissions()).toBe(missions);
    expect(mockedGetCurrentJournalLines).not.toHaveBeenCalled();
  });

  it("returns and caches the latest missions event, skipping malformed lines", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const missions = {
      event: EventEnum.Missions,
      Active: [{ MissionID: 1 }],
      Failed: [],
      Complete: [],
    };
    mockedGetCurrentJournalLines.mockReturnValue([
      "not-json",
      JSON.stringify({ event: EventEnum.Loadout }),
      JSON.stringify(missions),
    ]);

    expect(getAllMissions()).toEqual(missions);
    expect(mockedSetLatestMissions).toHaveBeenCalledWith(missions);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns null when no missions event exists", () => {
    mockedGetCurrentJournalLines.mockReturnValue([
      JSON.stringify({ event: EventEnum.Loadout }),
    ]);

    expect(getAllMissions()).toBeNull();
    expect(mockedSetLatestMissions).not.toHaveBeenCalled();
  });
});
