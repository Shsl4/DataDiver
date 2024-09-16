import { MutableRefObject } from "react";
import useAnimation from "../hooks/useAnimation";

async function useCustomAnim<T extends Element>(
    element: MutableRefObject<T>,
    keyFrames: Keyframe[],
    animDuration: number,
    delay?: number,
    pseudoElement?: string,
    keepEffects: boolean = true
) {
    if (!element.current) return;

    const animation = element.current.animate(keyFrames, {
        pseudoElement: pseudoElement,
        duration: animDuration,
        fill: "forwards",
        delay: delay,
        easing: "ease"
    });

    await useAnimation(animation, keepEffects);
}

export default useCustomAnim;
