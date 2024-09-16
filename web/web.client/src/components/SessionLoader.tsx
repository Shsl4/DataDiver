import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OverlayContext } from "./overlays/ContentOverlay";
import { showNotification } from "./overlays/NotificationOverlay";
import { ApiManager, NetResponse, NetResult } from "../utilities/ApiManager.ts";
import { SessionData, SessionType } from "../Models.ts";
import AsyncLoader from "./AsyncLoader.tsx";
import Loader from "./Loader.tsx";
import ChatPage from "./ChatPage.tsx";
import EvaluationPage from "components/EvaluationPage.tsx";

function SessionLoader() {
    const { id } = useParams();
    const navigate = useNavigate();
    const overlay = useContext(OverlayContext);

    function onError(response: NetResponse) {
        showNotification(response, overlay, 20000);
        navigate("/");
    }

    async function makePromise() {
        let result = await ApiManager.useSession(id!);
        if (result.response.code != 200) return new NetResult<SessionData>(result.response);
        return await ApiManager.getSession(id!);
    }

    return (
        <AsyncLoader
            component={(data: SessionData) => {
                if (data.config.session_type == SessionType.chat) {
                    return <ChatPage data={data} />;
                }
                return <EvaluationPage data={data} />;
            }}
            fallback={<Loader subtitle="Loading and applying session configuration" title="Loading session" />}
            promise={makePromise}
            error={onError}
        />
    );
}

export default SessionLoader;
