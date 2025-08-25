import { EventEnum } from "./enum";

// Colonisation
export interface ColonisationConstructionDepot {
	timestamp: string;
	event: EventEnum.ColonisationConstructionDepot;
	MarketID: number;
	ConstructionProgress: number;
	ConstructionComplete: boolean;
	ConstructionFailed: boolean;
	ResourcesRequired: ColonisationConstructionDepotResource[];
}

export interface ColonisationConstructionDepotResource {
	Name: string;
	Name_Localised: string;
	RequiredAmount: number;
	ProvidedAmount: number;
	Payment: number;
}
