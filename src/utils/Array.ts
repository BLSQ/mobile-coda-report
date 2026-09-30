import Entity from '../entity/Entity';
import { sumBy } from 'lodash';
import { countryConfig } from '../config/country';

const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
    arr.reduce((groups, item) => {
        (groups[key(item)] ||= []).push(item);
        return groups;
    }, {} as Record<K, T[]>);

const sumByAge = (
    entities: Array<Entity>,
    ageCheck: (age: number) => boolean,
): number => {
    return sumBy(entities, child => {
        let age =
            child.profile?.values?.age__int__ ??
            child.profile?.values?.age_months ??
            child.profile?.values?.age ??
            child.profile?.values?.age_years;
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
            child.profile?.values?.age__int__ ??
            child.profile?.values?.age_months ??
            child.profile?.values?.age ??
            child.profile?.values?.age_years;
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
        let admittedByCriteria = countryConfig.admissionTypeWithCriteria(
            program,
            null,
        )[category];

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
        new_case_MUAC: 'New admission (MUAC <11.5 cm)',
        new_case_WHZ: 'New admission (WHZ scores <-3SD)',
        new_case_MUAC_WHZ: 'New admission (Both WHZ and MUAC)',
        new_case_OEDEMA: 'New admission (Oedema + or ++)',
        referred_from_other_otp: 'Referred from other OTP by',
        referred_from_other_tsfp: 'Referred from other TSFP by',
        returned_defaulter: 'Returned Defaulters',
        relapse: 'Relapse',
        referred_from_sc_itp: 'Transfers in from SC/ITP',
        referred_from_tsfp: 'Referred from TSFP by',
        referred_from_otp: 'Referred from OTP by',
        transfer_from_other_otp: 'Transfer from OTP ',
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
        dismissed_due_to_cheating: 'Dismissed due to cheating',
        voluntary: 'Voluntary',
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
        motherdoesnotrecall: 'Mother does not recall',
        palmar_pallor: 'Palmar Pallor',
        conjuctivae_palm: 'Conjuctivae Palm',
        eyes_infection: 'Eyes Infection',
        eyes: 'Eyes Sunken',
        signs_vad: 'VAD Yes',
        skin_infections: 'Skin problems',
        lymph_nodes: 'Lymph Nodes',
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
        transfer_from_other_bsfp: 'Transferred from another BSFP/NSEP',
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
        muac_whz: 'MUAC & WHZ',
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
        ears_status: 'Ear Discharge',
        wsb: 'Super Cerial Plus/ WSB+',
        wsbp: 'Super Cerial Plus Plus/ WSB++',
        lns_mq: 'LNS-MQ',
        measles_status: 'Measles vaccination Status',
        deworming: 'Deworming',
        cash_voucher: 'Cash Voucher',
        in_kind: 'In-kind',
        new_admission: 'New Admission',
        readmission_after_default: 'Readmission After Default',
        returned_defaulter_old_case: 'Returned Defaulter (Old Case)',
        transferred_from_bsfp_nsep: 'Transferred from BSFP/NSEP',
        transferred_from_tsfp: 'Transferred from TSFP',
    };
    return keyValues[key];
};

let beneficiaryFollowupCategories = (program: string | null) => {
    let beneficiaryCategory = [
        { key: '', label: 'All data' },
        { key: 'absentees', label: 'Absentees' },
        { key: 'defaulters', label: 'Defaulters' },
        { key: 'non_respondent', label: 'Non-respondent' },
        { key: 'medical_investigation', label: 'Transfer to PHC' },
        //{ key: 'death', label: 'Death' },
    ];
    // BSFP/NSEP have no PHC referral pathway (unlike TSFP/OTP), so that
    // category never applies to their followup report.
    if (program === 'BSFP' || program === 'NSEP') {
        beneficiaryCategory = beneficiaryCategory.filter(
            row => row.key !== 'medical_investigation',
        );
    }
    return beneficiaryCategory;
};

const NON_FOOD_STOCK_ITEMS: Record<string, string> = {
    S1505046: 'Amoxillin pdr oral sus 125 mg bot 100 ml',
    S1505045: 'Amox 250mg tab Pac 10',
    S1505044: 'Amox 250mg tb Pac20',
    S0189000: 'Weighing trousers  pac',
    S1580100: 'Micronutrients film tab Pac 1000',
    S1555370: 'Albendazole 400 mg chew pac 1000',
    S0557000: 'Infant Scale,  Spring',
    S1561125: 'ReSoMal 42 g sachet Car 100',
    S0000209: 'F-100    ther diet sachet 1114 g Car 90',
    S0000208: 'F-75 ther diet sachet 102 g Car 120',
    S0114540: 'Portable bay/child length/height measure ',
    adult_height_measure: 'Portable adult height measure',
    S0141021: 'Weighing scale mother child 150 kg x 25 g',
    S1555360: 'Mebendazole 500 mg chew tab pack 100',
    S0145620: 'MUAC child PAC-50',
    S0145630: 'MUAC Adult PAC-50',
    S7800001: 'Retinol 100 K IU soft gel PAC caps. PAC-500',
    S7800002: 'Retinol 200 K IU soft gel PAC caps. PAC-500',
    S0114530: 'Portable bay chd L-H meas./SET-2',
    S0145555: 'Scale infant spring type 25 kg x100g',
    S1550025: 'Fe +folic acid 60+0.4 mg tab/PAC 1000',
    S1580201: 'Multiple Micro. Nut pdr (PAC)',
    S01145200: 'Port. Baby chd L-H',
    soap_hand_wash: 'Soap for hand washing',
    LLITN: 'Bed net (LLITN)',
    antimalarials: 'Antimalarials',
    NFC_cards: 'CODA NFC Cards',
    other: 'Other Stock items',
};

export {
    groupBy,
    sumByAge,
    categoryDictionary,
    sumByAgeOnField,
    defaultEmptyDataByCategory,
    sumByFieldValues,
    beneficiaryFollowupCategories,
    NON_FOOD_STOCK_ITEMS,
};
