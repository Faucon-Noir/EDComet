import { EventEmitter } from "events";
import * as fs from "fs";
import { getLatestLogFile } from "../services/LogInterpreterService";

export class LogFileWatcher extends EventEmitter {
	private logFile: string | null = null;
	private stream: fs.ReadStream | null = null;

	constructor() {
		super();
		this.logFile = getLatestLogFile();
		if (this.logFile) {
			this.watch();
		}
	}

	private watch(): void {
		fs.watchFile(this.logFile!, { interval: 1000 }, (curr, prev): void => {
			if (curr.size > prev.size) {
				this.readNewLines(prev.size, curr.size);
			}
		});
	}

	private readNewLines(start: number, end: number): void {
		const stream = fs.createReadStream(this.logFile!, {
			start,
			end: end - 1,
			encoding: "utf8",
		});
		let buffer = "";
		stream.on("data", (chunk): void => {
			buffer += chunk;
		});
		stream.on("end", (): void => {
			const lines = buffer
				.split("\n")
				.filter((line): boolean => line.trim().length > 0);
			lines.forEach((line): void => {
				this.emit("line", line);
			});
		});
	}

	close(): void {
		fs.unwatchFile(this.logFile!);
		this.stream?.close();
	}
}
