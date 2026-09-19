import { sumByAge, sumByAgeOnField, groupBy } from './Array';
import {
    visitsDataByFieldList,
    visitsDataByValuesList,
    visitsDataByStatus,
} from './Filter';
import {
    filterDataOnProgram,
    followUpData,
    visitsLinkedToForms,
    defaulterCases,
} from './DataFilter';
import { timeStampToDateString, removeTime } from './DateFormatter';

const pbwgMedicalStatusByCategory: any = {
    Malaria: ['positive', 'negative'],
    HIV: ['positive', 'negative', 'exposed', 'unknown'],
    'Breastfeeding problems': ['yes', 'no'],
    'Referred for treatment': ['yes', 'no'],
};
let childrenUnder5MedicalStatusByCategory: any = {
    '': [
        'have_diarrhoea__bool__',
        'passing_urine__bool__',
        'tb_therapy',
        'state_appetite',
        'appetite_test_result',
        'child_vomiting',
        'respiratory_rate',
        'conjuctivae_palm',
        'eyes',
        'disability_status',
        'ears_status',
        'skin_infections',
        'lymph_nodes',
    ],
    "Immunization for Age": [
        'none',
        'incomplete',
        'complete',
        'motherdoesnotrecall',
    ],

    //HIV: ['positive', 'negative', 'nottested'],
    Complications: [
       // 'apatheticpassive',
        'highfever',
        'hypothermia',
        'severedehydration',
        'lowerrespiratorytractinfection',
        'severeanemia',
        'eyesignsofvitadeficiency',
        'skinlesions',
        //'other',
    ],
    'Medication Given': [
        // 'ab_given',
        // 'anti_helminth_given',
        // 'art_given',
        'vitamins_given',
    ],
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

    let pregnantUnder19,
        lactatingUnder19,
        pregnantOver19,
        lactatingOver19 = 0;
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

const admissionByStatus = (
    entityType: string,
    entities: Array<any>,
    status: string,
    key: string,
) => {
    if (entityType === 'Child Under 5') {
        return admissionChildUnder5ByStatus(entities, status, key);
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
) => {
    let boys = entities?.filter((entity: any) =>
        ['Male', 'M'].includes(entity.profile?.values?.gender ?? entity.profile?.values?._gender),
    );

    let girls = entities?.filter((entity: any) =>
        ['Female', 'F'].includes(entity.profile?.values?.gender ?? entity.profile?.values?._gender),
    );

    let boyBetween6And23,
        girlBetween6And23,
        boyBetween24And59,
        girlBetween24And59 = 0;

    let fieldToSum = '';

    if (
        status === 'defaulter' ||
        !['Total Follow up', 'Follow Ups'].includes(status)
    ) {
        boyBetween6And23 = sumByAge(boys, age => age <= 23);
        girlBetween6And23 = sumByAge(girls, age => age <= 23);
        boyBetween24And59 = sumByAge(boys, age => age > 23);
        girlBetween24And59 = sumByAge(girls, age => age > 23);
    } else {
        if (['Total Follow up', 'Follow Ups'].includes(status)) {
            fieldToSum = 'visitsNumber';
        } else {
            key = '';
            fieldToSum = status;
        }
        boyBetween6And23 = sumByAgeOnField(boys, age => age <= 23, fieldToSum);
        girlBetween6And23 = sumByAgeOnField(
            girls,
            age => age <= 23,
            fieldToSum,
        );
        boyBetween24And59 = sumByAgeOnField(boys, age => age > 23, fieldToSum);
        girlBetween24And59 = sumByAgeOnField(
            girls,
            age => age > 23,
            fieldToSum,
        );
    }

    return {
        key: key !== 'undefined' ? key : '',
        status: status,
        between6And23: [boyBetween6And23, girlBetween6And23],
        between24And59: [boyBetween24And59, girlBetween24And59],
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
        let between6And23 = [0, 0];
        let between24And59 = [0, 0];
        data.forEach((row: any) => {
            between6And23 = [
                between6And23[0] + row['between6And23'][0],
                between6And23[1] + row['between6And23'][1],
            ];
            between24And59 = [
                between24And59[0] + row['between24And59'][0],
                between24And59[1] + row['between24And59'][1],
            ];
        });
        return {
            key: '',
            status: mainStatus,
            between6And23: between6And23,
            between24And59: between24And59,
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
        'nottested',
    ]);
    
    let groupHIVDataByMedicalTypes = groupBy(
        hivStatus.flat(),
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
        'Breastfeeding problems': groupbreastfeedingProblems,
        'Referred for treatment': groupBreastFeedingTreatment,
    };
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

    let defaultData = visitsDataByFieldList(rows, {
        have_diarrhoea__bool__: '1',
        passing_urine__bool__: '0',
        tb_therapy: '1',
        state_appetite: 'poor',
        appetite_test_result: 'failure',
        child_vomiting: '1',
        conjuctivae_palm: 'pale',
        eyes: 'sunken',
        disability_status__bool__: '1',
        respiratory_rate: '',
        ears_status: 'discharge',
        skin_infections: '',
        lymph_nodes: '',
    }).flat();
    let groupDefaultDataByMedicalTypes = groupBy(
        defaultData,
        (visit: any) => visit?.criteria,
    );
    // let immunizations = visitsDataByFieldList(rows, {
    //     fully_immunization: '1',
    //     not_fully_immunization: '1',
    //     measles_vacc_proof: '1',
    //     no_measles_vacc_proof: '1',
    // });
    let immunizations =visitsDataByValuesList(rows, 'immunization_status', ["none", "incomplete", "complete", "motherdoesnotrecall"]);
    console.info("IMMUNIZATION ...:", immunizations)
    let groupImmunizationDataByMedicalTypes = groupBy(
        immunizations.flat(),
        (visit: any) => visit?.value
    );
    console.info("GROUP IMMUNIZATION ...:", groupImmunizationDataByMedicalTypes)

    // let groupImmunizationDataByMedicalTypes = groupBy(
    //     immunizations.flat(),
    //     (visit: any) => visit?.criteria,
    // );

    let hivStatus = visitsDataByValuesList(rows, 'hiv_status', [
        'positive',
        'negative',
        'nottested',
    ]);
    let groupHIVDataByMedicalTypes = groupBy(
        hivStatus.flat(),
        (visit: any) => visit?.value,
    );

    let complications = visitsDataByValuesList(rows, 'medical_complications', [
        'intractablevomit',
        'convulsions',
        'lethargynotalert',
        'unconsciousness',
        'hypoglycaemia',
        'highfever',
        'hypothermia',
        'severedehydration',
        'lowerrespiratorytractinfection',
        'severeanemia',
        'eyesignsofvitadeficiency',
        'skinlesions',
    ]);

    // let state_consciousness = visitsDataByFieldList(rows, {
    //     state_consciousness: 'apatheticpassive',
    // });
    // complications.push(state_consciousness[0]);

    let groupComplicationsDataByMedicalTypes = groupBy(
        complications.flat(),
        (visit: any) => visit?.value,
    );

    let medicationGiven = visitsDataByFieldList(rows, {
        // ab_given: '1',
        // anti_helminth_given: 'mebendazole',
        // art_given: '1',
        vitamins_given: '1',
    });
    let groupMedicationGivenByType = groupBy(
        medicationGiven.flat(),
        (visit: any) => visit?.criteria,
    );

    return {
        '': groupDefaultDataByMedicalTypes,
        "Immunization for Age": groupImmunizationDataByMedicalTypes,
        HIV: groupHIVDataByMedicalTypes,
        Complications: groupComplicationsDataByMedicalTypes,
        'Medication Given': groupMedicationGivenByType,
    };
};

const medicalReports = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date,
    reportCategory: string,
) => {
    let rows: any = childrenUnder5MedicalReport(
        entities,
        program,
        startDate,
        endDate,
    );
    let medicalCategories: any = [];
    let medicalStatusByCategory: any = null;
    if (reportCategory === 'PBWG') {
        rows = pbwgMedicalDataReport(entities, program, startDate, endDate);
        medicalCategories = Object.keys(pbwgMedicalStatusByCategory);
        medicalStatusByCategory = pbwgMedicalStatusByCategory;
    } else {
        medicalStatusByCategory = childrenUnder5MedicalStatusByCategory;
        medicalCategories = Object.keys(medicalStatusByCategory);
    }

    return medicalCategories.map((category: string) => {
        let subCategories = medicalStatusByCategory[category];
        let subCategoriesData = subCategories.map((subCategory: any) => {
            let currentSubCategory =
                rows[category] && rows[category][subCategory];
            let dataWithStatus = null;
            if (reportCategory === 'PBWG') {
                dataWithStatus = admissionPBWGByStatus(
                    currentSubCategory,
                    category,
                    subCategory,
                );
            } else {
                dataWithStatus = admissionChildUnder5ByStatus(
                    currentSubCategory,
                    category,
                    subCategory,
                );
            }
            return dataWithStatus;
        });
        return {
            category: category,
            rows: subCategoriesData,
        };
    });
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
        "Anthropometric visit child_U6",
        "child_antropometric_followUp_tsfp_2"
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

        const exit_type = discharges.cured
            ? 'cured'
            : discharges.non_respondent
            ? 'non_respondent'
            : discharges.defaulters
            ? 'defaulters'
            : discharges.absentees
            ? 'absentees'
            : discharges.death
            ? 'death'
            : '';
        const visits = visitsLinkedToForms(
            startDate,
            endDate,
            entity?.visits,
            anthropometricForms,
            program,
        );
        let exitDate = visits[visits.length - 1]?.values?._visit_date;
        let exitWeight = discharges && discharges[exit_type]?.exitWeight;

        exitDate =
            discharges &&
            discharges[exit_type] &&
            timeStampToDateString(
                discharges[exit_type]['exitDate'] ||
                    discharges[exit_type]['createdAt'],
            );
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
            age:
                entity?.profile?.values?.age_months ??
                entity?.profile?.values?.age__int__,
            admission_date: timeStampToDateString(
                entity?.profile?.values?.registration_date,
            ),
            birth_date: timeStampToDateString(
                entity?.profile?.values?.actual_birthday__date__,
            ),
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
            exit_type: exit_type,
            exit: discharges && discharges[exit_type],
            exitWeight: exitWeight,
            exitVisit:
                discharges &&
                discharges[exit_type] &&
                timeStampToDateString(
                    discharges[exit_type]['exitDate'] ||
                        discharges[exit_type]['createdAt'] ||
                        visits[visits.length - 1]?.values?._visit_date,
                ),
            lengthOfStay: lengthOfStay,
            exitMuac:
                exit_type !== '' &&
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
    childrenUnder5MedicalStatusByCategory,
    pbwgMedicalStatusByCategory,
    medicalReports,
    eRegister,
};
