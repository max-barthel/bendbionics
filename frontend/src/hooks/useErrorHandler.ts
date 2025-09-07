import { useState } from "react";

type ErrorType = "network" | "validation" | "server" | "unknown";

type ErrorState = {
    type: ErrorType;
    message: string;
    visible: boolean;
};

export const useErrorHandler = () => {
    const [error, setError] = useState<ErrorState>({
        type: "unknown",
        message: "",
        visible: false,
    });

    const showError = (type: ErrorType, message: string) => {
        setError({ type, message, visible: true });
        setTimeout(() => {
            setError((prev) => ({ ...prev, visible: false }));
        }, 5000);
    };

    const hideError = () => {
        setError((prev) => ({ ...prev, visible: false }));
    };

    return {
        error,
        showError,
        hideError,
    };
};
