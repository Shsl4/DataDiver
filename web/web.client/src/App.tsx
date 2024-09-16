import { Navigate, Route, Routes } from "react-router-dom";
import OverlayProvider from "components/overlays/OverlayProvider.tsx";
import SessionLoader from "./components/SessionLoader.tsx";
import HomePage from "components/HomePage.tsx";

function App() {
    return (
        <OverlayProvider>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/session/:id" element={<SessionLoader />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </OverlayProvider>
    );
}

export default App;
