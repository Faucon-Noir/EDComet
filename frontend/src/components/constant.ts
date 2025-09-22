import { Construction, Contribute, Home, Ship, Test } from "../pages/paths";
import { NavItemType } from "./type";

export const navItem: NavItemType[]= [
	{ nav: "home", link: Home },
	{ nav: "construction", link: Construction },
	{ nav: "ship", link: Ship },
	{ nav: "contribute", link: Contribute },
	{ nav: "test", link: Test },
];

export const lang = [
	{ lang: "FR", link: "fr" },
	{ lang: "EN", link: "en" },
];

export const display = ["construction", "ship", "systems"];
