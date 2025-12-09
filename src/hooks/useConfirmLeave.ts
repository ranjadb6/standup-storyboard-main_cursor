import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Hook to prompt the user for confirmation before leaving the page.
 * Handles both client-side navigation (via react-router) and browser refresh/close.
 *
 * @param shouldBlock - Boolean to determine if navigation should be blocked. Defaults to true.
 * @param message - Message to display in the confirmation dialog.
 */
export const useConfirmLeave = (
    shouldBlock: boolean = true,
    message: string = "Are you sure you want to leave? Changes you made may not be saved."
) => {
    // Handle browser refresh/close
    useEffect(() => {
        if (!shouldBlock) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ""; // Required for Chrome to show the dialog
            return "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [shouldBlock]);

    // Handle client-side navigation (back/forward/internal links)
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            shouldBlock && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            // Use a small timeout to ensure the UI doesn't freeze immediately
            setTimeout(() => {
                const proceed = window.confirm(message);
                if (proceed) {
                    blocker.proceed();
                } else {
                    blocker.reset();
                }
            }, 0);
        }
    }, [blocker, message]);
};
