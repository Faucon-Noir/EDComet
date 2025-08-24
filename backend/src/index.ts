import express from "express";
import cors from "cors";
import path from "path";
import { useExpressServer } from "routing-controllers";
import { getLatestLogFile } from "./services/LogInterpreterService";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

// Auto generated tsoa files
import { RegisterRoutes } from "./routes";
import swaggerDocument from "./swagger.json";

dotenv.config();
const PORT: number = parseInt(process.env.PORT || "8000");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

RegisterRoutes(app);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

try {
	const logsAvailable = getLatestLogFile();
	if (logsAvailable != null) console.info("Logs found !");
} catch (error) {
	console.log("No logs available", error);
}

try {
	if (swaggerDocument != null) console.info("swagger file found !");
} catch (error) {
	console.log("No logs available", error);
}

const controllerPath = path.resolve("src", "controller", "*.ts");

useExpressServer(app, {
	defaultErrorHandler: true,
	routePrefix: "/api",
	controllers: [controllerPath],
});

const server = app.listen(PORT, "0.0.0.0", () => {
	return (
		console.log(`Express is listening at ${process.env.CLIENT_URL}`),
		console.log(
			`Swagger is listening at ${process.env.CLIENT_URL}/api-docs`
		)
	);
});

export { app };
export default server;
