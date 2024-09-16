import { useNavigate } from "react-router-dom";
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import {
    AlgorithmSelect,
    DisplayNameSelect,
    LlmSelect,
    ParameterSelect,
    RetrieverSelect
} from "components/ChatSettings.tsx";
import {
    algorithmChoices,
    AlgorithmParameters,
    AlgorithmType,
    choiceOf,
    defaultAlgorithmParameters,
    llmChoices,
    MMRParams,
    retrieverChoices,
    retrieverTypeFromString,
    SessionType,
    SimilarityParams,
    SSTParams
} from "Models.ts";
import { ComboChoice } from "components/core/ComboBox.tsx";
import { useFadeIn, useFadeOut } from "animations/FadeAnimations.ts";
import { ApiManager, NetResponse } from "utilities/ApiManager.ts";
import { FormStep, Step } from "components/Step.tsx";
import useCustomAnim from "animations/CustomAnimation.ts";
import Loader from "./Loader.tsx";
import { HStack, VStack } from "components/core/Stack.tsx";
import Separator from "components/core/Separator.tsx";
import { OverlayContext, OverlayObject } from "components/overlays/ContentOverlay.tsx";
import { showNotification } from "components/overlays/NotificationOverlay.tsx";
import "styles/components/messagebox.scss";

const buttonStyle =
    "stack-h align-c justify-c gap-medium padding-x-large text-small border-radius-small box-border large-menu-button border-highlight";

interface NewSessionContextType {
    mode: number;
    setMode: Dispatch<SetStateAction<number>>;
    llm: string;
    setLlm: Dispatch<SetStateAction<string>>;
    algorithmType: AlgorithmType;
    setAlgorithmType: Dispatch<SetStateAction<AlgorithmType>>;
    retriever: string;
    setRetriever: Dispatch<SetStateAction<string>>;
    displayName: string;
    setDisplayName: Dispatch<SetStateAction<string>>;
    parameters: AlgorithmParameters;
    updateParameters: (value: AlgorithmParameters) => void;
}

const NewSessionContext = createContext<NewSessionContextType>(null!);

function ModeSelection() {
    const context = useContext(NewSessionContext);

    return (
        <VStack className="expand-v padding-large align-c justify-c gap-large">
            <label className="text">Select a session mode</label>
            <HStack className="align-c">
                <button
                    onClick={() => context.setMode(0)}
                    className={context.mode == 0 ? `${buttonStyle} large-menu-button-selected` : buttonStyle}>
                    <FontAwesomeIcon icon={faComments} />
                    <label className="ignore-cursor">Conversation Mode</label>
                </button>
                <button
                    onClick={() => context.setMode(1)}
                    className={context.mode == 1 ? `${buttonStyle} large-menu-button-selected` : buttonStyle}>
                    <FontAwesomeIcon icon={faLightbulb} />
                    <label className="ignore-cursor">Evaluation Mode</label>
                </button>
            </HStack>
        </VStack>
    );
}

function ConfigurationList() {
    const context = useContext(NewSessionContext);

    async function onLlmChange(newValue: ComboChoice) {
        context.setLlm(newValue.value);
        return true;
    }

    async function onRetrieverChange(newValue: ComboChoice) {
        context.setRetriever(newValue.value);
        return true;
    }

    async function onAlgorithmChange(newValue: ComboChoice) {
        let newType = retrieverTypeFromString(newValue.value);
        context.setAlgorithmType(newType);
        context.updateParameters(defaultAlgorithmParameters(newType));
        return true;
    }

    function onChange(value: AlgorithmParameters) {
        context.updateParameters(value);
    }

    return (
        <>
            <VStack className="padding-h-medium padding-bottom-medium">
                <DisplayNameSelect onChange={context.setDisplayName} defaultValue={context.displayName} />
                <LlmSelect onChange={onLlmChange} defaultValue={choiceOf(llmChoices, context.llm)} />
                <RetrieverSelect
                    onChange={onRetrieverChange}
                    defaultValue={choiceOf(retrieverChoices, context.retriever)}
                />
            </VStack>
            <Separator />
            <VStack className="padding-medium">
                <AlgorithmSelect
                    onChange={onAlgorithmChange}
                    defaultValue={choiceOf(algorithmChoices, context.algorithmType.toString())}
                />
            </VStack>
            <Separator />
            <VStack className="padding-medium">
                <ParameterSelect
                    retrieverType={context.algorithmType}
                    defaultValue={context.parameters}
                    onChange={onChange}
                />
            </VStack>
        </>
    );
}

const steps: FormStep[] = [
    {
        title: "Select Mode",
        component: <ModeSelection />
    },
    {
        title: "Choose parameters",
        component: <ConfigurationList />
    },
    {
        title: "Generate Session",
        component: (
            <Loader
                title={"Generating session"}
                subtitle={"Generating a new session with the provided parameters"}
                loading={true}
            />
        )
    }
];

function NewSession({ overlayId }: OverlayObject) {
    const context = useContext(OverlayContext);
    const [currentPage, setCurrentPage] = useState(0);
    const previousButton = useRef<HTMLButtonElement>(null!);
    const nextButton = useRef<HTMLButtonElement>(null!);
    const [valid, setValid] = useState(true);
    const [mode, setMode] = useState(-1);
    const [algorithmType, setAlgorithmType] = useState<AlgorithmType>(AlgorithmType.sst);
    const [llm, setLlm] = useState<string>(llmChoices[0].value);
    const [retriever, setRetriever] = useState<string>(retrieverChoices[2].value);
    const [parameters, setParameters] = useState<AlgorithmParameters>(defaultAlgorithmParameters(algorithmType));
    const [displayName, setDisplayName] = useState("");
    const buttonContainer = useRef<HTMLDivElement>(null!);

    const container = useRef<HTMLDivElement>(null!);
    const navigate = useNavigate();

    async function handlePrevious() {
        if (currentPage == 0) {
            context.content.current.removeChild(overlayId);
            return;
        }
        await useFadeOut(container, 250, false);
        setCurrentPage(currentPage - 1);
    }

    async function handleNext() {
        await useFadeOut(container, 250, false);
        setCurrentPage(currentPage + 1);
    }

    function handleError(response: NetResponse) {
        showNotification(response, context);
        context.content.current.removeChild(overlayId);
    }

    async function makeSession() {
        let result = await ApiManager.newSession(
            displayName,
            mode == 0 ? SessionType.chat : SessionType.evaluation,
            llm,
            retriever,
            algorithmType,
            parameters
        );
        if (!result.value) {
            return handleError(result.response);
        }

        navigate(`/session/${result.value}`);
        context.content.current.removeChild(overlayId);
    }

    useEffect(() => {
        useFadeIn(container, 250).finally();

        if (currentPage == steps.length - 1) {
            let height = buttonContainer.current.getBoundingClientRect().height;
            useCustomAnim(
                buttonContainer,
                [
                    {
                        opacity: "1",
                        height: `${height}px`
                    },
                    { opacity: "0", height: "0", paddingTop: "0", paddingBottom: "0" }
                ],
                250
            );
            makeSession().finally();
        }
    }, [currentPage]);

    function makeSteps() {
        return steps.map((step, index) => {
            return <Step step={step} key={step.title} currentIndex={currentPage} index={index} />;
        });
    }

    function validateParams(value: AlgorithmParameters): boolean {
        switch (algorithmType) {
            case AlgorithmType.sst:
                let sst = value as SSTParams;
                return sst.k != null && !isNaN(sst.k) && sst.score_threshold != null && !isNaN(sst.score_threshold);

            case AlgorithmType.sim:
                let sim = value as SimilarityParams;
                return sim.k != null && !isNaN(sim.k);

            case AlgorithmType.mmr:
                let mmr = value as MMRParams;
                return mmr.fetch_k != null && !isNaN(mmr.fetch_k) && mmr.lambda_mult != null && !isNaN(mmr.lambda_mult);
        }
    }

    function updateParameters(value: AlgorithmParameters) {
        setValid(validateParams(value));
        setParameters(value);
    }

    function nextButtonEnabled() {
        if (currentPage == 0) {
            return mode >= 0;
        }

        if (currentPage == 1) {
            return valid && !displayName.isEmpty();
        }

        return currentPage < steps.length - 1;
    }

    return (
        <NewSessionContext.Provider
            value={{
                mode,
                setMode,
                llm,
                setLlm,
                algorithmType: algorithmType,
                setAlgorithmType: setAlgorithmType,
                retriever,
                setRetriever,
                displayName,
                setDisplayName,
                parameters,
                updateParameters
            }}>
            <VStack className="popover border-radius-medium auto-scroll" style={{ minWidth: "60%", minHeight: "70%" }}>
                <VStack className="expand-h padding-h-large padding-top-large">
                    <label className="title">New Session</label>
                    <label className="subtitle">Create a new session</label>
                </VStack>
                <Separator className="margin-v-medium" />

                <VStack className="expand-h padding-h-large align-c">
                    <HStack className="gap-none align-c justify-c" style={{ minWidth: "80%", maxWidth: "100%" }}>
                        {makeSteps()}
                    </HStack>
                </VStack>

                <Separator className="margin-v-medium" />

                <VStack ref={container} className="expand auto-scroll">
                    {steps[currentPage].component}
                </VStack>

                <HStack ref={buttonContainer} className="expand-h justify-sb padding-large auto-clip">
                    <button
                        ref={previousButton}
                        disabled={currentPage == steps.length - 1}
                        className="text-large border-radius-small box-border basic-button"
                        onClick={handlePrevious}>
                        Back
                    </button>
                    <button
                        className="border-radius-small box-border basic-button"
                        disabled={!nextButtonEnabled()}
                        ref={nextButton}
                        onClick={handleNext}>
                        Next
                    </button>
                </HStack>
            </VStack>
        </NewSessionContext.Provider>
    );
}

export default NewSession;
