import { Delete, Get, Patch, Post, Put, Route, Tags } from "tsoa";
import { getLanguage } from "../utils/utils";

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
