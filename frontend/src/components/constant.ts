import { Construction, Home, Mission, Ship, Test } from "../pages/paths";
import { NavItemType } from "./type";

export const navItem: NavItemType[] = [
  { nav: "home", link: Home },
  { nav: "construction", link: Construction },
  { nav: "ship", link: Ship },
  { nav: "mission", link: Mission },
];

export const lang = [
  { lang: "FR", link: "fr" },
  { lang: "EN", link: "en" },
];