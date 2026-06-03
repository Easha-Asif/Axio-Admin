import React from "react";

type ButtonType = "button" | "submit" | "reset";
type Variant = "primary" | "secondary" | "outline" | "text";
type Cursor = "pointer" | "not-allowed" | "default";

type AppButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: ButtonType;
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    cursor?: Cursor;
    className?: string;
    loadingText?: string,
};

export default function AppButton({
    children,
    onClick,
    type = "button",
    variant = "primary",
    loading = false,
    disabled = false,
    cursor,
    className = "",
    loadingText,
}: AppButtonProps) {
    const baseStyles =
        "w-full font-medium py-3 rounded-[12px] flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed";

    const variants: Record<Variant, string> = {
        primary:
            "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/20",
        secondary:
            "bg-[#1B2027] border border-[#333] hover:bg-[#1f1f1f] text-white",
        outline:
            "border border-[#333] text-white hover:bg-[#1B2027]",
        text: "text-white text-[14px] font-medium",
    };

    const cursorClasses: Record<Cursor, string> = {
        pointer: "cursor-pointer",
        "not-allowed": "cursor-not-allowed",
        default: "cursor-default",
    };

    const resolvedCursor =
        disabled || loading
            ? "not-allowed"
            : cursor || "pointer";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${cursorClasses[resolvedCursor]} ${className}`}
        >
            {loading ? (loadingText || "Loading...") : children}
        </button>
    );
}