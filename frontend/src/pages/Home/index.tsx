import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { helloApi } from "../../utils/api";
import { CommanderType } from "../../api/api";

const HomePage: React.FC = () => {
  const { t } = useTranslation("page", { keyPrefix: "home" });
  const [cmdr, setCmdr] = useState<CommanderType | null>(null);

  useEffect(() => {
    helloApi
      .getMeInfo()
      .then((res) => {
        setCmdr(res.data);
      })
      .catch((err) => {
        console.error("API error:", err);
      });
    document.title = t("title");
  }, []);

  return (
    <>
      <h1>{t("title")}</h1>
      <div>{t("description")}</div>
      <Box>
        {cmdr ? (
          <div>
            <h2>{t("welcome", { name: cmdr.Name })}</h2>
            <p>{t("cmdrInfo", { name: cmdr.Name, id: cmdr.FID })}</p>
          </div>
        ) : (
          <></>
        )}
      </Box>
    </>
  );
};

export default HomePage;
