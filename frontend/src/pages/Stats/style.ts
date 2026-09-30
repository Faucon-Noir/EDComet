import type { SxProps, Theme } from '@mui/material/styles';

export const page = { maxWidth: 1100, mx: 'auto', px: { xs: 1, md: 3 }, pb: 6, textAlign: 'left' } satisfies SxProps<Theme>;
export const title = { mt: 3 } satisfies SxProps<Theme>;
export const loading = { mt: 4 } satisfies SxProps<Theme>;
export const status = { mt: 3 } satisfies SxProps<Theme>;
export const updated = { mt: 1, mb: 3 } satisfies SxProps<Theme>;
export const metrics = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 2, mb: 5 } satisfies SxProps<Theme>;
export const metric = { borderTop: '2px solid', borderColor: '#62b5b0', pt: 1.5, minWidth: 0 } satisfies SxProps<Theme>;
export const metricValue = { overflowWrap: 'anywhere' } satisfies SxProps<Theme>;
export const charts = {
    display: 'grid',
    gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        lg: 'repeat(2, minmax(0, 1fr))'
    },
    gap: { xs: 4, lg: 5 }
};
export const chartSection = {
    minWidth: 0,
    borderTop: '1px solid rgba(170, 202, 217, 0.3)',
    pt: 2
};
export const chartEmpty = { mt: 2 };
export const chart = {
    position: 'relative',
    width: '100%',
    maxWidth: 320,
    mx: 'auto'
};
export const chartCenter = {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeContent: 'center',
    textAlign: 'center',
    pointerEvents: 'none'
};
export const legend = {
    listStyle: 'none',
    p: 0,
    m: 0,
    display: 'grid',
    gap: 1.5
};
export const legendRow = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5
};
export const legendLabel = { flex: 1 };
export const legendValue = {
    fontVariantNumeric: 'tabular-nums'
};
export const legendDot = {
    width: 10,
    height: 10,
    flexShrink: 0,
    borderRadius: '50%'
};
export const coloredLegendDot = (color: string) => ({
    ...legendDot,
    bgcolor: color
});
export const spendingTotal = {
    mb: 2,
    fontVariantNumeric: 'tabular-nums'
};
export const spendingGroup = {
    mb: 0.5
};
export const coloredSpendingGroup = (color: string) => ({
    ...spendingGroup,
    color
});
export const spendingItem = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 1,
    pl: 1.5
};
export const spendingDot = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0
};
export const coloredSpendingDot = (color: string) => ({
    ...spendingDot, bgcolor: color
});
export const detailsTitle = {
    mt: 5,
    mb: 2
};
export const accordion = {
    color: 'text.primary',
    bgcolor: 'rgba(10, 22, 35, 0.8)',
    borderBottom: '1px solid rgba(170, 202, 217, 0.22)',
    boxShadow: 'none',
    '&:before': { display: 'none' }
};
export const accordionExpand = {
    color: '#b7d4df',
    display: 'inline-block',
    transform: 'rotate(90deg)'
};
export const accordionDetails = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 2
}
    ;
export const detail = {
    minWidth: 0
};
