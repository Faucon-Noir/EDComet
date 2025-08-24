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

// Ship Loadout
export interface ShipLoadout {
	timestamp: Date;
	event: EventEnum.Loadout;
	Ship: string;
	ShipID: number;
	ShipName: string;
	ShipIdent: string;
	HullValue?: number;
	ModulesValue?: number;
	HullHealth: number;
	UnladenMass: number;
	CargoCapacity: number;
	MaxJumpRange: number;
	FuelCapacity: FuelCapacity;
	Rebuy: number;
	Modules: LoadoutModule[];
}

export interface FuelCapacity {
	Main: number;
	Reserve: number;
}

export interface LoadoutModule {
	Slot: string;
	Item: string;
	On: boolean;
	Priority: number;
	AmmoInClip?: number;
}
