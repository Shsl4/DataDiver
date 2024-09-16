import { NetResult } from "./ApiManager.ts";
import { showNotification } from "../components/overlays/NotificationOverlay.tsx";
import { OverlayContextType } from "../components/overlays/ContentOverlay.tsx";

export async function downloadBlob(
    apiCall: Promise<NetResult<Blob>>,
    fileName: string,
    context?: OverlayContextType
): Promise<boolean> {
    let result = await apiCall;

    if (result.value != null) {
        const url = URL.createObjectURL(result.value);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    if (context) {
        showNotification(result.response, context, 5000);
    }

    return result.value != null;
}
