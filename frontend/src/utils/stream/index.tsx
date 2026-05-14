import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	type PropsWithChildren,
} from "react";
import { EventEnum } from "ed-shared";
import { JournalStreamContextValue, JournalStreamEvent, JournalStreamStatus } from "./type";

const JournalStreamContext =
	createContext<JournalStreamContextValue | null>(null);

const supportedEventTypes: EventEnum[] = [
	EventEnum.Loadout,
	EventEnum.ColonisationConstructionDepot,
	EventEnum.FileHeader,
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
				// console.debug("📡 Received SSE message", payload);
				const eventId = payload.id ?? message.lastEventId;

				if (!eventId || lastEventIdRef.current === eventId) {
					return;
				}

				// Filter for supported event types
				const validEvents = (payload.events ?? []).filter(
					(event): event is EventEnum =>
						supportedEventTypes.includes(event as EventEnum)
				);

				if (validEvents.length === 0) {
					return;
				}

				lastEventIdRef.current = eventId;
				setLastEvent({
					id: eventId,
					events: validEvents,
					files: Array.isArray(payload.files) ? payload.files : [],
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

		eventSource.addEventListener("journal-update", handleMessage as EventListener);

		return () => {
			eventSource.removeEventListener(
				"journal-update",
				handleMessage as EventListener
			);
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