import { JSX, MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { Alignment, Dropdown } from "components/core/Dropdown.tsx";
import { HStack } from "components/core/Stack.tsx";
import useAnimation from "hooks/useAnimation.ts";

import "styles/components/core.scss";
import { useFadeIn, useFadeOut } from "animations/FadeAnimations.ts";

interface ComboChoice {
    value: string;
    icon?: string;
    displayValue?: string;
}

interface ComboInputProps {
    choices: ComboChoice[];
    id?: string;
    onChange?: (newValue: ComboChoice) => Promise<boolean>;
    defaultValue?: ComboChoice;
    disabled?: boolean;
    buttonClass?: string;
    choiceClass?: string;
    dropdownClass?: string;
    children?: ReactNode | ReactNode[];
}

async function useTextAnimIn<T extends HTMLElement>(element: MutableRefObject<T>, animDuration: number): Promise<void> {
    const animation = element.current.animate(
        [
            { color: "transparent", translate: "-1px -5px" },
            { color: "inherit", translate: "none" }
        ],
        {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        }
    );

    await useAnimation(animation);
}

async function useTextAnimOut<T extends HTMLElement>(
    element: MutableRefObject<T>,
    animDuration: number
): Promise<void> {
    const animation = element.current.animate(
        [
            { color: "inherit", translate: "none" },
            { color: "transparent", translate: "1px 5px" }
        ],
        {
            duration: animDuration,
            fill: "forwards",
            easing: "ease"
        }
    );

    await useAnimation(animation);
}

function ComboBox({
    choices = [],
    id,
    onChange,
    defaultValue,
    disabled,
    buttonClass,
    choiceClass,
    dropdownClass,
    children
}: ComboInputProps): JSX.Element {
    const buttonRef = useRef<HTMLButtonElement>(null!);
    const textRef = useRef<HTMLSpanElement>(null!);
    const iconRef = useRef<HTMLImageElement>(null!);
    const [value, setValue] = useState<ComboChoice>(defaultValue ?? choices[0]);
    const [first, setFirst] = useState<boolean>(false);

    async function updateValue(choice: ComboChoice) {
        if (choice != value) {
            // Fade out before changing the value
            if (onChange && !(await onChange(choice))) return;
            if (iconRef) useFadeOut(iconRef, 200, false).finally();
            await useTextAnimOut(textRef, 200);
            setValue(choice);
        }
    }

    useEffect(() => {
        if (!first) {
            setFirst(true);
            return;
        }

        // Fade in once the value has changed
        if (iconRef) useFadeIn(iconRef, 200).finally();
        useTextAnimIn(textRef, 200).finally();
    }, [value]);

    useEffect(() => {
        if (!choices.includes(value)) {
            if (choices.length == 0) {
                updateValue({ value: "No choice available" }).finally();
            } else {
                updateValue(choices[0]).finally();
            }
        }
    }, [choices]);

    function makeChoices() {
        return choices.map(choice => (
            <button key={choice.value} className={choiceClass ?? "combo-button"} onClick={() => updateValue(choice)}>
                {choice.icon && <img src={choice.icon} className="message-box-icon padding-h-small" alt="ai_icon" />}
                {choice.displayValue ?? choice.value}
            </button>
        ));
    }

    function noChoice() {
        return (
            <button className="combo-button" disabled={true}>
                No choice available
            </button>
        );
    }

    function Value() {
        return <span ref={textRef}>{value.displayValue ?? value.value}</span>;
    }

    function Body() {
        if (value.icon) {
            return (
                <HStack className="align-c expand-h gap-medium">
                    <img ref={iconRef} src={value.icon} className="message-box-icon padding-h-small" alt="ai_icon" />
                    <Value />
                </HStack>
            );
        }
        return <Value />;
    }

    return (
        <>
            <button
                ref={buttonRef}
                className={buttonClass ?? "input align-c stack-h expand-h justify-sb padding-small"}
                disabled={disabled || choices.length == 0}
                id={id}>
                <Body />
                <FontAwesomeIcon icon={faChevronDown}></FontAwesomeIcon>
            </button>
            {children}

            <Dropdown
                className={dropdownClass ?? "display"}
                buttonRef={buttonRef}
                alignment={{ x: Alignment.Start, y: Alignment.End }}>
                {choices.length > 0 ? makeChoices() : noChoice()}
            </Dropdown>
        </>
    );
}

export { ComboBox, type ComboChoice };
