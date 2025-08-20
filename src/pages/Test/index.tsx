import { useTranslation } from 'react-i18next';

import { Box, useTheme } from '@mui/material';

const TestPage: React.FC = () => {
    const { t } = useTranslation('page', { keyPrefix: 'test' });
    const theme = useTheme();
    const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main,
    ];
    return (
        <>
            <div>
                <h1>Test Page</h1>
                <div>{t('title')} should be equal to upper h1</div>
            </div>
            <>
                <h1>ABCDEFGHIJKLMNOPQRSTUVWXYZ</h1>
                <br />
                <h2>abcdefghijklmnopqrstuvwxyz</h2>
                <br />
                <h2>1234567890</h2>
                <br />
                <h2>{'&é~"#\'{([-|è`_ \\ ç^à@)]=}$¤£µ*?,.;/:§!€'}</h2>
            </>
            <Box display="flex" gap="2">
                {colors.map((color, index) => (
                    <Box
                        key={index}
                        sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            backgroundColor: color,
                        }}
                    />
                ))}
            </Box>
        </>
    );
};
export default TestPage;
