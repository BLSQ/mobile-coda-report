import {
    dateFromJson,
    removeTime,
    weekToDateStartMonday,
} from './DateFormatter';
import Form from '../entity/Form';

interface ChildrenUnder5 {
    green: { male: number; female: number };
    yellow: { male: number; female: number };
    red: { male: number; female: number };
    oedema: { male: number; female: number };
    passive: { male: number; female: number };
}

interface PBW {
    green: { pregnant: number; lactating: number };
    red: { pregnant: number; lactating: number };
    passive: { pregnant: number; lactating: number };
}

interface IScreeningData {
    childrenUnder5: ChildrenUnder5;
    pbw: PBW;
}

const u5Forms = [
    'Anthropometric visit child',
    'Anthropometric visit child_2',
    'Anthropometric visit child_U6',
    'Anthropometric_BSFP_child_2',
];
const pbwgForms = ['wfp_coda_pbwg_anthropometric', 'PBWG_BSFP'];
const passiveScreeningEntryPoints = [
    'young_child_clinic',
    'antenatal_clinic',
    'maternal_clinic',
    'postnatal_clinic',
    'antiretroviral_treatment_clini',
    'pre_antiretroviral_treatment_c',
    'outpatient_department',
    'tb_clinic',
    'self_referral',
    'child_clinic',
    'anc_clinic',
    'postnatal_care',
    'arv_clinic',
    'opd',
    'other',
];

function processScreeningData(
    submissions: Form[],
    startDate: Date | null,
    endDate: Date | null,
): IScreeningData {
    let activeScreeningRecords = submissions
        ?.filter(submission => submission.formFormId === 'screening_tally')
        ?.map(row => {
            return {
                ...row,
                period: new Date(weekToDateStartMonday(row?.periodId)),
            };
        });

    let passiveScreeningRecords: any[] = [];
    let malePassiveChildrenUnder5: any[] = [];
    let femalePassiveChildrenUnder5: any[] = [];
    let pregnantPassive: any[] = [];
    let lactatingPassive: any[] = [];

    if (startDate && endDate) {
        const start = removeTime(new Date(startDate));
        const end = removeTime(new Date(endDate));

        activeScreeningRecords = activeScreeningRecords?.filter(
            (record: any) => {
                const referenceReportDate = removeTime(
                    dateFromJson(record.period),
                );
                return (
                    referenceReportDate >= start && referenceReportDate <= end
                );
            },
        );
        passiveScreeningRecords = submissions.filter(
            submission =>
                (passiveScreeningEntryPoints.includes(
                    submission.values?.who_referred_green,
                ) ||
                    passiveScreeningEntryPoints.includes(
                        submission.values?.who_referred_yellow,
                    ) ||
                    passiveScreeningEntryPoints.includes(
                        submission.values?.entry_point,
                    ) ||
                    passiveScreeningEntryPoints.includes(
                        submission.values?.who_referred_severe,
                    ) ||
                    passiveScreeningEntryPoints.includes(
                        submission.values?._who_referred,
                    )) &&
                start <=
                    removeTime(
                        dateFromJson(
                            submission?.values?.visit_date ??
                                submission?.values?._visit_date,
                        ),
                    ) &&
                end >=
                    removeTime(
                        dateFromJson(
                            submission?.values?.visit_date ??
                                submission?.values?._visit_date,
                        ),
                    ),
        );
        const passiveChildrenUnder5 = passiveScreeningRecords.filter(
            submission => u5Forms.includes(submission?.formFormId),
        );
        malePassiveChildrenUnder5 = passiveChildrenUnder5.filter(
            submission =>
                submission?.values._gender === 'Male' ||
                submission?.values.gender === 'M',
        );
        femalePassiveChildrenUnder5 = passiveChildrenUnder5.filter(
            submission =>
                submission?.values._gender === 'Female' ||
                submission?.values.gender === 'F',
        );

        const passivePBWG = passiveScreeningRecords.filter(submission =>
            pbwgForms.includes(submission?.formFormId),
        );
        pregnantPassive = passivePBWG.filter(
            submission =>
                submission?.values.pregnant === 'yes' ||
                submission?.values.is_pregnant === 'yes' ||
                submission?.values._is_pregnant === 'yes',
        );
        lactatingPassive = passivePBWG.filter(
            submission =>
                submission?.values.pregnant === 'no' ||
                submission?.values.is_pregnant === 'no' ||
                submission?.values._is_pregnant === 'no',
        );
    }

    const totals: IScreeningData = {
        childrenUnder5: {
            green: { male: 0, female: 0 },
            yellow: { male: 0, female: 0 },
            red: { male: 0, female: 0 },
            oedema: { male: 0, female: 0 },
            passive: { male: 0, female: 0 },
        },
        pbw: {
            green: { pregnant: 0, lactating: 0 },
            red: { pregnant: 0, lactating: 0 },
            passive: { pregnant: 0, lactating: 0 },
        },
    };

    for (const record of activeScreeningRecords ?? []) {
        const values = record.values;

        // Children Under 5
        totals.childrenUnder5.green.male += values.u5_male_green || 0;
        totals.childrenUnder5.green.female += values.u5_female_green || 0;
        totals.childrenUnder5.yellow.male += values.u5_male_yellow || 0;
        totals.childrenUnder5.yellow.female += values.u5_female_yellow || 0;
        totals.childrenUnder5.red.male += values.u5_male_red || 0;
        totals.childrenUnder5.red.female += values.u5_female_red || 0;
        totals.childrenUnder5.oedema.male += values.u5_male_oedema || 0;
        totals.childrenUnder5.oedema.female += values.u5_female_oedema || 0;

        // Pregnant & Breastfeeding Women
        totals.pbw.green.pregnant += values.pregnant_w_muac_gt_23 || 0;
        totals.pbw.red.pregnant += values.pregnant_w_muac_lte_23 || 0;
        totals.pbw.green.lactating += values.lactating_w_muac_gt_23 || 0;
        totals.pbw.red.lactating += values.lactating_w_muac_lte_23 || 0;
    }
    totals.childrenUnder5.passive.male = malePassiveChildrenUnder5.length;
    totals.childrenUnder5.passive.female = femalePassiveChildrenUnder5.length;
    totals.pbw.passive.pregnant = pregnantPassive.length;
    totals.pbw.passive.lactating = lactatingPassive.length;

    return totals;
}

export { processScreeningData };
export type { IScreeningData };
