import { Get, Route, Tags } from "tsoa";
import { getLanguage } from "../utils/utils";

@Route("hello")
@Tags("Hello")
export class HelloController {
	@Get("/")
	public async getHello(): Promise<{
		message: string;
		lang: string;
	}> {
		console.log("getHello");
		const lang: string = getLanguage();

		return {
			message: "Hello from ED COMET 🚀",
			lang: lang,
		};
	}
}
