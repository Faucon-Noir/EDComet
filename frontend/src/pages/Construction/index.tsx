import { useTranslation } from 'react-i18next';
import LinearProgressWithLabel from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useConstructionPage } from './hook';
import {
  categoryGroupBoxSx,
  categoryTitleSx,
  checkedResourceTextSx,
  progressBoxSx,
  sectionHeaderBoxSx,
  sectionTitleSx,
} from './style';

const ConstructionPage: React.FC = () => {
  const { t } = useTranslation('page', { keyPrefix: 'construction' });
  const {
    categorizedResources,
    formatResourceLabel,
    handleToggle,
    isResourceChecked,
    progress,
    statsList,
  } = useConstructionPage();

  return (
    <>
      <h1>{t("title")}</h1>
      <div>{t("description")}</div>
      <Box sx={progressBoxSx}>
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
            {index < statsList.length - 1 && ' | '}
          </span>
        ))}
      </Box>
      <Box sx={sectionHeaderBoxSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Resources by category
        </Typography>
      </Box>
      <Box>
        {categorizedResources.map((group) => (
          <Box key={group.key} sx={categoryGroupBoxSx}>
            <Typography variant="subtitle1" sx={categoryTitleSx}>
              {group.label}
            </Typography>
            <List>
              {group.resources.map((resource) => {
                const labelId = `ressource-${resource.Name}`;
                const diff = resource.RequiredAmount - resource.ProvidedAmount;
                const isChecked = isResourceChecked(resource);
                return (
                  <ListItem key={resource.Name} dense disablePadding>
                    <ListItemButton
                      onClick={handleToggle(resource.Name)}
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
                        primary={`${formatResourceLabel(resource)} (${diff})`}
                        sx={isChecked ? checkedResourceTextSx : undefined}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default ConstructionPage;
