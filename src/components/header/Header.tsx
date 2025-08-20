import { useTranslation } from "react-i18next";
import { HeaderStyle, NavStyle } from "./style";
import { navItem } from "../constant";
import { Box, Link } from "@mui/material";
import { Home } from "../../pages/paths";

export const Header: React.FC = () => {
	const { t } = useTranslation("common", { keyPrefix: "header" });
	return (
		<Box sx={HeaderStyle}>
			<h1>
				<Link href={Home}>ED COMET</Link>
			</h1>
			<Box sx={NavStyle}>
				{navItem.map((item, index: number) => (
					<h2 key={index} style={{ margin: "0 2.5%" }}>
						<Link href={item.link}>{t(item.name)}</Link>
					</h2>
				))}
			</Box>
		</Box>
	);
};
