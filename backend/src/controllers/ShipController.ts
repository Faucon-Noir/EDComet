import { ShipLoadout } from "ed-shared";
import { Get, Route, Tags } from "tsoa";
import { getLoadout } from "../services/LogInterpreterService";

@Route("ship")
@Tags("ship")
export class ShipController {
	@Get("/loadout")
	public async getShipLoadout(): Promise<ShipLoadout | null> {
		return getLoadout();
	}
}
