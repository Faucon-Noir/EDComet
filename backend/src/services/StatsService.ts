import { ColonisationConstructionDepotResource, ColonisationStats, EventEnum, Stats, getErrorMessage } from "ed-shared";
import { getCurrentJournalLines, getLatestStatsState, setLatestStats } from "./LogInterpreterService";
import { calculateActualPurchaseCost } from "./MarketService";
import { getLatestConstructionDepot } from "./ColonisationService";
import { getLoadout } from "./ShipService";

export function getLatestStats(): Stats | null {
  const sharedStats = getLatestStatsState();
  if (sharedStats != null) {
    return sharedStats;
  }

  let lastStats: Stats | null = null;

  try {
    for (const line of getCurrentJournalLines()) {
      try {
        const event = JSON.parse(line);
        if (event.event === EventEnum.Stats) {
          lastStats = event as Stats;
        }
      } catch (err: unknown) {
        console.warn("🚧 Latest Stats foreach:", getErrorMessage(err));
      }
    }

    if (!lastStats) {
      return null;
    }

    setLatestStats(lastStats);
    return lastStats;
  } catch (error: unknown) {
    console.warn("🚧 Latest Stats Interpreter:", getErrorMessage(error));
    return null;
  }
}

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
