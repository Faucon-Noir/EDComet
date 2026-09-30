import {
  ColonisationConstructionDepot,
  EventEnum,
  getErrorMessage,
} from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestDepot,
  setLatestDepot,
} from "./LogInterpreterService";



/**
 * A function to get the latest ConstructionDepot where the commander docked
 * @returns An object, either of type ColonisationConstructionDepot or null
 */
export function getLatestConstructionDepot(): ColonisationConstructionDepot | null {
  const sharedDepot = getLatestDepot();
  if (sharedDepot != null) {
    return sharedDepot;
  }

  let lastDepot: ColonisationConstructionDepot | null = null;
  try {
    for (const line of getCurrentJournalLines()) {
      try {
        const event = JSON.parse(line);
        if (event.event === EventEnum.ColonisationConstructionDepot) {
          lastDepot = event as ColonisationConstructionDepot;
        }
      } catch (err: unknown) {
        console.warn("🚧 Latest Construction foreach:", getErrorMessage(err));
        continue;
      }
    }
    if (!lastDepot) {
      return null;
    }

    setLatestDepot(lastDepot);
    console.log(
      "✅ Found ColonisationConstructionDepot event:",
      lastDepot.MarketID,
      lastDepot.ConstructionProgress * 100,
      lastDepot.timestamp,
    );
  } catch (error: unknown) {
    console.warn("🚧 Latest Construction Interpreter:", getErrorMessage(error));
    return null;
  }

  return lastDepot;
}
