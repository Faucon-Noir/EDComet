import { Get, Route, Tags } from "tsoa";
import { getLatestConstructionDepot } from "../services/LogInterpreterService";
import {
	ColonisationConstructionDepot,
	ColonisationStats,
} from "../../../shared/types/colonisation.type";
import { calculateLatestSiteStats } from "../services/MarketService";

@Route("construction")
@Tags("Construction")
export class ColonisationController {
	@Get("/latestSite")
	public async getLatestSite(): Promise<ColonisationConstructionDepot> {
		return getLatestConstructionDepot();
	}
	@Get("/latestSite/Stats")
	public async getLatestSiteStats(): Promise<ColonisationStats> {
		return calculateLatestSiteStats();
	}
}
