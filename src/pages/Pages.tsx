import { Route, Routes } from "react-router-dom";

import HomePage from "./Home";
import Layout from "./Layout";
import {
	Admin,
	Home,
	Test,
} from "./paths";
import TestPage from "./Test";
import ErrorComponent from "../components/error";
import AdminPage from "./Admin";

const Pages = () => {
	return (
		<Routes>
			<Route path="*" element={<ErrorComponent />} />

			<Route path={Home} element={<Layout />}>
				<Route path={Home} element={<HomePage />} />
				<Route path={Test} element={<TestPage />} />
				<Route path={Admin} element={<AdminPage />} />
			</Route>
		</Routes>
	);
};
export default Pages;
