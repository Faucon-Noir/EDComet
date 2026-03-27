import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Configuration } from '../../api/configuration';
import { ColonisationConstructionDepot, ColonisationConstructionDepotResource, ColonisationStats, ConstructionApi, HelloApi } from '../../api';
import LinearProgressWithLabel from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import { MainBoxStyle, WrapperBoxStyle } from './style';

const ConstructionPage: React.FC = () => {
  const { t } = useTranslation("page", { keyPrefix: "construction" });
  const configuration = new Configuration();
  const apiInstance = new ConstructionApi(configuration);
  const helloApi = new HelloApi(configuration);

  const [checked, setChecked] = useState<string[]>([]);
  const [lang, setLang] = useState<string>("");
  const [stats, setStats] = useState<ColonisationStats>();
  const [data, setData] = useState<ColonisationConstructionDepot>({
    timestamp: "",
    event: "ColonisationConstructionDepot",
    MarketID: 0,
    ConstructionProgress: 0,
    ConstructionComplete: false,
    ConstructionFailed: false,
    ResourcesRequired: [],
  });

  const progress: number = Number((data.ConstructionProgress * 100).toFixed(1));

  useEffect(() => {
    helloApi.getLanguage().then((res) => {
      setLang(res.data);
      console.log("Language set to", res.data);
    });
    apiInstance.getLatestSite().then((res) => {
      setData(res.data);
    });
    apiInstance.getLatestSiteStats().then((res) => {
      setStats(res.data);
    });
  }, []);

  // TODO: Voir si on peut simplifier vu que le traitement est le même
  const estimatedPayment =
    stats && typeof stats.estimatedPayment === "number"
      ? stats.estimatedPayment.toLocaleString(lang)
      : "N/A";
  const totalUnitsRequired =
    stats && typeof stats.totalUnitsRequired === "number"
      ? stats.totalUnitsRequired.toLocaleString(lang)
      : "N/A";
  const travels =
    stats && typeof stats.travels === "number"
      ? stats.travels.toLocaleString(lang)
      : "N/A";
  const remainingTravels =
    stats && typeof stats.remainingTravels === "number"
      ? stats.remainingTravels.toLocaleString(lang)
      : "N/A";

  const statsList = [
    { label: "stats.estimatedPayment", value: estimatedPayment },
    { label: "stats.resourcesRequired", value: totalUnitsRequired },
    { label: "stats.travelsRequired", value: travels },
    { label: "stats.remainingTravels", value: remainingTravels },
  ];

  const handleToggle = (name: string) => () => {
    const currentIndex = checked.indexOf(name);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(name);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <>
      <h1>{t("title")}</h1>
      <div>{t("description")}</div>
      <Box sx={{ width: "50%", justifySelf: "center", marginTop: "20px" }}>
        {progress}%
        <LinearProgressWithLabel
          color="info"
          variant="determinate"
          value={progress}
        />
      </Box>
      <Box>
        {statsList.map((stat, index) => (
          <span key={stat.label}>
            {t(stat.label)} {stat.value}
            {index < statsList.length - 1 && " | "}
          </span>
        ))}
      </Box>
      <Box>
        <List>
          {[...(data.ResourcesRequired ?? [])]
            .sort((a, b) => {
              // Les ressources complétées (diff == 0) vont en bas
              const diffA = a.RequiredAmount - a.ProvidedAmount;
              const diffB = b.RequiredAmount - b.ProvidedAmount;
              if (diffA === 0 && diffB !== 0) return 1;
              if (diffA !== 0 && diffB === 0) return -1;
              return 0;
            })
            .map((ressource: ColonisationConstructionDepotResource) => {
              const labelId = `ressource-${ressource.Name}`;
              const diff = ressource.RequiredAmount - ressource.ProvidedAmount;
              const isChecked =
                diff === 0 || checked.indexOf(ressource.Name) !== -1;
              return (
                <ListItem key={ressource.Name} dense disablePadding>
                  <ListItemButton
                    onClick={handleToggle(ressource.Name)}
                    disabled={diff === 0}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={isChecked}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={labelId}
                      primary={`${ressource.Name_Localised} (${diff})`}
                      sx={
                        isChecked
                          ? {
                              textDecoration: "line-through",
                              color: "grey.500",
                            }
                          : {}
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
        </List>
      </Box>
    </>
  );
};

export default ConstructionPage;
