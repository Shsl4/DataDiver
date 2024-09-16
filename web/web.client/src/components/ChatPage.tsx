import { faDownload, faFileCode, faFileExcel, faGear, faHome } from "@fortawesome/free-solid-svg-icons";
import { HStack, VStack, ZStack } from "components/core/Stack.tsx";
import { ApiManager } from "utilities/ApiManager.ts";
import { NotificationType, showNotification, useShrink } from "components/overlays/NotificationOverlay.tsx";
import { OverlayContext, OverlayObject } from "components/overlays/ContentOverlay.tsx";
import {
    FormEvent,
    forwardRef,
    KeyboardEvent,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState
} from "react";
import { HistoryMessage, selectGradient, selectIcon, SessionData } from "Models.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFadeIn, useFadeOut, usePopFadeIn, usePopFadeOut } from "animations/FadeAnimations.ts";
import { ChatSettings } from "components/ChatSettings.tsx";
import { useNavigate } from "react-router-dom";
import MessageBox from "components/MessageBox.tsx";
import { downloadBlob } from "utilities/DownloadBlob.ts";
import { Alignment, Dropdown } from "components/core/Dropdown.tsx";
import moment from "moment";
import "styles/components/messagebox.scss";
import "styles/main.scss";

const buttonStyle =
    "stack-h expand text-small align-c justify-s gap-medium border-radius-small border-none download-button padding-h-medium padding-v-small";
interface NotifProps extends OverlayObject {
    llm: string;
}

const GeneratingNotification = forwardRef(function GeneratingNotification({ llm, overlayId }: NotifProps, ref) {
    const context = useContext(OverlayContext);
    const root = useRef<HTMLDivElement>(null!);

    async function dispose() {
        await usePopFadeOut(root, 150, { x: 0, y: -15 }, false);
        await useShrink(root, 250);
        context.notification.current.removeNotification(overlayId);
    }

    useImperativeHandle(ref, () => {
        return {
            async dispose() {
                return await dispose();
            }
        };
    });

    useEffect(() => {
        usePopFadeIn(root, 250, { x: 0, y: -5 }).then();
    }, []);

    return (
        <HStack
            ref={root}
            className={`${selectGradient(llm)} loading-box-gradient expand-h padding-x-small border-radius-large notification align-c`}>
            <VStack className="loading-box expand align-c justify-c" style={{ borderRadius: "14px" }}>
                <HStack
                    className="padding-v-small expand-h justify-c align-c ignore-cursor"
                    style={{ textOverflow: "ellipsis" }}>
                    <img src={selectIcon(llm)} className="loading-box-icon padding-h-small" alt="ai_icon" />
                    <label className="text">Generating</label>
                </HStack>
            </VStack>
        </HStack>
    );
});

interface ChatPageProps {
    data: SessionData;
}

function ChatPage({ data }: ChatPageProps) {
    const context = useContext(OverlayContext);
    const navigate = useNavigate();
    const [hist, setHistory] = useState<HistoryMessage[]>(data.history ?? []);
    const [asking, setAsking] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(true);
    const [llm, setLlm] = useState<string>(data.config.llm_name);
    const root = useRef<HTMLDivElement>(null!);
    const downloadButton = useRef<HTMLButtonElement>(null!);
    const chatContainer = useRef<HTMLDivElement>(null!);
    const messageContainer = useRef<HTMLDivElement>(null!);
    const settingsContainer = useRef<HTMLDivElement>(null!);

    // @ts-ignore
    const notificationRef = useRef<GeneratingNotification>(null!);

    async function submitQuestion(content: string) {
        if (content.isEmpty()) return;
        if (asking) return;
        setAsking(true);

        setHistory(oldValue => [
            ...oldValue,
            {
                type: "human",
                content: content,
                timestamp: moment(Date.now())
            }
        ]);

        context.notification.current.customNotification(<GeneratingNotification ref={notificationRef} llm={llm} />);

        let result = await ApiManager.ask(content);

        if (result.value?.answer) {
            setHistory(oldValue => [
                ...oldValue,
                {
                    type: "ai",
                    content: result.value!.answer,
                    timestamp: moment(Date.now()),
                    llm: data.config.llm_name,
                    sources: result.value!.sources ?? {}
                }
            ]);
        } else {
            showNotification(result.response, context);
        }

        notificationRef.current.dispose();
        setAsking(false);
    }

    useEffect(() => {
        if (messageContainer.current.lastElementChild) {
            messageContainer.current.lastElementChild.scrollIntoView({ behavior: "smooth", inline: "start" });
        }
    }, [hist]);

    function buildMessages() {
        if (hist.length == 0) {
            return (
                <VStack className="expand align-c justify-c">
                    <label className="text-xx-large">Welcome!</label>
                    <label className="text">Ask a question to get started</label>
                </VStack>
            );
        }

        return hist.map((message, index) => {
            return <MessageBox message={message} key={index} />;
        });
    }

    async function showSettings() {
        setVisible(false);
        await useFadeOut(chatContainer, 250);
        await useFadeIn(settingsContainer, 250);
    }

    async function hideSettings() {
        setVisible(true);
        await useFadeOut(settingsContainer, 250);
        await useFadeIn(chatContainer, 250);
        if (messageContainer.current.lastElementChild) {
            messageContainer.current.lastElementChild.scrollIntoView({ behavior: "smooth", inline: "start" });
        }
    }

    async function updated(newLlm: string) {
        setLlm(newLlm);
        context.notification.current.makeNotification({
            title: "Updated configuration",
            type: NotificationType.Success,
            duration: 5000
        });
        if (!visible) {
            await hideSettings();
        }
    }

    async function handleHome() {
        await useFadeOut(root, 250);
        navigate("/");
    }

    function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (e.key == "Enter") {
            if (!e.shiftKey) {
                e.preventDefault();
                submitQuestion(e.currentTarget.innerText).finally();
                setPlaceholderVisible(true);
                e.currentTarget.innerText = "";
            }
        }
    }

    const [placeholderVisible, setPlaceholderVisible] = useState(true);

    function countNewlines(str: string) {
        return (str.match(/\n/g) || []).length;
    }

    function onInput(e: FormEvent<HTMLDivElement>) {
        setPlaceholderVisible(e.currentTarget.innerText.isEmpty() && countNewlines(e.currentTarget.innerText) <= 1);
    }

    async function downloadXlsx() {
        await downloadBlob(ApiManager.getXlsxHistory(data.config._id), `history-${data.config._id}.xlsx`, context);
    }

    async function downloadJson() {
        await downloadBlob(ApiManager.getJsonHistory(data.config._id), `history-${data.config._id}.json`, context);
    }

    return (
        <HStack ref={root} className="expand align-c justify-c auto-fade-in">
            <VStack className="expand-v chat-page justify-sb gap-none">
                <VStack className="expand align-c justify-sb" ref={chatContainer}>
                    <VStack className="auto-scroll gap-large padding-large expand bottom-fade" ref={messageContainer}>
                        {buildMessages()}
                    </VStack>
                    <VStack className="expand-h padding-h-large margin-bottom-large">
                        <HStack className="expand-h align-c gap-none box-border border-radius-medium padding-h-large">
                            <ZStack className="expand">
                                <div
                                    className="ai-chatbox text expand-h padding-v-large"
                                    onKeyDown={onKeyDown}
                                    onInput={onInput}
                                    contentEditable={true}></div>
                                <div
                                    className={`ignore-cursor expand-h subtitle ${placeholderVisible ? "" : "transparent"}`}>
                                    Ask a question...
                                </div>
                            </ZStack>
                            <HStack className="align-c justify-e ignore-cursor">
                                <button ref={downloadButton} className="chat-settings-button">
                                    <FontAwesomeIcon size="lg" icon={faDownload} />
                                </button>
                                <Dropdown
                                    className="box-border border-radius-medium padding-small background-primary"
                                    buttonRef={downloadButton}
                                    alignment={{ x: Alignment.Start, y: Alignment.Start }}
                                    offset={{ x: -32, y: -22 }}>
                                    <button onClick={downloadXlsx} className={buttonStyle}>
                                        <FontAwesomeIcon icon={faFileExcel} />
                                        <label className="text ignore-cursor">Excel</label>
                                    </button>
                                    <button onClick={downloadJson} className={buttonStyle}>
                                        <FontAwesomeIcon icon={faFileCode} />
                                        <label className="text ignore-cursor">JSON</label>
                                    </button>
                                </Dropdown>
                                <button
                                    onClick={showSettings}
                                    disabled={!visible}
                                    className="chat-settings-button hover-rotate">
                                    <FontAwesomeIcon size="lg" icon={faGear} />
                                </button>
                                <button onClick={handleHome} className="chat-settings-button">
                                    <FontAwesomeIcon size="lg" icon={faHome} />
                                </button>
                            </HStack>
                        </HStack>
                    </VStack>
                </VStack>
                <ChatSettings
                    container={settingsContainer}
                    onUpdated={updated}
                    onBack={hideSettings}
                    config={data.config}
                    visible={!visible}
                />
            </VStack>
        </HStack>
    );
}

export default ChatPage;
