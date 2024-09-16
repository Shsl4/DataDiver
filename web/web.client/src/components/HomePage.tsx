import { OverlayContext } from "components/overlays/ContentOverlay.tsx";
import NewSession from "./NewSession.tsx";
import OpenSession from "./OpenSession.tsx";
import { VStack } from "components/core/Stack.tsx";
import { useContext, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen, faPlus } from "@fortawesome/free-solid-svg-icons";

const buttonStyle =
    "stack-h align-c justify-c gap-medium padding-large text-small border-radius-small box-border background-primary pointer border-highlight";

function HomePage() {
    const context = useContext(OverlayContext);
    const root = useRef<HTMLDivElement>(null!);

    async function handleNewSession() {
        context.content.current.addChild(<NewSession />);
    }

    async function handleOpenSession() {
        context.content.current.addChild(<OpenSession />);
    }

    return (
        <VStack ref={root} className="expand align-c justify-c auto-fade-in gap-large">
            <VStack className="align-c justify-c">
                <label className="text-xx-large">Welcome!</label>
                <label className="text">Select an option to get started</label>
            </VStack>
            <VStack style={{ width: "300px" }}>
                <button className={buttonStyle} onClick={handleNewSession}>
                    <FontAwesomeIcon icon={faPlus} />
                    New session
                </button>
                <button className={buttonStyle} onClick={handleOpenSession}>
                    <FontAwesomeIcon icon={faFolderOpen} />
                    Open session
                </button>
            </VStack>
        </VStack>
    );
}

export default HomePage;
