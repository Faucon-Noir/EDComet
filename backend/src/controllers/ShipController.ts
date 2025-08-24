import { Get, Route, Tags } from "tsoa";
import { getLoadout } from "../services/LogInterpreterService";
import { ShipLoadout } from "../../../shared/types/log.type";

@Route("ship")
@Tags("ship")
export class ShipController {
	@Get("/loadout")
	public async getShipLoadout(): Promise<ShipLoadout | null> {
		return getLoadout();
	}
}
