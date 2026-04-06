import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const apiUrl: string = process.env.API_URL || '';
const apiPrefix: string = process.env.API_PREFIX||'';

const tsoaConfig = {
	entryFile: "src/index.ts",
	noImplicitAdditionalProperties: "throw-on-extras",
	controllerPathGlobs: ["src/controllers/*Controller.ts"],
	spec: {
		outputDirectory: "src/",
		specVersion: 3,
		title: "EDComet API",
		version: "0.1.1",
		description: "EDComet API specification",
		basePath: apiPrefix,
		host: apiUrl,
		schemes: ["http"],
	},
	routes: {
		routesDir: "src/",
		basePath: apiPrefix,
	},
};

const tsoaJsonPath = path.resolve("./tsoa.json");
fs.writeFileSync(tsoaJsonPath, JSON.stringify(tsoaConfig, null, 2));
console.log(`✅ tsoa.json updated`);

export default tsoaConfig;
