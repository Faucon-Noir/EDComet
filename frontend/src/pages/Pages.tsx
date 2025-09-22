import { Route, Routes } from "react-router-dom";
import HomePage from "./Home";
import Layout from "./Layout";
import { Construction, Contribute, Home, Ship, Test } from "./paths";
import TestPage from "./Test";
import ErrorComponent from "../components/error";
import ShipPage from "./Ship";
import ConstructionPage from "./Construction";
import ContributePage from "./Contribute";

const Pages = () => {
  return (
    <Routes>
      <Route path="*" element={<ErrorComponent />} />

      <Route path={Home} element={<Layout />}>
        <Route path={Construction} element={<ConstructionPage />} />
        <Route path={Home} element={<HomePage />} />
        <Route path={Ship} element={<ShipPage />} />
        <Route path={Contribute} element={<ContributePage />} />
        <Route path={Test} element={<TestPage />} />
      </Route>
    </Routes>
  );
};
export default Pages;
