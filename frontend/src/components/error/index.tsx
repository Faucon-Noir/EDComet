import { Component, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { isRouteErrorResponse } from "react-router-dom";

const statusMessages: Record<number, string> = {
    400: "Bad request",
    401: "Authentication required",
    403: "Access denied",
    404: "Page not found",
    405: "Method not allowed",
    408: "Request timeout",
    409: "Conflict",
    410: "Resource no longer available",
    422: "Unprocessable content",
    429: "Too many requests",
    500: "Internal server error",
    502: "Bad gateway",
    503: "Service unavailable",
    504: "Gateway timeout",
};

const getMessage = (data: unknown): string | undefined => {
    if (typeof data === "string" && data.trim()) {
        return data;
    }
    if (typeof data === "object" && data !== null && "message" in data) {
        return getMessage(data.message);
    }
    return undefined;
};

const ErrorComponent = ({ error }: { error?: unknown }) => {
    let status = error === undefined ? 404 : 500;
    let message: string | undefined;
    let statusText: string | undefined;

    if (isAxiosError<unknown>(error)) {
        status = error.response?.status ?? 500;
        message = getMessage(error.response?.data);
        statusText = error.response?.statusText;
    } else if (isRouteErrorResponse(error)) {
        status = error.status;
        message = getMessage(error.data);
        statusText = error.statusText;
    } else if (error instanceof Response) {
        status = error.status;
        statusText = error.statusText;
    } else if (typeof error === "object" && error !== null) {
        if ("status" in error && typeof error.status === "number") {
            status = error.status;
        }
        message = getMessage(error);
    } else {
        message = getMessage(error);
    }

    return (
        <div role="alert">
            <h1>{status}</h1>
            <p>{message ?? statusMessages[status] ?? (statusText || "An unexpected error occurred")}</p>
        </div>
    )
}

export class ErrorBoundary extends Component<
    { children: ReactNode },
    { error: unknown; hasError: boolean }
> {
    state = { error: undefined, hasError: false };

    static getDerivedStateFromError(error: unknown) {
        return { error, hasError: true };
    }

    render() {
        return this.state.hasError
            ? <ErrorComponent error={this.state.error} />
            : this.props.children;
    }
}

export default ErrorComponent