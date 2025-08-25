import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import DisplayBox from '../../components/displayBox';
import { display } from '../../components/constant';
import { useEffect } from 'react';
import {
  Configuration,
  ShipApi
} from '../../api/index';



const HomePage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'home' });
  const configuration = new Configuration();
  const shipInstance = new ShipApi(configuration);


  useEffect(() => {
    shipInstance.getShipLoadout().then(res => console.log('ship', res.data));
  }, []);

  return (
    <>
      <h1>{t('title')}</h1>
      <div>{t('description')}</div>
      <Box display="flex" justifyContent="center" mt={2}>
        {display.map((item) => (
          <DisplayBox key={item} text={t(item)} items={[]} />
        ))}
      </Box>
    </>
  );
};

export default HomePage;
