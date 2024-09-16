import { NotificationData, NotificationType } from "components/overlays/NotificationOverlay";
import Separator from "components/core/Separator";
import { HStack, VStack } from "components/core/Stack";
import { OverlayContext, OverlayObject } from "components/overlays/ContentOverlay";
import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface NotificationDetailProps extends OverlayObject {
    data: NotificationData;
}

function NotificationDetail({ data, overlayId }: NotificationDetailProps) {
    const context = useContext(OverlayContext);
    const color = NotificationType.color(data.type);

    function handleClose() {
        context.content.current.removeChild(overlayId);
    }

    const subtitle = data.status ? `${data.title} (Code ${data.status})` : `${data.title}`;

    return (
        <VStack className="popover border-radius-medium auto-scroll">
            <HStack className="expand-h padding-h-large padding-top-large justify-sb">
                <VStack>
                    <label className="title">{NotificationType.name(data.type)}</label>
                    <label className="subtitle">{subtitle}</label>
                </VStack>
                <HStack>
                    <FontAwesomeIcon
                        size="2xl"
                        className="padding-h-small"
                        style={{ color: color, alignSelf: "center" }}
                        icon={NotificationType.icon(data.type)}
                    />
                    <div
                        className="border-radius-small expand-v"
                        style={{ backgroundColor: color, minWidth: "5px" }}></div>
                </HStack>
            </HStack>
            <Separator className="margin-v-medium" />
            <VStack className="expand-h padding-h-large padding-bottom-large">
                <label className="text">Details:</label>
                <label className="text-small">{data.contents}</label>
                <HStack className="expand-h justify-e">
                    <button className="basic-button box-border border-radius-small text-small" onClick={handleClose}>
                        Continue
                    </button>
                </HStack>
            </VStack>
        </VStack>
    );
}

export { NotificationDetail };
