import { EventEnum } from "./enum";

export interface Mission {
  timestamp: Date;
  event: EventEnum.Missions;
  Active: MissionResume[];
  Failed: MissionResume[];
  Complete: MissionResume[];
}

export interface MissionResume {
  MissionID: number;
  Name: string;
  Name_Localised: string;
  PassengerMission: boolean;
  Expires: number;
}

export interface MissionAbandoned {
  timestamp: Date;
  event: EventEnum.MissionAbandoned;
  Name: string;
  LocalisedName: string;
  MissionID: number;
  Fine?: number;
}

export interface MissionAccepted {
  timestamp: Date;
  event: EventEnum.MissionAccepted;
  Faction: string;
  Name: string;
  LocalisedName?: string;
  Commodity?: string;
  Commodity_Localised?: string;
  Count?: number;
  Expiry: Date;
  Wing: true;
  Influence: string;
  Reputation: string;
  Reward?: number;
  MissionId: number;
  TargetType?: string;
  TargetType_Localised?: string;
  TargetFaction?: string;
  DestinationSystem?: string;
  DestinationStation?: string;
  NewDestinationSystem?: string;
  NewDestinationStation?: string;
  Target?: string;
  Donation?: number;
  Target_Localised?: string;
  DestinationSettlement?: string;
  KillCount?: number;
  PassengerCount?: number;
  PassengerVIPs?: boolean;
  PassengerWanted?: boolean;
  PassengerType?: string;
}

export interface MissionCompleted {
  timestamp: Date;
  event: EventEnum.MissionCompleted;
  Faction: string;
  Name: string;
  LocalisedName?: string;
  MissionID: number;
  Commodity?: string;
  Commodity_Localised?: string;
  Count?: number;
  Reward?: number;
  PermitsAwarded?: string[];
  CommodityReward?: CommodityReward[];
  MaterialRewards?: MaterialRewards[];
  FactionEffects?: FactionEffects[];
  Donation?: string;
  Donated?: number;
  TargetFaction?: string;
  DestinationSystem?: string;
  DestinationStation?: string;
  Target?: string;
  Target_Localised?: string;
  DestinationSettlement?: string;
  TargetType?: string;
  TargetType_Localised?: string;
  KillCount?: number;
  NewDestinationSystem?: string;
  NewDestinationStation?: string;
}
// #region MissionCompleted dependency
export interface CommodityReward {
  Name: string;
  Name_Localised?: string;
  Count: number;
}

export interface MaterialRewards {
  Name: string;
  Name_Localised?: string;
  Category: string;
  Category_Localised?: string;
  Count: number;
}

export interface FactionEffects {
  Faction: string;
  Effects: Effects[];
  Influence?: Influence[];
  ReputationTrend: string;
  Reputation: string;
}

export interface Effects {
  Effect: string;
  Effect_Localised?: string;
  Trend: string;
}

export interface Influence {
  SystemAdress: number;
  Trend: string;
  Influence: string;
}
// #endregion MissionCompleted dependency

export interface MissionFailed {
  timestamp: Date;
  event: EventEnum.MissionFailed;
  Name: string;
  LocalisedName?: string;
  MissionID: number;
  Fine?: number;
}

/**
 * Use @param LocalisedName_Localised for the fully localised name of the mission.
 */
export interface MissionRedirected {
  timestamp: Date;
  event: EventEnum.MissionRedirected;
  Name: string;
  LocalisedName?: string;
  LocalisedName_Localised?: string; // The one to use, since the 2 others seem to be full or partial translation keys
  NewDestinationStation: string;
  NewDestinationSystem: string;
  OldDestinationStation: string;
  OldDestinationSystem: string;
}
