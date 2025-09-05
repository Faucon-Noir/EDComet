import { ColonisationStats } from "../../../shared/types/colonisation.type";
import {
	getLatestConstructionDepot,
	getLoadout,
} from "./LogInterpreterService";

// Process EDDN API requests and responses & market data handling, such as fetching market price, hilighting required ressources etc
export function calculateLatestSiteStats(): ColonisationStats | null {
	try {
		const data = getLatestConstructionDepot().ResourcesRequired || null;
		const totalUnitsRequired: number = data.reduce(
			(acc, res): number => acc + res.RequiredAmount,
			0
		);
		const travels: number = Math.ceil(
			totalUnitsRequired / getLoadout().CargoCapacity
		);
		const estimatedPayment: number = data.reduce(
			(acc, res): number => acc + res.Payment * res.RequiredAmount,
			0
		); 

		return { travels, estimatedPayment, totalUnitsRequired };
	} catch (error) {
		console.warn("⚠️ Calculate Latest Site Stats:", error.message);
		return null;
	}
}
