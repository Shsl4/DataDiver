import { MutableRefObject } from "react";
import useAnimation from "../hooks/useAnimation.ts";

async function useScaleIn<T extends HTMLElement>(
    element: MutableRefObject<T>,
    height: number,
    animDuration: number,
    useMin: boolean = true,
    keepEffects = true
) {
    if (!element.current) return;

    element.current.style.display = "";

    let keyframes = [];

    if (useMin) {
        keyframes = [{ minHeight: 0 }, { minHeight: `${height}px` }];
    } else {
        keyframes = [{ maxHeight: 0 }, { maxHeight: `${height}px` }];
    }

    const animation = element.current.animate(keyframes, {
        duration: animDuration,
        fill: "forwards",
        easing: "ease"
    });

    await useAnimation(animation, keepEffects);
}

async function useScaleOut<T extends HTMLElement>(
    element: MutableRefObject<T>,
    height: number,
    animDuration: number,
    useMin: boolean = true,
    keepEffects = true
) {
    if (!element.current) return;

    element.current.style.display = "";

    let keyframes = [];

    if (useMin) {
        keyframes = [{ minHeight: `${height}px` }, { minHeight: 0 }];
    } else {
        keyframes = [{ maxHeight: `${height}px` }, { maxHeight: 0 }];
    }

    const animation = element.current.animate(keyframes, {
        duration: animDuration,
        fill: "forwards",
        easing: "ease"
    });

    await useAnimation(animation, keepEffects);
}

export { useScaleIn, useScaleOut };
