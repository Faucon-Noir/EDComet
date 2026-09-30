import { EventEnum, getErrorMessage, Mission } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestMissionsState,
  setLatestMissions,
} from "./LogInterpreterService";

/**
 * A function to get the latest Missions summary (active, failed and completed missions)
 * @returns A Mission object or null
 */
export function getAllMissions(): Mission | null {
  const sharedMissions = getLatestMissionsState();
  if (sharedMissions != null) {
    return sharedMissions;
  }

  let lastMissions: Mission | null = null;
  for (const line of getCurrentJournalLines()) {
    try {
      const event = JSON.parse(line);
      if (event.event === EventEnum.Missions) {
        lastMissions = event as Mission;
      }
    } catch (err: unknown) {
      console.warn("🚧 Missions Interpreter:", getErrorMessage(err));
    }
  }

  if (!lastMissions) {
    return null;
  }

  setLatestMissions(lastMissions);
  console.log(
    "✅ Found Missions event:",
    lastMissions.Active.length,
    lastMissions.Failed.length,
    lastMissions.Complete.length,
  );
  return lastMissions;
}