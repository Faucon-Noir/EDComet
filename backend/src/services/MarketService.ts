import { EventEnum, ShipLoadout, ColonisationConstructionDepotResource, ColonisationStats } from "ed-shared";
import { LogFileWatcher } from "../utils/watcher";
import {
  getLatestConstructionDepot,
  getLoadout,
} from "./LogInterpreterService";

let latestLoadout: ShipLoadout | null = null
const watcher = new LogFileWatcher();
watcher.on("line", (line: string) => {
  try {
    const event = JSON.parse(line);
    if (event.event === EventEnum.Loadout) {
      latestLoadout = event as ShipLoadout;
    }
  } catch (err: Error | any) {
    console.log("🚧 Watch error", err.message);
  }
});

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

    if (loadout.CargoCapacity <= 0) {
      return null;
    }

    const travels: number = Math.ceil(totalUnitsRequired / loadout.CargoCapacity);
    const remainingTravels: number = Math.ceil(
      totalUnitsRemaining / loadout.CargoCapacity
    );

    return {
      travels,
      estimatedPayment,
      totalUnitsRequired,
      remainingTravels,
    };
  } catch {
    return null;
  }
}