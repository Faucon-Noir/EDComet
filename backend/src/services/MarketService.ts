import {
  ColonisationConstructionDepotResource,
  ColonisationStats,
} from "../../../shared/types/colonisation.type";
import {
  getLatestConstructionDepot,
  getLoadout,
} from "./LogInterpreterService";

// Process EDDN API requests and responses & market data handling, such as fetching market price, hilighting required ressources etc
export function calculateLatestSiteStats(): ColonisationStats | null {
  try {
    const data: ColonisationConstructionDepotResource[] =
      getLatestConstructionDepot().ResourcesRequired || null;

    const totalUnitsRemaining: number = data.reduce(
      (acc, res): number =>
        acc + Math.max(res.RequiredAmount - res.ProvidedAmount, 0),
      0
    );
    const totalUnitsRequired: number = data.reduce(
      (acc, res): number => acc + res.RequiredAmount,
      0
    );
    const estimatedPayment: number = data.reduce(
      (acc, res): number => acc + res.Payment * res.RequiredAmount,
      0
    );
    const travels: number = Math.ceil(
      totalUnitsRequired / getLoadout().CargoCapacity
    );
    const remainingTravels: number = Math.ceil(
      (totalUnitsRemaining-49214) / getLoadout().CargoCapacity
    );

    return {
      travels,
      estimatedPayment,
      totalUnitsRequired,
      remainingTravels,
    };
  } catch (error) {
    console.warn("⚠️ Calculate Latest Site Stats:", error.message);
    return null;
  }
}
