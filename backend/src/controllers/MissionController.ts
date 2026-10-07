import { Get, Route, Tags } from "tsoa";
import { Mission } from "ed-shared";
import { getAllMissions } from "../services/MissionService";

@Route("mission")
@Tags("Mission")
export class MissionController {
    @Get("/")
    public async getMissions(): Promise<Mission | null> {
        return getAllMissions();
    }
}