import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

// Auto generated tsoa files
import { RegisterRoutes } from "./routes";
import swaggerDocument from "./swagger.json";
import { getLatestLogFile } from "./services/LogInterpreterService";
import { journalSseService } from "./services/SseService";

dotenv.config();
const PORT: number = parseInt(process.env.PORT ||'0');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/journal/stream", (req, res): void => {
	const closeStream = journalSseService.subscribe(res);
	req.on("close", closeStream);
});

RegisterRoutes(app);

// Swagger UI
const customCss = fs.readFileSync(
	path.join(process.cwd(), "src/theme/swagger-dark.css"),
	"utf8"
);

app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerDocument, { customCss })
);

try {
	const logsAvailable = getLatestLogFile();
	if (logsAvailable != null) console.info("✅ Logs found !");
} catch (error: Error | any) {
	console.log("❌ No logs available", error.message);
}

try {
	if (swaggerDocument != null) console.info("✅ swagger file found !");
} catch (error: Error | any) {
	console.log("❌ No logs available", error.message);
}

const server = app.listen(PORT, (): void => {
	return (
		console.log(`👀 Express is listening at ${process.env.CLIENT_URL}`),
		console.log(
			`👀 Swagger is listening at ${process.env.CLIENT_URL}/api-docs`
		)
	);
});

export { app };
export default server;
