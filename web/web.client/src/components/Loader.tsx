import { HStack, VStack } from "./core/Stack";
import "styles/components/loader.scss";
import "styles/main.scss";

interface LoadPlaceholderProps {
    title: string;
    subtitle: string;
    loading?: boolean;
}

function Loader({ title, subtitle, loading = true }: LoadPlaceholderProps) {
    return (
        <HStack className="expand align-c justify-c gap-xx-large">
            {loading && <div className="circle-loader"></div>}
            <VStack className="justify-c">
                <label className="text-xx-large">{title}</label>
                <label className="text">{subtitle}</label>
            </VStack>
        </HStack>
    );
}

export default Loader;
