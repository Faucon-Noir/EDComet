import { Get, Route, Tags } from "tsoa";
import { getLatestConstructionDepot, calculateLatestSiteStats } from "../services/ColonisationService";
import { getLatestMarket } from "../services/MarketService";
import {
	ColonisationConstructionDepot,
	ColonisationStats,
	Market,
} from "ed-shared";

@Route("construction")
@Tags("Construction")
export class ColonisationController {
	@Get("/latestSite")
	public async getLatestSite(): Promise<ColonisationConstructionDepot | null> {
		return getLatestConstructionDepot();
	}
	@Get("/latestSite/Stats")
	public async getLatestSiteStats(): Promise<ColonisationStats | null> {
		return calculateLatestSiteStats();
	}

	@Get("/latestMarket")
	public async getLatestMarket(): Promise<Market | null> {
		return getLatestMarket();
	}
}
