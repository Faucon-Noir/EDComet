import { useTranslation } from "react-i18next";

const ContributionPage: React.FC = () => {
  const { t } = useTranslation("page", { keyPrefix: "contribute" });

  return (
    <>
      <h1>{t("title")}</h1>
      <div>{t("description")}</div>
    </>
  );
};

export default ContributionPage;
