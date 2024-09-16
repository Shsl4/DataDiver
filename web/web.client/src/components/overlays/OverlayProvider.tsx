import { ContentOverlay, OverlayContext } from "./ContentOverlay.tsx";
import { NotificationOverlay } from "./NotificationOverlay.tsx";
import { JSX, ReactNode, useRef } from "react";

interface OverlayProviderProps {
    children?: ReactNode | ReactNode[];
}

function OverlayProvider({ children }: OverlayProviderProps): JSX.Element {
    // @ts-ignore
    const contentOverlay = useRef<ContentOverlay>(null!);
    // @ts-ignore
    const notificationOverlay = useRef<NotificationOverlay>(null!);

    return (
        <OverlayContext.Provider value={{ content: contentOverlay, notification: notificationOverlay }}>
            <ContentOverlay ref={contentOverlay} />
            <NotificationOverlay ref={notificationOverlay} />
            {children}
        </OverlayContext.Provider>
    );
}

export default OverlayProvider;
