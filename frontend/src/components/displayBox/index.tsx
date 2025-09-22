import { Box, List, ListItem } from "@mui/material";
import { MainBoxStyle, WrapperBoxStyle } from "./style";
import { useTranslation } from "react-i18next";

const DisplayBox = ({ text, items }: { text: string; items?: string[] }) => {
  // const { t} = useTranslation("common", { keyPrefix: "components" });
  const { t } = useTranslation("page", { keyPrefix: "contribute" });
  return (
    <Box sx={WrapperBoxStyle}>
      <Box sx={MainBoxStyle}>
        {text}
        {items && items.length > 0 ? (
          <List>
            {items.map((elm, index) => (
              <ListItem key={index}>{elm}</ListItem>
            ))}
            <a
              href="https://crowdin.com/project/ed-comet"
              target="_blank"
              rel="noreferrer"
            >
              {t("translate.linkText")}
            </a>
          </List>
        ) : (
          <div>{t("wip")}</div>
        )}
      </Box>
    </Box>
  );
};

export default DisplayBox;
