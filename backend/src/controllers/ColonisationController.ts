import { Get, Route, Tags } from "tsoa";
import { getLatestConstructionDepot } from "../services/LogInterpreterService";
import {
	ColonisationConstructionDepot,
	ColonisationStats,
} from "ed-shared";
import { calculateLatestSiteStats } from "../services/MarketService";

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
}
