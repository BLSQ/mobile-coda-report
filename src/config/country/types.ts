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

// A row of the Child Under 5 medical report: a child is counted when one of
// its visits matches. With splitBy (a free-text field), the row becomes one
// row per text typed in it, labelled with that text.
export interface MedicalRow {
    label: string;
    match: (visit: any, ageMonths?: number) => boolean;
    splitBy?: string;
}

// A section of the Child Under 5 medical report, shown in config order.
export interface MedicalSection {
    title: string;
    rows: MedicalRow[];
}

export interface CountryConfig {
    screeningForms: string[];
    formsByCategory: Record<string, Record<string, string[]>>;
    pbwgFormsByCategory: Record<string, Record<string, string[]>>;
    admissionTypesByCategory: Record<string, string[]>;
    pbwgAdmissionTypesByCategory: Record<string, string[]>;
    bsfpnsepAdmissionTypesByCategory?: Record<string, string[]>;
    bsfpPbwgAdmissionTypesByCategory?: Record<string, string[]>;
    // Visit forms that both record a visit and book the next one, read by
    // the eRegister (Bangladesh's BSFP and NSEP). Only a country defining
    // them offers the BSFP and NSEP eRegister.
    eRegisterVisitForms?: string[];
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

    childUnder5MedicalSections: MedicalSection[];
    // Whether the program's Child Under 5 reports split a 0-5 months column
    // off 6-23.
    under6Column?: (program: string) => boolean;

    stockForms: string[];
    assistanceFoodItemForms: string[];
    resolveRationType?: (values: any) => string | undefined;
}
