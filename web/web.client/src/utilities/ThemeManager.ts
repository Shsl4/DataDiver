import Color from "color";
import { useCallback, useEffect, useState } from "react";

class ThemeColors {
    accent: Color = Color();

    primaryText: Color = Color();
    secondaryText: Color = Color();
    tertiaryText: Color = Color();

    primaryBackground: Color = Color();
    secondaryBackground: Color = Color();
    tertiaryBackground: Color = Color();
}

class Theme {
    constructor(name: string) {
        this.name = name;
    }

    name: string;
    fontFamily: string = "Arial";
    colors: ThemeColors = new ThemeColors();
}

class ThemeManager {
    public static currentTheme: Theme = new Theme("invalid");
    private static listeners: Array<(name: string) => void> = [];

    /**
     * Retrieves a CSS variable by name for a given style declaration
     *
     * @static
     * @param {CSSStyleDeclaration} style The style to examine
     * @param {string} variable The variable to get
     * @return {string} The value of the text
     * @memberof ThemeManager
     */
    public static getCssVariableFromStyle(style: CSSStyleDeclaration, variable: string): string {
        return style.getPropertyValue(variable);
    }

    /**
     * Initializes the theme manager, subscribes to the appropriate callbacks
     *
     * @static
     * @memberof ThemeManager
     */
    public static init() {
        const schemeWatch = window.matchMedia("(prefers-color-scheme: dark)");
        const userTheme = localStorage.getItem("theme");

        // Apply the user theme immediately to avoid color flashing
        if (userTheme) {
            document.documentElement.className = userTheme;
        }

        window.addEventListener("load", () => {
            this.onLoad();
        });

        schemeWatch.addEventListener("change", () => {
            this.onChange();
        });
    }

    /**
     * Adds a listener to the theme change event
     *
     * @static
     * @param {(name: string) => void} listener The function to call on theme update
     * @memberof ThemeManager
     */
    public static addListener(listener: (name: string) => void): void {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
            listener(this.currentTheme.name);
        }
    }

    /**
     * Removes a listener from the theme change event
     *
     * @static
     * @param {(name: string) => void} listener The listener to remove
     * @memberof ThemeManager
     */
    public static removeListener(listener: (name: string) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Dynamically registers a custom, user-defined theme
     *
     * @static
     * @param {Theme} theme The theme to register
     * @memberof ThemeManager
     */
    public static registerTheme(theme: Theme): void {
        if (this.selectorExists(theme.name)) {
            console.error(`Cannot register theme '${theme.name}': The selector already exists.`);
            return;
        }

        let style = document.getElementById("custom-themes") as HTMLStyleElement;

        if (!style) {
            style = document.createElement("style");
            style.id = "custom-themes";
            document.head.appendChild(style);
        }

        style.appendChild(
            document.createTextNode(`
      .${theme.name} { 
      
        --accent: ${theme.colors.accent.hexa()};

        --primary-text: ${theme.colors.primaryText.hexa()};
        --secondary-text: ${theme.colors.secondaryText.hexa()};
        --tertiary-text: ${theme.colors.tertiaryText.hexa()};
  
        --primary-background: ${theme.colors.primaryBackground.hexa()};
        --secondary-background: ${theme.colors.secondaryBackground.hexa()};
        --tertiary-background: ${theme.colors.tertiaryBackground.hexa()};
      
      }`)
        );
    }

    /**
     * Applies a theme by name. If null is provided, the system theme is applied.
     *
     * @static
     * @param {string} [name] The name of the theme to apply
     * @memberof ThemeManager
     */
    public static useTheme(name?: string): void {
        if (name && name != "system") {
            if (!this.selectorExists(name)) {
                console.error(`Cannot apply theme '${name}': The selector does not seem to exist.`);
                localStorage.removeItem("theme");
                return;
            }

            document.documentElement.className = name;
            localStorage.setItem("theme", name);
        } else {
            document.documentElement.removeAttribute("class");
            localStorage.removeItem("theme");
        }
        this.reload();
        this.invokeListeners();
    }

    /**
     * Parses and retrieves a CSS theme by name
     *
     * @static
     * @param {string} name The name of the theme to get
     * @return {Theme | null} The theme object or null if it does not exist
     * @memberof ThemeManager
     */
    public static getTheme(name: string): Theme | null {
        if (document.styleSheets.length == 0) {
            console.error("Could not get theme: There are no stylesheets available.");
            return null;
        }

        for (let sheetIndex = 0; sheetIndex < document.styleSheets.length; ++sheetIndex) {
            const sheet = document.styleSheets[sheetIndex];

            for (let ruleIndex = 0; ruleIndex < sheet.cssRules.length; ruleIndex++) {
                const rule = sheet.cssRules[ruleIndex] as CSSStyleRule;

                if (rule.selectorText === `.${name}`) {
                    try {
                        return this.parseTheme(name, rule.style);
                    } catch (error) {
                        console.warn(`Failed to parse theme ${name}: ${error}`);
                    }
                }
            }
        }

        console.error(`Could not get theme: The selector '${name}' does not seem to exist.`);
        return null;
    }

    /**
     * Returns whether a theme is loaded
     *
     * @static
     * @return {boolean} Whether a theme is loaded
     * @memberof ThemeManager
     */
    public static isLoaded(): boolean {
        return this.currentTheme.name != "invalid";
    }

    /**
     * Returns the browser stored theme if any. Useful to get the theme name early before the loading phase.
     *
     * @static
     * @return {string | null} The cached theme name if any
     * @memberof ThemeManager
     */
    public static getCachedThemeName(): string | null {
        return localStorage.getItem("theme");
    }

    /**
     * Private callback invoked when the page has loaded
     *
     * @private
     * @static
     * @memberof ThemeManager
     */
    private static onLoad() {
        this.reload();
        this.invokeListeners();
    }

    /**
     * Private callback invoked when the color scheme changes
     *
     * @private
     * @static
     * @memberof ThemeManager
     */
    private static onChange() {
        this.reload();
        this.invokeListeners();
    }

    /**
     * Reloads the theme colors from CSS
     *
     * @static
     * @return {boolean} Whether the reload succeeded.
     * @memberof ThemeManager
     */
    private static reload(): boolean {
        try {
            const schemeWatch = window.matchMedia("(prefers-color-scheme: dark)");
            const schemeName = schemeWatch.matches ? "dark" : "light";
            const themeName = document.documentElement.className || schemeName;
            const style = getComputedStyle(document.documentElement);
            this.currentTheme = this.parseTheme(themeName, style);
        } catch (error) {
            console.error("Failed to reload colors: " + error);
            return false;
        }

        return true;
    }

    /**
     * Invokes all the registered listeners
     *
     * @private
     * @static
     * @memberof ThemeManager
     */
    private static invokeListeners() {
        this.listeners.forEach(listener => {
            listener(this.currentTheme.name);
        });
    }

    /**
     * Checks whether a given selector exists in any of the stylesheets
     *
     * @private
     * @static
     * @param {string} className The selector to check
     * @return {boolean} Whether the selector exists
     * @memberof ThemeManager
     */
    private static selectorExists(className: string): boolean {
        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            const rules: CSSRuleList = sheet.cssRules;
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                if (rule instanceof CSSStyleRule && rule.selectorText === "." + className) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Parses a theme from a given stylesheet declaration
     * This function might throw and must be handled by the caller
     *
     * @private
     * @static
     * @param {string} name The name of the theme to create
     * @param {CSSStyleDeclaration} style The style to analyze
     * @return {Theme} The parsed theme
     * @throws {Error} If a parsing error occurs
     * @memberof ThemeManager
     */
    private static parseTheme(name: string, style: CSSStyleDeclaration): Theme {
        const theme = new Theme(name);

        theme.fontFamily = this.getCssVariableFromStyle(style, "--font-name").replace(/['"]+/g, "");
        theme.colors.accent = Color(this.getCssVariableFromStyle(style, "--accent"));
        theme.colors.primaryText = Color(this.getCssVariableFromStyle(style, "--primary-text"));
        theme.colors.secondaryText = Color(this.getCssVariableFromStyle(style, "--secondary-text"));
        theme.colors.tertiaryText = Color(this.getCssVariableFromStyle(style, "--tertiary-text"));
        theme.colors.primaryBackground = Color(this.getCssVariableFromStyle(style, "--primary-background"));
        theme.colors.secondaryBackground = Color(this.getCssVariableFromStyle(style, "--secondary-background"));
        theme.colors.tertiaryBackground = Color(this.getCssVariableFromStyle(style, "--tertiary-background"));

        return theme;
    }
}

/**
 * A custom hook used to react to color scheme modifications. Use the returned value as a useEffect
 * dependency to trigger a re-render when the color scheme is changed.
 *
 * @return {string} The name of the current theme
 */
function useThemeListener(): string {
    const [name, setName] = useState("invalid");

    const schemeChanged = useCallback(
        (newName: string) => {
            setName(newName);
        },
        [setName]
    );

    useEffect(() => {
        ThemeManager.addListener(schemeChanged);

        return () => {
            ThemeManager.removeListener(schemeChanged);
        };
    }, [schemeChanged]);

    return name;
}

export { ThemeManager, Theme, ThemeColors, useThemeListener };
