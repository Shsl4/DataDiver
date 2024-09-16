import React, {
    MutableRefObject,
    useContext,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
    ReactElement
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faCircleInfo, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import { usePopFadeIn, usePopFadeOut } from "animations/FadeAnimations.ts";
import useDelay from "hooks/useDelay.ts";
import useAnimation from "hooks/useAnimation.ts";
import { HStack, VStack } from "components/core/Stack";
import { OverlayContext, OverlayContextType, OverlayObject } from "./ContentOverlay.tsx";
import { NetResponse } from "utilities/ApiManager.ts";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { NotificationDetail } from "components/NotificationDetail.tsx";
import useArrayState from "hooks/useArrayState.ts";
import { ThemeManager } from "utilities/ThemeManager.ts";
import "styles/components/notification.scss";

enum NotificationType {
    Info,
    Success,
    Warning,
    Error
}

namespace NotificationType {
    export function icon(type: NotificationType): IconDefinition {
        switch (type) {
            case NotificationType.Info:
                return faCircleInfo;
            case NotificationType.Success:
                return faCircleCheck;
            case NotificationType.Warning:
                return faCircleExclamation;
            case NotificationType.Error:
                return faCircleXmark;
        }
    }
    export function name(type: NotificationType): string {
        switch (type) {
            case NotificationType.Info:
                return "Info";
            case NotificationType.Success:
                return "Success";
            case NotificationType.Warning:
                return "Warning";
            case NotificationType.Error:
                return "Error";
        }
    }

    export function color(type: NotificationType): string {
        switch (type) {
            case NotificationType.Info:
                return "var(--system-blue-400)";
            case NotificationType.Success:
                if (ThemeManager.currentTheme.name == "dark") {
                    return "var(--system-green-300)";
                } else {
                    return "var(--system-green-400)";
                }
            case NotificationType.Warning:
                return "var(--system-yellow-300)";
            case NotificationType.Error:
                return "var(--system-red-400)";
        }
    }
}

interface NotificationData {
    title: string;
    contents?: string;
    type: NotificationType;
    status?: number;
    duration: number;
}

interface NotificationProps extends OverlayObject {
    data: NotificationData;
}

async function useShrink<T extends HTMLElement>(element: MutableRefObject<T>, animDuration: number) {
    if (!element.current) return;

    const height = element.current.getBoundingClientRect().height;

    const animation = element.current.animate(
        [
            { maxHeight: `${height}px`, overflow: "hidden", marginTop: "0" },
            { maxHeight: "0", overflow: "hidden", padding: 0, marginTop: "-8px" }
        ],
        {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        }
    );

    await useAnimation(animation);
}

function Notification({ data, overlayId }: NotificationProps) {
    const context = useContext(OverlayContext);
    const root = useRef<HTMLDivElement>(null!);
    const color = NotificationType.color(data.type);
    let cancelDelay: () => void;

    function showDetail() {
        if (data.contents) {
            context.content.current.addChild(<NotificationDetail data={data} />);
        }
        cancelDelay();
    }

    async function dispose() {
        await usePopFadeOut(root, 150, { x: 0, y: -15 }, false);
        await useShrink(root, 250);
        context.notification.current.removeNotification(overlayId);
    }

    useEffect(() => {
        async function mainLogic() {
            const [delay, cancel] = useDelay(data.duration);
            cancelDelay = cancel;
            await usePopFadeIn(root, 250, { x: 0, y: -5 });
            try {
                await delay;
            } catch {}
            await dispose();
        }
        mainLogic().catch(console.error);
    }, []);

    return (
        <HStack
            ref={root}
            className="expand-h padding-medium border-radius-large notification align-c"
            onClick={showDetail}>
            <HStack className="padding-v-small expand-h justify-c ignore-cursor" style={{ textOverflow: "ellipsis" }}>
                <FontAwesomeIcon size="lg" style={{ color: color }} icon={NotificationType.icon(data.type)} />
                <label className="text">{data.title}</label>
            </HStack>
        </HStack>
    );
}

const NotificationOverlay = forwardRef(function NotificationOverlay(_, ref) {
    const overlayRef = useRef<HTMLDivElement>(null!);
    const [elements, addElement, removeElement] = useArrayState<ReactElement>();

    useImperativeHandle(ref, () => {
        return {
            customNotification(element: ReactElement<OverlayObject>) {
                addElement(React.cloneElement(element, { ...element.props, overlayId: uuidv4() }));
            },
            makeNotification(notification: NotificationData) {
                const key = uuidv4();
                const component = <Notification key={key} data={notification} overlayId={key} />;
                addElement(component);
            },
            removeNotification(overlayId: string) {
                removeElement(e => e.props.overlayId == overlayId);
            }
        };
    });

    return (
        <VStack
            ref={overlayRef}
            className="expand ignore-cursor align-c justify-s margin-none padding-none auto-clip absolute"
            style={{ zIndex: 10 }}>
            <VStack className="align-c justify-c padding-medium gap-medium" style={{ width: "350px" }}>
                {elements}
            </VStack>
        </VStack>
    );
});

function showNotification(response: NetResponse, context: OverlayContextType, duration: number = 5000): boolean {
    let type = NotificationType.Error;

    if (response.code == 200) {
        type = NotificationType.Success;
    } else if (response.code != null && response.code > 200 && response.code < 300) {
        type = NotificationType.Warning;
    }

    context.notification.current.makeNotification({
        title: response.name,
        contents: response.message,
        type: type,
        status: response.code,
        duration: duration
    });

    return type == NotificationType.Success;
}

export { NotificationOverlay, NotificationType, type NotificationData, showNotification, useShrink };
