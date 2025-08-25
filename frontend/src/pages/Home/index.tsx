import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import DisplayBox from '../../components/displayBox';
import { display } from '../../components/constant';

const HomePage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'home' });

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
