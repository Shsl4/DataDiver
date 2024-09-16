import { ApiManager, NetResponse } from "utilities/ApiManager.ts";
import { OverlayContext, OverlayObject } from "components/overlays/ContentOverlay.tsx";
import { MouseEvent, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HStack, VStack } from "components/core/Stack.tsx";
import Separator from "components/core/Separator.tsx";
import AsyncLoader from "components/AsyncLoader.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { showNotification } from "components/overlays/NotificationOverlay.tsx";
import Loader from "./Loader.tsx";
import { SessionData, SessionType } from "Models.ts";
import { faComments, faLightbulb, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import useAnimation from "hooks/useAnimation.ts";
import { useFadeIn } from "animations/FadeAnimations.ts";

const buttonStyle =
    "stack-h align-c justify-sb gap-medium padding-large text-small border-radius-small box-border large-menu-button auto-clip margin-bottom-small border-highlight";

const otherButtonStyle =
    "stack-h align-c text-small justify-c padding-medium border-radius-small box-border delete-entry-button";

interface SessionListProps {
    sessions: Record<string, SessionData>;
    onChange: (value: string | undefined) => void;
}

function SessionList({ sessions, onChange }: SessionListProps) {
    const [selectedSession, setSelectedSession] = useState<String>();
    const [validSessions, setValidSessions] = useState(Object.keys(sessions));
    const sortedSessions: Record<string, SessionData> = sort(sessions);
    const [deleteRequested, setDeleteRequested] = useState<boolean>(false);

    const context = useContext(OverlayContext);
    const root = useRef<HTMLDivElement>(null!);

    function sort(sessions: Record<string, SessionData>): Record<string, SessionData> {
        const sortedEntries = Object.entries(sessions).sort(([, sessionA], [, sessionB]) => {
            const mostRecentA = Math.max(...(sessionA.history?.map(m => m.timestamp.unix()) ?? []));
            const mostRecentB = Math.max(...(sessionB.history?.map(m => m.timestamp.unix()) ?? []));
            return mostRecentB - mostRecentA;
        });
        return Object.fromEntries(sortedEntries);
    }

    function sessionChanged(id: string | undefined) {
        if (deleteRequested) return;
        setSelectedSession(id);
        onChange(id);
    }

    async function betterScaleOut<T extends HTMLElement>(element: T, animDuration: number) {
        if (!element) return;

        element.style.display = "";

        let keyframes = [
            { maxHeight: `${element.getBoundingClientRect().height}px` },
            { maxHeight: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, opacity: 0, border: 0 }
        ];

        const animation = element.animate(keyframes, {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        });

        await useAnimation(animation);

        element.style.display = "none";
    }

    function buildSessions() {
        if (validSessions.length == 0) {
            return (
                <VStack className="expand align-c justify-c">
                    <label className="text-xx-large">No sessions</label>
                    <label className="text">Could not find any session. Create a session to get started</label>
                </VStack>
            );
        }

        let sessionList = [];

        for (let [id, data] of Object.entries(sortedSessions)) {
            if (!validSessions.includes(id)) continue;

            async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
                if (deleteRequested) return;
                setDeleteRequested(true);

                event.stopPropagation();

                if (selectedSession == id) {
                    sessionChanged(undefined);
                }

                let parent = event.currentTarget.parentElement!;

                let result = await ApiManager.deleteSession(id);

                if (result.response.code == 200) {
                    await betterScaleOut(parent, 250);
                    setValidSessions(validSessions.filter(e => e != id));
                }

                showNotification(result.response, context);
                setDeleteRequested(false);
            }

            function makeDescriptionString() {
                if (data.config.session_type == SessionType.chat && data.history) {
                    return `${data.config.display_name}: ${data.history.length} messages (${data.config._id})`;
                } else if (data.data) {
                    return `${data.config.display_name}: ${Object.keys(data.data.results).length} answers (${data.config._id})`;
                }
            }

            sessionList.push(
                <div
                    key={id}
                    onClick={() => sessionChanged(id)}
                    className={selectedSession == id ? `${buttonStyle} large-menu-button-selected` : buttonStyle}>
                    <HStack>
                        <FontAwesomeIcon
                            icon={data.config.session_type == SessionType.chat ? faComments : faLightbulb}
                        />
                        <label className="ignore-cursor">{makeDescriptionString()}</label>
                    </HStack>
                    <button disabled={deleteRequested} onClick={handleDelete} className={otherButtonStyle}>
                        <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                </div>
            );
        }

        return sessionList;
    }

    useEffect(() => {
        if (validSessions.length == 0 && Object.keys(sessions).length > 0) {
            useFadeIn(root, 250);
        }
    }, [validSessions]);

    return (
        <VStack ref={root} className="expand padding-h-large gap-none">
            {buildSessions()}
        </VStack>
    );
}

function makeLoad() {
    return <Loader title="Fetching data" subtitle="Fetching existing session datacomponents." loading />;
}

function OpenSession({ overlayId }: OverlayObject) {
    const context = useContext(OverlayContext);
    const [selectedSession, setSelectedSession] = useState<String>();
    const navigate = useNavigate();

    function handleOpen() {
        navigate(`/session/${selectedSession}`);
        context.content.current.removeChild(overlayId);
    }

    async function close() {
        context.content.current.removeChild(overlayId);
    }

    function makeError(response: NetResponse) {
        showNotification(response, context);
        close().then();
    }

    return (
        <VStack className="popover border-radius-medium" style={{ minHeight: "70%", minWidth: "60%" }}>
            <VStack className="expand-h padding-h-large padding-top-large">
                <label className="title">Open Session</label>
                <label className="subtitle">Open an existing new session</label>
            </VStack>
            <Separator className="margin-v-medium" />

            <AsyncLoader
                fallback={makeLoad()}
                component={(sessions: Record<string, SessionData>) => (
                    <SessionList sessions={sessions} onChange={setSelectedSession} />
                )}
                error={makeError}
                promise={ApiManager.getSessions}
            />

            <HStack className="expand-h justify-sb padding-large">
                <button className="text-large border-radius-small box-border basic-button" onClick={close}>
                    Back
                </button>
                <button
                    className="border-radius-small box-border basic-button"
                    disabled={!selectedSession}
                    onClick={handleOpen}>
                    Open
                </button>
            </HStack>
        </VStack>
    );
}

export default OpenSession;
