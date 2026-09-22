import {
  ColonisationConstructionDepot,
  ColonisationConstructionDepotResource,
  ColonisationStats,
  EventEnum,
  getErrorMessage,
} from "ed-shared";
import {
  getCurrentJournalLines,
  getLatestDepot,
  setLatestDepot,
} from "./LogInterpreterService";
import { getLoadout } from "./ShipService";
import { calculateActualPurchaseCost } from "./MarketService";

/**
 * A function to calculate the latest colonisation site stats, such as remaining travels, estimated payment, etc
 * @returns An object, either of type ColonisationStats or null
 */
export function calculateLatestSiteStats(): ColonisationStats | null {
  try {
    const depot = getLatestConstructionDepot();
    const loadout = getLoadout();

    if (!depot) {
      return null;
    }

    if (!loadout) {
      return null;
    }

    const data: ColonisationConstructionDepotResource[] =
      depot.ResourcesRequired ?? [];

    const totalUnitsRemaining: number = data.reduce(
      (acc, res): number =>
        acc + Math.max(res.RequiredAmount - res.ProvidedAmount, 0),
      0,
    );

    const totalUnitsRequired: number = data.reduce(
      (acc, res): number => acc + res.RequiredAmount,
      0,
    );

    const estimatedPayment: number = data.reduce(
      (acc, res): number => acc + res.Payment * res.RequiredAmount,
      0,
    );

    const actualPurchaseCost = calculateActualPurchaseCost();
    const estimatedProfit = estimatedPayment - actualPurchaseCost;

    if (loadout.CargoCapacity <= 0) {
      return null;
    }

    const travels: number = Math.ceil(
      totalUnitsRequired / loadout.CargoCapacity,
    );
    const remainingTravels: number = Math.ceil(
      totalUnitsRemaining / loadout.CargoCapacity,
    );

    return {
      travels,
      estimatedPayment,
      actualPurchaseCost,
      estimatedProfit,
      totalUnitsRequired,
      remainingTravels,
    };
  } catch {
    return null;
  }
}

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
