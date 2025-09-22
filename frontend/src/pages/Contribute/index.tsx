import Box from "@mui/material/Box";
import { useTranslation } from "react-i18next";
import DisplayBox from "../../components/displayBox";

const ContributePage: React.FC = () => {
  const { t } = useTranslation("page", { keyPrefix: "contribute" });

  return (
    <>
      <h1>{t("title")}</h1>
      <div>{t("description")}</div>
      <Box display="flex" justifyContent="center" mt={2}>
        <DisplayBox
          text={t("translate.title")}
          items={[t("translate.text"), t("translate.linkText")]}
        />
      </Box>
    </>
  );
};

export default ContributePage;
