import { Get, Route, Tags } from "tsoa";

@Route("hello")
@Tags("Hello")
export class HelloController {
	@Get("/")
	public async getHello(): Promise<{ message: string }> {
		return { message: "Hello from ED COMET 🚀" };
	}
}
