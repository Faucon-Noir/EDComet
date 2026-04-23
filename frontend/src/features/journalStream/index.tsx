import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	type PropsWithChildren,
} from "react";

export type JournalEventType =
	| "Loadout"
	| "ColonisationConstructionDepot"
	| "Fileheader";

export type JournalStreamStatus =
	| "connecting"
	| "connected"
	| "disconnected";

export interface JournalStreamEvent {
	id: string;
	event: JournalEventType;
	timestamp: string;
}

interface JournalStreamContextValue {
	status: JournalStreamStatus;
	lastEvent: JournalStreamEvent | null;
}

const JournalStreamContext =
	createContext<JournalStreamContextValue | null>(null);

const supportedEventTypes: JournalEventType[] = [
	"Loadout",
	"ColonisationConstructionDepot",
	"Fileheader",
];

function buildJournalStreamUrl(): string {
	const env = import.meta.env as ImportMetaEnv & {
		readonly VITE_API_BASE_URL?: string;
	};
	const baseUrl = env.VITE_API_BASE_URL?.trim();

	if (!baseUrl) {
		return "/journal/stream";
	}

	return `${baseUrl.replace(/\/+$/, "")}/journal/stream`;
}

export function JournalStreamProvider({
	children,
}: PropsWithChildren): JSX.Element {
	const [status, setStatus] = useState<JournalStreamStatus>("connecting");
	const [lastEvent, setLastEvent] = useState<JournalStreamEvent | null>(null);
	const lastEventIdRef = useRef<string | null>(null);

	useEffect(() => {
		const eventSource = new EventSource(buildJournalStreamUrl());

		eventSource.onopen = () => {
			setStatus("connected");
		};

		eventSource.onerror = () => {
			setStatus("disconnected");
		};

		const handleMessage = (message: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(message.data) as Partial<JournalStreamEvent>;
				const eventId = payload.id ?? message.lastEventId;

				if (!eventId || lastEventIdRef.current === eventId) {
					return;
				}

				if (
					payload.event !== "Loadout" &&
					payload.event !== "ColonisationConstructionDepot" &&
					payload.event !== "Fileheader"
				) {
					return;
				}

				lastEventIdRef.current = eventId;
				setLastEvent({
					id: eventId,
					event: payload.event,
					timestamp:
						typeof payload.timestamp === "string"
							? payload.timestamp
							: new Date().toISOString(),
				});
				setStatus("connected");
			} catch (error) {
				console.warn("Invalid SSE payload", error);
			}
		};

		for (const eventType of supportedEventTypes) {
			eventSource.addEventListener(eventType, handleMessage as EventListener);
		}

		return () => {
			for (const eventType of supportedEventTypes) {
				eventSource.removeEventListener(
					eventType,
					handleMessage as EventListener
				);
			}
			eventSource.close();
		};
	}, []);

	return (
		<JournalStreamContext.Provider value={{ status, lastEvent }}>
			{children}
		</JournalStreamContext.Provider>
	);
}

export function useJournalStream(): JournalStreamContextValue {
	const context = useContext(JournalStreamContext);

	if (context == null) {
		throw new Error("useJournalStream must be used within JournalStreamProvider");
	}

	return context;
}