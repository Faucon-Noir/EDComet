import { Delete, Get, Patch, Post, Put, Route, Tags } from "tsoa";
import { getLanguage } from "../utils/utils";
import { getLatestCommander } from "../services/LogInterpreterService";
import { CommanderType } from "ed-shared";

@Route("hello")
@Tags("Hello")
export class HelloController {
	@Get("/")
	public async getHello(): Promise<{
		message: string;
		lang: string;
	}> {
		const lang: string = getLanguage();

		return {
			message: "Hello from ED COMET 🚀",
			lang: lang,
		};
	}

	@Get("/lang")
	public async getLanguage() {
		return getLanguage();
	}

	@Get("/me")
	public async getMeInfo(): Promise<CommanderType | null> {
		return getLatestCommander();
	}

	@Post("/")
	public async postHello() {
		console.log("post");
	}
	@Put("/")
	public async putHello() {
		console.log("put");
	}
	@Patch("/")
	public async patchHello() {
		console.log("patch");
	}
	@Delete("/")
	public async delHello() {
		console.log("delete");
	}
}
