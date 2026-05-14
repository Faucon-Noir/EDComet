import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { ShipLoadout } from '../../api';
import { useJournalStream } from '../../utils/stream';
import { shipApi } from '../../utils/api';

const ShipPage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'ship' });
  const { lastEvent } = useJournalStream();
  const [loadout, setLoadout] = useState<ShipLoadout | null>(null);

  useEffect(() => {
    shipApi.getShipLoadout().then((res) => {
      setLoadout(res.data);
    });
  }, []);

  useEffect(() => {
    const hasLoadoutEvent = lastEvent?.events.some(e => e === 'Loadout');
    const hasJournalSwitch = lastEvent?.files?.some(file => file.type === 'journal-switched');

    if (!hasLoadoutEvent && !hasJournalSwitch) {
      return;
    }

    shipApi.getShipLoadout().then((res) => {
      setLoadout(res.data);
    });
  }, [shipApi, lastEvent]);

  return (
    <>
      <h1>{t('title')}</h1>
      <div>{t('description')}</div>
      {loadout == null ? (
        <p>{t('emptyState')}</p>
      ) : (
        <Box sx={{ mt: 2 }}>
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
