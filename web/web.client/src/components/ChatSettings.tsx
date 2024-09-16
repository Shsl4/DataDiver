import { HStack, VStack } from "components/core/Stack.tsx";
import Separator from "components/core/Separator.tsx";
import { FormEvent, KeyboardEvent, MutableRefObject, useContext, useEffect, useState } from "react";
import {
    algorithmChoices,
    choiceOf,
    defaultAlgorithmParameters,
    llmChoices,
    MMRParams,
    retrieverChoices,
    AlgorithmType,
    retrieverTypeFromString,
    SessionConfiguration,
    SimilarityParams,
    SSTParams,
    AlgorithmParameters
} from "Models.ts";
import { ComboBox, ComboChoice } from "components/core/ComboBox.tsx";
import { ApiManager } from "utilities/ApiManager.ts";
import { showNotification } from "components/overlays/NotificationOverlay.tsx";
import { OverlayContext } from "components/overlays/ContentOverlay.tsx";
import { useNavigate } from "react-router-dom";
import { useFadeOut } from "animations/FadeAnimations.ts";
import { ThemeManager } from "../utilities/ThemeManager.ts";

interface ChatSettingsProps {
    container: MutableRefObject<HTMLDivElement>;
    config: SessionConfiguration;
    onUpdated: (newLlm: string) => void;
    onBack: () => void;
    visible: boolean;
}

const choiceStyle = "text stack-h align-c border-radius-small padding-medium ai-choice-button border-radius-medium";
const buttonStyle =
    "stack-h expand text align-c justify-sb border-radius-small ai-select-button box-border padding-medium";

interface SimSelectionParams {
    value: SimilarityParams;
    onChange: (value: SimilarityParams) => void;
    disabled?: boolean;
}

function inputChange(e: FormEvent<HTMLInputElement>): number {
    if (e.currentTarget.valueAsNumber > Number.parseFloat(e.currentTarget.max)) {
        e.currentTarget.value = e.currentTarget.max;
    } else if (e.currentTarget.valueAsNumber < Number.parseFloat(e.currentTarget.min)) {
        e.currentTarget.value = e.currentTarget.min;
    }
    return e.currentTarget.valueAsNumber;
}

function validateKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key == "Backspace" || e.key == ".") return;
    if (!isFinite(Number.parseFloat(e.key))) {
        e.preventDefault();
    }
}

function SimSelection({ value, onChange, disabled }: SimSelectionParams) {
    const [state, setState] = useState<SimilarityParams>(value);

    function kChanged(e: FormEvent<HTMLInputElement>) {
        state.k = inputChange(e);
        onChange(state);
        setState(state);
    }

    useEffect(() => {
        onChange(state);
    }, [state]);

    return (
        <HStack className="expand-h">
            <VStack className="expand-h">
                <label className="text">K</label>
                <label className="text-small">
                    The number of documents to retrieve when querying the database (2 - 100)
                </label>
            </VStack>
            <input
                disabled={disabled}
                min={2}
                max={100}
                defaultValue={value.k}
                onKeyDown={validateKey}
                onInput={kChanged}
                className="expand-h padding-medium text border-radius-small my-input"
                placeholder="e.g: 4"
                type="number"
            />
        </HStack>
    );
}

interface SstSelectionParams {
    value: SSTParams;
    onChange: (value: SSTParams) => void;
    disabled?: boolean;
}

function SstSelection({ value, onChange, disabled }: SstSelectionParams) {
    const [state, setState] = useState<SSTParams>(value);

    function kChanged(e: FormEvent<HTMLInputElement>) {
        state.k = inputChange(e);
        onChange(state);
        setState(state);
    }

    function thershChanged(e: FormEvent<HTMLInputElement>) {
        state.score_threshold = inputChange(e);
        onChange(state);
        setState(state);
    }

    useEffect(() => {
        onChange(state);
    }, [state]);

    return (
        <VStack className="expand-h gap-medium">
            <HStack className="expand-h">
                <VStack className="expand-h">
                    <label className="text">K</label>
                    <label className="text-small">
                        The number of documents to retrieve when querying the database (2 - 100)
                    </label>
                </VStack>
                <input
                    disabled={disabled}
                    min={2}
                    max={100}
                    defaultValue={value.k}
                    onKeyDown={validateKey}
                    onInput={kChanged}
                    className="expand-h padding-medium text border-radius-small my-input"
                    placeholder="e.g: 4"
                    type="number"
                />
            </HStack>
            <HStack className="expand-h">
                <VStack className="expand-h">
                    <label className="text">Score Threshold</label>
                    <label className="text-small">
                        The minimal relevancy score for a document to be considered (0.0 - 1.0)
                    </label>
                </VStack>
                <input
                    disabled={disabled}
                    min={0.0}
                    max={1.0}
                    defaultValue={value.score_threshold}
                    onKeyDown={validateKey}
                    onInput={thershChanged}
                    className="expand-h padding-medium text border-radius-small my-input"
                    placeholder="e.g: 0.4"
                    type="number"
                />
            </HStack>
        </VStack>
    );
}

interface MmrSelectionParams {
    value: MMRParams;
    onChange: (value: MMRParams) => void;
    disabled?: boolean;
}

function MmrSelection({ value, onChange, disabled }: MmrSelectionParams) {
    const [state, setState] = useState<MMRParams>(value);

    function fetchKChanged(e: FormEvent<HTMLInputElement>) {
        state.fetch_k = inputChange(e);
        setState(state);
        onChange(state);
    }

    function lambdaMultChanged(e: FormEvent<HTMLInputElement>) {
        state.lambda_mult = inputChange(e);
        setState(state);
        onChange(state);
    }

    useEffect(() => {
        onChange(state);
    }, [state]);

    return (
        <VStack className="expand-h gap-medium">
            <HStack className="expand-h">
                <VStack className="expand-h">
                    <label className="text">Fetch K</label>
                    <label className="text-small">The number of documents to pass to the MMR algorithm (2 - 100)</label>
                </VStack>
                <input
                    disabled={disabled}
                    min={2}
                    max={100}
                    defaultValue={value.fetch_k}
                    onKeyDown={validateKey}
                    onInput={fetchKChanged}
                    className="expand-h padding-medium text border-radius-small my-input"
                    placeholder="e.g: 4"
                    type="number"
                />
            </HStack>
            <HStack className="expand-h">
                <VStack className="expand-h">
                    <label className="text">Lambda Mult</label>
                    <label className="text-small">
                        Diversity of results selected (0.0 - 1.0, 0 = Max diversity, 1 = Min diversity)
                    </label>
                </VStack>
                <input
                    disabled={disabled}
                    min={0.0}
                    max={1.0}
                    defaultValue={value.lambda_mult}
                    onKeyDown={validateKey}
                    onInput={lambdaMultChanged}
                    className="expand-h padding-medium text border-radius-small my-input"
                    placeholder="e.g: 0.5"
                    type="number"
                />
            </HStack>
        </VStack>
    );
}

interface ParameterSelectParams {
    retrieverType: AlgorithmType;
    defaultValue: AlgorithmParameters;
    onChange: (value: AlgorithmParameters) => void;
    disabled?: boolean;
}

function ParameterSelect({ retrieverType, defaultValue, onChange, disabled }: ParameterSelectParams) {
    switch (retrieverType) {
        case AlgorithmType.sim:
            return <SimSelection disabled={disabled} onChange={onChange} value={defaultValue as SimilarityParams} />;

        case AlgorithmType.sst:
            return <SstSelection disabled={disabled} onChange={onChange} value={defaultValue as SSTParams} />;
    }

    return <MmrSelection disabled={disabled} onChange={onChange} value={defaultValue as MMRParams} />;
}

interface ParametersViewParams {
    retrieverType: AlgorithmType;
    config: SessionConfiguration;
    parameters: AlgorithmParameters;
    onChange: (value: AlgorithmParameters) => void;
    onLlmChange: (choice: ComboChoice) => Promise<boolean>;
    onRetrieverChange: (choice: ComboChoice) => Promise<boolean>;
    onAlgorithmChange: (choice: ComboChoice) => Promise<boolean>;
    onDisplayNameChange: (value: string) => void;
    disabled?: boolean;
}

interface SelectParams {
    onChange: (choice: ComboChoice) => Promise<boolean>;
    defaultValue?: ComboChoice;
    disabled?: boolean;
}

interface DisplayNameParams {
    onChange: (value: string) => void;
    defaultValue: string;
    disabled?: boolean;
}

function DisplayNameSelect({ onChange, defaultValue, disabled }: DisplayNameParams) {
    return (
        <HStack className="expand-h">
            <VStack className="expand-h">
                <label className="text">Display Name</label>
                <label className="text-small">Set a human friendly display name for this session</label>
            </VStack>
            <input
                disabled={disabled}
                defaultValue={defaultValue}
                onInput={e => onChange(e.currentTarget.value)}
                className="expand-h padding-medium text border-radius-small my-input"
                placeholder="e.g: Cybersecurity Chat"
            />
        </HStack>
    );
}

function LlmSelect({ onChange, defaultValue, disabled }: SelectParams) {
    return (
        <HStack className="expand-h">
            <VStack className="expand-h justify-c">
                <label className="text">LLM</label>
                <label className="text-small">Choose a large language model to generate your answers</label>
            </VStack>
            <ComboBox
                disabled={disabled}
                choices={llmChoices}
                choiceClass={choiceStyle}
                buttonClass={buttonStyle}
                onChange={onChange}
                defaultValue={defaultValue}
            />
        </HStack>
    );
}

function RetrieverSelect({ onChange, defaultValue, disabled }: SelectParams) {
    return (
        <HStack className="expand-h">
            <VStack className="expand-h justify-c">
                <label className="text">Retriever</label>
                <label className="text-small">Choose a retriever model to retrieve documents in the database</label>
            </VStack>
            <ComboBox
                disabled={disabled}
                choices={retrieverChoices}
                choiceClass={choiceStyle}
                buttonClass={buttonStyle}
                onChange={onChange}
                defaultValue={defaultValue}
            />
        </HStack>
    );
}

function AlgorithmSelect({ onChange, defaultValue, disabled }: SelectParams) {
    return (
        <HStack className="expand-h">
            <VStack className="expand-h">
                <label className="text">Retrieval Settings</label>
                <label className="text-small">Customize your RAG retrieval algorithm settings</label>
            </VStack>
            <ComboBox
                disabled={disabled}
                choices={algorithmChoices}
                choiceClass={choiceStyle}
                buttonClass={buttonStyle}
                defaultValue={defaultValue}
                onChange={onChange}
            />
        </HStack>
    );
}

function ParametersView({
    retrieverType,
    config,
    parameters,
    onChange,
    onLlmChange,
    onRetrieverChange,
    onAlgorithmChange,
    onDisplayNameChange,
    disabled = false
}: ParametersViewParams) {
    return (
        <VStack className="expand-h">
            <DisplayNameSelect disabled={disabled} onChange={onDisplayNameChange} defaultValue={config.display_name} />
            <LlmSelect
                disabled={disabled}
                onChange={onLlmChange}
                defaultValue={choiceOf(llmChoices, config.llm_name)}
            />
            <RetrieverSelect
                disabled={disabled}
                onChange={onRetrieverChange}
                defaultValue={choiceOf(retrieverChoices, config.retriever_name)}
            />
            <Separator className="margin-v-medium" />
            <AlgorithmSelect
                disabled={disabled}
                onChange={onAlgorithmChange}
                defaultValue={choiceOf(algorithmChoices, retrieverType)}
            />
            <Separator className="margin-v-medium" />
            <ParameterSelect
                disabled={disabled}
                onChange={onChange}
                defaultValue={parameters}
                retrieverType={retrieverType}
            />
        </VStack>
    );
}

const themeChoices: ComboChoice[] = [
    {
        value: "system",
        displayValue: "System"
    },
    {
        value: "light",
        displayValue: "Light"
    },
    {
        value: "dark",
        displayValue: "Dark"
    }
];

function defaultTheme() {
    return themeChoices.find(v => v.value == ThemeManager.currentTheme.name) ?? themeChoices[0];
}

function ChatSettings({ container, config, onUpdated, onBack, visible }: ChatSettingsProps) {
    const context = useContext(OverlayContext);
    const [algorithmType, setAlgorithmType] = useState<AlgorithmType>(config.algorithm_type);
    const [llm, setLlm] = useState<string>(config.llm_name);
    const [retriever, setRetriever] = useState<string>(config.retriever_name);
    const [parameters, setParameters] = useState<AlgorithmParameters>(config.algorithm_params);
    const [displayName, setDisplayName] = useState<string>(config.display_name);
    const [requesting, setRequesting] = useState<boolean>(false);
    const navigate = useNavigate();

    async function onLlmChange(newValue: ComboChoice) {
        setLlm(newValue.value);
        return true;
    }

    async function onRetrieverChange(newValue: ComboChoice) {
        setRetriever(newValue.value);
        return true;
    }

    async function onAlgorithmChange(newValue: ComboChoice) {
        let newType = retrieverTypeFromString(newValue.value);
        setAlgorithmType(newType);
        setParameters(defaultAlgorithmParameters(newType));
        return true;
    }

    async function apply() {
        setRequesting(true);

        let result = await ApiManager.useConfig(displayName, llm, retriever, algorithmType, parameters);

        setRequesting(false);

        if (result.response.code != 200) {
            showNotification(result.response, context);
            return;
        }

        onUpdated(llm);
    }

    function onChange(value: AlgorithmParameters) {
        setParameters(value);
    }

    async function deleteSession() {
        setRequesting(true);
        let result = await ApiManager.deleteSession(config._id);
        await useFadeOut(container, 250);
        setRequesting(false);
        showNotification(result.response, context);
        navigate("/");
    }

    async function themeChanged(value: ComboChoice) {
        ThemeManager.useTheme(value.value);
        return true;
    }

    return (
        <VStack className="expand align-s padding-x-large hidden" ref={container}>
            <label className="text-xx-large">Settings</label>
            <label className="text">Session {config._id}</label>

            <Separator className="margin-v-medium" />

            <VStack className="expand">
                <ParametersView
                    disabled={!visible || requesting}
                    onChange={onChange}
                    config={config}
                    parameters={parameters}
                    retrieverType={algorithmType}
                    onLlmChange={onLlmChange}
                    onRetrieverChange={onRetrieverChange}
                    onAlgorithmChange={onAlgorithmChange}
                    onDisplayNameChange={setDisplayName}
                />

                <HStack className="expand-h padding-top-small">
                    <VStack className="expand-h">
                        <label className="text">Apply</label>
                        <label className="text-small">Apply the modified settings</label>
                    </VStack>
                    <button disabled={!visible || requesting} onClick={apply} className={`${buttonStyle} positive`}>
                        Apply
                    </button>
                </HStack>

                <Separator className="margin-v-medium" />

                <VStack className="expand gap-medium">
                    <HStack className="expand-h">
                        <VStack className="expand-h">
                            <label className="text">Theme</label>
                            <label className="text-small">Select the current appearance</label>
                        </VStack>
                        <ComboBox
                            disabled={!visible || requesting}
                            onChange={themeChanged}
                            defaultValue={defaultTheme()}
                            choiceClass="text stack-h align-c border-radius-small padding-medium ai-choice-button border-radius-medium"
                            buttonClass={buttonStyle}
                            choices={themeChoices}
                        />
                    </HStack>

                    <HStack className="expand-h">
                        <VStack className="expand-h">
                            <label className="text">Chat</label>
                            <label className="text-small">Go back to the chat</label>
                        </VStack>
                        <button disabled={!visible || requesting} onClick={onBack} className={buttonStyle}>
                            Back
                        </button>
                    </HStack>
                    <HStack className="expand-h">
                        <VStack className="expand-h">
                            <label className="text">Delete session</label>
                            <label className="text-small">
                                Delete the current session and its associated data (irreversible)
                            </label>
                        </VStack>
                        <button
                            disabled={!visible || requesting}
                            onClick={deleteSession}
                            className={`${buttonStyle} dangerous`}>
                            Delete session
                        </button>
                    </HStack>
                </VStack>
            </VStack>
        </VStack>
    );
}

export {
    ChatSettings,
    ParametersView,
    LlmSelect,
    RetrieverSelect,
    AlgorithmSelect,
    ParameterSelect,
    DisplayNameSelect
};
