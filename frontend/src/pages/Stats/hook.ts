import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Stats } from '../../api';
import { statsApi } from '../../utils/api';

const label = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');

export function useStats() {
    const { t, i18n } = useTranslation('page', { keyPrefix: 'stats' });
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        statsApi.getLatestStats()
            .then(response => { if (active) setStats(response.data ?? null); })
            .catch(() => { if (active) setError(true); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const formatNumber = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
    const profits = stats ? [
        { id: 'combat', label: t('categories.Combat'), value: stats.Combat?.Bounty_Hunting_Profit ?? 0, color: '#dc7949' },
        { id: 'trading', label: t('categories.Trading'), value: stats.Trading?.Market_Profits ?? 0, color: '#3fada9' },
        { id: 'mining', label: t('categories.Mining'), value: stats.Mining?.Mining_Profit ?? 0, color: '#a4b554' },
        { id: 'smuggling', label: t('categories.Smuggling'), value: stats.Smuggling?.Black_Markets_Profits ?? 0, color: '#c98ea2' },
    ].filter(item => item.value > 0) : [];
    const totalProfits = profits.reduce((sum, item) => sum + item.value, 0);
    const account = stats?.Bank_Account;
    const spendingGroups = [
        {
            id: 'ships', color: '#e99061', items: [
                { id: 'ships', value: account?.Spent_On_Ships ?? 0, color: '#e99061' },
                { id: 'outfitting', value: account?.Spent_On_Outfitting ?? 0, color: '#f7b88c' },
            ]
        },
        {
            id: 'operations', color: '#51b6ae', items: [
                { id: 'repairs', value: account?.Spent_On_Repairs ?? 0, color: '#51b6ae' },
                { id: 'fuel', value: account?.Spent_On_Fuel ?? 0, color: '#81d0c4' },
                { id: 'ammo', value: account?.Spent_On_Ammo_Consumables ?? 0, color: '#b1e5d8' },
                { id: 'insurance', value: account?.Spent_On_Insurance ?? 0, color: '#378d93' },
            ]
        },
        {
            id: 'equipment', color: '#c79fdb', items: [
                { id: 'suits', value: account?.Spent_On_Suits ?? 0, color: '#c79fdb' },
                { id: 'weapons', value: account?.Spent_On_Weapons ?? 0, color: '#a87dc6' },
                { id: 'consumables', value: account?.Spent_On_Suit_Consumables ?? 0, color: '#e0c2ee' },
            ]
        },
        {
            id: 'premium', color: '#d3bc65', items: [
                { id: 'premium', value: account?.Spent_On_Premium_Stock ?? 0, color: '#d3bc65' },
            ]
        },
    ].map(group => ({ ...group, label: t(`spendingGroups.${group.id}`), items: group.items.filter(item => item.value > 0).map(item => ({ ...item, label: t(`spendingItems.${item.id}`) })) }))
        .filter(group => group.items.length > 0);
    const spendingItems = spendingGroups.flatMap(group => group.items);
    const totalSpent = spendingItems.reduce((sum, item) => sum + item.value, 0);

    return {
        t,
        language: i18n.language,
        stats,
        loading,
        error,
        formatNumber,
        profits,
        totalProfits,
        spendingGroups,
        spendingItems,
        totalSpent,
        label,
    };
}
