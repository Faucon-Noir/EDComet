import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Configuration, ShipApi, ShipLoadout } from '../../api';
import { useJournalStream } from '../../features/journalStream';

const ShipPage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'ship' });
  const { lastEvent } = useJournalStream();
  const configuration = new Configuration();
  const apiInstance = new ShipApi(configuration);
  const [loadout, setLoadout] = useState<ShipLoadout | null>(null);

  useEffect(() => {
    apiInstance.getShipLoadout().then((res) => {
      setLoadout(res.data);
    });
  }, []);

  useEffect(() => {
    if (!lastEvent?.events.some(e => e === 'Loadout')) {
      return;
    }

    apiInstance.getShipLoadout().then((res) => {
      setLoadout(res.data);
    });
  }, [apiInstance, lastEvent]);

  return (
    <>
      <h1>{t('title')}</h1>
      <div>{t('description')}</div>
      {loadout == null ? (
        <p>{t('emptyState')}</p>
      ) : (
        <Box mt={2}>
          <p>{t('summary.name')}: {loadout.ShipName || loadout.Ship}</p>
          <p>{t('summary.identifier')}: {loadout.ShipIdent || 'N/A'}</p>
          <p>{t('summary.cargoCapacity')}: {loadout.CargoCapacity}</p>
          <p>{t('summary.jumpRange')}: {loadout.MaxJumpRange}</p>
        </Box>
      )}
    </>
  );
};

export default ShipPage;
