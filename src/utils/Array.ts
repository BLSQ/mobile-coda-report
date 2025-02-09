import Entity from '../entity/Entity';
import { sumBy } from 'lodash';

const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
    arr.reduce((groups, item) => {
        (groups[key(item)] ||= []).push(item);
        return groups;
    }, {} as Record<K, T[]>);

const entityTypeByProgram = (program: string, type: string): string => {
    let entityType = '';
    if (type === 'Child Under 5') {
        if (program === 'TSFP_MAM' || program === 'TSFP') {
            entityType = 'TSFP';
        } else {
            if (program === 'OTP_SAM' || program === 'OTP') {
                entityType = 'OTP';
            }
        }
    } else {
        if (type === undefined || type === 'PBWG') {
            entityType = 'TSFP';
        }
    }

    return entityType;
};

const sumByAge = (
    entities: Array<Entity>,
    ageCheck: (age: number) => boolean,
): number => {
    return sumBy(entities, child => {
        let age =
            child.profile.values?.age__int__ ??
            child.profile.values?.age_months ??
            child.profile.values?.age ??
            child.profile.values?.age_years;
        if (age != null && ageCheck(age)) {
            return 1;
        }
        return 0;
    });
};

const sumByFieldValues = (rows: any[], keyName: string) => {
    return rows.reduce((value: any, visit: any) => {
        if (visit?.values[keyName] !== '') {
            return value + parseFloat(visit?.values[keyName] ?? 0);
        } else {
            return value;
        }
    }, 0);
};

const sumByAgeOnField = (
    entities: Array<any>,
    ageCheck: (age: number) => boolean,
    status: string,
) => {
    return sumBy(entities, child => {
        let age =
            child.profile.values?.age__int__ ??
            child.profile.values?.age_months ??
            child.profile.values?.age ??
            child.profile.values?.age_years;
        let visitSatus = child[status];
        if (age != null && ageCheck(age)) {
            return visitSatus ?? 0;
        }
        return 0;
    });
};

const defaultEmptyDataByCategory = (
    categories: Array<any>,
    program: string,
    entityType: string,
) => {
    return categories.map(category => {
        let defaultKeys: any = null;
        if (entityType === 'Child Under 5') {
            defaultKeys = {
                between6And23: [0, 0],
                between24And59: [0, 0],
            };
        } else {
            defaultKeys = {
                under19: [0, 0],
                over19: [0, 0],
            };
        }
        let admittedByCriteria = admissionTypeWithCriteria(program, null)[
            category
        ];

        if (admittedByCriteria && admittedByCriteria !== undefined) {
            let rows = admittedByCriteria?.map((criteria: string) => {
                return {
                    key: criteria,
                    status: category,
                    ...defaultKeys,
                };
            });
            return rows;
        } else {
            return {
                key: '',
                status: category,
                ...defaultKeys,
            };
        }
    });
};

const categoryDictionary = (key: string) => {
    let keyValues: any = {
        new_case: 'New case',
        referred_from_other_otp: 'Referred from other OTP by',
        referred_from_other_tsfp: 'Referred from other TSFP by',
        returned_defaulter: 'Returned Defaulters',
        relapse: 'Relapse',
        referred_from_sc_itp: 'Transfers in from SC/ITP',
        referred_from_tsfp: 'Referred from other TSFP by',
        referred_from_otp: 'Referred from OTP by',
        returned_referral: 'Returned Referral',
        readmission_as_non_respondent: 'Readmission as non respondent',
        readmission_non_respondent: 'Readmission as non respondent',
        voluntarywithdrawal: 'Voluntary Withdrawal',
        voluntary_withdrawal: 'Voluntary Withdrawal',
        dismissiedduetocheating: 'Dismissals due to cheating',
        dismissal: 'Dismissals due to cheating',
        death: 'Death',
        cured: 'Cured',
        transferred_out: 'Transferred Out',
        transferredout: 'Transferred Out',
        yes: 'Yes',
        no: 'No',
        have_diarrhoea: 'Diarrhoea',
        have_diarrhoea__bool__: 'Diarrhoea',
        passing_urine: 'Problems urinating',
        passing_urine__bool__: 'Problems urinating',
        contact_tb: 'Contact with TB person',
        medical_appetite: 'Poor appetite',
        state_appetite: 'Poor appetite',
        none: 'None',
        incomplete: 'Incomplete',
        complete: 'Complete',
        'motherdoesnot recall': 'No idea',
        palmar_pallor: 'Palmar Pallor',
        conjuctivae_palm: 'Conjuctivae Palm',
        eyes_infection: 'Eyes Infection',
        eyes: 'Eyes Sunken',
        signs_vad: 'VAD Yes',
        skin_infections: 'Skin infections',
        dermatosis_dermatosis: 'Dermatosis',
        disability_status: 'Disability present',
        positive: 'Positive',
        negative: 'Negative',
        exposed: 'Exposed',
        unknown: 'Unknown',
        tb_therapy: 'TB Therapy',
        nottested: 'Not tested',
        tested_malaria: 'Tested',
        malaria_test: 'Tested',
        tested_malaria__bool__: 'Tested',
        treated_for_malaria: 'Treated',
        treated_for_malaria__bool__: 'Treated',
        result_appetite_test: 'Failed appetite test',
        appetite_test_result: 'Failed appetite test',
        amoxillin: 'Amoxicillin given',
        erythromycin: 'Erythromycin given',
        albendazole: 'Albendazole given',
        intractablevomit: 'Intractable vomit',
        convulsions: 'Convulsions',
        lethargynotalert: 'Lethargy/not alert',
        unconsciousness: 'Unconsciousness',
        hypoglycaemia: 'Hypoglycaemia',
        highfever: 'High fever',
        hypothermia: 'Hypothermia',
        severedehydration: 'Severe dehydration',
        lowerrespiratorytractinfection: 'Lower respiratory tract infection',
        severeanemia: 'Severe anemia',
        eyesignsofvitadeficiency: 'Eye signs of vit A deficiency',
        skinlesions: 'Skin lesions',
        respiratory_rate: 'Poor respiratory rate',
        rutf: 'RUTF',
        rusf: 'RUSF',
        csb: 'CSB+',
        csb1: 'CSB+ and Veg oil',
        csb2: 'CSB++',
        lndf: 'Local Nutrient Dense Food (e.g. Tom Brown)',
        RUSF: 'RUSF',
        'CSB++': 'CSB++',
        child_waste: 'Wasted child',
        child_wasted: 'Wasted child',
        returned_from_sc: 'Transfer in from SC',
        transfer_from_other_tsfp: 'Transfer in from other TSFP',
        transfer_to_sc_itp: 'Referrals to SC/ITP',
        transfer_to_healthcenter: 'Transfers to Health Center',
        whz: 'Z-Score',
        defaulter: 'Defaulters',
        non_respondent: 'Non-respondent',
        non_respondent__int__: 'Non-respondent',
        dismissedduetocheating: 'Dismissals due to cheating',
        transferred_to_otp: 'Referrals to OTP',
        transferred_to_tsfp: 'Transfers to TSFP/Cured',
        referred_for_medical_examination: 'Medical transfers',
        absentees: 'Absentees',
        defaulters: 'Defaulters',
        medical_investigation: 'Medical investigation',
        home_visits: 'Home visits',
        referral_to_sc_itp: 'Referral to SC',
        breastfeeding: 'Lactating',
        pregnant: 'Pregnant',
        returnee: 'Returnee',
        muac: 'MUAC',
        oedema: 'Oedema',
        other: 'Other',
        birthregistration: 'Birth Registration',
        vaccinationid: 'Vaccination ID',
        child_vomiting: 'Vomit',
        fully_immunization: 'Fully immunised',
        not_fully_immunization: 'Not fully immunised',
        measles_vacc_proof: 'Measles vaccine proof',
        no_measles_vacc_proof: 'No measles vaccine proof',
        apatheticpassive: 'Apathetic/Passive',
        ab_given: 'Abendazole ',
        anti_helminth_given: 'Mebendazole',
        abendazole: 'Abendazole ',
        mebendazole: 'Mebendazole',
        art_given: 'ART',
        vitamins_given: 'Vitamin A',
        ears_status: 'Ear Discharge'
    };
    return keyValues[key];
};

const childrenUnder5Criteria = ['muac', 'oedema', 'whz'];

const admissionTypeWithCriteria = (
    program: string,
    beneficiaryType: string | null,
) => {
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
        referred_from_other_tsfp: criteriaType,
    };
    return types;
};

let beneficiaryFollowupCategories = (program: string | null) => {
    let beneficiaryCategory = [
        { key: '', label: 'All data' },
        { key: 'absentees', label: 'Absentees' },
        { key: 'defaulters', label: 'Defaulters' },
        { key: 'non_respondent', label: 'Non-respondent' },
        { key: 'referral_to_sc_itp', label: 'Referral to SC' },
        { key: 'medical_investigation', label: 'Medical investigation' },
        { key: 'death', label: 'Death' },
    ];
    if (program?.includes('TSFP')) {
        beneficiaryCategory.push({
            //key:'_transfer_to_otp',
            key: 'referred_from_other_otp',
            label: 'Transfer in from OTP',
        });
        beneficiaryCategory.push({
            key: 'referred_from_other_tsfp',
            label: 'Transfer in from other TSFP',
        });
    } else {
        if (program?.includes('OTP')) {
            beneficiaryCategory.push({
                key: 'transferred_to_tsfp',
                label: 'Transfer To TSFP',
            });
            beneficiaryCategory.push({
                key: 'referred_from_other_otp',
                label: 'Transfer in from other OTP',
            });
        }
    }
    return beneficiaryCategory;
};

export {
    groupBy,
    sumByAge,
    categoryDictionary,
    sumByAgeOnField,
    defaultEmptyDataByCategory,
    admissionTypeWithCriteria,
    entityTypeByProgram,
    sumByFieldValues,
    beneficiaryFollowupCategories,
};
