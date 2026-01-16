/**
 * Style Configuration Types and Defaults
 * 
 * Defines the shape of user page customization stored as JSON.
 */

// Template types
export type StyleTemplate =
    | "tesla"
    | "apple"
    | "anthropic"
    | "openai"
    | "minimal"
    | "soft"
    | "vogue"
    | "brutalist"
    | "midnight"
    | "serene"
    | "poster_warm"
    | "poster_cool";

// Background options
export type BackgroundType = "solid" | "gradient";

export interface BackgroundConfig {
    type: BackgroundType;
    color: string;
    gradient?: string;
}

// Button styles
export type ButtonStyle = "fill" | "outline" | "soft-shadow" | "hard-shadow";
export type ButtonShape = "square" | "rounded" | "pill";

export interface ButtonConfig {
    color: string;
    textColor: string;
    style: ButtonStyle;
    shape: ButtonShape;
}

// Font options
export interface FontConfig {
    family: FontFamily;
    color: string;
}

// Profile styling
export interface ProfileConfig {
    titleColor: string;
    bioColor: string;
    titleSize?: "small" | "medium" | "large" | "xl";
    bioSize?: "small" | "medium" | "large";
    imageSize: "small" | "medium" | "large";
    imageShape?: "circle" | "rounded" | "square";
    imageWidth?: "normal" | "full"; // normal = circular/square, full = banner style
    imagePosition?: "top" | "bottom"; // top = above text, bottom = below text
    imageBorderWidth?: "none" | "thin" | "medium" | "thick";
    imageBorderColor?: string;
    titleEnabled?: boolean;
    subtitleEnabled?: boolean;
    socialEnabled?: boolean;
    socialPosition?: "top" | "bottom";
}

export interface ServiceButtonConfig {
    enabled: boolean;
    text: string;
    color?: string; // Optional override, otherwise uses main button color
    textColor?: string;
}

export interface SocialButtonConfig {
    color?: string;
    textColor?: string;
    style?: ButtonStyle;
    shape?: ButtonShape;
}

// Complete style configuration
export interface StyleConfig {
    template: StyleTemplate;
    background: BackgroundConfig;
    button: ButtonConfig;
    font: FontConfig;
    profile: ProfileConfig;
    serviceButton: ServiceButtonConfig;
    socialButton?: SocialButtonConfig;
    cardBackgroundColor?: string; // Optional override for card/input backgrounds
    cardTextColor?: string; // Optional override for card text
    cardStyle?: "default" | "left-border" | "minimal" | "fill" | "outline" | "soft-shadow" | "hard-shadow";
    cardShape?: ButtonShape;
}

// Default configurations per template
// Default configurations per template
// Default configurations per template
export const TEMPLATE_DEFAULTS: Record<StyleTemplate, StyleConfig> = {
    // 1. Tesla (Dark High Contrast - "Bold Background, White Div, Colored Text" inverted for dark mode)
    tesla: {
        template: "tesla",
        background: { type: "solid", color: "#111111" },
        button: { color: "#E31937", textColor: "#FFFFFF", style: "fill", shape: "rounded" },
        font: { family: "syne", color: "#FFFFFF" },
        profile: {
            titleColor: "#FFFFFF",
            bioColor: "#A1A1A1",
            imageSize: "large",
            imageShape: "square",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Book", color: "#E31937", textColor: "#FFFFFF" },
        cardBackgroundColor: "#1F1F1F",
        cardStyle: "default"
    },
    // 2. Apple (Clean Minimal - "White background, very slight colored div")
    apple: {
        template: "apple",
        background: { type: "solid", color: "#FFFFFF" },
        button: { color: "#000000", textColor: "#FFFFFF", style: "fill", shape: "pill" },
        font: { family: "dm-sans", color: "#1D1D1F" },
        profile: {
            titleColor: "#1D1D1F",
            bioColor: "#86868B",
            imageSize: "medium",
            imageShape: "circle",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Reserve", color: "#F5F5F7", textColor: "#000000" },
        cardBackgroundColor: "#F5F5F7", // Slight gray div
        cardStyle: "default"
    },
    // 3. Anthropic (Paper/Warm - The Reference)
    anthropic: {
        template: "anthropic",
        cardBackgroundColor: "#FFFFFF",
        background: { type: "solid", color: "#F0EBE5" }, // Warmer paper background
        button: { color: "#D97757", textColor: "#FFFFFF", style: "fill", shape: "rounded" }, // Terracotta/Claudius
        font: { family: "instrument-serif", color: "#191919" },
        profile: {
            titleColor: "#191919",
            bioColor: "#6B6B6B",
            imageSize: "medium",
            imageShape: "rounded",
            imageBorderWidth: "thin",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: false, text: "Book" }, // Example hidden button
    },
    // 4. OpenAI (Clinical - Minimal, Left Border)
    openai: {
        template: "openai",
        cardStyle: "left-border",
        cardBackgroundColor: "#FFFFFF",
        background: { type: "solid", color: "#FFFFFF" },
        button: { color: "#10a37f", textColor: "#FFFFFF", style: "fill", shape: "rounded" },
        font: { family: "inter", color: "#202123" },
        profile: {
            titleColor: "#202123",
            bioColor: "#6E6E80",
            imageSize: "medium",
            imageShape: "circle",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Book", color: "#10A37F", textColor: "#FFFFFF" },
    },
    // 5. Minimal (Fixed Visibility - High Contrast)
    minimal: {
        template: "minimal",
        cardStyle: "minimal",
        cardBackgroundColor: "transparent",
        background: { type: "solid", color: "#FFFFFF" },
        button: { color: "#000000", textColor: "#FFFFFF", style: "fill", shape: "rounded" },
        font: { family: "dm-sans", color: "#333333" },
        profile: {
            titleColor: "#000000",
            bioColor: "#888888",
            imageSize: "medium",
            imageShape: "circle",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Go" },
    },
    // 6. Vogue (Replaces Elegant - Luxury Fashion)
    vogue: {
        template: "vogue",
        cardBackgroundColor: "#FFFFFF",
        background: { type: "solid", color: "#F8F5F2" }, // Linen/Off-white
        button: { color: "#000000", textColor: "#FFFFFF", style: "fill", shape: "pill" },
        font: { family: "playfair", color: "#000000" },
        profile: {
            titleColor: "#000000",
            bioColor: "#4A4A4A",
            imageSize: "large",
            imageShape: "square",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Book Now" },
    },
    // 7. Brutalist
    brutalist: {
        template: "brutalist",
        cardBackgroundColor: "#FFFFFF",
        background: { type: "solid", color: "#FDFDFD" },
        button: { color: "#FFC857", textColor: "#000000", style: "hard-shadow", shape: "square" },
        font: { family: "inter", color: "#000000" },
        profile: {
            titleColor: "#000000",
            bioColor: "#666666",
            imageSize: "medium",
            imageShape: "square",
            imageBorderWidth: "thick",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "GET IT" },
    },
    // 8. Midnight (Redesigned - Dark Tech)
    midnight: {
        template: "midnight",
        cardStyle: "left-border",
        cardBackgroundColor: "#1e293b",
        background: { type: "gradient", color: "#020617", gradient: "linear-gradient(135deg, #020617 0%, #0f172a 100%)" },
        button: { color: "#38bdf8", textColor: "#020617", style: "fill", shape: "rounded" },
        font: { family: "manrope", color: "#f8fafc" },
        profile: {
            titleColor: "#f8fafc",
            bioColor: "#94a3b8",
            imageSize: "medium",
            imageShape: "circle",
            imageBorderWidth: "thin",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Book", color: "#38BDF8", textColor: "#000000" },
    },
    // 9. Soft (Replaces Glass - Etsy/Organic/Linktree)
    soft: {
        template: "soft",
        cardBackgroundColor: "#FFFFFF",
        background: { type: "solid", color: "#FAF6F1" }, // Soft cream
        button: { color: "#78866B", textColor: "#FFFFFF", style: "fill", shape: "pill" }, // Sage green
        font: { family: "poppins", color: "#4A4A4A" },
        profile: {
            titleColor: "#4A4A4A",
            bioColor: "#7A7A7A",
            imageSize: "medium",
            imageShape: "circle",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Book", color: "#EBE6DE", textColor: "#2E241E" },
        cardStyle: "default"
    },
    // 10. Serene (Wellness)
    serene: {
        template: "serene",
        background: { type: "solid", color: "#F4F7F5" },
        button: { color: "#4A6E59", textColor: "#FFFFFF", style: "fill", shape: "pill" },
        font: { family: "instrument-serif", color: "#2F4538" },
        profile: {
            titleColor: "#2F4538",
            bioColor: "#546E63",
            imageSize: "large",
            imageShape: "rounded",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: true,
            socialEnabled: true,
            socialPosition: "top"
        },
        serviceButton: { enabled: true, text: "Schedule" },
        cardBackgroundColor: "#FFFFFF",
        cardStyle: "default"
    },

    // 13. Poster Warm (Anthropic-inspired Minimal)
    poster_warm: {
        template: "poster_warm",
        background: { type: "solid", color: "#F9F7F5" }, // Warm Alabaster
        button: { color: "#E63946", textColor: "#FFFFFF", style: "fill", shape: "rounded" }, // Vibrant Red
        font: { family: "instrument-serif", color: "#111111" }, // Sharp Black
        profile: {
            titleColor: "#111111",
            bioColor: "#666666",
            titleSize: "medium",
            imageSize: "medium",
            imageShape: "rounded",
            imageWidth: "full",
            imagePosition: "bottom",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: false,
            socialEnabled: false,
            socialPosition: "bottom"
        },
        serviceButton: { enabled: true, text: "Book", color: "#E63946", textColor: "#FFFFFF" },
        cardStyle: "default",
        cardBackgroundColor: "#FFFFFF",
        cardShape: "rounded"
    },
    // 14. Poster Cool (Cool/Blue Variation)
    poster_cool: {
        template: "poster_cool",
        background: { type: "solid", color: "#F0F4F8" }, // Cool gray/blue paper
        button: { color: "#3182CE", textColor: "#FFFFFF", style: "fill", shape: "rounded" }, // Blue
        font: { family: "inter", color: "#1A202C" },
        profile: {
            titleColor: "#1A202C",
            bioColor: "#4A5568",
            titleSize: "medium",
            imageSize: "medium",
            imageShape: "circle",
            imageWidth: "full",
            imagePosition: "bottom",
            imageBorderWidth: "none",
            titleEnabled: true,
            subtitleEnabled: false,
            socialEnabled: false,
            socialPosition: "bottom"
        },
        serviceButton: { enabled: true, text: "Book", color: "#3182CE", textColor: "#FFFFFF" },
        cardStyle: "default",
        cardBackgroundColor: "#FFFFFF",
        cardShape: "rounded"
    }
};

// Default style config
export const DEFAULT_STYLE_CONFIG: StyleConfig = TEMPLATE_DEFAULTS.apple;

// Parse JSON string to StyleConfig with defaults
export function parseStyleConfig(jsonString?: string | null): StyleConfig {
    if (!jsonString) return DEFAULT_STYLE_CONFIG;
    try {
        const parsed = JSON.parse(jsonString);

        // Ensure template is valid
        const template = (parsed.template && TEMPLATE_DEFAULTS[parsed.template as StyleTemplate])
            ? (parsed.template as StyleTemplate)
            : DEFAULT_STYLE_CONFIG.template;

        // Ensure font family is valid
        const fontFamily = (parsed.font?.family && FONT_CSS[parsed.font.family as FontFamily])
            ? (parsed.font.family as FontFamily)
            : TEMPLATE_DEFAULTS[template].font.family;

        // Merge with defaults to ensure all fields exist
        return {
            ...TEMPLATE_DEFAULTS[template],
            ...parsed,
            background: { ...TEMPLATE_DEFAULTS[template].background, ...parsed.background },
            button: { ...TEMPLATE_DEFAULTS[template].button, ...parsed.button },
            font: {
                ...TEMPLATE_DEFAULTS[template].font,
                ...parsed.font,
                family: fontFamily
            },
            profile: {
                ...TEMPLATE_DEFAULTS[template].profile,
                ...parsed.profile,
                imageSize: parsed.profile?.imageSize ?? TEMPLATE_DEFAULTS[template].profile.imageSize,
                imageShape: parsed.profile?.imageShape ?? TEMPLATE_DEFAULTS[template].profile.imageShape,
                imageBorderWidth: parsed.profile?.imageBorderWidth ?? TEMPLATE_DEFAULTS[template].profile.imageBorderWidth,
                socialEnabled: parsed.profile?.socialEnabled ?? TEMPLATE_DEFAULTS[template].profile.socialEnabled,
                socialPosition: parsed.profile?.socialPosition ?? TEMPLATE_DEFAULTS[template].profile.socialPosition
            },
            serviceButton: { ...TEMPLATE_DEFAULTS[template].serviceButton, ...(parsed.serviceButton || {}) },
            cardBackgroundColor: parsed.cardBackgroundColor ?? TEMPLATE_DEFAULTS[template].cardBackgroundColor,
            cardStyle: parsed.cardStyle ?? TEMPLATE_DEFAULTS[template].cardStyle,
            template // Ensure we use the validated template
        };
    } catch {
        return DEFAULT_STYLE_CONFIG;
    }
}

// Stringify StyleConfig to JSON
export function stringifyStyleConfig(config: StyleConfig): string {
    return JSON.stringify(config);
}

// Font family to CSS mapping
export type FontFamily = "inter" | "poppins" | "playfair" | "space-grotesk" | "roboto" | "manrope" | "outfit" | "instrument-serif" | "dm-sans" | "bricolage" | "syne";

export const FONT_CSS: Record<FontFamily, { name: string; import: string }> = {
    "inter": { name: "'Inter', sans-serif", import: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" },
    "poppins": { name: "'Poppins', sans-serif", import: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;900&display=swap" },
    "playfair": { name: "'Playfair Display', serif", import: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700;900&display=swap" },
    "space-grotesk": { name: "'Space Grotesk', sans-serif", import: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" },
    "roboto": { name: "'Roboto', sans-serif", import: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" },
    "manrope": { name: "'Manrope', sans-serif", import: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" },
    "outfit": { name: "'Outfit', sans-serif", import: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" },
    "instrument-serif": { name: "'Instrument Serif', serif", import: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&display=swap" },
    "dm-sans": { name: "'DM Sans', sans-serif", import: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;500;600;700&display=swap" },
    "bricolage": { name: "'Bricolage Grotesque', sans-serif", import: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@10..48,400;500;600;700&display=swap" },
    "syne": { name: "'Syne', sans-serif", import: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" }
};


// Generate button CSS classes based on config
export function getButtonStyles(config: Partial<ButtonConfig> & { style?: ButtonStyle | string; shape?: ButtonShape | string }): React.CSSProperties {
    const base: React.CSSProperties = {
        backgroundColor: config.style === "outline" ? "transparent" : (config.color || "black"),
        color: config.textColor || "white",
        borderColor: config.color || "black",
        borderWidth: "2px",
        borderStyle: "solid"
    };

    // Shape
    switch (config.shape) {
        case "rounded": base.borderRadius = "8px"; break;
        case "pill": base.borderRadius = "9999px"; break;
        default: base.borderRadius = "0"; break;
    }

    // Shadow
    if (config.style === "hard-shadow") {
        base.boxShadow = "4px 4px 0px 0px rgba(0,0,0,1)";
    } else if (config.style === "soft-shadow") {
        base.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
    }

    return base;
}

// Generate container CSS classes based on template
export function getContainerStyles(config: StyleConfig): React.CSSProperties {
    const { template, cardBackgroundColor, cardTextColor, cardStyle, button, cardShape } = config;

    // Base container style
    const baseStyle: React.CSSProperties = {
        backgroundColor: cardBackgroundColor || "white",
        color: cardTextColor, // Apply text color if set
        borderRadius: "12px",
        borderColor: "#E5E7EB", // Default border color
        borderWidth: "0px",
        borderStyle: "solid",
    };

    // Helper to override shape if provided
    const applyShape = (style: React.CSSProperties) => {
        if (cardShape === "square") style.borderRadius = "0px";
        if (cardShape === "rounded") style.borderRadius = "12px";
        if (cardShape === "pill") style.borderRadius = "24px";
        return style;
    };

    let style = { ...baseStyle };

    // 1. Template Defauts
    if (template === "brutalist") {
        style = {
            ...baseStyle,
            backgroundColor: cardBackgroundColor || "white",
            border: "4px solid black",
            boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
            borderRadius: "0",
        };
    } else if (template === "soft") {
        style = {
            ...baseStyle,
            backgroundColor: cardBackgroundColor || "#FFFFFF",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.02)",
            borderRadius: "16px"
        };
    } else if (template === "vogue") {
        style = {
            ...baseStyle,
            borderRadius: "0px",
            border: "1px solid #CCCCCC",
            boxShadow: "none"
        };
    } else if (template === "tesla") {
        style = {
            ...baseStyle,
            border: "1px solid #333333",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
        };
    } else if (template === "midnight") {
        style = {
            ...baseStyle,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
        };
    } else if (template === "apple") {
        style = {
            ...baseStyle,
            borderRadius: "24px",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
        };
    } else if (template === "anthropic" || template === "poster_warm") {
        style = {
            ...baseStyle,
            borderRadius: "8px",
            border: "1px solid #E6E1D8",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        };
    } else if (template === "poster_cool") {
        style = {
            ...baseStyle,
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        };
    } else if (template === "serene") {
        style = {
            ...baseStyle,
            borderRadius: "16px",
            border: "none",
            boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.02)"
        };
    } else {
        // Default (Modern Minimal)
        style = {
            ...baseStyle,
            border: "1px solid #F3F3F3",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
        };
    }

    // 2. Card Style Overrides (applied after template defaults to allow customization)
    if (cardStyle === "left-border") {
        style = {
            ...style,
            borderLeft: `4px solid ${button.color}`,
            borderTop: "none",
            borderRight: "none",
            borderBottom: "none",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            paddingLeft: "16px",
            borderRadius: "2px"
        };
    } else if (cardStyle === "minimal") {
        style = {
            ...style,
            backgroundColor: "transparent",
            borderBottom: "1px solid #E5E5E5",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderRadius: "0",
            padding: "16px 0",
            boxShadow: "none",
            marginTop: "0px", // Ensure no gap between items so borders collapse or stack properly
            marginBottom: "0px"
        };
    } else if (cardStyle === "outline") {
        style = {
            ...style,
            backgroundColor: "transparent",
            border: `2px solid ${cardBackgroundColor || "currentColor"}`, // Use bg color as border color if outlined
            boxShadow: "none"
        };
    } else if (cardStyle === "soft-shadow") {
        style = {
            ...style,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
            border: "none"
        };
    } else if (cardStyle === "hard-shadow") {
        style = {
            ...style,
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            border: "2px solid black"
        };
    } else if (cardStyle === "fill") {
        // Reset specific borders/shadows if switching back to fill
        if (style.borderBottom && style.backgroundColor === "transparent") {
            // likely coming from minimal, reset
            style.borderBottom = undefined;
            style.padding = undefined;
        }
    }


    // 3. User Overrides (Specific Props)
    if (cardBackgroundColor && cardStyle !== 'minimal' && cardStyle !== 'outline') {
        style.backgroundColor = cardBackgroundColor;
    }

    // 4. Shape Override
    return applyShape(style);
}
