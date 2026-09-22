import { CountryConfig, AdmissionTypeMatch } from './types';

const entityTypeByProgram = (program: string, type: string): string => {
    let entityType = '';
    if (type === 'Child Under 5') {
        if (program === 'TSFP_MAM' || program === 'TSFP') {
            entityType = 'TSFP';
        } else {
            if (program === 'OTP_SAM' || program === 'OTP') {
                entityType = 'OTP';
            } else {
                if (program === 'BSFP') {
                    entityType = 'BSFP';
                }
            }
        }
    } else {
        if (type === undefined || type === 'PBWG') {
            entityType = 'TSFP';
        }
    }

    return entityType;
};

const childrenUnder5Criteria = ['muac', 'oedema', 'whz'];

const admissionTypeWithCriteria = (
    program: string,
    beneficiaryType: string | null,
): Record<string, string[]> => {
    let criteriaType: any = ['child_wasted', 'muac'];
    if (beneficiaryType === 'Child Under 5') {
        let entityType = entityTypeByProgram(program, beneficiaryType);

        if (entityType === 'TSFP') {
            criteriaType = ['muac', 'whz'];
        } else {
            if (entityType === 'OTP') {
                criteriaType = childrenUnder5Criteria;
            }
        }
    }
    let types: any = {
        new_case: criteriaType,
        referred_from_sc_itp: program.includes('OTP')
            ? criteriaType
            : undefined,
        returned_referral: program.includes('TSFP') ? criteriaType : [],
        returned_defaulter: criteriaType,
        referred_from_other_otp: criteriaType,
        referred_from_tsfp: program.includes('TSFP') ? criteriaType : undefined,
        relapse: criteriaType,
        readmission_as_non_respondent: criteriaType,
        readmison_non_respondent: criteriaType,
        readmission_non_respondent: criteriaType,
        returned_from_sc: criteriaType,
        transfer_from_other_tsfp: criteriaType,
        referred_from_otp: criteriaType,
        transfer_from_other_otp: criteriaType,
        referred_from_other_tsfp: criteriaType,
    };
    return types;
};

const screeningForms = [
    'screening_tally',
    'Anthropometric visit child',
    'Anthropometric visit child_2',
    'Anthropometric visit child_U6',
    'Anthropometric_BSFP_child_2',
    'wfp_coda_pbwg_anthropometric',
    'PBWG_BSFP',
];

const stockForms: string[] = ['stock_add', 'nfi_stocks'];
const assistanceFoodItemForms = [
    'child_assistance_2nd_visit_tsfp',
    'child_assistance_follow_up',
    'child_assistance_follow_up_2',
    'assistance_admission_otp',
    'assistance_admission_2nd_visit_otp',
    'child_assistance_admission',
    'child_assistance_admission_2',
    'child_assistance_admission_2_u6',
    'assistance_u6',
    'Anthropometric_BSFP_child_2',
    'PBWG_BSFP',
    'wfp_coda_pbwg_assistance',
    'wfp_coda_pbwg_assistance_followup',
];

const admissionTypesByCategory: Record<string, string[]> = {
    'Follow Ups': ['Total Follow up'],
    'New admissions': ['new_case', 'readmission_as_non_respondent', 'relapse'],
    'Old cases': [
        'returned_defaulter',
        'referred_from_other_tsfp',
        'transfer_from_other_otp',
        'referred_from_other_otp',
    ],
    Discharges: ['cured', 'death', 'defaulter', 'non_respondent__int__'],
    'Other Exits': [
        'voluntarywithdrawal',
        'dismissedduetocheating',
        'transfer_to_sc_itp',
        'transferred_out',
    ],
    Total: ['Total Admissions', 'Follow Ups'],
};

const pbwgAdmissionTypesByCategory: Record<string, string[]> = {
    'Follow Ups': ['Total Follow up'],
    'New admissions': ['new_case', 'readmission_as_non_respondent', 'relapse'],
    'Old cases': [
        'returned_defaulter',
        'returned_referral',
        'transfer_from_other_tsfp',
        'returned_from_sc',
    ],
    Discharges: ['cured', 'death', 'defaulter', 'non_respondent__int__'],
    'Other Exits': ['transferred_out', 'voluntary_withdrawal', 'dismissal'],
    Total: ['Total Admissions', 'Follow Ups'],
};

const pbwgFormsByCategory: Record<string, Record<string, string[]>> = {
    admission: {
        TSFP: ['ng_pbwg_anthropometric'],
    },
    oldCase: {
        TSFP: [
            'ng_pbwg_anthropometric',
            'wfp_coda_pbwg_followup_anthro',
            'wfp_coda_pbwg_luctating_followup_anthro',
        ],
    },
    followUps: {
        TSFP: [
            'wfp_coda_pbwg_followup_anthro',
            'wfp_coda_pbwg_luctating_followup_anthro',
        ],
    },
    defaulters: {
        TSFP: [
            'ng_pbwg_anthropometric',
            'wfp_coda_pbwg_followup_anthro',
            'wfp_coda_pbwg_luctating_followup_anthro',
            'ng_pbwg_assistance',
            'wfp_coda_pbwg_assistance_followup',
        ],
    },
    absentees: {
        TSFP: [
            'ng_pbwg_anthropometric',
            'wfp_coda_pbwg_followup_anthro',
            'wfp_coda_pbwg_luctating_followup_anthro',
            'ng_pbwg_assistance',
            'wfp_coda_pbwg_assistance_followup',
        ],
    },
    cured: {
        TSFP: [
            'ng_pbwg_anthropometric',
            'wfp_coda_pbwg_followup_anthro',
            'wfp_coda_pbwg_luctating_followup_anthro',
            'ng_pbwg_assistance',
            'wfp_coda_pbwg_assistance_followup',
        ],
    },
    nonRespondent: {
        TSFP: ['ng_pbwg_anthropometric'],
    },
    rationGiven: {
        TSFP: ['ng_pbwg_assistance', 'wfp_coda_pbwg_assistance_followup'],
    },
    medicals: {
        TSFP: [
            'ng_pbwg_anthropometric',
            'wfp_coda_pbwg_luctating_followup_anthro',
            'wfp_coda_pbwg_followup_anthro',
            'ng_medical_visit_PBWG',
            'wfp_coda_medical_follow_up_visit_PBWG',
        ],
    },
};

const formsByCategory: Record<string, Record<string, string[]>> = {
    admission: {
        TSFP: [
            'anthropometric_admission',
            'Anthropometric visit child',
            'anthropometric_second_visit_tsfp',
            'Anthropometric visit child_U6',
        ],
        OTP: [
            'anthropometric_admission',
            'anthropometric_admission_otp',
            'anthropometric_second_visit_otp',
            'Anthropometric visit child_U6',
        ],
    },
    oldCase: {
        TSFP: [
            'anthropometric_admission',
            'Anthropometric visit child',
            'anthropometric_second_visit_tsfp',
            'Anthropometric visit child_U6',
        ],
        OTP: [
            'anthropometric_admission',
            'anthropometric_admission_otp',
            'anthropometric_second_visit_otp',
            'Anthropometric visit child_U6',
        ],
    },
    followUps: {
        TSFP: [
            'anthropometric_second_visit_tsfp',
            'child_antropometric_followUp_tsfp_2',
        ],
        OTP: [
            'anthropometric_second_visit_otp',
            'child_antropometric_followUp_otp_2',
        ],
    },
    defaulters: {
        TSFP: [
            'anthropometric_admission',
            'Anthropometric visit child',
            'child_assistance_admission',
            'anthropometric_second_visit_tsfp',
            'child_assistance_2nd_visit_tsfp',
        ],
        OTP: [
            'anthropometric_admission',
            'anthropometric_admission_otp',
            'assistance_admission_otp',
            'anthropometric_second_visit_otp',
            'assistance_admission_2nd_visit_otp',
        ],
    },
    absentees: {
        TSFP: [
            'anthropometric_admission',
            'Anthropometric visit child',
            'child_assistance_admission',
            'anthropometric_second_visit_tsfp',
            'child_assistance_2nd_visit_tsfp',
        ],
        OTP: [
            'anthropometric_admission',
            'anthropometric_admission_otp',
            'assistance_admission_otp',
            'anthropometric_second_visit_otp',
            'assistance_admission_2nd_visit_otp',
        ],
    },
    cured: {
        TSFP: [
            'anthropometric_admission',
            'Anthropometric visit child',
            'child_assistance_admission',
            'anthropometric_second_visit_tsfp',
            'child_assistance_2nd_visit_tsfp',
        ],
        OTP: [
            'anthropometric_admission',
            'anthropometric_admission_otp',
            'assistance_admission_otp',
            'anthropometric_second_visit_otp',
            'assistance_admission_2nd_visit_otp',
        ],
    },
    nonRespondent: {
        TSFP: [
            'Anthropometric visit child',
            'anthropometric_second_visit_tsfp',
        ],
        OTP: [
            'anthropometric_admission_otp',
            'anthropometric_second_visit_otp',
        ],
    },
    rationGiven: {
        TSFP: [
            'child_assistance_admission',
            'child_assistance_2nd_visit_tsfp',
            'child_assistance_admission_2_u6',
        ],
        OTP: [
            'assistance_admission_otp',
            'assistance_admission_2nd_visit_otp',
            'child_assistance_admission_2_u6',
        ],
        BSFP: ['Anthropometric_BSFP_child_2'],
    },
    medicals: {
        TSFP: [
            'anthropometric_admission',
            'anthropometric_second_visit_tsfp',
            'Child Medical Admission',
            'Child Medical Follow Up TSFP',
            'child_medical_admission',
            'Child Medical Follow Up Visit TSFP',
        ],
        OTP: [
            'anthropometric_admission',
            'anthropometric_second_visit_otp',
            'Child Medical Admission',
            'Child Medical Follow Up OTP',
            'child_medical_admission',
            'Child Medical Follow Up Visit OTP',
        ],
    },
};

const matchAdmissionType = (
    values: any,
    baseType: string,
    _beneficiaryType?: string | null,
    _program?: string,
): AdmissionTypeMatch | null => {
    const rawType = values?.new_admission_type ?? values?.admission_type;
    if (rawType !== baseType) {
        return null;
    }
    return {
        baseType,
        criteria:
            values?.admission_criteria ?? values?.admission_criteria_yellow,
    };
};

const southSudan: CountryConfig = {
    screeningForms,
    formsByCategory,
    pbwgFormsByCategory,
    admissionTypesByCategory,
    pbwgAdmissionTypesByCategory,
    entityTypeByProgram,
    admissionTypeWithCriteria,
    matchAdmissionType,
    stockForms,
    assistanceFoodItemForms,
};

export default southSudan;
