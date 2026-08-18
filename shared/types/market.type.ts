import { EventEnum } from "./enum.js";

export interface Market {
  timestamp: Date;
  event: EventEnum.Market;
  MarketID: number;
  StationName: string;
  StationName_Localised?: string;
  StationType: string;
  CarrierDockingAccess?: string;
  StarSystem: string;
  Items: MarketItem[];
}

export interface MarketItem {
  id: number;
  Name: string;
  Name_Localised?: string;
  Category: string;
  Category_Localised?: string;
  BuyPrice: number;
  SellPrice: number;
  MeanPrice: number;
  Stock: number;
  Demand: number;
  Consumer: boolean;
  Producer: boolean;
  Rare: boolean;
}

export interface MarketBuy {
  timestamp: Date;
  event: EventEnum.MarketBuy;
  MarketID: number;
  Type: string;
  Count: number;
  BuyPrice: number;
  TotalCost: number;
  Type_Localised?: string;
}
