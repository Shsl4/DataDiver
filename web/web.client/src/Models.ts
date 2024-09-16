import moment from "moment";
import { ComboChoice } from "components/core/ComboBox.tsx";

type AlgorithmParameters = SSTParams | MMRParams | SimilarityParams;

enum AlgorithmType {
    sim = "similarity",
    sst = "similarity_score_threshold",
    mmr = "mmr"
}

interface SSTParams {
    k: number;
    score_threshold: number;
}

interface SimilarityParams {
    k: number;
}

interface SessionData {
    config: SessionConfiguration;
    history?: HistoryMessage[];
    data?: EvaluationData;
}

interface MMRParams {
    fetch_k: number;
    lambda_mult: number;
}

enum SessionType {
    chat = "chat",
    evaluation = "evaluation"
}

interface SessionConfiguration {
    _id: string;
    display_name: string;
    session_type: SessionType;
    llm_name: string;
    retriever_name: string;
    algorithm_type: AlgorithmType;
    algorithm_params: MMRParams | SSTParams | SimilarityParams;
}

interface HistoryMessage {
    type: string;
    content: string;
    timestamp: moment.Moment;
    llm?: string;
    sources?: Record<string, Array<number>>;
}

interface EvaluationResult {
    result_id: string;
    criterion: string;
    grade: number;
    remark: string;
    timestamp: string;
    llm: string;
    sources: Record<string, Array<number>>;
}

interface EvaluationData {
    scenario: string;
    criteria: string[];
    answers: Record<string, string>;
    results: Record<string, EvaluationResult[]>;
}

interface AskResponse {
    answer: string;
    sources: Record<string, Array<number>>;
}

interface EvalResponse {
    result: EvaluationResult;
}

let llmChoices: ComboChoice[] = [
    { icon: "/icons/mistral.svg", value: "mistral", displayValue: "Mistral" },
    { icon: "/icons/microsoft.svg", value: "phi3", displayValue: "Phi3" },
    { icon: "/icons/meta.svg", value: "llama3.1", displayValue: "Llama 3.1" }
];

let retrieverChoices: ComboChoice[] = [
    { value: "sentence-transformers/all-MiniLM-L12-v2" },
    { value: "sentence-transformers/all-mpnet-base-v2" },
    { value: "BAAI/bge-m3" }
];

let algorithmChoices: ComboChoice[] = [
    { value: "similarity", displayValue: "Similarity" },
    { value: "similarity_score_threshold", displayValue: "Similarity Score Threshold" },
    { value: "mmr", displayValue: "Maximum Marginal Relevance" }
];

function choiceOf(choices: ComboChoice[], name: string) {
    for (let i = 0; i < choices.length; ++i) {
        if (choices[i].value == name) {
            return choices[i];
        }
    }
    console.warn(`The provided choices do not contain any choice named ${name}!`);
}

function retrieverTypeFromString(value: string): AlgorithmType {
    if (value == "similarity") {
        return AlgorithmType.sim;
    }
    if (value == "similarity_score_threshold") {
        return AlgorithmType.sst;
    }
    return AlgorithmType.mmr;
}

function defaultAlgorithmParameters(retrieverType: AlgorithmType): AlgorithmParameters {
    switch (retrieverType) {
        case AlgorithmType.mmr:
            return {
                fetch_k: 20,
                lambda_mult: 0.5
            };
        case AlgorithmType.sim:
            return {
                k: 5
            };
        case AlgorithmType.sst:
            return {
                k: 5,
                score_threshold: 0.4
            };
    }
}

function selectGradient(model?: string) {
    switch (model) {
        case "llama3.1":
            return "meta-gradient";
        case "phi3":
            return "microsoft-gradient";
        default:
            return "mistral-gradient";
    }
}

function selectIcon(model?: string) {
    switch (model) {
        case "mistral":
            return "/icons/mistral.svg";
        case "llama3.1":
            return "/icons/meta.svg";
        case "phi3":
            return "/icons/microsoft.svg";
    }

    return "/icons/user.svg";
}

export {
    AlgorithmType,
    SessionType,
    type SSTParams,
    type SimilarityParams,
    type MMRParams,
    type SessionConfiguration,
    type HistoryMessage,
    type AskResponse,
    type EvalResponse,
    type AlgorithmParameters,
    type SessionData,
    type EvaluationData,
    type EvaluationResult,
    llmChoices,
    retrieverChoices,
    algorithmChoices,
    choiceOf,
    retrieverTypeFromString,
    defaultAlgorithmParameters,
    selectGradient,
    selectIcon
};
