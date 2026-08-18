import {
  ColonisationConstructionDepotResource,
  ColonisationStats,
} from "ed-shared";
import {
  getLatestConstructionDepot,
  getLoadout,
  getMarketBuys,
} from "./LogInterpreterService";

function calculateActualPurchaseCost(): number {
  return getMarketBuys().reduce(
    (cost, purchase) => cost + purchase.TotalCost,
    0,
  );
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
