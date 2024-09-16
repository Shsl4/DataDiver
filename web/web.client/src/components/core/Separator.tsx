import "styles/components/core.scss";
import { JSX } from "react";

interface SeparatorProps {
    vertical?: boolean;
    className?: string;
}

/**
 * A basic line separator component
 *
 * @component
 * @param {boolean} vertical - Whether to render vertically (default to false)
 * @param {string} className - The additional styles
 * @return {JSX.Element} The rendered separator
 */
function Separator({ vertical = false, className }: SeparatorProps): JSX.Element {
    return <div className={[vertical ? "separator-v" : "separator-h", className].join(" ")}></div>;
}

export default Separator;
