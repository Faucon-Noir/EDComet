import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import AdminDisplayBox from "../../components/adminDisplayBox";

const AdminPage: React.FC = () => {
    const { t } = useTranslation("page", { keyPrefix: "admin.dashboard" });

    let display = ["markets", "ship", "systems"];

    return (
        <>
            <h1>{t("title")}</h1>
            <div>{t("description")}</div>
            <Box display="flex" justifyContent="center" mt={2}>
                {display.map((item) => (
                    <AdminDisplayBox key={item} text={t(item)} items={[]} />
                ))}
            </Box>
        </>
    );
};

export default AdminPage;
