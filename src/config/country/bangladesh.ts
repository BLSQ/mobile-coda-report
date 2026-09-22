import { CountryConfig, AdmissionTypeMatch } from './types';
import southSudan from './southSudan';
import { bsfpnsepAdmissionTypesByCategory } from './bsfpnsep';


const NSEP_BASE_TYPES = [
    ...bsfpnsepAdmissionTypesByCategory['New admissions'],
    ...bsfpnsepAdmissionTypesByCategory['Old cases'],
];
const NSEP_TYPE_CRITERIA: Record<string, string[]> = Object.fromEntries(
    NSEP_BASE_TYPES.map(baseType => [baseType, ['']]),
);

const BSFP_PBWG_BASE_TYPES = [
    'new_case',
    'returned_defaulter',
    'transfer_from_other_bsfp',
    'transfer_from_other_tsfp',
];
const BSFP_PBWG_TYPE_CRITERIA: Record<string, string[]> = Object.fromEntries(
    BSFP_PBWG_BASE_TYPES.map(baseType => [baseType, ['']]),
);

// Bangladesh keeps South Sudan's admission-type/criteria model as-is
// (entityTypeByProgram, the category tables, and the plain-admission_type
// + separate-admission_criteria-field matching) with one change, scoped to
// Child Under 5's "New admissions" only: instead of a single "new_case"
// admission type broken into muac/whz/oedema criteria via a separate
// admission_criteria field, Bangladesh's forms record 4 self-contained
// admission_type values that already bake the criteria in — new_case is
// replaced by these, not kept alongside them.
//
// Each of the 4 types is still broken down into the full criteria set
// (muac/whz/muac_whz/oedema) as its own report rows, same shape as South
// Sudan's new_case breakdown — a visit only ever lands in its own type's
// matching row (OWN_CRITERIA below), the other 3 rows for that type stay
// at zero, but the table keeps a uniform set of criteria rows per type.
const NEW_CASE_TYPE_CRITERIA: Record<string, string[]> = {
    new_case_MUAC: ['muac', 'whz', 'muac_whz', 'oedema'],
    new_case_WHZ: ['muac', 'whz', 'muac_whz', 'oedema'],
    new_case_MUAC_WHZ: ['muac', 'whz', 'muac_whz', 'oedema'],
    new_case_OEDEMA: ['muac', 'whz', 'muac_whz', 'oedema'],
};

const OWN_CRITERIA: Record<string, string> = {
    new_case_MUAC: 'muac',
    new_case_WHZ: 'whz',
    new_case_MUAC_WHZ: 'muac_whz',
    new_case_OEDEMA: 'oedema',
};

const matchAdmissionType = (
    values: any,
    baseType: string,
    beneficiaryType?: string | null,
    program?: string,
): AdmissionTypeMatch | null => {
    const criteria = OWN_CRITERIA[baseType];
    if (criteria != null && beneficiaryType === 'Child Under 5') {
        return values?.admission_type === baseType
            ? { baseType, criteria }
            : null;
    }
    if (NSEP_BASE_TYPES.includes(baseType)) {
        // NSEP types carry no separate criteria field — '' here must match
        // the '' NSEP_TYPE_CRITERIA declares for the same baseType below,
        // since a report row only renders when the two agree.
        return values?.admission_type === baseType
            ? { baseType, criteria: '' }
            : null;
    }
    if (
        program === 'BSFP' &&
        beneficiaryType === 'PBWG' &&
        BSFP_PBWG_BASE_TYPES.includes(baseType)
    ) {
        // Checked only when program === 'BSFP': 'new_case' etc. mean
        // something different (and criteria-bearing) for TSFP-PBWG, which
        // must keep falling through to South Sudan's matcher below.
        return values?.admission_type === baseType
            ? { baseType, criteria: '' }
            : null;
    }
    return southSudan.matchAdmissionType(values, baseType, beneficiaryType);
};

const admissionTypeWithCriteria = (
    program: string,
    beneficiaryType: string | null,
): Record<string, string[]> => {
    const { new_case, ...base } = southSudan.admissionTypeWithCriteria(
        program,
        beneficiaryType,
    );
    if (program === 'BSFP' && beneficiaryType === 'PBWG') {
        return { new_case, ...base, ...BSFP_PBWG_TYPE_CRITERIA };
    }
    if (beneficiaryType !== 'Child Under 5') {
        // new_case is only replaced for Child Under 5 — PBWG (and anything
        // else) keeps South Sudan's plain new_case untouched.
        return { new_case, ...base };
    }
    return { ...base, ...NEW_CASE_TYPE_CRITERIA, ...NSEP_TYPE_CRITERIA };
};

const entityTypeByProgram = (program: string, type: string): string => {
    if (type === 'Child Under 5' && program === 'NSEP') {
        return 'NSEP';
    }
    if (type === 'PBWG' && program === 'BSFP') {
        return 'BSFP';
    }
    return southSudan.entityTypeByProgram(program, type);
};

// TODO(bangladesh): replace with Bangladesh's real screening formFormIds.
const screeningForms: string[] = ['screening_tally'];

const stockForms: string[] = ["nfi_stocks", "food_item_stock"];
const assistanceFoodItemForms = [
  'child_assistance_admission_2_u6','bsfp_child_followup_visit','child_assistance_follow_up_2',
  'bsfp_pbwg_followup_visit', 'wfp_coda_pbwg_assistance','wfp_coda_pbwg_assistance_followup',
  'nsep_child_followup_visit', 'nsep_child_visit'
];

// Unlike South Sudan, Bangladesh doesn't use different formFormIds per
// program (TSFP/OTP) — the same forms are used for both, so each list below
// is duplicated under both program keys. "admission" and "oldCase" share
// the same forms too, matching South Sudan's own pattern: which one a visit
// belongs to is decided by its admission_type, not by which form was used.
const childUnder5AdmissionForms = [
    'Anthropometric visit child_U6',
    //'Child Medical Admission_2_u6',
    'child_assistance_admission_2_u6',
];
const childUnder5FollowUpForms = [
    'child_antropometric_followUp_tsfp_2',
    // 'medical_follow_up_u6',
    'child_assistance_follow_up_2',
];
const childUnder5MedicalForms = [
    'Child Medical Admission_2_u6',
    'medical_follow_up_u6',
];
const childUnder5AssistanceForms = [
    'child_assistance_admission_2_u6',
    'child_assistance_follow_up_2',
];

// TODO(bangladesh): absentees/defaulters/medicals/rationGiven form lists
// aren't in yet — followUpData/assistanceGiven for those statuses will see
// an empty list (no matching visits) until they're filled in.

// BSFP now reports in the same shape as NSEP (see bsfpnsepAdmissionTypesByCategory
// below, which both share): bsfp_child_visit covers admission/oldCase (all 5
// admission types) plus defaulters/absentees detection, bsfp_child_followup_visit
// covers followUps, and ration given is read off both.
const bsfpAdmissionForms = ['bsfp_child_visit'];
const bsfpFollowupForms = ['bsfp_child_followup_visit'];

// NSEP's admission form records all 5 admission types (new admissions and
// old cases alike), same as BSFP's single admission form above — the
// separate followup form only covers follow-up visits and ration given.
const nsepAdmissionForms = ['nsep_child_visit'];
const nsepFollowupForms = ['nsep_child_followup_visit'];

const formsByCategory: Record<string, Record<string, string[]>> = {
    admission: {
        TSFP: childUnder5AdmissionForms,
        OTP: childUnder5AdmissionForms,
        BSFP: bsfpAdmissionForms.concat(bsfpFollowupForms),
        NSEP: nsepAdmissionForms.concat(nsepFollowupForms)
    },
    oldCase: {
        TSFP: childUnder5AdmissionForms.concat(childUnder5FollowUpForms),
        OTP: childUnder5AdmissionForms.concat(childUnder5FollowUpForms),
        BSFP: bsfpAdmissionForms.concat(bsfpFollowupForms),
        NSEP: nsepAdmissionForms.concat(nsepFollowupForms)
    },
    followUps: {
        TSFP: childUnder5AdmissionForms,
        OTP: childUnder5FollowUpForms,
        BSFP: bsfpFollowupForms,
        NSEP: nsepFollowupForms
    },
    defaulters: {
        TSFP: childUnder5AdmissionForms.concat(childUnder5FollowUpForms),
        OTP: childUnder5AdmissionForms.concat(childUnder5FollowUpForms),
        BSFP: bsfpAdmissionForms.concat(bsfpFollowupForms),
        NSEP: nsepAdmissionForms.concat(nsepFollowupForms)
    },
    absentees: {
        TSFP: childUnder5AdmissionForms.concat(childUnder5FollowUpForms),
        OTP: childUnder5AdmissionForms.concat(childUnder5FollowUpForms),
        BSFP: bsfpAdmissionForms.concat(bsfpFollowupForms),
        NSEP: nsepAdmissionForms.concat(nsepFollowupForms)
    },
    rationGiven: {
        TSFP: childUnder5AssistanceForms,
        OTP: childUnder5AssistanceForms,
        BSFP: bsfpAdmissionForms.concat(bsfpFollowupForms),
        NSEP: nsepAdmissionForms.concat(nsepFollowupForms)

    },
    medicals: { TSFP: childUnder5MedicalForms, OTP: childUnder5MedicalForms },
};

// wfp_coda_pbwg_luctating_followup_anthro applies to breastfeeding
// entities and wfp_coda_pbwg_followup_anthro to pregnant ones;
// iycf_pregnant_women (admission side) is pregnant-only — noted here for
// context, but followUpData/assistanceGiven don't filter by
// physiology_status, so all of a category's forms are listed together and
// that filtering happens downstream (e.g. PBWGFollowUpCategories).
const pbwgAdmissionForms = [
    'wfp_coda_pbwg_anthropometric',
    'wfp_coda_medical_visit_PBWG',   
    'iycf_pregnant_women', // pregnant only
    'wfp_coda_pbwg_assistance',
];
const pbwgFollowUpForms = [
    'wfp_coda_pbwg_luctating_followup_anthro', // breastfeeding
    'wfp_coda_pbwg_followup_anthro', // pregnant
    'wfp_coda_medical_follow_up_visit_PBWG',
    'wfp_coda_pbwg_assistance_followup',
     'bsfp_pbwg_followup_visit',
];
const pbwgMedicalForms = [
    'wfp_coda_medical_visit_PBWG',
    'wfp_coda_medical_follow_up_visit_PBWG',
];
const pbwgAssistanceForms = [
    'wfp_coda_pbwg_assistance',
    'wfp_coda_pbwg_assistance_followup',
];

// BSFP-PBWG reports in the same 2-form shape as BSFP/NSEP for Child Under
// 5: bsfp_pbwg_visit covers admission/oldCase (new_case plus the old-case
// types) plus defaulters/absentees detection, bsfp_pbwg_followup_visit
// covers followUps, and ration given is read off both.
const bsfpPbwgAdmissionForms = ['bsfp_pbwg_visit'];
const bsfpPbwgFollowupForms = ['bsfp_pbwg_followup_visit'];

// TODO(bangladesh): medicals form list isn't in yet for TSFP-PBWG, same as
// formsByCategory above. BSFP has no medical report.
const pbwgFormsByCategory: Record<string, Record<string, string[]>> = {
    admission: {
        TSFP: pbwgAdmissionForms,
        BSFP: bsfpPbwgAdmissionForms.concat(bsfpPbwgFollowupForms),
    },
    oldCase: {
        TSFP: pbwgAdmissionForms.concat(pbwgFollowUpForms),
        BSFP: bsfpPbwgAdmissionForms.concat(bsfpPbwgFollowupForms),
    },
    followUps: {
        TSFP: pbwgFollowUpForms,
        BSFP: bsfpPbwgFollowupForms,
    },
    defaulters: {
        TSFP: pbwgAdmissionForms.concat(pbwgFollowUpForms),
        BSFP: bsfpPbwgAdmissionForms.concat(bsfpPbwgFollowupForms),
    },
    absentees: {
        TSFP: pbwgAdmissionForms.concat(pbwgFollowUpForms),
        BSFP: bsfpPbwgAdmissionForms.concat(bsfpPbwgFollowupForms),
    },
    rationGiven: {
        TSFP: pbwgAssistanceForms,
        BSFP: bsfpPbwgAdmissionForms.concat(bsfpPbwgFollowupForms),
    },
    medicals: { TSFP: pbwgMedicalForms },
};

// "New admissions" swaps new_case for the 4 compound types (see
// matchAdmissionType/admissionTypeWithCriteria above); every other
// category, and PBWG entirely, is reused from South Sudan unchanged.
const admissionTypesByCategory: Record<string, string[]> = {
    ...southSudan.admissionTypesByCategory,
    'New admissions': [
        ...Object.keys(NEW_CASE_TYPE_CRITERIA),
        'readmission_as_non_respondent',
        'relapse',
    ],
};
const { pbwgAdmissionTypesByCategory } = southSudan;

// BSFP-PBWG's report shape, requested explicitly (unlike Child Under 5's
// BSFP, which reuses NSEP's vocabulary as-is): New admissions/Old cases
// keyed off admission_type (see BSFP_PBWG_BASE_TYPES above); Discharges
// keyed off reason_not_continue_pbwg instead — the 4 values below aren't
// read from this table (DataFilter.ts's categoryWithData 'Discharges' case
// hardcodes them directly for BSFP+PBWG), they're listed here only so this
// table documents the report's full shape; Follow Ups/Total reuse the
// generic form-count logic. Rendered the same way as every other section
// (ReportPBWGContent), not the cured/defaulter/absentees/non_respondent
// Summary() every other program's Discharges uses.
const bsfpPbwgAdmissionTypesByCategory: Record<string, string[]> = {
    'Follow Ups': ['Total Follow up'],
    'New admissions': ['new_case'],
    'Old cases': [
        'returned_defaulter',
        'transfer_from_other_bsfp',
        'transfer_from_other_tsfp',
    ],
    Discharges: [
        'transferred_out',
        'dismissed_due_to_cheating',
        'voluntary',
        'other',
    ],
    Total: ['Total Admissions', 'Follow Ups'],
};

// NSEP's and BSFP's ration types are recorded under ration_given or
// assistance_given instead of ration/ration_type/ration_type_tsfp —
// assistanceGiven (DataFilter.ts) only consults this once those 3 come
// back empty, so it doesn't affect any program that does use one of them.
const resolveRationType = (values: any): string | undefined =>
    values?.ration_given ?? values?.assistance_given;

const bangladesh: CountryConfig = {
    screeningForms,
    formsByCategory,
    pbwgFormsByCategory,
    admissionTypesByCategory,
    pbwgAdmissionTypesByCategory,
    bsfpnsepAdmissionTypesByCategory,
    bsfpPbwgAdmissionTypesByCategory,
    entityTypeByProgram,
    admissionTypeWithCriteria,
    matchAdmissionType,
    stockForms,
    assistanceFoodItemForms,
    resolveRationType

};

export default bangladesh;
