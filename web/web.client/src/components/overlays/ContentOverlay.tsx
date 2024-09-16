import React, {
    createContext,
    forwardRef,
    MutableRefObject,
    ReactElement,
    useEffect,
    useImperativeHandle,
    useRef,
    useState
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useFadeIn, useFadeOut } from "animations/FadeAnimations.ts";
import useArrayState from "hooks/useArrayState.ts";
import { VStack } from "../core/Stack.tsx";
import "styles/components/contentoverlay.scss";
import { useBlurIn, useBlurOut } from "../../animations/BlurAnimation.ts";

interface OverlayObject {
    overlayId?: string;
}

interface OverlayContextType {
    // @ts-ignore
    content: MutableRefObject<ContentOverlay>;
    // @ts-ignore
    notification: MutableRefObject<NotificationOverlay>;
}

const OverlayContext = createContext<OverlayContextType>(null!);

const ContentOverlay = forwardRef(function ContentOverlay(_, ref) {
    const overlayRef = useRef<HTMLDivElement>(null!);
    const viewRef = useRef<HTMLDivElement>(null!);
    const [elements, addElement, removeElement] = useArrayState<ReactElement>();
    const [activeView, setActiveView] = useState<string | null>();
    const [visible, setVisible] = useState<boolean>(false);
    const viewFadeTime = 250;

    useImperativeHandle(ref, () => {
        return {
            addChild(newChild: ReactElement<OverlayObject>) {
                addElement(React.cloneElement(newChild, { ...newChild.props, overlayId: uuidv4() }));
            },
            async removeChild(overlayId: string) {
                if (activeView == overlayId) {
                    if (elements.length == 1) {
                        useFadeOut(viewRef, viewFadeTime).then();
                        await useBlurOut(overlayRef, 250);
                    } else {
                        await useFadeOut(viewRef, viewFadeTime);
                    }
                    setActiveView(null);
                }

                removeElement(e => e.props.overlayId == overlayId);
            }
        };
    }, [activeView]);

    async function showView(overlayId: string) {
        if (elements.length == 0) {
            setActiveView(null);
            return;
        }

        if (activeView == overlayId || overlayId == null) return;

        if (activeView != null) {
            await useFadeOut(viewRef, viewFadeTime);
        }

        setActiveView(overlayId);
        await useFadeIn(viewRef, viewFadeTime);
    }

    useEffect(() => {
        async function showContent() {
            const content = document.getElementById("content");

            if (content) {
                content.style.overflowY = "hidden";
            }

            useBlurIn(overlayRef, 350);
            await showView(elements[0].props.overlayId);
            setVisible(true);
        }

        async function showLastElement() {
            await showView(elements[elements.length - 1].props.overlayId);
        }

        async function hideOverlay() {
            await useBlurOut(overlayRef, 250);

            const content = document.getElementById("content");

            if (content) {
                content.style.overflowY = "auto";
            }

            setVisible(false);
        }

        async function onElementsChanged() {
            if (elements.length > 0) {
                if (visible) {
                    await showLastElement();
                } else {
                    await showContent();
                }
            } else {
                await hideOverlay();
            }
        }
        onElementsChanged().catch(console.error);
    }, [elements]);

    return (
        <VStack ref={overlayRef} className="content-overlay expand align-c justify-c" style={{ display: "none" }}>
            <VStack ref={viewRef} className="expand align-c justify-c">
                {elements.map((elem, index) => {
                    return (
                        <VStack
                            className="expand align-c justify-c"
                            key={index}
                            style={{ display: elem.props.overlayId == activeView ? "" : "none" }}>
                            {elem}
                        </VStack>
                    );
                })}
            </VStack>
        </VStack>
    );
});

export { ContentOverlay, type OverlayObject, type OverlayContextType, OverlayContext };
