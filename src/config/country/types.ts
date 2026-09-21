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
    // The bucket a report groups this admission under, e.g. "new_case" —
    // matches one of the literal strings in admissionTypesByCategory /
    // pbwgAdmissionTypesByCategory.
    baseType: string;
    // The nutrition criteria this specific submission represents, e.g.
    // "muac" | "whz" | "muac_whz" | "oedema" — must be one of the values
    // admissionTypeWithCriteria(...) returns for this baseType.
    criteria: string;
}

export interface CountryConfig {
    // formFormIds requested/kept for the Screening Data report.
    screeningForms: string[];
    // category -> program -> formFormId[], for Child Under 5 reports
    // (followUpData/assistanceGiven in utils/DataFilter.ts).
    formsByCategory: Record<string, Record<string, string[]>>;
    // Same shape, for PBWG reports.
    pbwgFormsByCategory: Record<string, Record<string, string[]>>;
    // Report category -> the base admission-type literals shown under it,
    // for Child Under 5.
    admissionTypesByCategory: Record<string, string[]>;
    // Same shape, for PBWG.
    pbwgAdmissionTypesByCategory: Record<string, string[]>;
    // Normalizes a program name (and its aliases) to the canonical
    // TSFP/OTP/BSFP key the rest of the pipeline keys its lookups on.
    entityTypeByProgram: (program: string, type: string) => string;
    // Which nutrition criteria apply to a given base admission type, for
    // this program/beneficiary type — drives which criteria rows a report
    // breaks an admission type into.
    admissionTypeWithCriteria: (
        program: string,
        beneficiaryType: string | null,
    ) => Record<string, string[]>;
    // Does this visit's raw `values` represent `baseType`, and with which
    // criteria? South Sudan's forms carry the criteria in a separate
    // admission_criteria-style field alongside a plain admission_type;
    // Bangladesh's Child Under 5 new_case forms additionally bake the
    // criteria into admission_type itself (e.g. "new_case_MUAC") — hence
    // `beneficiaryType`, needed to scope that to Child Under 5 only.
    // Returns null when this visit isn't an instance of `baseType` at all.
    matchAdmissionType: (
        values: any,
        baseType: string,
        beneficiaryType?: string | null,
    ) => AdmissionTypeMatch | null;

    stockForms: string[];
    assistanceFoodItemForms: string[];
}
