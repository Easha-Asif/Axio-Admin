// ── Toggle ─────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex items-center ${checked ? "bg-blue-600" : "bg-[#1E2433]"}`}
        >
            <span
                className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
            />
        </button>
    );
}