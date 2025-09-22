import { Box, List } from "@mui/material";
import { MainBoxStyle, WrapperBoxStyle } from "./style";
import { useTranslation } from "react-i18next";

const DisplayBox = ({ text, items }: any) => {
	const { t } = useTranslation("common", { keyPrefix: "components" });
	return (
		<Box sx={WrapperBoxStyle}>
			<Box sx={MainBoxStyle}>
				{text}
				{items ? <div>{t("ongoing")}</div> : <div>{t("wip")}</div>}
			</Box>
			<List></List>
		</Box>
	);
};

export default DisplayBox;
