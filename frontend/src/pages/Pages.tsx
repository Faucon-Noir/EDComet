import { Route, Routes } from "react-router-dom";
import HomePage from "./Home";
import Layout from "./Layout";
import { Construction, Contribute, Home, Ship, Test } from "./paths";
import TestPage from "./Test";
import ErrorComponent from "../components/error";
import ShipPage from "./Ship";
import ConstructionPage from "./Construction";
import ContributionPage from "./Contribution";

const Pages = () => {
  return (
    <Routes>
      <Route path="*" element={<ErrorComponent />} />

      <Route path={Home} element={<Layout />}>
        <Route path={Construction} element={<ConstructionPage />} />
        <Route path={Home} element={<HomePage />} />
        <Route path={Ship} element={<ShipPage />} />
        <Route path={Test} element={<TestPage />} />
        <Route path={Contribute} element={<ContributionPage />} />
      </Route>
    </Routes>
  );
};
export default Pages;
