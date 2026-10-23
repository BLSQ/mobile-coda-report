import { sumByAge, sumByAgeOnField, groupBy, getBeneficiaryAge } from './Array';
import {
    visitsDataByValuesList,
    visitsDataByStatus,
    isChecked,
} from './Filter';
import {
    filterDataOnProgram,
    followUpData,
    visitsLinkedToForms,
    defaulterCases,
    isReferredToSc,
    isTransferredToTsfp,
    isTransferredToOtp,
    hasFailedToGainWeight,
} from './DataFilter';
import { timeStampToDateString, removeTime } from './DateFormatter';
import { countryConfig, MedicalRow } from '../config/country';

const pbwgMedicalStatusByCategory: any = {
    Malaria: ['positive', 'negative'],
    HIV: ['positive', 'negative', 'exposed', 'unknown'],
    Fever: ['yes', 'no'],
    'Breastfeeding problems': ['yes', 'no'],
    'Referred for treatment': ['yes', 'no'],
};
const admissionPBWGByStatus = (
    entities: Array<any>,
    status: string,
    key: string,
) => {
    let pregnant = entities?.filter(
        (entity: any) =>
            entity.profile?.values?.physiology_status === 'pregnant',
    );
    let lactating = entities?.filter(
        (entity: any) =>
            entity.profile?.values?.physiology_status === 'breastfeeding',
    );

    let pregnantUnder19 = 0;
    let lactatingUnder19 = 0;
    let pregnantOver19 = 0;
    let lactatingOver19 = 0;
    let fieldToSum = '';

    if (
        status === 'defaulter' ||
        !['Total Follow up', 'Follow Ups'].includes(status)
    ) {
        pregnantUnder19 = sumByAge(pregnant, age => age <= 19);
        lactatingUnder19 = sumByAge(lactating, age => age <= 19);
        pregnantOver19 = sumByAge(pregnant, age => age > 19);
        lactatingOver19 = sumByAge(lactating, age => age > 19);
    } else {
        if (['Total Follow up', 'Follow Ups'].includes(status)) {
            fieldToSum = 'visitsNumber';
        } else {
            key = '';
            fieldToSum = status;
        }
        pregnantUnder19 = sumByAgeOnField(
            pregnant,
            age => age <= 19,
            fieldToSum,
        );
        lactatingUnder19 = sumByAgeOnField(
            lactating,
            age => age <= 19,
            fieldToSum,
        );
        pregnantOver19 = sumByAgeOnField(pregnant, age => age > 19, fieldToSum);
        lactatingOver19 = sumByAgeOnField(
            lactating,
            age => age > 19,
            fieldToSum,
        );
    }
    return {
        key: key !== 'undefined' ? key : '',
        status: status,
        under19: [pregnantUnder19, lactatingUnder19],
        over19: [pregnantOver19, lactatingOver19],
    };
};

// Whether the program's Child Under 5 tables have a 0-5 months column.
const hasUnder6Column = (program?: string) =>
    program != null && (countryConfig.under6Column?.(program) ?? false);

const admissionByStatus = (
    entityType: string,
    entities: Array<any>,
    status: string,
    key: string,
    program?: string,
) => {
    if (entityType === 'Child Under 5') {
        return admissionChildUnder5ByStatus(
            entities,
            status,
            key,
            hasUnder6Column(program),
        );
    } else {
        if (entityType === 'PBWG') {
            return admissionPBWGByStatus(entities, status, key);
        }
    }
};

const admissionChildUnder5ByStatus = (
    entities: Array<any>,
    status: string,
    key: string,
    withUnder6: boolean = false,
) => {
    let boys = entities?.filter((entity: any) =>
        ['Male', 'M'].includes(
            entity.profile?.values?.gender ?? entity.profile?.values?._gender,
        ),
    );

    let girls = entities?.filter((entity: any) =>
        ['Female', 'F'].includes(
            entity.profile?.values?.gender ?? entity.profile?.values?._gender,
        ),
    );

    // Follow ups count visits, every other status counts children.
    const count = (group: Array<any>, ageCheck: (age: number) => boolean) =>
        ['Total Follow up', 'Follow Ups'].includes(status)
            ? sumByAgeOnField(group, ageCheck, 'visitsNumber')
            : sumByAge(group, ageCheck);
    const byGender = (ageCheck: (age: number) => boolean) => [
        count(boys, ageCheck),
        count(girls, ageCheck),
    ];

    return {
        key: key !== 'undefined' ? key : '',
        status: status,
        ...(withUnder6 && { under6: byGender(age => age < 6) }),
        between6And23: byGender(
            withUnder6 ? age => age >= 6 && age <= 23 : age => age <= 23,
        ),
        between24And59: byGender(age => age > 23),
    };
};

const sumDataWithCommonKeys = (
    rows: any[],
    mainStatus: string,
    reportCategory: string,
) => {
    let data = rows.filter(row => row !== undefined);

    if (reportCategory && reportCategory === 'PBWG') {
        let under19 = [0, 0];
        let over19 = [0, 0];
        data.forEach((row: any) => {
            under19 = [
                under19[0] + row['under19'][0],
                under19[1] + row['under19'][1],
            ];
            over19 = [
                over19[0] + row['over19'][0],
                over19[1] + row['over19'][1],
            ];
        });
        return {
            key: '',
            status: mainStatus,
            under19: under19,
            over19: over19,
        };
    } else {
        const sumOf = (field: string) =>
            data.reduce(
                ([boys, girls], row: any) => [
                    boys + (row[field]?.[0] ?? 0),
                    girls + (row[field]?.[1] ?? 0),
                ],
                [0, 0],
            );
        return {
            key: '',
            status: mainStatus,
            ...(data.some(row => row.under6) && { under6: sumOf('under6') }),
            between6And23: sumOf('between6And23'),
            between24And59: sumOf('between24And59'),
        };
    }
};

const pbwgMedicalDataReport = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date,
) => {
    let initialData = filterDataOnProgram(
        entities,
        program,
        startDate,
        endDate,
    );
    let rows = followUpData(initialData, program, 'medicals', 'PBWG');
    let malariaStatus = visitsDataByValuesList(rows, 'malaria_result', [
        'positive',
        'negative',
    ]);
    let groupMalariaDataByMedicalTypes = groupBy(
        malariaStatus.flat(),
        (visit: any) => visit?.value,
    );

    let hivStatus = visitsDataByValuesList(rows, 'hiv_status', [
        'positive',
        'negative',
        'exposed',
        'unknown',
    ]);

    let groupHIVDataByMedicalTypes = groupBy(
        hivStatus.flat(),
        (visit: any) => visit?.value,
    );

    let fever = visitsDataByValuesList(rows, 'fever', ['yes', 'no']);
    let groupFeverDataByMedicalTypes = groupBy(
        fever.flat(),
        (visit: any) => visit?.value,
    );

    let breastfeedingProblems = visitsDataByValuesList(
        rows,
        'breastfeeding_problems',
        ['yes', 'no'],
    );
    let groupbreastfeedingProblems = groupBy(
        breastfeedingProblems.flat(),
        (visit: any) => visit?.value,
    );
    let breastfeedingTreatment = visitsDataByValuesList(
        rows,
        'breastfeeding_treatment',
        ['yes', 'no'],
    );
    let groupBreastFeedingTreatment = groupBy(
        breastfeedingTreatment.flat(),
        (visit: any) => visit?.value,
    );

    return {
        Malaria: groupMalariaDataByMedicalTypes,
        HIV: groupHIVDataByMedicalTypes,
        Fever: groupFeverDataByMedicalTypes,
        'Breastfeeding problems': groupbreastfeedingProblems,
        'Referred for treatment': groupBreastFeedingTreatment,
    };
};

// The entities with the visits matching a medical row, dropping the ones
// with none.
const entitiesMatching = (entities: Array<any>, row: MedicalRow) =>
    entities
        .map(entity => {
            const age = getBeneficiaryAge(entity);
            const visits = entity.visits.filter((visit: any) =>
                row.match(visit?.values, age),
            );
            return { ...entity, visits, visitsNumber: visits.length };
        })
        .filter(entity => entity.visitsNumber > 0);

// A row with splitBy becomes one row per text typed in that field, sorted;
// visits with no text stay under the row's own label.
const splitByText = (row: MedicalRow, entities: Array<any>) => {
    const splitBy = row.splitBy;
    if (!splitBy) {
        return [{ label: row.label, entities }];
    }
    const byText: Record<string, Array<any>> = {};
    entities.forEach(entity => {
        const visitsByText = groupBy(
            entity.visits,
            (visit: any) => visit?.values?.[splitBy]?.trim() || row.label,
        );
        Object.entries(visitsByText).forEach(([text, visits]) => {
            (byText[text] ||= []).push({
                ...entity,
                visits,
                visitsNumber: visits.length,
            });
        });
    });
    const texts = Object.keys(byText).sort();
    return texts.length > 0
        ? texts.map(text => ({ label: text, entities: byText[text] }))
        : [{ label: row.label, entities: [] }];
};

const childrenUnder5MedicalReport = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date,
) => {
    let initialData = filterDataOnProgram(
        entities,
        program,
        startDate,
        endDate,
    );
    let rows = followUpData(initialData, program, 'medicals', 'Child Under 5');
    const withUnder6 = hasUnder6Column(program);

    return countryConfig.childUnder5MedicalSections.map(section => ({
        category: section.title,
        rows: section.rows
            .flatMap(row => splitByText(row, entitiesMatching(rows, row)))
            .map(({ label, entities }) => ({
                ...admissionChildUnder5ByStatus(
                    entities,
                    section.title,
                    label,
                    withUnder6,
                ),
                label,
            })),
    }));
};

const medicalReports = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date,
    reportCategory: string,
) => {
    if (reportCategory !== 'PBWG') {
        return childrenUnder5MedicalReport(
            entities,
            program,
            startDate,
            endDate,
        );
    }
    let rows: any = pbwgMedicalDataReport(
        entities,
        program,
        startDate,
        endDate,
    );
    return Object.keys(pbwgMedicalStatusByCategory).map((category: string) => ({
        category: category,
        rows: pbwgMedicalStatusByCategory[category].map((subCategory: string) =>
            admissionPBWGByStatus(
                rows[category] && rows[category][subCategory],
                category,
                subCategory,
            ),
        ),
    }));
};

const eRegister = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date,
    entityType: string,
) => {
    let initialData = filterDataOnProgram(
        entities,
        program,
        startDate,
        endDate,
    );
    let defaulters = followUpData(entities, program, 'defaulters', entityType);

    let entitiesToDefaults = defaulterCases(
        defaulters,
        startDate,
        endDate,
        program,
    );
    const deaths = visitsDataByStatus(entities, 'reason_not_continue', 'death');
    const nonRespondents = visitsDataByStatus(
        entities,
        'non_respondent__int__',
        1,
    );
    const cured = visitsDataByStatus(initialData, 'cured__bool__', true);

    const anthropometricForms = [
        'Anthropometric visit child',
        'anthropometric_admission',
        'anthropometric_admission_otp',
        'anthropometric_second_visit_tsfp',
        'anthropometric_second_visit_otp',
        'ng_pbwg_anthropometric',
        'wfp_coda_pbwg_followup_anthro',
        'wfp_coda_pbwg_luctating_followup_anthro',
        'wfp_coda_pbwg_anthropometric',
        'Anthropometric visit child_U6',
        'child_antropometric_followUp_tsfp_2',
    ];

    let beneficiaries = initialData.map(entity => {
        let discharges: any = {
            cured: cured.find(
                (current_entity: any) => current_entity.id === entity.id,
            ),
            non_respondent: nonRespondents.find(
                (current_entity: any) => current_entity.id === entity.id,
            ),
            defaulters: entitiesToDefaults
                .filter(entity => entity?.counter > 1)
                .find((current_entity: any) => current_entity.id === entity.id),
            absentees: entitiesToDefaults
                .filter(entity => entity?.counter === 1)
                .find((current_entity: any) => current_entity.id === entity.id),
            death: deaths.find(
                (current_entity: any) => current_entity.id === entity.id,
            ),
        };
        // TSFP and OTP transfer to each other: the transfer visit is the exit.
        const transferVisit = (key: string) => {
            const visit = (entity?.visits ?? []).find((visit: any) =>
                isChecked(visit?.values?.[`_${key}`]),
            );
            return (
                visit && {
                    exitDate: visit?.values?._visit_date ?? visit?.createdAt,
                    exitWeight:
                        visit?.values?.weight_kgs ??
                        visit?.values?.previous_weight_kgs__decimal__,
                }
            );
        };
        if (program?.includes('TSFP')) {
            discharges.transfer_to_otp = transferVisit('transfer_to_otp');
        }
        if (program?.includes('OTP')) {
            discharges.transfer_to_tsfp = transferVisit('transfer_to_tsfp');
        }

        // Death wins over every exit but cured: a child who died after
        // missing visits is a death, not an absentee or a defaulter.
        const exitType = discharges.cured
            ? 'cured'
            : discharges.death
            ? 'death'
            : discharges.transfer_to_otp
            ? 'transfer_to_otp'
            : discharges.transfer_to_tsfp
            ? 'transfer_to_tsfp'
            : discharges.non_respondent
            ? 'non_respondent'
            : discharges.defaulters
            ? 'defaulters'
            : discharges.absentees
            ? 'absentees'
            : '';
        // Read before `visits` is narrowed to the anthropometric forms below:
        // the SC referral is confirmed on the medical form.
        const referralToSc = isReferredToSc(entity);
        const transferToOtp = isTransferredToOtp(entity, program);
        const transferToTsfp = isTransferredToTsfp(entity, program);
        const failureToGainWeight = hasFailedToGainWeight(entity);
        const visits = visitsLinkedToForms(
            startDate,
            endDate,
            entity?.visits,
            anthropometricForms,
            program,
        );
        const exit = discharges[exitType];

        let exitWeight = exit?.exitWeight;
        let exitDate = ""
        if(exit){
            exitDate = timeStampToDateString(
                  exit.exitDate ||
                      exit.createdAt ||
                      visits[visits.length - 1]?.values?._visit_date ||
                      visits[visits.length - 1]?.values?.visit_date,
              )
        }

        let lengthOfStay = 0;

        if (exitDate) {
            const duration =
                removeTime(new Date(exitDate)).getTime() -
                removeTime(entity?.profile?.createdAt).getTime();
            lengthOfStay = Math.round(duration / (1000 * 3600 * 24));
        }
        return {
            ...entity,
            firstName: entity?.profile?.values?.first_name,
            lastName: entity?.profile?.values?.last_name,
            middleName: entity?.profile?.values?.middle_name,
            gender: entity?.profile?.values?._gender,
            age: getBeneficiaryAge(entity),
            admission_date: timeStampToDateString(
                entity?.profile?.values?.registration_date,
            ),
            birth_date: timeStampToDateString(
                entity?.profile?.values?.actual_birthday__date__,
            ),
            address: entity?.profile?.values?.path_address,
            visits: visits,
            weight:
                visits[0]?.values?.previous_weight_kgs__decimal__ ||
                visits[0]?.values?.weight_kgs,
            muac: visits[0]?.values?.muac,
            whzScore: visits[0]?.values?._whz_score,
            admissionType:
                entity?.visitLinkedToProgram?.values?.new_admission_type ??
                entity?.visitLinkedToProgram?.values?.admission_type ??
                visits[0]?.values?.new_admission_type ??
                visits[0]?.values?.admission_type ??
                visits[0]?.values?.admission_type_yellow ??
                visits[0]?.values?.admission_type_red ??
                entity?.profile?.values?.admission_type,
            admissionChoice:
                entity?.visitLinkedToProgram?.values?.admission_criteria ??
                entity?.visitLinkedToProgram?.values?.admission_choice ??
                visits[0]?.values?.admission_choice ??
                visits[0]?.values?.admission_criteria_yellow ??
                visits[0]?.values?.admission_criteria_red ??
                visits[0]?.values?.admission_criteria ??
                entity?.profile?.values?.admission_choice,
            visit_number: visits.length,
            oedemaStatus:
                visits[0]?.values?.oedema_severity === '1'
                    ? '+'
                    : visits[0]?.values?.oedema_severity === '2'
                    ? '++'
                    : visits[0]?.values?.oedema_severity === '3'
                    ? '+++'
                    : '',
            referralToSc: referralToSc,
            transferToOtp: transferToOtp,
            transferToTsfp: transferToTsfp,
            failureToGainWeight: failureToGainWeight,
            exit_type: exitType,
            exit: discharges && discharges[exitType],
            exitWeight: exitWeight,
            exitDate: exitDate,
            lengthOfStay: lengthOfStay,
            exitMuac:
                exitType !== '' &&
                (visits[visits.length - 1]?.values?.muac ??
                    visits[visits.length - 1]?.values?.previous_muac ??
                    visits[visits.length - 1]?.values
                        ?.previous_oedema_status__int__),
        };
    });
    return beneficiaries;
};

export {
    admissionChildUnder5ByStatus,
    admissionPBWGByStatus,
    admissionByStatus,
    sumDataWithCommonKeys,
    childrenUnder5MedicalReport,
    pbwgMedicalDataReport,
    pbwgMedicalStatusByCategory,
    medicalReports,
    eRegister,
};
