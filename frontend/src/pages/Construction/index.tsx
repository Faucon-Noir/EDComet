import { useTranslation } from 'react-i18next';

const ConstructionPage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'construction' });

  return (
    <>
      <h1>{t('title')}</h1>
      <div>{t('description')}</div>
    </>
  );
};

export default ConstructionPage;
