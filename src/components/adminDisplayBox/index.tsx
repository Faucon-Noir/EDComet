import { Box, List } from "@mui/material";
import { MainBoxStyle, WrapperBoxStyle } from "./style";

const AdminDisplayBox = ({ text, items }: any) => {
	return (
		<Box sx={WrapperBoxStyle}>
			<Box sx={MainBoxStyle}>
				{text}
				{items ? (
					<div>Nothing to Display</div>
				) : (
					<div>Something to Display</div>
				)}
			</Box>
			<List></List>
		</Box>
	);
};

export default AdminDisplayBox;
