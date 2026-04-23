import { useTranslation } from "react-i18next";
import { HeaderStyle, NavStyle } from "./style";
import { navItem } from "../constant";
import { Box, Link } from "@mui/material";
import { Home } from "../../pages/paths";
import { useJournalStream } from "../../features/journalStream";

export const Header: React.FC = () => {
	const { t } = useTranslation("common", { keyPrefix: "header" });
	const { status } = useJournalStream();
	return (
		<Box sx={HeaderStyle}>
			<h1>
				<Link href={Home}>ED COMET</Link>
			</h1>
			<Box>{t(`sse.${status}`)}</Box>
			<Box sx={NavStyle}>
				{navItem.map((item, index: number) => (
					<h2 key={index} style={{ margin: "0 2.5%" }}>
						<Link href={item.link}>{t(item.nav)}</Link>
					</h2>
				))}
			</Box>
		</Box>
	);
};
