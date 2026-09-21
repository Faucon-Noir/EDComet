import { Get, Route, Tags } from "tsoa";

@Route("mission")
@Tags("Mission")
export class MissionController {
    @Get("/")
    public async getMissions(): Promise<any> {
        // Implement your logic to fetch missions here
        return [];
    }
}