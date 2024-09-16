/**
 * Awaits for an animation to finish
 * @param {Animation} anim The target animation
 * @param {boolean} keepEffects Whether to keep the animation side effects when it is finished
 */
function useAnimation(anim: Animation, keepEffects = true): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        anim.onfinish = () => {
            resolve();
            if (!keepEffects) anim.cancel();
        };
        anim.oncancel = reject;
    });
}

export default useAnimation;
