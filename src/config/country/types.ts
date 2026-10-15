// The report-generation pipeline (utils/DataFilter.ts, utils/DataByCategory.ts,
// config/reportConfig.ts, Android.tsx) is shared across every deployment of
// this app; what differs per country is which forms feed which report and
// how a submission's admission_type/criteria fields are read. A
// `CountryConfig` collects exactly that country-varying vocabulary so the
// shared pipeline never hardcodes one country's forms or field names.
//
// One config is picked at startup from the native bridge's app_id (see
// ./index.ts) — one native build serves one country, so this only ever
// resolves once per app launch, not a live in-app switch.

export interface AdmissionTypeMatch {
    baseType: string;
    criteria: string;
}

export interface CountryConfig {
    screeningForms: string[];
    formsByCategory: Record<string, Record<string, string[]>>;
    pbwgFormsByCategory: Record<string, Record<string, string[]>>;
    admissionTypesByCategory: Record<string, string[]>;
    pbwgAdmissionTypesByCategory: Record<string, string[]>;
    bsfpnsepAdmissionTypesByCategory?: Record<string, string[]>;
    bsfpPbwgAdmissionTypesByCategory?: Record<string, string[]>;
    entityTypeByProgram: (program: string, type: string) => string;
    admissionTypeWithCriteria: (
        program: string,
        beneficiaryType: string | null,
    ) => Record<string, string[]>;
    matchAdmissionType: (
        values: any,
        baseType: string,
        beneficiaryType?: string | null,
        program?: string,
    ) => AdmissionTypeMatch | null;

    stockForms: string[];
    assistanceFoodItemForms: string[];
    resolveRationType?: (values: any) => string | undefined;
}
