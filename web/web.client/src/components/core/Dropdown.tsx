import { MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";
import "styles/components/dropdown.scss";
import { usePopFadeIn, usePopFadeOut } from "animations/FadeAnimations.ts";
import { VStack } from "./Stack.tsx";
import useDelay from "../../hooks/useDelay.ts";
import { createPortal } from "react-dom";

enum Alignment {
    Start,
    End
}

enum AlignMode {
    Vertical,
    Horizontal
}

enum ShowType {
    Click,
    Hover
}

interface Alignment2D {
    x: Alignment;
    y: Alignment;
}

interface Point {
    x: number;
    y: number;
}

interface DropdownProps {
    buttonRef: MutableRefObject<HTMLElement>;
    alignTo?: MutableRefObject<HTMLElement>;
    className?: string;
    type?: ShowType;
    mode?: AlignMode;
    alignment?: Alignment2D;
    depth?: number;
    children?: ReactNode | ReactNode[];
    offset?: Point;
    animateClose?: boolean;
}

function Dropdown({
    buttonRef,
    alignTo = buttonRef,
    className = "dropdown-content-default",
    alignment,
    depth = 10,
    type = ShowType.Click,
    mode = AlignMode.Vertical,
    animateClose = true,
    offset = { x: 0, y: 0 },
    children
}: DropdownProps) {
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isDropdownHovered, setIsDropdownHovered] = useState(false);
    const [isOpen, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null!);
    let callback = useRef<() => void>();
    function alignLeft(buttonRect: DOMRect, dropdownRect: DOMRect) {
        if (mode == AlignMode.Horizontal) {
            return buttonRect.left - dropdownRect.width + window.scrollX;
        }
        return buttonRect.left + window.scrollX;
    }

    function alignRight(buttonRect: DOMRect, dropdownRect: DOMRect) {
        if (mode == AlignMode.Horizontal) {
            return buttonRect.right + window.scrollX;
        }
        return buttonRect.right - dropdownRect.width + window.scrollX;
    }

    function alignBottom(buttonRect: DOMRect, _dropdownRect: DOMRect) {
        if (mode == AlignMode.Horizontal) {
            return buttonRect.bottom - _dropdownRect.height + window.scrollY;
        }
        return buttonRect.bottom + window.scrollY;
    }

    function alignTop(buttonRect: DOMRect, dropdownRect: DOMRect) {
        if (mode == AlignMode.Horizontal) {
            return buttonRect.top + window.scrollY;
        }
        return buttonRect.top - dropdownRect.height + window.scrollY;
    }

    function positionDropdown() {
        if (!dropdownRef.current) return;

        const buttonRect = alignTo.current.getBoundingClientRect();

        dropdownRef.current.style.display = "flex";
        dropdownRef.current.style.minWidth = `${buttonRect.width.toFixed(0)}px`;

        const dropdownRect = dropdownRef.current.getBoundingClientRect();

        dropdownRef.current.style.display = "none";

        let drawX = alignRight(buttonRect, dropdownRect);
        let drawY = alignBottom(buttonRect, dropdownRect);

        if (alignment != null) {
            if (alignment.x == Alignment.Start) {
                drawX = alignLeft(buttonRect, dropdownRect);
            }

            if (alignment.y == Alignment.Start) {
                drawY = alignTop(buttonRect, dropdownRect);
            }
        }

        const spaceBottom = window.innerHeight - buttonRect.bottom;
        const spaceTop = buttonRect.top;
        const spaceRight = window.innerWidth - buttonRect.right;
        const spaceLeft = buttonRect.left;

        const overflowsTop = spaceTop < dropdownRect.height;
        const overflowsBottom = spaceBottom < dropdownRect.height;
        const overflowsLeft = spaceLeft < dropdownRect.width;
        const overflowsRight = spaceRight < dropdownRect.width;

        if (overflowsBottom) {
            if (mode == AlignMode.Vertical) {
                drawY = alignTop(buttonRect, dropdownRect);
            } else {
                drawY = alignBottom(buttonRect, dropdownRect);
            }
        }
        if (overflowsTop) {
            if (mode == AlignMode.Vertical) {
                drawY = alignBottom(buttonRect, dropdownRect);
            } else {
                drawY = alignTop(buttonRect, dropdownRect);
            }
        }
        if (overflowsLeft) {
            if (mode == AlignMode.Vertical) {
                drawX = alignLeft(buttonRect, dropdownRect);
            } else {
                drawX = alignRight(buttonRect, dropdownRect);
            }
        }
        if (overflowsRight) {
            if (mode == AlignMode.Vertical) {
                drawX = alignRight(buttonRect, dropdownRect);
            } else {
                drawX = alignLeft(buttonRect, dropdownRect);
            }
        }

        dropdownRef.current.style.translate = `${(drawX + offset.x).toFixed(0)}px ${(drawY + offset.y).toFixed(0)}px`;
    }

    async function openAnimation() {
        if (dropdownRef.current == null) return;

        document.addEventListener("mousedown", handleClickDown);
        document.addEventListener("mouseup", handleClickUp);
        window.addEventListener("resize", positionDropdown);

        await usePopFadeIn(dropdownRef, 250, { x: 0, y: 5 });
    }

    async function closeAnimation() {
        if (dropdownRef.current == null) return;

        document.removeEventListener("mousedown", handleClickDown);
        document.removeEventListener("mouseup", handleClickUp);
        window.removeEventListener("resize", positionDropdown);

        await usePopFadeOut(dropdownRef, animateClose ? 250 : 0, { x: 0, y: 5 });
        setOpen(false);
    }

    async function handleClickDown(event: MouseEvent) {
        if (dropdownRef.current == null || buttonRef.current == null) return;

        const target = event.target as Node;

        if (!dropdownRef.current.contains(target) && !buttonRef.current.contains(target)) {
            await closeAnimation();
        }
    }

    async function handleClickUp(event: MouseEvent) {
        if (buttonRef.current == null) return;

        const target = event.target as Node;

        if (!buttonRef.current.contains(target)) {
            await closeAnimation();
        }
    }

    function cancelDelay() {
        if (callback.current != null) {
            callback.current();
            callback.current = undefined;
        }
    }

    async function onHoverButton() {
        setIsButtonHovered(true);
        setOpen(true);
        cancelDelay();
    }

    async function onHoverDropdown() {
        setIsDropdownHovered(true);
        setOpen(true);
        cancelDelay();
    }

    async function onOutButton() {
        setIsButtonHovered(false);
    }

    async function onOutDropdown() {
        setIsDropdownHovered(false);
    }

    useEffect(() => {
        async function check() {
            if (isOpen && !isButtonHovered && !isDropdownHovered) {
                const [delay, cancel] = useDelay(10);
                callback.current = cancel;
                try {
                    await delay;
                    await closeAnimation();
                } catch {}
            }
        }

        check().then();
    }, [isButtonHovered, isDropdownHovered]);

    useEffect(() => {
        function open() {
            setOpen(true);
        }

        function cleanup() {
            if (buttonRef.current == null) return;
            buttonRef.current.removeEventListener("click", open);
            buttonRef.current.removeEventListener("mouseenter", onHoverButton);
            buttonRef.current.removeEventListener("mouseleave", onOutButton);
        }

        function setup() {
            if (buttonRef.current == null) return;

            if (type == ShowType.Click) {
                buttonRef.current.addEventListener("click", open);
            } else {
                buttonRef.current.addEventListener("mouseenter", onHoverButton);
                buttonRef.current.addEventListener("mouseleave", onOutButton);
            }
        }

        setup();

        return cleanup;
    }, [buttonRef]);

    useEffect(() => {
        function cleanup() {
            if (dropdownRef.current == null) return;
            dropdownRef.current.removeEventListener("mouseenter", onHoverDropdown);
            dropdownRef.current.removeEventListener("mouseleave", onOutDropdown);
        }

        async function setup() {
            if (isOpen) {
                if (type == ShowType.Hover && dropdownRef.current) {
                    dropdownRef.current.addEventListener("mouseenter", onHoverDropdown);
                    dropdownRef.current.addEventListener("mouseleave", onOutDropdown);
                }

                positionDropdown();
                await openAnimation();
            }
        }

        setup().then();

        return cleanup;
    }, [isOpen]);

    return (
        isOpen &&
        createPortal(
            <VStack
                ref={dropdownRef}
                style={{ display: "none", zIndex: `${depth}` }}
                className={`dropdown-content ${className}`}>
                {children}
            </VStack>,
            document.getElementById("root")!
        )
    );
}

export { Dropdown, Alignment, AlignMode, ShowType, type Alignment2D };
