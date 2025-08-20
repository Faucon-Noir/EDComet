import { createTheme } from "@mui/material/styles";
const theme = createTheme({
	palette: {
		background: {
			default: "radial-gradient(#021027, #000000)",
		},
		text: {
			primary: "#FFFFFFDE",
			secondary: "#FFFFFFDE",
			disabled: "#FFFFFFDE",
		},
		primary: {
			main: "#021027",
		},
		secondary: {
			main: "#000000",
		},
	},
	typography: {
		fontFamily: "SansationLight, sans-serif",
		h1: {
			fontSize: "2.5rem",
			lineHeight: 1.1,
		},
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				a: {
					color: "#FFFFFFDE !important",
					textDecoration: "none !important",
				},
				":root": {
					lineHeight: 1.5,
					fontWeight: 400,
					colorScheme: "light dark",
					fontSynthesis: "none",
					textRendering: "optimizeLegibility",
					WebkitFontSmoothing: "antialiased",
					MozOsxFontSmoothing: "grayscale",
					background: "radial-gradient(#021027, #000000)",
				},
				body: {
					margin: 0,
					display: "flex",
					placeItems: "center",
					minWidth: "400px",
					minHeight: "100vh",
					fontFamily: "'SansationLight', sans-serif !important",
				},
				input: {
					border: "1px solid #fff",
					borderRadius: "15px",
					margin: "5px",
					height: "30px",
					padding: "10px",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: "8px",
					textTransform: "none",
					padding: "8px 16px",
				},
				contained: {
					color: "#FFFFFF",
					borderColor: "#FFFFFF",
					"&:hover": {},
				},
				outlined: {
					color: "#FFFFFF",
					borderColor: "#FFFFFF",
					"&:hover": {},
				},
			},
		},
	},
});

export default theme;
