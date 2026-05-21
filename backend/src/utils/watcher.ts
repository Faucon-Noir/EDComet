import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import { getLatestLogFile } from "../services/LogInterpreterService";
import { getLogsPath } from "./utils";

export type WatchedSupportFile = "Market.json";

export interface WatchedFileChange {
	type: "journal-switched" | "support-file";
	fileName: string;
	filePath: string;
	change: "created" | "updated";
}

export class LogFileWatcher extends EventEmitter {
	private logFile: string | null = null;
	private logsPath: string | null = null;
	private lastJournalSize = 0;
	private supportFiles = new Map<string, number>();
	private readonly supportedFiles: WatchedSupportFile[] = ["Market.json"];
	private pollTimer: NodeJS.Timeout | null = null;

	constructor() {
		super();
		this.logsPath = getLogsPath();
		this.logFile = getLatestLogFile();
		if (this.logsPath && this.logFile) {
			this.lastJournalSize = fs.statSync(this.logFile).size;
			this.primeSupportFiles();
			this.watch();
		}
	}

	private watch(): void {
		this.pollTimer = setInterval(() => {
			this.pollJournal();
			this.pollSupportFiles();
		}, 1000);
	}

	private pollJournal(): void {
		const latestLogFile = getLatestLogFile();

		if (!latestLogFile) {
			return;
		}

		if (this.logFile !== latestLogFile) {
			this.logFile = latestLogFile;
			console.info("📁 Journal switched:", path.basename(latestLogFile));
			this.lastJournalSize = 0;
			this.emit("file-change", {
				type: "journal-switched",
				fileName: path.basename(latestLogFile),
				filePath: latestLogFile,
				change: "created",
			} satisfies WatchedFileChange);
			try {
				const nextSize = fs.statSync(latestLogFile).size;
				this.readNewLines(0, nextSize);
				this.lastJournalSize = nextSize;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				console.warn("🚧 Unable to read switched journal:", message);
			}
			return;
		}

		let stats: fs.Stats;
		try {
			stats = fs.statSync(latestLogFile);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn("🚧 Unable to stat journal:", message);
			return;
		}

		const previousSize = this.lastJournalSize;

		if (stats.size > previousSize) {
			this.readNewLines(previousSize, stats.size);
		}

		this.lastJournalSize = stats.size;
	}

	private primeSupportFiles(): void {
		for (const fileName of this.supportedFiles) {
			const filePath = path.join(this.logsPath!, fileName);
			if (!fs.existsSync(filePath)) {
				continue;
			}

			this.supportFiles.set(fileName, fs.statSync(filePath).mtimeMs);
		}
	}

	private pollSupportFiles(): void {
		for (const fileName of this.supportedFiles) {
			const filePath = path.join(this.logsPath!, fileName);
			if (!fs.existsSync(filePath)) {
				continue;
			}

			const stats = fs.statSync(filePath);
			const previousMtime = this.supportFiles.get(fileName);

			if (previousMtime == null) {
				this.supportFiles.set(fileName, stats.mtimeMs);
				this.emitSupportFileChange(fileName, filePath, "created");
				continue;
			}

			if (stats.mtimeMs > previousMtime) {
				this.supportFiles.set(fileName, stats.mtimeMs);
				this.emitSupportFileChange(fileName, filePath, "updated");
			}
		}
	}

	private emitSupportFileChange(
		fileName: WatchedSupportFile,
		filePath: string,
		change: "created" | "updated"
	): void {
		this.emit("file-change", {
			type: "support-file",
			fileName,
			filePath,
			change,
		} satisfies WatchedFileChange);
	}

	private readNewLines(start: number, end: number): void {
		if (!this.logFile || end <= start || end <= 0) {
			return;
		}

		const stream = fs.createReadStream(this.logFile!, {
			start,
			end: end - 1,
			encoding: "utf8",
		});
		let buffer = "";
		stream.on("error", (error: Error): void => {
			console.warn("🚧 Journal stream read error:", error.message);
		});
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
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
		}
	}
}
