import { HistoryMessage, selectIcon } from "Models.ts";
import { OverlayContext } from "components/overlays/ContentOverlay.tsx";
import { NotificationType } from "components/overlays/NotificationOverlay.tsx";
import { HStack, VStack } from "components/core/Stack.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone, faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { useContext, useRef } from "react";
import Sources from "components/Sources.tsx";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, coldarkDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useThemeListener } from "utilities/ThemeManager.ts";

interface MessageBoxProps {
    message: HistoryMessage;
}

type MarkdownRendererProps = {
    theme: string;
    children: string;
};

export function MarkdownRenderer({ theme, children: markdown }: MarkdownRendererProps) {
    return (
        <Markdown
            className="text border-radius-large"
            components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");

                    return !inline && match ? (
                        <SyntaxHighlighter
                            style={theme == "light" ? oneLight : coldarkDark}
                            PreTag="div"
                            className="border-radius-medium"
                            language={match[1]}
                            {...props}>
                            {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                }
            }}>
            {markdown}
        </Markdown>
    );
}

function MessageBox({ message }: MessageBoxProps) {
    const divRef = useRef<HTMLDivElement>(null!);
    const imgRef = useRef<HTMLImageElement>(null!);
    const elemRef = useRef<HTMLDivElement>(null!);
    const context = useContext(OverlayContext);
    const theme = useThemeListener();

    async function toggleView() {
        context.content.current.addChild(<Sources sources={message.sources!} />);
    }

    function makeSources() {
        if (message.sources != null) {
            let disabled = Object.keys(message.sources).length == 0;
            return (
                <button
                    onClick={toggleView}
                    disabled={disabled}
                    className="message-box-action-icon border-radius-medium padding-small">
                    <FontAwesomeIcon icon={disabled ? faLinkSlash : faLink} />
                </button>
            );
        }
        return null;
    }

    function makeCopy() {
        function notify() {
            context.notification.current.makeNotification({
                title: "Copied text",
                contents: null,
                type: NotificationType.Success,
                status: null,
                duration: 5000
            });
        }

        function copyText() {
            navigator.clipboard.writeText(message.content).then(notify);
        }

        return (
            <button onClick={copyText} className="message-box-action-icon border-radius-medium padding-small">
                <FontAwesomeIcon icon={faClone} />
            </button>
        );
    }

    function MessageBody() {
        return <MarkdownRenderer theme={theme}>{message.content}</MarkdownRenderer>;
    }

    return (
        <>
            <HStack ref={divRef} className="message-box align-s padding-large border-radius-medium auto-fade-in">
                <img
                    ref={imgRef}
                    src={selectIcon(message.llm)}
                    className="message-box-icon padding-h-small"
                    style={!message.llm && theme == "dark" ? { filter: "invert(100%)" } : {}}
                    alt="ai_icon"
                />
                <VStack className="message-box-content">
                    <HStack ref={elemRef} className="expand" style={{ overflow: "hidden" }}>
                        <MessageBody />
                    </HStack>
                    <HStack className="expand-h align-c">
                        <label className="text-small message-box-date">
                            {message.timestamp.format("DD/MM/YYYY HH:mm")}
                        </label>
                        <HStack className="gap-small">
                            {makeCopy()}
                            {makeSources()}
                        </HStack>
                    </HStack>
                </VStack>
            </HStack>
        </>
    );
}

export default MessageBox;
