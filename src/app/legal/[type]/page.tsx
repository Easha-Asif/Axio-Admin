import PublicLegalPage from "./PublicLegalPage";

type LegalType = "terms-of-service" | "privacy-policy" | "creator-agreement";

const VALID_TYPES: LegalType[] = [
    "terms-of-service",
    "privacy-policy",
    "creator-agreement",
];

export function generateStaticParams() {
    return VALID_TYPES.map((type) => ({ type }));
}

export default function LegalPage({ params }: { params: { type: string } }) {
    const type = params.type as LegalType;

    if (!VALID_TYPES.includes(type)) {
        return (
            <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-white text-[24px] font-bold">404 — Page Not Found</h1>
                    <p className="text-[#6B7280] text-[13px] mt-2">This legal document does not exist.</p>
                </div>
            </div>
        );
    }

    return <PublicLegalPage type={type} />;
}
