import { ReactNode, useEffect, useRef, useState } from "react";
import { NetResponse, NetResult } from "utilities/ApiManager.ts";
import { useFadeIn, useFadeOut } from "animations/FadeAnimations.ts";

interface ComponentLoaderProps<ValueType> {
    fallback: ReactNode;
    promise: () => Promise<NetResult<ValueType>>;
    error: (value: NetResponse) => ReactNode | void;
    component: (value: ValueType) => ReactNode;
}

function AsyncLoader<T>({ fallback, error, promise, component }: ComponentLoaderProps<T>) {
    const root = useRef<HTMLDivElement>(null!);
    const [comp, setComponent] = useState<ReactNode>(fallback);
    const [done, setDone] = useState(false);
    const effectRan = useRef(false);

    useEffect(() => {
        async function main() {
            if (effectRan.current) return;

            await useFadeIn(root, 250);
            let result = await promise();
            await useFadeOut(root, 250, false);
            if (result.value) {
                setComponent(component(result.value));
            } else {
                let component = error(result.response);
                if (!component) return;
                setComponent(component);
            }
            setDone(true);
        }

        main();

        return () => {
            effectRan.current = true;
        };
    }, []);

    useEffect(() => {
        if (done) {
            useFadeIn(root, 250);
        }
    }, [done]);

    return (
        <div className="expand auto-scroll" ref={root}>
            {comp}
        </div>
    );
}

export default AsyncLoader;
