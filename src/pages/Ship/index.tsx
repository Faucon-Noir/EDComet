import { useTranslation } from 'react-i18next';

const ShipPage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'ship' });

  return (
    <>
      <h1>{t('title')}</h1>
      <div>{t('description')}</div>
    </>
  );
};

export default ShipPage;
