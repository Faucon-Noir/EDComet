import type {
  ColonisationConstructionDepot,
  ColonisationConstructionDepotResource,
} from '../../api';

export interface StoredCategoryBucket {
  label: string;
  resources: Record<string, string>;
}

export type StoredCategoryMap = Record<string, StoredCategoryBucket>;

export interface CategorizedResourceGroup {
  key: string;
  label: string;
  resources: ColonisationConstructionDepotResource[];
}

export interface ConstructionStatItem {
  label: string;
  value: string;
}

export const CATEGORY_STORAGE_KEY = 'construction-market-categories';
export const OTHER_CATEGORY_KEY = 'other';
export const OTHER_CATEGORY_LABEL = 'Other';

export const EMPTY_CONSTRUCTION_DEPOT: ColonisationConstructionDepot = {
  timestamp: '',
  event: 'ColonisationConstructionDepot',
  MarketID: 0,
  ConstructionProgress: 0,
  ConstructionComplete: false,
  ConstructionFailed: false,
  ResourcesRequired: [],
};