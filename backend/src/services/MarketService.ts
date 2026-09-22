import * as fs from "fs";
import * as path from "path";
import { EventEnum, getErrorMessage, Market, MarketBuy } from "ed-shared";
import { getLogsPath } from "../utils/utils";
import {
  getCurrentJournalLines,
  getLatestMarketState,
  setLatestMarket,
} from "./LogInterpreterService";

export function calculateActualPurchaseCost(): number {
  return getMarketBuys().reduce(
    (cost, purchase) => cost + purchase.TotalCost,
    0,
  );
}

/**
 * A function to get the latest Market.json support file content
 * @returns A Market object or null
 */
export function getLatestMarket(): Market | null {
  const sharedMarket = getLatestMarketState();
  if (sharedMarket != null) {
    return sharedMarket;
  }

  const logsPath = getLogsPath();
  if (!logsPath) {
    return null;
  }

  const marketPath = path.join(logsPath, "Market.json");
  if (!fs.existsSync(marketPath)) {
    return null;
  }

  try {
    const rawContent = fs.readFileSync(marketPath, "utf8");
    const market = JSON.parse(rawContent) as Market;

    if (market.event !== EventEnum.Market || !Array.isArray(market.Items)) {
      return null;
    }

    setLatestMarket(market);
    return market;
  } catch (error: unknown) {
    console.warn("🚧 Latest Market Interpreter:", getErrorMessage(error));
    return null;
  }
}

/**
 * Returns every MarketBuy event from the active journal file.
 */
export function getMarketBuys(): MarketBuy[] {
  const marketBuys: MarketBuy[] = [];

  for (const line of getCurrentJournalLines()) {
    try {
      const event = JSON.parse(line);
      if (event.event === EventEnum.MarketBuy) {
        marketBuys.push(event as MarketBuy);
      }
    } catch (error: unknown) {
      console.warn("🚧 MarketBuy Interpreter:", getErrorMessage(error));
    }
  }

  return marketBuys;
}
