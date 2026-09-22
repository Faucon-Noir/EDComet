import { Get, Route, Tags } from "tsoa";
import { Stats } from "ed-shared";
import { getLatestStats } from "../services/StatsService";

@Route("stats")
@Tags("Stats")
export class StatsController {
  @Get("/")
  public async getLatestStats(): Promise<Stats | null> {
    return getLatestStats();
  }
}