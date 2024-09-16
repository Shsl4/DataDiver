import { MutableRefObject } from "react";
import useAnimation from "hooks/useAnimation.ts";

interface Point {
    x: number;
    y: number;
}

/**
 * Applies a fade-in animation to an HTML element using the display and opacity properties
 * @param {HTMLElement} element The element to animate
 * @param {number} animDuration The duration of the animation
 * @param {boolean} keepEffects Whether to keep the animation side effects when it is finished
 */
async function useFadeIn<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number,
    keepEffects: boolean = true
) {
    if (!element.current) return;

    element.current.style.display = "flex";

    const animation = element.current.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: animDuration,
        fill: "forwards",
        easing: "ease"
    });

    await useAnimation(animation, keepEffects);
}

/**
 * Applies a fade-in with a pop-up animation to an HTML element using the display, opacity and translate properties
 * @param {HTMLElement} element The element to animate
 * @param {number} animDuration The duration of the animation
 * @param {Point} translate
 * @param {boolean} keepEffects Whether to keep the animation side effects when it is finished
 */
async function usePopFadeIn<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number,
    translate: Point = {
        x: 0,
        y: 50
    },
    keepEffects: boolean = true
) {
    if (!element.current) return;

    element.current.style.display = "";

    const animation = element.current.animate(
        [
            { opacity: 0, transform: `translate(${translate.x}px, ${translate.y}px)` },
            { opacity: 1, transform: "none" }
        ],
        {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        }
    );

    await useAnimation(animation, keepEffects);
}

/**
 * Applies a fade-out animation to an HTML element using the display and opacity properties
 * @param {HTMLElement} element The element to animate
 * @param {number} animDuration The duration of the animation
 * @param {boolean} displayNone Whether to set display to none after the transition
 * @param {boolean} keepEffects Whether to keep the animation side effects when it is finished
 */
async function useFadeOut<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number,
    displayNone: boolean = true,
    keepEffects: boolean = true
) {
    if (!element.current) return;

    const animation = element.current.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: animDuration,
        fill: "forwards",
        easing: "ease"
    });

    await useAnimation(animation, keepEffects);

    if (displayNone && element.current) {
        element.current.style.display = "none";
    }
}

/**
 * Applies a fade-out with a pop-down animation to an HTML element using the display, opacity and translate properties
 * @param {HTMLElement} element The element to animate
 * @param {number} animDuration The duration of the animation
 * @param {Point} translate
 * @param {boolean} displayNone Whether to set display to none after the transition
 * @param {boolean} keepEffects Whether to keep the animation side effects once it is finished
 */
async function usePopFadeOut<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number,
    translate: Point = { x: 0, y: 50 },
    displayNone: boolean = true,
    keepEffects: boolean = true
) {
    if (!element.current) return;

    const animation = element.current.animate(
        [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: `translate(${translate.x}px, ${translate.y}px)` }
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

export { useFadeIn, usePopFadeIn, useFadeOut, usePopFadeOut };
