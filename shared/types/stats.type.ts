import { EventEnum } from "./enum";

export interface Stats {
  timestamp: Date;
  event: EventEnum.Stats;
  Bank_Account: BankAccount;
  Combat: Combat;
  Crime: Crime;
  Smuggling: Smuggling;
  Trading: Trading;
  Mining: Mining;
  Exploration: Exploration;
  Passenger: Passenger;
  Search_And_Rescue: SAR;
  Crafting?: Crafting;
  Crew?: Crew;
  Multicrew?: Multicrew;
  Material_Trader_Stats?: MaterialTraderStats;
  FLEETCARRIER?: FleetCarrier;
  Exobiology?: Exobiology;
  TG_ENCOUNTERS?: ThargoidEncounters;
  CQC?: CQC;
  Squadron?: Squadron;
}

//#region Stats dependency objects
export interface BankAccount {
  Current_Wealth: number;
  // Ships
  Spent_On_Ships: number;
  Spent_On_Outfitting: number;
  Spent_On_Repairs: number;
  Spent_On_Fuel: number;
  Spent_On_Ammo_Consumables: number;
  Insurance_Claims: number;
  Spent_On_Insurance: number;
  Owned_Ship_Count?: number;
  // Suits and Weapons
  Spent_On_Suits?: number;
  Spent_On_Weapons?: number;
  Spent_On_Suit_Consumables: number;
  Suits_Owned?: number;
  Weapons_Owned: number;
  // Premium Stock
  Spent_On_Premium_Stock: number;
  Premium_Stock_Bought: number;
  // Mercenary Coins
  MercCoins_Current?: number;
  MercCoins_Total_Earned?: number;
  MercCoins_Total_Spent?: number;
  MercCoins_Spent_On_MercGear?: number;
  MercCoins_Spent_On_Engineering?: number;
}

export interface Combat {
  // Bounties
  Bounties_Claimed: number;
  Bounty_Hunting_Profit: number;
  // Combat Bonds
  Combat_Bonds: number;
  Combat_Bond_Profits: number;
  // Assassinations
  Assassinations: number;
  Assassination_Profits: number;
  Highest_Single_Reward: number;
  // Skimmers
  Skimmers_Killed?: number;
  // On Foot
  OnFoot_Combat_Bonds?: number;
  OnFoot_Combat_Bonds_Profits?: number;
  OnFoot_Vehicles_Destroyed?: number;
  OnFoot_Ships_Destroyed?: number;
  // Dropships
  Dropships_Taken?: number;
  Dropships_Booked?: number;
  Dropships_Cancelled?: number;
  // Conflict Zones
  ConflictZone_High?: number;
  ConflictZone_Medium?: number;
  ConflictZone_Low?: number;
  ConflictZone_Total?: number;
  ConflictZone_High_Wins?: number;
  ConflictZone_Medium_Wins?: number;
  ConflictZone_Low_Wins?: number;
  ConflictZone_Total_Wins?: number;
  // Settlements
  Settlement_Defended?: number;
  Settlement_Conquered?: number;
  // On Foot Skimmers and Scavs
  OnFoot_Skimmers_Killed?: number;
  OnFoot_Scavs_Killed?: number;
}

export interface Crime {
  Notoriety?: number;
  Fines: number;
  Total_Fines: number;
  Bounties_Received: number;
  Total_Bounties: number;
  Highest_Bounty: number;
  Malware_Uploaded?: number;
  Settlements_State_Shutdown?: number;
  Production_Sabotage?: number;
  Production_Theft?: number;
  // Murders
  Total_Murders?: number;
  Citizens_Murdered?: number;
  Omnipol_Murdered?: number;
  Guards_Murdered?: number;
  // Stolen
  Data_Stolen?: number;
  Goods_Stolen?: number;
  Sample_Stolen?: number;
  Total_Stolen?: number;
  // Turrets
  Turrets_Destroyed?: number;
  Turrets_Overloaded?: number;
  Turrets_Total?: number;
  Value_Stolen_StateChange?: number;
  Profiles_Cloned?: number;
}

export interface Smuggling {
  Black_Markets_Traded_With: number;
  Black_Markets_Profits: number;
  Resources_Smuggled: number;
  Average_Profit: number;
  Highest_Single_Transaction: number;
}

export interface Trading {
  Markets_Traded_With: number;
  Market_Profits: number;
  Resources_Traded: number;
  Average_Profit: number;
  Highest_Single_Transaction: number;
  Data_Sold?: number;
  Goods_Sold?: number;
  Assets_Sold?: number;
}

export interface Mining {
  Mining_Profit: number;
  Quantity_Mined: number;
  Materials_Collected?: number;
}

export interface Exploration {
  Systems_Visited: number;
  Planets_Scanned: number;
  Planets_Scanned_To_Level_2: number;
  Planets_Scanned_To_Level_3: number;
  Efficient_Scans?: number;
  Highest_Payout: number;
  Total_Hyperspace_Distance: number;
  Total_Hyperspace_Jumps: number;
  Greatest_Distance_From_Start: number;
  Time_Played: number;
  OnFoot_Distance_Traveled?: number;
  Shuttle_Journeys?: number;
  Shuttle_Distance_Traveled?: number;
  Spent_On_Shuttles?: number;
  First_Footfalls?: number;
  Settlements_Visited?: number;
  Fuel_Scooped?: number;
  Fuel_Purchased?: number;
}

export interface Passenger {
  // Base
  Passengers_Missions_Accepted?: number;
  Passengers_Missions_Disgruntled?: number;
  Passengers_Missions_Bulk: number;
  Passengers_Missions_VIP: number;
  Passengers_Missions_Delivered: number;
  Passengers_Missions_Ejected: number;
  // Tourists
  Passengers_Missions_Tourist_vip_delivered?: number;
  Passengers_Missions_Tourist_vip_ejected?: number;
  Passengers_Missions_Tourist_bulk_delivered?: number;
  Passengers_Missions_Tourist_bulk_ejected?: number;
  // Refugees
  Passengers_Missions_Refugee_vip_delivered?: number;
  Passengers_Missions_Refugee_vip_ejected?: number;
  Passengers_Missions_Refugee_bulk_delivered?: number;
  Passengers_Missions_Refugee_bulk_ejected?: number;
  // Aid Workers
  Passengers_Missions_AidWorker_vip_delivered?: number;
  Passengers_Missions_AidWorker_vip_ejected?: number;
  Passengers_Missions_AidWorker_bulk_delivered?: number;
  Passengers_Missions_AidWorker_bulk_ejected?: number;
  // POW
  Passengers_Missions_POW_vip_delivered?: number;
  Passengers_Missions_POW_vip_ejected?: number;
  Passengers_Missions_POW_bulk_delivered?: number;
  Passengers_Missions_POW_bulk_ejected?: number;
  // Soldiers
  Passengers_Missions_Soldiers_vip_delivered?: number;
  Passengers_Missions_Soldiers_vip_ejected?: number;
  Passengers_Missions_Soldiers_bulk_delivered?: number;
  Passengers_Missions_Soldiers_bulk_ejected?: number;
  // Protestors
  Passengers_Missions_Protestors_vip_delivered?: number;
  Passengers_Missions_Protestors_vip_ejected?: number;
  Passengers_Missions_Protestors_bulk_delivered?: number;
  Passengers_Missions_Protestors_bulk_ejected?: number;
  // Prisoners
  Passengers_Missions_Prisoners_vip_delivered?: number;
  Passengers_Missions_Prisoners_vip_ejected?: number;
  Passengers_Missions_Prisoners_bulk_delivered?: number;
  Passengers_Missions_Prisoners_bulk_ejected?: number;
  // Freedom Fighters
  Passengers_Missions_FreedomFighters_vip_delivered?: number;
  Passengers_Missions_FreedomFighters_vip_ejected?: number;
  Passengers_Missions_FreedomFighters_bulk_delivered?: number;
  Passengers_Missions_FreedomFighters_bulk_ejected?: number;
  // Politicians
  Passengers_Missions_Politicians_vip_delivered?: number;
  Passengers_Missions_Politicians_vip_ejected?: number;
  Passengers_Missions_Politicians_bulk_delivered?: number;
  Passengers_Missions_Politicians_bulk_ejected?: number;
  // Political Prisoners
  Passengers_Missions_PoliticalPrisoner_vip_delivered?: number;
  Passengers_Missions_PoliticalPrisoner_vip_ejected?: number;
  Passengers_Missions_PoliticalPrisoner_bulk_delivered?: number;
  Passengers_Missions_PoliticalPrisoner_bulk_ejected?: number;
  // Security Forces
  Passengers_Missions_SecurityForces_vip_delivered?: number;
  Passengers_Missions_SecurityForces_vip_ejected?: number;
  Passengers_Missions_SecurityForces_bulk_delivered?: number;
  Passengers_Missions_SecurityForces_bulk_ejected?: number;
  // Businessmen
  Passengers_Missions_Businessmen_vip_delivered?: number;
  Passengers_Missions_Businessmen_vip_ejected?: number;
  Passengers_Missions_Businessmen_bulk_delivered?: number;
  Passengers_Missions_Businessmen_bulk_ejected?: number;
  // Science Teams
  Passengers_Missions_ScienceTeams_vip_delivered?: number;
  Passengers_Missions_ScienceTeams_vip_ejected?: number;
  Passengers_Missions_ScienceTeams_bulk_delivered?: number;
  Passengers_Missions_ScienceTeams_bulk_ejected?: number;
  // Explorers
  Passengers_Missions_Explorers_vip_delivered?: number;
  Passengers_Missions_Explorers_vip_ejected?: number;
  Passengers_Missions_Explorers_bulk_delivered?: number;
  Passengers_Missions_Explorers_bulk_ejected?: number;
  // Celebrities
  Passengers_Missions_Celebrities_vip_delivered?: number;
  Passengers_Missions_Celebrities_vip_ejected?: number;
  Passengers_Missions_Celebrities_bulk_delivered?: number;
  Passengers_Missions_Celebrities_bulk_ejected?: number;
  // Head of State
  Passengers_Missions_HeadOfState_vip_delivered?: number;
  Passengers_Missions_HeadOfState_vip_ejected?: number;
  Passengers_Missions_HeadOfState_bulk_delivered?: number;
  Passengers_Missions_HeadOfState_bulk_ejected?: number;
  // Criminal
  Passengers_Missions_Criminal_vip_delivered?: number;
  Passengers_Missions_Criminal_vip_ejected?: number;
  Passengers_Missions_Criminal_bulk_delivered?: number;
  Passengers_Missions_Criminal_bulk_ejected?: number;
  // Medical
  Passengers_Missions_Medical_vip_delivered?: number;
  Passengers_Missions_Medical_vip_ejected?: number;
  Passengers_Missions_Medical_bulk_delivered?: number;
  Passengers_Missions_Medical_bulk_ejected?: number;
  // Disgruntled
  Passengers_Missions_Disgruntled_vip_delivered?: number;
  Passengers_Missions_Disgruntled_vip_ejected?: number;
  Passengers_Missions_Disgruntled_bulk_delivered?: number;
  Passengers_Missions_Disgruntled_bulk_ejected?: number;
}

export interface SAR {
  SearchRescue_Traded: number;
  SearchRescue_Profit: number;
  SearchRescue_Count: number;
  Salvage_Legal_POI?: number;
  Salvage_Legal_Settlements?: number;
  Salvage_Illegal_POI?: number;
  Salvage_Illegal_Settlements?: number;
  MagLocks_Opened?: number;
  Panels_Opened?: number;
  Settlements_State_FireOut?: number;
  Settlements_State_Reboot?: number;
}

export interface Crafting {
  Count_Of_Used_Engineers: number;
  Recipes_Generated: number;
  Recipes_Generated_Rank_1: number;
  Recipes_Generated_Rank_2: number;
  Recipes_Generated_Rank_3: number;
  Recipes_Generated_Rank_4: number;
  Recipes_Generated_Rank_5: number;
  Suit_Mods_Applied?: number;
  Weapon_Mods_Applied?: number;
  Suits_Upgraded?: number;
  Weapons_Upgraded?: number;
  Suits_Upgraded_Full?: number;
  Weapons_Upgraded_Full?: number;
  Suit_Mods_Applied_Full?: number;
  Weapon_Mods_Applied_Full?: number;
  Spent_On_Crafting?: number;
  Recipes_Applied?: number;
  Recipes_Applied_Rank_1?: number;
  Recipes_Applied_Rank_2?: number;
  Recipes_Applied_Rank_3?: number;
  Recipes_Applied_Rank_4?: number;
  Recipes_Applied_Rank_5?: number;
  Recipes_Applied_On_Previously_Modified_Modules?: number;
}

export interface Crew {
  NpcCrew_TotalWages?: number;
  NpcCrew_Hired?: number;
  NpcCrew_Fired?: number;
  NpcCrew_Died?: number;
}

export interface Multicrew {
  Multicrew_Time_Total: number;
  Multicrew_Gunner_Time_Total: number;
  Multicrew_Fighter_Time_Total: number;
  Multicrew_Credits_Total: number;
  Multicrew_Fines_Total: number;
}

export interface MaterialTraderStats {
  Trades_Completed: number;
  Materials_Traded: number;
  Encoded_Materials_Traded?: number;
  Raw_Materials_Traded?: number;
  Grade_1_Materials_Traded?: number;
  Grade_2_Materials_Traded?: number;
  Grade_3_Materials_Traded?: number;
  Grade_4_Materials_Traded?: number;
  Grade_5_Materials_Traded?: number;
  Assets_Traded_In?: number;
  Assets_Traded_Out?: number;
}

export interface FleetCarrier {
  FLEETCARRIER_EXPORT_TOTAL: number;
  FLEETCARRIER_IMPORT_TOTAL: number;
  FLEETCARRIER_TRADEPROFIT_TOTAL: number;
  FLEETCARRIER_TRADESPEND_TOTAL: number;
  FLEETCARRIER_STOLENPROFIT_TOTAL: number;
  FLEETCARRIER_STOLENSPEND_TOTAL: number;
  FLEETCARRIER_DISTANCE_TRAVELLED: number; //Referenced as unknwon -> for now, keeping it as number
  FLEETCARRIER_TOTAL_JUMPS: number;
  FLEETCARRIER_SHIPYARD_SOLD: number;
  FLEETCARRIER_SHIPYARD_PROFIT: number;
  FLEETCARRIER_OUTFITTING_SOLD: number;
  FLEETCARRIER_OUTFITTING_PROFIT: number;
  FLEETCARRIER_REARM_TOTAL: number;
  FLEETCARRIER_REFUEL_TOTAL: number;
  FLEETCARRIER_REFUEL_PROFIT: number;
  FLEETCARRIER_REPAIRS_TOTAL: number;
  FLEETCARRIER_VOUCHERS_REDEEMED: number;
  FLEETCARRIER_VOUCHERS_PROFIT: number;
}

export interface Exobiology {
  Organic_Genus_Encountered: number;
  Organic_Species_Encountered: number;
  Organic_Variant_Encountered: number;
  Organic_Data_Profits: number;
  Organic_Data: number;
  First_Logged_Profits: number;
  First_Logged: number;
  Organic_Systems: number;
  Organic_Planets: number;
  Organic_Genus: number;
  Organic_Species: number;
}

export interface ThargoidEncounters {
  TG_ENCOUNTER_IMPRINT?: number;
  TG_ENCOUNTER_WAKES?: number;
  TG_ENCOUNTER_KILLED?: number;
  TG_ENCOUNTER_TOTAL?: number;
  TG_ENCOUNTER_TOTAL_LAST_SYSTEM?: string;
  TG_ENCOUNTER_TOTAL_LAST_TIMESTAMP?: string; // Not Date ISO -> Treat it as a string
  TG_ENCOUNTER_TOTAL_LAST_SHIP?: string;
  TG_SCOUT_COUNT?: number;
}

export interface CQC {
  CQC_Credits_Earned?: number;
  CQC_Time_Played?: number;
  CQC_KD?: number;
  CQC_Kills?: number;
  CQC_WL?: number;
}

export interface Squadron {
  Squadron_Bank_Credits_Deposited: number;
  Squadron_Bank_Credits_Withdrawn: number;
  Squadron_Bank_Commodities_Deposited_Num: number;
  Squadron_Bank_Commodities_Deposited_Value: number;
  Squadron_Bank_Commodities_Withdrawn_Num: number;
  Squadron_Bank_Commodities_Withdrawn_Value: number;
  Squadron_Bank_PersonalAssets_Deposited_Num: number;
  Squadron_Bank_PersonalAssets_Deposited_Value: number;
  Squadron_Bank_PersonalAssets_Withdrawn_Num: number;
  Squadron_Bank_PersonalAssets_Withdrawn_Value: number;
  Squadron_Bank_Ships_Deposited_Num: number;
  Squadron_Bank_Ships_Deposited_Value: number;
  Squadron_Leaderboard_aegis_highestcontribution: number;
  Squadron_Leaderboard_bgs_totalcontribution: number;
  Squadron_Leaderboard_bounty_highestcontribution: number;
  Squadron_Leaderboard_colonisation_contribution_highestcontribution: number;
  Squadron_Leaderboard_combat_highestcontribution: number;
  Squadron_Leaderboard_cqc_highestcontribution: number;
  Squadron_Leaderboard_exploration_highestcontribution: number;
  Squadron_Leaderboard_mining_highestcontribution: number;
  Squadron_Leaderboard_powerplay_highestcontribution: number;
  Squadron_Leaderboard_trade_highestcontribution: number;
  Squadron_Leaderboard_trade_illicit_highestcontribution: number;
  Squadron_Leaderboard_operationscore_highestcontribution: number;
  Squadron_Leaderboard_podiums: number;
}
//#endregion Stats dependency objects
