import { CSSProperties, forwardRef, MouseEvent, ReactNode } from "react";
import "styles/components/core.scss";

interface StackProps {
    children?: ReactNode | ReactNode[];
    className?: string;
    style?: CSSProperties;
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

/**
 * A vertical stack component
 *
 * @component
 * @param {ReactNode | ReactNode[]} children - The children to render
 * @param {string} className - The custom classes to apply
 * @param {CSSProperties} style - The custom styles to apply
 * @return {JSX.Element} The rendered stack
 */
const VStack = forwardRef<HTMLDivElement, StackProps>(({ children, className, style, onClick }, ref) => {
    const defaultStyle = "stack-v";
    const classStyle = `${defaultStyle}${className ? ` ${className}` : ""}`;
    return (
        <div className={classStyle} style={style} ref={ref} onClick={onClick}>
            {children}
        </div>
    );
});

/**
 * A horizontal stack component
 *
 * @component
 * @param {ReactNode | ReactNode[]} children - The children to render
 * @param {string} className - The custom classes to apply
 * @param {CSSProperties} style - The custom styles to apply
 * @return {JSX.Element} The rendered stack
 */
const HStack = forwardRef<HTMLDivElement, StackProps>(({ children, className, style, onClick }, ref) => {
    const defaultStyle = "stack-h";
    const classStyle = `${defaultStyle}${className ? ` ${className}` : ""}`;
    return (
        <div className={classStyle} style={style} ref={ref} onClick={onClick}>
            {children}
        </div>
    );
});

const ZStack = forwardRef<HTMLDivElement, StackProps>(({ children, className, style, onClick }, ref) => {
    const defaultStyle = "stack-z";
    const classStyle = `${defaultStyle}${className ? ` ${className}` : ""}`;
    return (
        <div className={classStyle} style={style} ref={ref} onClick={onClick}>
            {children}
        </div>
    );
});

export { VStack, HStack, ZStack };
