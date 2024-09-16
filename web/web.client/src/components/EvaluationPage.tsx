import { HStack, VStack } from "components/core/Stack.tsx";
import { NotificationType, showNotification } from "components/overlays/NotificationOverlay.tsx";
import { OverlayContext, OverlayObject } from "components/overlays/ContentOverlay.tsx";
import {
    createContext,
    Dispatch,
    FormEvent,
    ReactElement,
    SetStateAction,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import {
    AlgorithmParameters,
    AlgorithmType,
    defaultAlgorithmParameters,
    retrieverTypeFromString,
    SessionData
} from "Models.ts";
import { useFadeIn, useFadeOut } from "animations/FadeAnimations.ts";
import { ParametersView } from "components/ChatSettings.tsx";

import { useNavigate } from "react-router-dom";
import Separator from "./core/Separator.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faComments, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { v4 } from "uuid";
import useAnimation from "../hooks/useAnimation.ts";
import { ApiManager } from "../utilities/ApiManager.ts";
import { FormStep, Step } from "./Step.tsx";
import { downloadBlob } from "../utilities/DownloadBlob.ts";
import { ComboBox, ComboChoice } from "./core/ComboBox.tsx";

import "styles/main.scss";
import "styles/components/messagebox.scss";
import Loader from "./Loader.tsx";
import { ThemeManager } from "../utilities/ThemeManager.ts";

const buttonStyle =
    "stack-h expand text align-c justify-sb border-radius-small ai-select-button box-border padding-medium";
const otherButtonStyle = "stack-h align-c justify-c padding-medium border-radius-small box-border delete-entry-button";
const menuButton =
    "stack-h align-c justify-c gap-medium padding-x-large text-small border-radius-small box-border large-menu-button";
const listButtonStyle =
    "stack-h align-c justify-s gap-medium padding-medium text border-radius-small box-border large-menu-button border-highlight";
const selectAllButtonStyle =
    "stack-h align-c justify-c gap-medium padding-medium text border-radius-small box-border background-primary pointer border-highlight";
const selectAnswerButtonStyle =
    "padding-medium text border-radius-small box-border background-primary pointer border-highlight";
interface EvaluationPageProps {
    data: SessionData;
}

interface CriteriaEditProps extends OverlayObject {
    criteria: string[];
    submit: (values: string[]) => void;
}

interface ScenarioEditProps extends OverlayObject {
    scenario: string;
    submit: (values: string) => void;
}

interface CriteriaListProps {
    elements: Map<string, string>;
    fieldUpdated: (id: string, value: string) => void;
    removeCriterion: (id: string) => void;
}

interface CriteriaListElementProps {
    id: string;
    criterion: string;
    fieldUpdated: (id: string, value: string) => void;
    removeCriterion: (id: string) => void;
}
async function betterScaleOut<T extends HTMLElement>(element: T, animDuration: number) {
    if (!element) return;

    element.style.display = "";

    let keyframes = [
        { maxHeight: `${element.getBoundingClientRect().height}px` },
        { maxHeight: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, opacity: 0, border: 0 }
    ];

    const animation = element.animate(keyframes, {
        duration: animDuration,
        fill: "forwards",
        easing: "ease"
    });

    await useAnimation(animation);

    element.style.display = "none";
}
function CriteriaListElement({ id, criterion, fieldUpdated, removeCriterion }: CriteriaListElementProps) {
    const body = useRef<HTMLDivElement>(null!);

    async function removeSelf() {
        console.log(`removing: ${id}`);
        await betterScaleOut(body.current, 250);
        removeCriterion(id);
    }

    useEffect(() => {
        useFadeIn(body, 250);
        return () => console.log(`killed ${id}`);
    }, []);

    return (
        <HStack ref={body} className="expand-h padding-h-large padding-top-medium">
            <input
                defaultValue={criterion}
                onInput={e => fieldUpdated(id, e.currentTarget.value)}
                className="expand-h padding-medium text border-radius-small my-input"
                placeholder="e.g: Internal communication"
            />
            <button disabled={false} onClick={removeSelf} className={otherButtonStyle}>
                <FontAwesomeIcon icon={faTrashCan} />
            </button>
        </HStack>
    );
}

function CriteriaList({ elements, fieldUpdated, removeCriterion }: CriteriaListProps) {
    if (elements.size == 0) {
        return (
            <VStack className="expand align-c justify-c auto-fade-in">
                <label className="title">No criteria</label>
                <label className="subtitle">Press the "Add criterion" button to add a new criterion</label>
            </VStack>
        );
    }

    let components: ReactElement[] = [];

    elements.forEach((value, id) => {
        components.push(
            <CriteriaListElement
                key={id}
                id={id}
                criterion={value}
                fieldUpdated={fieldUpdated}
                removeCriterion={removeCriterion}
            />
        );
    });

    return components;
}

function makeIdentified(values: string[]): Map<string, string> {
    let myMap = new Map<string, string>();

    for (const criterion of values) {
        myMap.set(v4(), criterion);
    }

    return myMap;
}

function CriteriaEdit({ criteria, submit, overlayId }: CriteriaEditProps) {
    const context = useContext(OverlayContext);
    const [elements, setElements] = useState<Map<string, string>>(makeIdentified(criteria));
    const content = useRef<HTMLDivElement>(null!);
    const [fadeIn, setFadeIn] = useState<boolean>(false);

    function closeView() {
        context.content.current.removeChild(overlayId);
    }

    async function removeCriterion(id: string) {
        let newValue = new Map(elements);
        newValue.delete(id);
        setElements(newValue);
    }

    function fieldUpdated(id: string, value: string) {
        let newValue = new Map(elements);
        newValue.set(id, value);
        setElements(newValue);
    }

    async function apply() {
        let newCriteria = Array.from(elements.values());
        let result = await ApiManager.useCriteria(newCriteria);

        if (result.response.code != 200) {
            showNotification(result.response, context);
        } else {
            submit(newCriteria);
            closeView();
        }
    }

    async function addCriterion() {
        if (elements.size == 0) {
            await useFadeOut(content, 250, false);
            setFadeIn(true);
        }
        let newValue = new Map(elements);
        newValue.set(v4(), "");
        setElements(newValue);
    }

    useEffect(() => {
        if (fadeIn) {
            useFadeIn(content, 250);
            setFadeIn(false);
        }
    }, [fadeIn]);

    function valid() {
        return elements.size > 0 && Array.from(elements.values()).filter(v => v.isEmpty()).length == 0;
    }

    return (
        <VStack className="popover border-radius-medium auto-scroll" style={{ minWidth: "60%", height: "60%" }}>
            <VStack className="expand-h padding-h-large padding-top-large">
                <label className="title">Criteria</label>
                <label className="subtitle">Add or remove criteria for your evaluation</label>
            </VStack>

            <Separator className="margin-v-medium" />

            <VStack ref={content} className="expand auto-scroll gap-none">
                <CriteriaList elements={elements} fieldUpdated={fieldUpdated} removeCriterion={removeCriterion} />
            </VStack>

            <HStack className="expand-h justify-sb padding-large">
                <button className="text-large border-radius-small box-border basic-button" onClick={closeView}>
                    Back
                </button>
                <HStack>
                    <button className="border-radius-small box-border basic-button" onClick={addCriterion}>
                        Add Criterion
                    </button>
                    <button
                        disabled={!valid()}
                        className="border-radius-small box-border basic-button positive"
                        onClick={apply}>
                        Apply
                    </button>
                </HStack>
            </HStack>
        </VStack>
    );
}

function ScenarioEdit({ scenario, submit, overlayId }: ScenarioEditProps) {
    const context = useContext(OverlayContext);
    const [value, setValue] = useState<string>(scenario);

    function closeView() {
        context.content.current.removeChild(overlayId);
    }

    function edited(event: FormEvent<HTMLTextAreaElement>) {
        setValue(event.currentTarget.value);
    }

    async function apply() {
        if (!valid()) return;

        let result = await ApiManager.useScenario(value);

        console.log(value);
        if (result.response.code != 200) {
            showNotification(result.response, context);
        } else {
            submit(value);
            closeView();
        }
    }

    function valid() {
        return !value.isEmpty();
    }

    return (
        <VStack className="popover border-radius-medium auto-scroll" style={{ minWidth: "60%", height: "60%" }}>
            <VStack className="expand-h padding-h-large padding-top-large">
                <label className="title">Scenario</label>
                <label className="subtitle">Edit the scenario for your evaluation</label>
            </VStack>

            <Separator className="margin-v-medium" />

            <VStack className="expand padding-h-large padding-top-medium auto-scroll">
                <textarea
                    onInput={edited}
                    placeholder="Write your scenario here..."
                    defaultValue={scenario}
                    className="scenario-box text expand padding-large box-border border-radius-medium"
                />
            </VStack>

            <HStack className="expand-h justify-sb padding-large">
                <button className="text-large border-radius-small box-border basic-button" onClick={closeView}>
                    Back
                </button>
                <HStack>
                    <button
                        disabled={!valid()}
                        className="border-radius-small box-border basic-button positive"
                        onClick={apply}>
                        Apply
                    </button>
                </HStack>
            </HStack>
        </VStack>
    );
}
interface NewEvaluationContextType {
    overlayId: string;
    criteria: string[];
    answers: Record<string, string>;
    mode: number;
    setMode: Dispatch<SetStateAction<number>>;
    answer: string;
    setAnswer: Dispatch<SetStateAction<string>>;
    selectedCriteria: string[];
    setSelectedCriteria: Dispatch<SetStateAction<string[]>>;
}

const NewEvaluationContext = createContext<NewEvaluationContextType>(null!);

function AnswerTypeSelect() {
    const context = useContext(NewEvaluationContext);

    return (
        <VStack className="expand-v padding-large align-c justify-c gap-large">
            <label className="text">Select an answer type</label>
            <HStack className="align-c">
                <button
                    onClick={() => context.setMode(1)}
                    className={context.mode == 1 ? `${menuButton} large-menu-button-selected` : menuButton}>
                    <FontAwesomeIcon icon={faAdd} />
                    <label className="ignore-cursor">New answer</label>
                </button>
                <button
                    onClick={() => context.setMode(0)}
                    className={context.mode == 0 ? `${menuButton} large-menu-button-selected` : menuButton}>
                    <FontAwesomeIcon icon={faComments} />
                    <label className="ignore-cursor">Existing answer</label>
                </button>
            </HStack>
        </VStack>
    );
}

function AnswerSelect() {
    const context = useContext(NewEvaluationContext);

    if (context.mode == 0) {
        if (Object.entries(context.answers).length == 0) {
            context.setAnswer("");
            return (
                <VStack className="expand align-c justify-c auto-fade-in">
                    <label className="title">No answers</label>
                    <label className="subtitle">There is no answer history, please create a new answer instead</label>
                </VStack>
            );
        }

        function select(value: string) {
            context.setAnswer(value);
        }

        if (!Object.values(context.answers).find(v => v == context.answer)) {
            context.setAnswer("");
        }

        console.log(context.answers);

        return (
            <VStack className="padding-medium gap-large">
                <label className="text-large padding-h-medium">Select the answer to evaluate:</label>
                <VStack className="padding-h-medium">
                    {Object.entries(context.answers).map(([id, value]) => (
                        <button
                            key={id}
                            className={
                                context.answer == value
                                    ? `${selectAnswerButtonStyle} large-menu-button-selected`
                                    : selectAnswerButtonStyle
                            }
                            onClick={() => select(value)}
                            style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxHeight: "4em"
                            }}>
                            {value}
                        </button>
                    ))}
                </VStack>
            </VStack>
        );
    }

    return (
        <VStack className="expand padding-h-large padding-top-medium gap-large">
            <label className="text-large">Write your answer below:</label>
            <VStack className="expand auto-scroll">
                <textarea
                    defaultValue={context.answer}
                    onInput={e => {
                        context.setAnswer(e.currentTarget.value);
                    }}
                    placeholder="Write your answer..."
                    className="scenario-box text expand padding-large box-border border-radius-medium"
                />
            </VStack>
        </VStack>
    );
}

function CriteriaSelect() {
    const context = useContext(NewEvaluationContext);

    function toggle(value: string) {
        if (context.selectedCriteria.filter(v => v == value).length > 0) {
            console.log("removing");
            context.setSelectedCriteria(context.selectedCriteria.filter(v => v != value));
        } else {
            console.log("adding", [...context.selectedCriteria, value]);
            context.setSelectedCriteria([...context.selectedCriteria, value]);
        }
    }

    function selectAll() {
        if (context.criteria == context.selectedCriteria) {
            context.setSelectedCriteria([]);
        } else {
            context.setSelectedCriteria(context.criteria);
        }
    }

    return (
        <VStack className={"expand padding-h-medium gap-medium"}>
            <HStack className="expand-h align-c justify-sb padding-right-medium">
                <label className="text-large padding-h-medium">Select the criteria to evaluate:</label>
                <button className={selectAllButtonStyle} onClick={selectAll}>
                    Toggle All
                </button>
            </HStack>
            <VStack className={"padding-h-medium gap-medium"}>
                {context.criteria.map(criterion => (
                    <button
                        key={criterion}
                        className={
                            context.selectedCriteria.filter(v => v == criterion).length > 0
                                ? `${listButtonStyle} large-menu-button-selected`
                                : listButtonStyle
                        }
                        onClick={() => toggle(criterion)}>
                        {criterion}
                    </button>
                ))}
            </VStack>
        </VStack>
    );
}

function EvaluateView() {
    const context = useContext(NewEvaluationContext);
    const ovContext = useContext(OverlayContext);
    const [current, setCurrent] = useState<number>(0);
    const [errors, setErrors] = useState<number>(0);
    const [currentName, setCurrentName] = useState<string>(context.selectedCriteria[0]);

    async function run() {
        let val = 1;
        let currentErrors = 0;
        for (let criterion of context.selectedCriteria) {
            setCurrentName(criterion);
            setCurrent(val);
            let result = await ApiManager.eval(criterion, context.answer);
            if (result.response.code != 200) {
                showNotification(result.response, ovContext);
                currentErrors++;
                setErrors(currentErrors);
            }
            val++;
        }
        ovContext.content.current.removeChild(context.overlayId);

        if (val - 1 == currentErrors) {
            ovContext.notification.current.makeNotification({
                title: `All evaluation attempts failed!`,
                type: NotificationType.Error,
                duration: 20000
            });
        } else {
            ovContext.notification.current.makeNotification({
                title: `Evaluated ${val - 1} criteria`,
                type: NotificationType.Success,
                duration: 20000
            });
        }
    }

    useEffect(() => {
        run();
    }, []);

    return (
        <VStack className={"expand align-c justify-c"}>
            <Loader
                title={`Evaluating answer... (${current}/${context.selectedCriteria.length})`}
                subtitle={`Evaluating criteria ${currentName} (${errors} errors)`}
            />
        </VStack>
    );
}

const steps: FormStep[] = [
    {
        title: "Answer type",
        component: <AnswerTypeSelect />
    },
    {
        title: "Select answer",
        component: <AnswerSelect />
    },
    {
        title: "Select criteria",
        component: <CriteriaSelect />
    },
    {
        title: "Evaluate",
        component: <EvaluateView />
    }
];

interface EvaluationEditProps extends OverlayObject {
    scenario: string;
    criteria: string[];
    answers: Record<string, string>;
}

function NewEvaluation({ scenario, answers, criteria, overlayId = "" }: EvaluationEditProps) {
    const context = useContext(OverlayContext);
    const [transition, setTransition] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [mode, setMode] = useState<number>(-1);
    const [answer, setAnswer] = useState<string>("");
    const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
    const previousButton = useRef<HTMLButtonElement>(null!);
    const nextButton = useRef<HTMLButtonElement>(null!);
    const container = useRef<HTMLDivElement>(null!);
    const buttonContainer = useRef<HTMLDivElement>(null!);

    async function handlePrevious() {
        if (currentPage == 0) {
            context.content.current.removeChild(overlayId);
            return;
        }
        setTransition(true);
        await useFadeOut(container, 250, false);
        setCurrentPage(currentPage - 1);
    }

    async function handleNext() {
        setTransition(true);
        await useFadeOut(container, 250, false);
        setCurrentPage(currentPage + 1);
    }

    function makeSteps() {
        return steps.map((step, index) => {
            return <Step step={step} key={step.title} currentIndex={currentPage} index={index} />;
        });
    }

    function nextButtonEnabled() {
        switch (currentPage) {
            case 0:
                return mode != -1;
            case 1:
                return !answer.isEmpty();
            case 2:
                return selectedCriteria.length > 0;
            default:
                return false;
        }
    }

    function selectView() {
        if (!scenario.isEmpty() && criteria.length > 0) return steps[currentPage].component;

        return (
            <VStack className="expand align-c justify-c auto-fade-in">
                <label className="title">Invalid configuration</label>
                <label className="subtitle">
                    You need to define a scenario and at least one criterion before you can start evaluating
                </label>
            </VStack>
        );
    }

    useEffect(() => {
        useFadeIn(container, 250).then(() => setTransition(false));

        if (currentPage == steps.length - 1) {
            useFadeOut(previousButton, 250, false);
        }
    }, [currentPage]);

    return (
        <NewEvaluationContext.Provider
            value={{
                overlayId,
                criteria,
                answers,
                mode,
                setMode,
                answer,
                setAnswer,
                selectedCriteria,
                setSelectedCriteria
            }}>
            <VStack className="popover border-radius-medium auto-scroll" style={{ width: "70%", minHeight: "70%" }}>
                <VStack className="expand-h padding-h-large padding-top-large">
                    <label className="title">New Evaluation</label>
                    <label className="subtitle">Evaluate a new user answer</label>
                </VStack>
                <Separator className="margin-v-medium" />

                <VStack className="expand-h padding-h-large align-c">
                    <HStack className="gap-none align-c justify-c" style={{ minWidth: "80%", maxWidth: "100%" }}>
                        {makeSteps()}
                    </HStack>
                </VStack>

                <Separator className="margin-v-medium" />

                <VStack ref={container} className="expand auto-scroll">
                    {selectView()}
                </VStack>

                <HStack ref={buttonContainer} className="expand-h justify-sb padding-large auto-clip">
                    <button
                        ref={previousButton}
                        disabled={transition || currentPage == steps.length - 1}
                        className="text-large border-radius-small box-border basic-button"
                        onClick={handlePrevious}>
                        Back
                    </button>
                    <button
                        className="border-radius-small box-border basic-button"
                        disabled={transition || !nextButtonEnabled()}
                        ref={nextButton}
                        onClick={handleNext}>
                        Next
                    </button>
                </HStack>
            </VStack>
        </NewEvaluationContext.Provider>
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

function EvaluationPage({ data }: EvaluationPageProps) {
    const context = useContext(OverlayContext);
    const [criteria, setCriteria] = useState<string[]>(data.data!.criteria);
    const [scenario, setScenario] = useState<string>(data.data!.scenario);
    const root = useRef<HTMLDivElement>(null!);
    const main = useRef<HTMLDivElement>(null!);

    const [algorithmType, setAlgorithmType] = useState<AlgorithmType>(data.config.algorithm_type);
    const [llm, setLlm] = useState<string>(data.config.llm_name);
    const [retriever, setRetriever] = useState<string>(data.config.retriever_name);
    const [parameters, setParameters] = useState<AlgorithmParameters>(data.config.algorithm_params);
    const [displayName, setDisplayName] = useState<string>(data.config.display_name);
    const [requesting, setRequesting] = useState<boolean>(false);
    const navigate = useNavigate();

    function showCriteriaEdit() {
        context.content.current.addChild(<CriteriaEdit criteria={criteria} submit={setCriteria} />);
    }
    function showScenarioEdit() {
        context.content.current.addChild(<ScenarioEdit scenario={scenario} submit={setScenario} />);
    }
    function showEvaluationEdit() {
        console.log("Ans: ", data.data!.answers);
        context.content.current.addChild(
            <NewEvaluation criteria={criteria} scenario={scenario} answers={data.data!.answers} />
        );
    }

    async function handleHome() {
        await useFadeOut(root, 250);
        navigate("/");
    }

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

        context.notification.current.makeNotification({
            title: "Updated configuration",
            type: NotificationType.Success,
            duration: 5000
        });
    }

    function onChange(value: AlgorithmParameters) {
        setParameters(value);
    }

    async function deleteSession() {
        setRequesting(true);
        let result = await ApiManager.deleteSession(data.config._id);
        await useFadeOut(root, 250);
        setRequesting(false);
        showNotification(result.response, context);
        navigate("/");
    }

    async function downloadXlsx() {
        setRequesting(true);
        await downloadBlob(ApiManager.getXlsxEval(data.config._id), `eval-${data.config._id}.xlsx`, context);
        setRequesting(false);
    }

    async function downloadJson() {
        setRequesting(true);
        await downloadBlob(ApiManager.getJsonEval(data.config._id), `eval-${data.config._id}.json`, context);
        setRequesting(false);
    }

    async function themeChanged(value: ComboChoice) {
        ThemeManager.useTheme(value.value);
        return true;
    }

    return (
        <HStack ref={root} className="expand align-s justify-c auto-fade-in padding-bottom-xx-large">
            <VStack className="expand-v chat-page justify-s">
                <VStack className="expand align-s justify-s padding-large gap-medium" ref={main}>
                    <VStack>
                        <label className="text-xx-large">Evaluation</label>
                        <label className="text">Edit evaluation session information</label>
                    </VStack>

                    <Separator className="margin-v-medium" />

                    <ParametersView
                        disabled={requesting}
                        onChange={onChange}
                        config={data.config}
                        parameters={parameters}
                        retrieverType={algorithmType}
                        onLlmChange={onLlmChange}
                        onRetrieverChange={onRetrieverChange}
                        onAlgorithmChange={onAlgorithmChange}
                        onDisplayNameChange={setDisplayName}
                    />

                    <VStack className="expand-h gap-medium">
                        <HStack className="expand-h">
                            <VStack className="expand-h">
                                <label className="text">Apply</label>
                                <label className="text-small">Apply the modified settings</label>
                            </VStack>
                            <button disabled={requesting} onClick={apply} className={`${buttonStyle} positive`}>
                                Apply
                            </button>
                        </HStack>
                    </VStack>

                    <Separator className="margin-v-medium" />

                    <HStack className="expand-h align-c justify-c">
                        <VStack className="expand-h">
                            <label className="text">Scenario</label>
                            <label className="text-small">Customize the Scenario for your exercise evaluation</label>
                        </VStack>
                        <button disabled={requesting} onClick={showScenarioEdit} className={buttonStyle}>
                            Edit scenario
                        </button>
                    </HStack>

                    <HStack className="expand-h">
                        <VStack className="expand-h">
                            <label className="text">Criteria</label>
                            <label className="text-small">Customize the criteria used to evaluate the exercise</label>
                        </VStack>
                        <button disabled={requesting} onClick={showCriteriaEdit} className={buttonStyle}>
                            Edit criteria
                        </button>
                    </HStack>

                    <HStack className="expand-h">
                        <VStack className="expand-h">
                            <label className="text">Evaluate</label>
                            <label className="text-small">Start evaluating an answer</label>
                        </VStack>
                        <button disabled={requesting} onClick={showEvaluationEdit} className={buttonStyle}>
                            Start evaluating
                        </button>
                    </HStack>

                    <HStack className="expand-h gap-none">
                        <VStack className="expand-h-50">
                            <label className="text">Export</label>
                            <label className="text-small">Export the current session data</label>
                        </VStack>
                        <HStack className="expand-h-50">
                            <button disabled={requesting} onClick={downloadXlsx} className={buttonStyle}>
                                Export XLSX
                            </button>
                            <button disabled={requesting} onClick={downloadJson} className={buttonStyle}>
                                Export JSON
                            </button>
                        </HStack>
                    </HStack>

                    <Separator className="margin-v-medium" />

                    <VStack className="expand gap-medium">
                        <HStack className="expand-h">
                            <VStack className="expand-h">
                                <label className="text">Theme</label>
                                <label className="text-small">Select the current appearance</label>
                            </VStack>
                            <ComboBox
                                disabled={requesting}
                                onChange={themeChanged}
                                defaultValue={defaultTheme()}
                                choiceClass="text stack-h align-c border-radius-small padding-medium ai-choice-button border-radius-medium"
                                buttonClass={buttonStyle}
                                choices={themeChoices}
                            />
                        </HStack>

                        <HStack className="expand-h">
                            <VStack className="expand-h">
                                <label className="text">Home</label>
                                <label className="text-small">Go back to the main menu</label>
                            </VStack>
                            <button disabled={requesting} onClick={handleHome} className={buttonStyle}>
                                Home
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
                                disabled={requesting}
                                onClick={deleteSession}
                                className={`${buttonStyle} dangerous`}>
                                Delete session
                            </button>
                        </HStack>
                    </VStack>
                </VStack>
            </VStack>
        </HStack>
    );
}

export default EvaluationPage;
