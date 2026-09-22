import { EventEnum, Stats, getErrorMessage } from "ed-shared";
import { getCurrentJournalLines, getLatestStatsState, setLatestStats } from "./LogInterpreterService";

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
