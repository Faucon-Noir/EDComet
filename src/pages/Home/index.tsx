import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
    const { t } = useTranslation('page', { keyPrefix: 'home' });
    return (
        <>
            <h1>{t('title')}</h1>
            <div>{t('description')}</div>
        </>
    );
};

export default HomePage;
