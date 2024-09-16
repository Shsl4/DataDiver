import { AlgorithmParameters, AlgorithmType, AskResponse, EvalResponse, SessionData, SessionType } from "Models.ts";
import moment from "moment";

interface NetResponse {
    code?: number;
    name: string;
    message?: string;
}

class NetResult<T> {
    response: NetResponse;
    value?: T;

    constructor(response: NetResponse, value?: T) {
        this.response = response;
        this.value = value;
    }

    static make<T>(code: number, name: string, message?: string, value?: T) {
        return new NetResult<T>(
            {
                code: code,
                name: name,
                message: message
            },
            value
        );
    }

    static networkError<T>() {
        return new NetResult<T>({
            name: "Network Error",
            message: `An unexpected network error occured. Check the console for more details.`
        });
    }
}

interface FileResult {
    response: NetResponse;
    data?: Blob;
}

class ApiManager {
    public static isDevelopment(): boolean {
        return !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    }

    public static rootPath(): string {
        return ApiManager.isDevelopment() ? "https://localhost:8001/api/" : "/api/";
    }

    public static async getSession(sessionId: string): Promise<NetResult<SessionData>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/session/${sessionId}`), { method: "GET" });
            let json = await response.json();
            let session: SessionData = json.session;

            if (session.history) {
                session.history.forEach(v => {
                    // Map the raw time string to a moment object
                    v.timestamp = moment(v.timestamp, "DD/MM/YYYY HH:mm");
                });
            }
            return NetResult.make(response.status, json.name, json.message, session);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async useSession(sessionId: string): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/session/${sessionId}`), { method: "POST" });
            let json = await response.json();

            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async useCriteria(criteria: string[]): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/criteria/`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ criteria: criteria })
            });
            let json = await response.json();

            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async useScenario(scenario: string): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/scenario/`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenario: scenario })
            });
            let json = await response.json();

            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async deleteSession(sessionId: string): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/session/${sessionId}`), { method: "DELETE" });
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async useLlm(llm: string): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/llm/${llm}`), { method: "POST" });
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async useRetriever(retriever: string): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/retriever`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ retriever: retriever })
            });

            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async getSessions(): Promise<NetResult<Record<string, SessionData>>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/sessions`), { method: "GET" });
            let json = await response.json();
            let sessions: Record<string, SessionData> = json.sessions;

            if (sessions) {
                for (let data of Object.values(sessions)) {
                    if (!data.history) continue;
                    data.history.forEach(v => {
                        // Map the raw time string to a moment object
                        v.timestamp = moment(v.timestamp, "DD/MM/YYYY HH:mm");
                    });
                }
            }

            return NetResult.make(response.status, json.name, json.message, sessions);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async getDocument(file: string): Promise<NetResult<Blob>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/document/${file}`), { method: "GET" });

            if (response.ok) {
                return NetResult.make(response.status, "Downloaded file", undefined, await response.blob());
            }
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async getJsonHistory(sessionId: string): Promise<NetResult<Blob>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`export/chat/json/${sessionId}`), {
                method: "GET"
            });

            if (response.ok) {
                return NetResult.make(response.status, "Downloaded file", undefined, await response.blob());
            }
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async getXlsxHistory(sessionId: string): Promise<NetResult<Blob>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`export/chat/xlsx/${sessionId}`), {
                method: "GET"
            });

            if (response.ok) {
                return NetResult.make(response.status, "Downloaded file", undefined, await response.blob());
            }
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async getJsonEval(sessionId: string): Promise<NetResult<Blob>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`export/eval/json/${sessionId}`), {
                method: "GET"
            });

            if (response.ok) {
                return NetResult.make(response.status, "Downloaded file", undefined, await response.blob());
            }
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async getXlsxEval(sessionId: string): Promise<NetResult<Blob>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`export/eval/xlsx/${sessionId}`), {
                method: "GET"
            });

            if (response.ok) {
                return NetResult.make(response.status, "Downloaded file", undefined, await response.blob());
            }
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }

        return NetResult.networkError();
    }

    public static async ask(question: string): Promise<NetResult<AskResponse>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/ask`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: question })
            });
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message, {
                sources: json.sources,
                answer: json.answer
            });
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async eval(criterion: string, answer: string): Promise<NetResult<EvalResponse>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/eval`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ criterion: criterion, answer: answer })
            });
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message, {
                result: json.result
            });
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async newSession(
        displayName: string,
        type: SessionType,
        llm: string,
        retriever: string,
        algorithm: AlgorithmType,
        parameters: AlgorithmParameters
    ): Promise<NetResult<string>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/new_session`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: displayName,
                    type: type.toString(),
                    llm: llm,
                    retriever: retriever,
                    algorithm: algorithm.toString(),
                    ...parameters
                })
            });

            let json = await response.json();
            let sessionId: string = json.session_id;
            return NetResult.make(response.status, json.name, json.message, sessionId);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }

    public static async useConfig(
        displayName: string,
        llm: string,
        retriever: string,
        algorithm: AlgorithmType,
        parameters: AlgorithmParameters
    ): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/config`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: displayName,
                    llm: llm,
                    retriever: retriever,
                    algorithm: algorithm.toString(),
                    ...parameters
                })
            });

            console.log(response.status);
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch {}
        return NetResult.networkError();
    }

    public static async useAlgorithm(type: AlgorithmType, params: AlgorithmParameters): Promise<NetResult<void>> {
        try {
            let response = await fetch(ApiManager.rootPath().concat(`ai/algorithm`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    algorithm: type.toString(),
                    ...params
                })
            });
            let json = await response.json();
            return NetResult.make(response.status, json.name, json.message);
        } catch (error) {
            console.log(error);
        }
        return NetResult.networkError();
    }
}

export { ApiManager, type NetResponse, type FileResult, NetResult };
