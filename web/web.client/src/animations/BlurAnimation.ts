import { MutableRefObject } from "react";
import useAnimation from "../hooks/useAnimation.ts";

async function useBlurIn<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number,
    keepEffects: boolean = true
) {
    if (!element.current) return;

    element.current.style.display = "";

    const animation = element.current.animate(
        [
            { backdropFilter: "blur(0)", opacity: "0" },
            { backdropFilter: "blur(6px)", opacity: "1" }
        ],
        {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        }
    );

    await useAnimation(animation, keepEffects);
}

async function useBlurOut<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number,
    displayNone: boolean = true,
    keepEffects: boolean = true
) {
    if (!element.current) return;

    const animation = element.current.animate(
        [
            { backdropFilter: "blur(5px)", opacity: "1" },
            { backdropFilter: "blur(0)", opacity: "0" }
        ],
        {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        }
    );

    await useAnimation(animation, keepEffects);

    if (displayNone && element.current) {
        element.current.style.display = "none";
    }
}

export { useBlurIn, useBlurOut };
