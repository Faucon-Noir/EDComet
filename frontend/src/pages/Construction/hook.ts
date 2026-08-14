import { useEffect, useState } from 'react';
import type {
  ColonisationConstructionDepotResource,
  ColonisationStats,
  Market,
  MarketItem,
} from '../../api';
import { constructionApi } from '../../utils/api';
import { useJournalStream } from '../../utils/stream';
import type {
  CategorizedResourceGroup,
  ConstructionStatItem,
  StoredCategoryMap,
} from './type';
import {
  CATEGORY_STORAGE_KEY,
  EMPTY_CONSTRUCTION_DEPOT,
  OTHER_CATEGORY_KEY,
  OTHER_CATEGORY_LABEL,
} from './type';

interface UseConstructionPageResult {
  categorizedResources: CategorizedResourceGroup[];
  formatResourceLabel: (
    resource: ColonisationConstructionDepotResource,
  ) => string;
  handleToggle: (name: string) => () => void;
  isResourceChecked: (
    resource: ColonisationConstructionDepotResource,
  ) => boolean;
  progress: number;
  statsList: ConstructionStatItem[];
}

const normalizeWhitespace = (value: string): string => value.trim();

const formatFallbackCategoryLabel = (category: string): string => {
  const cleanedCategory = category
    .replace(/^\$MARKET_category_/i, '')
    .replace(/;$/, '')
    .replace(/_/g, ' ')
    .trim();

  if (cleanedCategory.length === 0) {
    return OTHER_CATEGORY_LABEL;
  }

  return cleanedCategory.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getCategoryKey = (item: Pick<MarketItem, 'Category'>): string => {
  const category = normalizeWhitespace(item.Category ?? '');
  return category.length > 0 ? category : OTHER_CATEGORY_KEY;
};

const getCategoryLabel = (
  item: Pick<MarketItem, 'Category' | 'Category_Localised'>,
): string => {
  const localized = normalizeWhitespace(item.Category_Localised ?? '');

  if (localized.length > 0) {
    return localized;
  }

  const category = normalizeWhitespace(item.Category ?? '');
  return category.length > 0
    ? formatFallbackCategoryLabel(category)
    : OTHER_CATEGORY_LABEL;
};

const getResourceLabel = (name: string, localizedName?: string): string => {
  const localized = normalizeWhitespace(localizedName ?? '');
  return localized.length > 0 ? localized : name;
};

const sortResources = (
  left: ColonisationConstructionDepotResource,
  right: ColonisationConstructionDepotResource,
  checkedResources: Set<string>,
): number => {
  const leftChecked =
    left.RequiredAmount - left.ProvidedAmount === 0 || checkedResources.has(left.Name);
  const rightChecked =
    right.RequiredAmount - right.ProvidedAmount === 0 || checkedResources.has(right.Name);

  if (leftChecked && !rightChecked) {
    return 1;
  }

  if (!leftChecked && rightChecked) {
    return -1;
  }

  return getResourceLabel(left.Name, left.Name_Localised).localeCompare(
    getResourceLabel(right.Name, right.Name_Localised),
    undefined,
    { sensitivity: 'base' },
  );
};

const sortCategoryGroups = (
  left: CategorizedResourceGroup,
  right: CategorizedResourceGroup,
): number => {
  if (left.key === OTHER_CATEGORY_KEY && right.key !== OTHER_CATEGORY_KEY) {
    return 1;
  }

  if (left.key !== OTHER_CATEGORY_KEY && right.key === OTHER_CATEGORY_KEY) {
    return -1;
  }

  return left.label.localeCompare(right.label, undefined, { sensitivity: 'base' });
};

const readStoredCategoryMap = (): StoredCategoryMap => {
  if (typeof window === 'undefined') {
    return {};
  }

  const storedValue = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!storedValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(storedValue) as StoredCategoryMap;
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
};

const persistCategoryMap = (categoryMap: StoredCategoryMap): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryMap));
};

const mergeCategoryMaps = (...maps: StoredCategoryMap[]): StoredCategoryMap => {
  return maps.reduce<StoredCategoryMap>((accumulator, currentMap) => {
    for (const categoryKey in currentMap) {
      const bucket = currentMap[categoryKey];

      const currentBucket = accumulator[categoryKey] ?? {
        label: bucket.label,
        resources: {},
      };

      accumulator[categoryKey] = {
        label: bucket.label || currentBucket.label,
        resources: {
          ...currentBucket.resources,
          ...bucket.resources,
        },
      };
    }

    return accumulator;
  }, {});
};

const buildCategoryMapFromMarket = (
  market: Market | null | undefined,
): StoredCategoryMap => {
  if (!market?.Items?.length) {
    return {};
  }

  return market.Items.reduce<StoredCategoryMap>((accumulator, item) => {
    const categoryKey = getCategoryKey(item);
    const categoryLabel = getCategoryLabel(item);
    const resourceLabel = getResourceLabel(item.Name, item.Name_Localised);
    const existingBucket = accumulator[categoryKey] ?? {
      label: categoryLabel,
      resources: {},
    };

    accumulator[categoryKey] = {
      label: existingBucket.label || categoryLabel,
      resources: {
        ...existingBucket.resources,
        [item.Name]: resourceLabel,
      },
    };

    return accumulator;
  }, {});
};

const ensureOtherCategoryResources = (
  categoryMap: StoredCategoryMap,
  resources: ColonisationConstructionDepotResource[],
): StoredCategoryMap => {
  const knownResourceNames = new Set<string>();

  for (const categoryKey in categoryMap) {
    const bucket = categoryMap[categoryKey];

    Object.keys(bucket.resources).forEach((resourceName) => {
      knownResourceNames.add(resourceName);
    });
  }

  const missingResources = resources.filter(({ Name }) => !knownResourceNames.has(Name));

  if (missingResources.length === 0) {
    return categoryMap;
  }

  const otherBucket = categoryMap[OTHER_CATEGORY_KEY] ?? {
    label: OTHER_CATEGORY_LABEL,
    resources: {},
  };

  const nextOtherBucketResources = { ...otherBucket.resources };
  missingResources.forEach((resource) => {
    nextOtherBucketResources[resource.Name] = getResourceLabel(
      resource.Name,
      resource.Name_Localised,
    );
  });

  return {
    ...categoryMap,
    [OTHER_CATEGORY_KEY]: {
      label: otherBucket.label || OTHER_CATEGORY_LABEL,
      resources: nextOtherBucketResources,
    },
  };
};

const buildResourceCategoryLookup = (
  categoryMap: StoredCategoryMap,
): Record<string, { categoryKey: string; categoryLabel: string }> => {
  return Object.keys(categoryMap).reduce<
    Record<string, { categoryKey: string; categoryLabel: string }>
  >((accumulator, categoryKey) => {
    const bucket = categoryMap[categoryKey];

    Object.keys(bucket.resources).forEach((resourceName) => {
      accumulator[resourceName] = {
        categoryKey,
        categoryLabel: bucket.label || OTHER_CATEGORY_LABEL,
      };
    });

    return accumulator;
  }, {});
};

const buildCategorizedResources = (
  resources: ColonisationConstructionDepotResource[],
  categoryMap: StoredCategoryMap,
  checkedResources: Set<string>,
): CategorizedResourceGroup[] => {
  const resourceLookup = buildResourceCategoryLookup(categoryMap);
  const groupedResources = new Map<string, CategorizedResourceGroup>();

  resources.forEach((resource) => {
    const category = resourceLookup[resource.Name] ?? {
      categoryKey: OTHER_CATEGORY_KEY,
      categoryLabel: OTHER_CATEGORY_LABEL,
    };

    const existingGroup = groupedResources.get(category.categoryKey) ?? {
      key: category.categoryKey,
      label: category.categoryLabel,
      resources: [],
    };

    existingGroup.resources.push(resource);
    groupedResources.set(category.categoryKey, existingGroup);
  });

  return Array.from(groupedResources.values())
    .map((group) => ({
      ...group,
      resources: [...group.resources].sort((left, right) =>
        sortResources(left, right, checkedResources),
      ),
    }))
    .sort(sortCategoryGroups);
};

const formatStat = (value: number | undefined): string => {
  return typeof value === 'number' ? value.toString() : 'N/A';
};

export const useConstructionPage = (): UseConstructionPageResult => {
  const { lastEvent } = useJournalStream();

  const [checked, setChecked] = useState<string[]>([]);
  const [stats, setStats] = useState<ColonisationStats>();
  const [categoryMap, setCategoryMap] = useState<StoredCategoryMap>(() =>
    readStoredCategoryMap(),
  );
  const [data, setData] = useState(EMPTY_CONSTRUCTION_DEPOT);

  const progress = Number((data.ConstructionProgress * 100).toFixed(1));
  const checkedResources = new Set(checked);

  const syncCategoryMap = (
    market: Market | null | undefined,
    resources: ColonisationConstructionDepotResource[],
  ): void => {
    setCategoryMap((previousCategoryMap) => {
      const nextCategoryMap = ensureOtherCategoryResources(
        mergeCategoryMaps(previousCategoryMap, buildCategoryMapFromMarket(market)),
        resources,
      );

      if (JSON.stringify(nextCategoryMap) === JSON.stringify(previousCategoryMap)) {
        return previousCategoryMap;
      }

      persistCategoryMap(nextCategoryMap);
      return nextCategoryMap;
    });
  };

  const loadConstructionData = (): void => {
    Promise.all([
      constructionApi.getLatestSite(),
      constructionApi.getLatestSiteStats(),
      constructionApi.getLatestMarket(),
    ]).then(([siteResponse, statsResponse, marketResponse]) => {
      const nextData = siteResponse.data ?? EMPTY_CONSTRUCTION_DEPOT;
      const nextResources = nextData.ResourcesRequired ?? [];

      setData(nextData);
      setStats(statsResponse.data ?? undefined);
      syncCategoryMap(marketResponse.data, nextResources);
    });
  };

  useEffect(() => {
    loadConstructionData();
  }, []);

  useEffect(() => {
    const hasDepotEvent = lastEvent?.events.some((eventName) => eventName === 'ColonisationConstructionDepot');
    const hasJournalSwitch = lastEvent?.files?.some(
      (file) => file.type === 'journal-switched',
    );

    if (!hasDepotEvent && !hasJournalSwitch) {
      return;
    }

    loadConstructionData();
  }, [lastEvent]);

  useEffect(() => {
    syncCategoryMap(null, data.ResourcesRequired ?? []);
  }, [data.ResourcesRequired]);

  const handleToggle = (name: string) => () => {
    setChecked((previousChecked) =>
      previousChecked.includes(name)
        ? previousChecked.filter((checkedName) => checkedName !== name)
        : [...previousChecked, name],
    );
  };

  const isResourceChecked = (
    resource: ColonisationConstructionDepotResource,
  ): boolean => {
    return (
      resource.RequiredAmount - resource.ProvidedAmount === 0 ||
      checkedResources.has(resource.Name)
    );
  };

  const formatResourceLabel = (
    resource: ColonisationConstructionDepotResource,
  ): string => {
    return getResourceLabel(resource.Name, resource.Name_Localised);
  };

  const statsList: ConstructionStatItem[] = [
    { label: 'stats.estimatedPayment', value: formatStat(stats?.estimatedPayment) },
    { label: 'stats.resourcesRequired', value: formatStat(stats?.totalUnitsRequired) },
    { label: 'stats.travelsRequired', value: formatStat(stats?.travels) },
    { label: 'stats.remainingTravels', value: formatStat(stats?.remainingTravels) },
  ];

  return {
    categorizedResources: buildCategorizedResources(
      data.ResourcesRequired ?? [],
      categoryMap,
      checkedResources,
    ),
    formatResourceLabel,
    handleToggle,
    isResourceChecked,
    progress,
    statsList,
  };
};