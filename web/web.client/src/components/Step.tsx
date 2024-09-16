import { ReactNode, useEffect, useRef, useState } from "react";
import { HStack, VStack, ZStack } from "./core/Stack.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import useCustomAnim from "../animations/CustomAnimation.ts";
import "styles/main.scss";
import "styles/components/step.scss";

interface FormStep {
    title: string;
    component: ReactNode;
}

interface StepProps {
    step: FormStep;
    index: number;
    currentIndex: number;
}

function Step({ step, index, currentIndex }: StepProps) {
    const done = currentIndex > index;
    const active = currentIndex == index;
    const [first, setFirst] = useState(true);
    const circleRef = useRef<HTMLDivElement>(null!);
    const titleRef = useRef<HTMLLabelElement>(null!);
    const checkRef = useRef<SVGSVGElement>(null!);
    const numberRef = useRef<HTMLLabelElement>(null!);

    const animDuration = 250;
    const fadeIn = [{ opacity: 0 }, { opacity: 1 }];
    const fadeOut = [{ opacity: 1 }, { opacity: 0 }];
    const clipIn = [
        {
            clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
        },
        {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
        }
    ];
    const clipOut = [
        {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
        },
        {
            clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
        }
    ];
    const borderInDone = [{}, { border: "solid 2px var(--system-green-300)", color: "var(--system-green-300)" }];
    const borderInActive = [{}, { border: "solid 2px var(--accent)", color: "var(--accent)" }];
    const borderOut = [{}, { border: "solid 2px var(--secondary-text)", color: "var(--secondary-text)" }];
    const colorInDone = [{}, { color: "var(--system-green-300)" }];
    const colorInActive = [{}, { color: "var(--accent)" }];
    const colorOut = [{}, { color: "var(--secondary-text)" }];

    useEffect(() => {
        if (first) {
            setFirst(false);
            return;
        }
        if (done) {
            useCustomAnim(numberRef, fadeOut, animDuration);
            useCustomAnim(checkRef, clipIn, animDuration, animDuration * 0.5);
            useCustomAnim(circleRef, borderInDone, animDuration);
            useCustomAnim(titleRef, colorInDone, animDuration);
        } else {
            useCustomAnim(checkRef, clipOut, animDuration);
            useCustomAnim(numberRef, fadeIn, animDuration, animDuration * 0.5);
            useCustomAnim(circleRef, borderOut, animDuration, animDuration * 0.5);
            useCustomAnim(titleRef, colorOut, animDuration, animDuration * 0.5);
        }
    }, [done]);

    useEffect(() => {
        if (active) {
            useCustomAnim(circleRef, borderInActive, animDuration);
            useCustomAnim(titleRef, colorInActive, animDuration);
        } else if (!done) {
            useCustomAnim(circleRef, borderOut, animDuration, animDuration * 0.5);
            useCustomAnim(titleRef, colorOut, animDuration, animDuration * 0.5);
        }
    }, [active]);

    return (
        <VStack className="align-c padding-medium expand-h">
            <HStack>
                <ZStack ref={circleRef} className="step-circle align-c justify-c">
                    <FontAwesomeIcon ref={checkRef} className="check-icon" icon={faCheck} />
                    <label className="basic-text" ref={numberRef}>
                        {index + 1}
                    </label>
                </ZStack>
            </HStack>
            <label ref={titleRef} className="subtitle-small">
                {step.title}
            </label>
        </VStack>
    );
}

export { type FormStep, Step };
