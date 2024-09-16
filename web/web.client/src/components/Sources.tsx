import { HStack, VStack } from "components/core/Stack.tsx";
import Separator from "components/core/Separator.tsx";
import { OverlayContext, OverlayObject } from "components/overlays/ContentOverlay.tsx";
import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { ApiManager } from "utilities/ApiManager.ts";
import { downloadBlob } from "../utilities/DownloadBlob.ts";
import "styles/main.scss";

interface SourcesProps extends OverlayObject {
    sources: Record<string, number[]>;
}

const buttonStyle =
    "stack-h align-c justify-sb gap-medium padding-large text-small border-radius-small box-border large-menu-button auto-clip margin-bottom-small border-highlight";

function Sources({ sources, overlayId }: SourcesProps) {
    const context = useContext(OverlayContext);

    async function close() {
        context.content.current.removeChild(overlayId);
    }

    function SourceList() {
        async function downloadDocument(name: string) {
            await downloadBlob(ApiManager.getDocument(name), name.split("/").last()!, context);
        }

        return (
            <VStack className={"padding-h-large"}>
                {Object.entries(sources).map(entry => {
                    let [document, pages] = entry;
                    let simplified = document.split("/").last()!;

                    return (
                        <div key={document} onClick={() => downloadDocument(document)} className={buttonStyle}>
                            <HStack>
                                <FontAwesomeIcon icon={faFile} />
                                <label className="ignore-cursor">
                                    Document: {simplified} (Source pages: {pages.join(", ")})
                                </label>
                            </HStack>
                        </div>
                    );
                })}
            </VStack>
        );
    }

    return (
        <VStack className="popover border-radius-medium" style={{ minWidth: "60%" }}>
            <VStack className="expand-h padding-h-large padding-top-large">
                <label className="title">Sources</label>
                <label className="subtitle">A list of sources for the answer</label>
            </VStack>
            <Separator className="margin-v-medium" />

            <SourceList />

            <HStack className="expand-h justify-e padding-large">
                <button className="text-large border-radius-small box-border basic-button" onClick={close}>
                    Close
                </button>
            </HStack>
        </VStack>
    );
}

export default Sources;
