import { EventEnum, getErrorMessage, ShipLoadout } from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestLoadout,
  setLatestLoadout,
} from "./LogInterpreterService";

/**
 * A function to get the ShipLoadout
 * @returns A ShipLoadout object or null
 */
export function getLoadout(): ShipLoadout | null {
  const sharedLoadout = getLatestLoadout();
  if (sharedLoadout != null) {
    return sharedLoadout;
  }

  let lastLoadout: ShipLoadout | null = null;
  for (const line of getCurrentJournalLines()) {
    try {
      const event = JSON.parse(line);
      if (event.event === EventEnum.Loadout) {
        lastLoadout = event as ShipLoadout;
      }
    } catch (err: unknown) {
      console.warn("🚧 Loadout Interpreter", getErrorMessage(err));
    }
  }

  if (!lastLoadout) {
    return null;
  }

  setLatestLoadout(lastLoadout);
  console.log(
    "✅ Found Loadout event:",
    lastLoadout.Ship,
    lastLoadout.CargoCapacity,
  );
  return lastLoadout;
}
