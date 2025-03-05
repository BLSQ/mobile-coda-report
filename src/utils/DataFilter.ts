import Entity from '../entity/Entity';
import {
    stepsLinkedToProgram,
    filterStepsInPeriod,
    entitiesByStatus,
    visitsDataByStatus,
} from './Filter';
import { timeStampToDate, removeTime } from './DateFormatter';
import { orderBy, uniqBy } from 'lodash';
import {
    formsByCategory,
    pbwgFormsByCategory,
    admissionTypesByCategory,
    pbwgAdmissionTypesByCategory,
    admissionChildUnder5ByStatus,
    sumDataWithCommonKeys,
    eRegister,
    admissionByStatus,
} from './DataByCategory';
import {
    entityTypeByProgram,
    groupBy,
    admissionTypeWithCriteria,
} from './Array';

const entitiesWithVisits = (
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
) => {
    return entities.map(entity => {
        const visits = filterStepsInPeriod(entity.visits, startDate, endDate);
        return { ...entity, visits: visits };
    });
};

const filterDataOnProgram = (
    entities: Array<Entity>,
    program: string,
    startDate: Date,
    endDate: Date,
) => {
    let rows = entities.map(entity => {
        let visits = orderBy(entity.visits, ['createdAt'], ['asc']);
        let visitsInPeriod = filterStepsInPeriod(visits, startDate, endDate);
        let visitsLinkedToProgram = stepsLinkedToProgram(
            visitsInPeriod,
            program,
        );

        return {
            ...entity,
            visits: visitsLinkedToProgram,
            visitLinkedToProgram:
                visitsLinkedToProgram && visitsLinkedToProgram[0],
            program: program,
        };
    });
    let dataLinkedToProgram = rows.filter(
        row => row.visitLinkedToProgram !== undefined,
    );
    return dataLinkedToProgram;
};

const categoryWithData = (
    entities: Array<Entity>,
    program: string,
    category: string,
    startDate: Date,
    endDate: Date,
    entityType: string,
) => {
    let mainData: any = [];
    let admissionTypes = null;
    if (entityType === 'Child Under 5') {
        admissionTypes = admissionTypesByCategory[category];
    } else {
        if (entityType === 'PBWG')
            admissionTypes = pbwgAdmissionTypesByCategory[category];
    }

    switch (category) {
        case 'Follow Ups':
            let data = followUpData(entities, program, 'followUps', entityType);
            let followUps = admissionByStatus(
                entityType,
                data,
                category,
                'Total Follow up',
            );
            mainData[category] = [followUps];
            break;

        case 'New admissions':
            let newAdmissions = followUpData(
                entities,
                program,
                'admission',
                entityType,
            );
            mainData[category] = subMainCategoryData(
                program,
                category,
                newAdmissions,
                admissionTypes,
                entityType,
            );
            break;

        case 'Old cases':
            let oldCases = followUpData(
                entities,
                program,
                'oldCase',
                entityType,
            );
            mainData[category] = subMainCategoryData(
                program,
                category,
                oldCases,
                admissionTypes,
                entityType,
            );
            break;

        case 'Discharges':
            const absentees = followUpData(
                entities,
                program,
                'absentees',
                entityType,
            );
            const allAbsentes = defaulterCases(
                absentees,
                startDate,
                endDate,
                program,
            ).filter((entity: any) => entity?.counter === 1);

            const defaulters = followUpData(
                entities,
                program,
                'defaulters',
                entityType,
            );
            let defaulted = defaulterCases(
                defaulters,
                startDate,
                endDate,
                program,
            ).filter((entity: any) => entity?.counter > 1);
            const deathCases = visitsDataByStatus(
                entities,
                'reason_not_continue',
                'death',
            );
            const non_respondent = visitsDataByStatus(
                entities,
                'non_respondent__int__',
                1,
            );
            const cured = visitsDataByStatus(entities, 'cured__bool__', true);
            mainData[category] = [
                admissionByStatus(entityType, cured, category, 'cured'),
                admissionByStatus(
                    entityType,
                    allAbsentes,
                    category,
                    'absentees',
                ),
                admissionByStatus(entityType, defaulted, category, 'defaulter'),
                admissionByStatus(entityType, deathCases, category, 'death'),
                admissionByStatus(
                    entityType,
                    non_respondent,
                    category,
                    'non_respondent__int__',
                ),
            ];
            break;

        case 'Other Exits':
            const withdrawal = visitsDataByStatus(
                entities,
                'reason_not_continue',
                'voluntarywithdrawal',
            );
            const dismissal = visitsDataByStatus(
                entities,
                'reason_not_continue',
                'dismissalduetocheating',
            );
            const transferredout = visitsDataByStatus(
                entities,
                'reason_not_continue',
                'transferredout',
            );

            mainData[category] = [
                admissionByStatus(
                    entityType,
                    withdrawal,
                    category,
                    'voluntarywithdrawal',
                ),
                admissionByStatus(
                    entityType,
                    dismissal,
                    category,
                    'dismissedduetocheating',
                ),
                admissionByStatus(
                    entityType,
                    transferredout,
                    category,
                    'transferredout',
                ),
            ];

            break;

        case 'Total':
            let allFolloWup = followUpData(
                entities,
                program,
                'followUps',
                entityType,
            );
            let allAdmissions = followUpData(
                entities,
                program,
                'admission',
                entityType,
            );

            let totalFolloWups = admissionByStatus(
                entityType,
                allFolloWup,
                category,
                'Follow Ups',
            );
            let totalAdmissions = admissionByStatus(
                entityType,
                allAdmissions,
                category,
                'Total Admissions',
            );
            mainData[category] = [totalFolloWups, totalAdmissions];

            break;

        default:
            break;
    }
    return mainData[category];
};

const subMainCategoryData = (
    program: string,
    category: string,
    caseTypes: any[],
    admissionTypes: [],
    entityType: string,
) => {
    let records = admissionTypes?.map((admissionTypeValue: string) => {
        let admissionByTypeAndCriteria = filterDataByAdmissionType(
            caseTypes,
            admissionTypeValue,
        ).filter(entity => entity?.visits.length > 0);
        let criterias = admissionTypeByCriteriaMapper(
            admissionTypeValue,
            program,
            entityType,
        );

        return criterias?.map((criteria: any) => {
            let filteredEntities = entitiesByStatus(
                admissionByTypeAndCriteria,
                'subCategory',
                criteria?.admissionTypeWithCriteria,
            );
            let admissionsByStatus = admissionByStatus(
                entityType,
                filteredEntities,
                category,
                criteria,
            );
            return {
                ...admissionsByStatus,
                admissionType: admissionTypeValue,
                admissionCriteria: criteria?.criteria,
                program: program,
            };
        });
    });
    let data = records?.flat();
    return data;
};

const admissionTypeByCriteriaMapper = (
    admissionType: string,
    program: string,
    entityType: string | null,
) => {
    let criterias = admissionTypeWithCriteria(program, entityType)[
        admissionType
    ];
    let admissionTypeByCriteria = criterias?.map((criteria: string) => {
        return {
            admissionTypeWithCriteria: `${admissionType} ${criteria}`,
            admissionType,
            criteria,
        };
    });
    return admissionTypeByCriteria;
};

const dataCategory = (
    entities: Array<Entity>,
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
    let categories: any[] = Object.keys(admissionTypesByCategory);
    if (entityType === 'PBWG') {
        categories = Object.keys(pbwgAdmissionTypesByCategory);
    }

    let rows = categories.map((category: any) => {
        let data = categoryWithData(
            initialData,
            program,
            category,
            startDate,
            endDate,
            entityType,
        );
        let total = null;
        if (data) {
            total = sumDataWithCommonKeys(data, 'Total', entityType);
        }
        return {
            program: program,
            category: category,
            rows: data,
            total,
        };
    });
    return rows;
};

const followUpData = (
    entities: Array<Entity>,
    program: string,
    status: string,
    beneficiaryType: string,
) => {
    const entityType = entityTypeByProgram(program, beneficiaryType);
    let forms: any = [];
    if (beneficiaryType === 'Child Under 5') {
        forms = formsByCategory[status][entityType];
    } else {
        if (beneficiaryType === 'PBWG') {
            forms = pbwgFormsByCategory[status][entityType];
        }
    }
    let beneficiariesAdmissions = entities
        ?.map(entity => {
            let visits = orderBy(
                entity?.visits,
                ['createdAt'],
                ['asc'],
            )?.filter((visit: any) => forms.includes(visit?.formFormId));
            let visitsCounter = visits.length;
            return {
                ...entity,
                visits: visits,
                visitsNumber: visitsCounter,
                status: status,
            };
        })
        .filter(entity => entity.visitsNumber > 0);
    return beneficiariesAdmissions;
};
const assistanceGiven = (
    entities: Array<Entity>,
    program: string,
    startDate: Date,
    endDate: Date,
    status: string,
    beneficiaryType: string,
) => {
    let initialData = filterDataOnProgram(
        entities,
        program,
        startDate,
        endDate,
    );
    const entityType = entityTypeByProgram(program, beneficiaryType);
    let forms: any = [];

    if (beneficiaryType === 'Child Under 5') {
        forms = formsByCategory[status][entityType];
    } else {
        if (beneficiaryType === 'PBWG') {
            forms = pbwgFormsByCategory[status][entityType];
        }
    }

    let startPeriod = timeStampToDate(startDate.toISOString());
    let endPeriod = timeStampToDate(endDate.toISOString());

    let assistanceData = initialData.map(entity => {
        let visits = orderBy(entity.visits, ['createdAt'], ['asc'])?.filter(
            (visit: any) => {
                let createdAt = timeStampToDate(visit?.createdAt);
                let visitDate = timeStampToDate(visit?.values?._visit_date);
                return (
                    forms.includes(visit?.formFormId) &&
                    visit?.values &&
                    (visit?.values?.ration_type !== '' ||
                        visit?.values?.ration !== '') &&
                    ((startPeriod <= createdAt && endPeriod >= createdAt) ||
                        (startPeriod <= visitDate && endPeriod >= visitDate))
                );
            },
        );

        let groupByRationType = groupBy(
            visits,
            (visit: any) => visit.values?.ration_type || visit?.values?.ration,
        );
        let rationType = Object.keys(groupByRationType);
        return {
            ...entity,
            ration: rationType.length > 0 ? rationType[0] : '',
            visits: visits,
        };
    });
    return assistanceData;
};

const filterDataByAdmissionType = (
    entities: Array<Entity>,
    admissionTypeValue: string,
) => {
    let admissions = entities.map(entity => {
        let admissionByType = entity.visits.filter(
            (visit: any) =>
                visit?.values?.new_admission_type === admissionTypeValue ||
                visit?.values?.admission_type === admissionTypeValue,
        );
        let groupByAdmissionCriteria = groupBy(
            admissionByType,
            (visit: any) =>
                (visit?.values?.new_admission_type ??
                    visit.values?.admission_type) +
                ' ' +
                visit.values?.admission_criteria,
        );

        let admissionByCriteria = Object.keys(groupByAdmissionCriteria);
        return {
            ...entity,
            subCategory:
                admissionByCriteria.length > 0 ? admissionByCriteria[0] : '',
            visits: admissionByType,
        };
    });
    return admissions;
};

const filterDataOnAdmissionCriteria = (
    entities: Array<Entity>,
    status: string,
    key: string,
) => {
    return admissionChildUnder5ByStatus(entities, status, key);
};

const visitsLinkedToForms = (
    startDate: Date,
    endDate: Date,
    visits: Array<any>,
    formIds: any[],
    program: string,
) => {
    let startPeriod = timeStampToDate(startDate.toISOString());
    let endPeriod = timeStampToDate(endDate.toISOString());

    return visits.filter((visit: any) => {
        let createdAt = timeStampToDate(visit?.createdAt);
        return (
            (visit?.values?.program?.includes(program) ||
                visit?.values?._programme?.includes(program) ||
                visit?.values?.programme?.includes(program) ||
                visit?.values?.previous_discharge_program?.includes(program)) &&
            startPeriod <= createdAt &&
            endPeriod >= createdAt &&
            formIds.includes(visit?.formFormId)
        );
    });
};

const defaulterCases = (
    entities: Array<any>,
    startDate: Date,
    endDate: Date,
    program: string,
) => {
    let startPeriod = timeStampToDate(startDate.toISOString());
    let endPeriod = timeStampToDate(endDate.toISOString());
    const anthropometricForms = [
        'Anthropometric visit child',
        'anthropometric_admission',
        'anthropometric_admission_otp',
        'anthropometric_second_visit_tsfp',
        'anthropometric_second_visit_otp',
        'ng_pbwg_anthropometric',
        'wfp_coda_pbwg_followup_anthro',
        'wfp_coda_pbwg_luctating_followup_anthro',
    ];
    const assistanceForms = [
        'child_assistance_admission',
        'assistance_admission_otp',
        'child_assistance_2nd_visit_tsfp',
        'assistance_admission_2nd_visit_otp',
        'ng_pbwg_assistance',
        'wfp_coda_pbwg_assistance_followup',
    ];
    let rows = entities.map(entity => {
        let lastVisitDate = null;
        const assistanceVisits = orderBy(
            entity.visits,
            ['createdAt'],
            ['asc'],
        ).filter((visit: any) => assistanceForms.includes(visit?.formFormId));
        //Keep only 1 assistance by date
        const assistanceVisitsByDate = uniqBy(assistanceVisits, [
            'formFormId',
            'createdAt',
        ]);
        const anthropometricVisits = orderBy(
            entity.visits,
            ['createdAt'],
            ['asc'],
        ).filter((visit: any) => {
            return anthropometricForms.includes(visit?.formFormId);
        });
        let counter = 0;
        assistanceVisitsByDate.forEach((visit: any) => {
            let nextVisitDays =
                visit?.values?.next_visit ??
                visit?.values?.number_of_days__int__ ??
                visit?.values?.next_visit_days;
            const nextVisit =
                visit?.values?.new_next_visit__date__ ??
                visit?.values?._display_next_visit ??
                visit?.values?.next_visit__date__;
            const nextVisitDate = timeStampToDate(nextVisit);
            const secondNextVisit = new Date(nextVisitDate).setDate(
                new Date(nextVisitDate).getDate() + nextVisitDays,
            );
            const secondNextVisitDate = timeStampToDate(secondNextVisit);
            const currentDate = timeStampToDate(new Date());
            const currentTime = new Date().getHours();

            //check if the beneficiary missed 1 next visit!
            if (
                nextVisitDate !== '' &&
                startPeriod <= nextVisitDate &&
                endPeriod >= nextVisitDate
            ) {
                let carriedOutAnthropometricVisits =
                    anthropometricVisits.filter((visit: any) => {
                        let createdAt = timeStampToDate(
                            visit?.values?.visit_date ??
                                visit?.values?._visit_date,
                        );
                        return createdAt === nextVisitDate;
                    });
                if (
                    (currentDate > nextVisitDate || currentTime >= 17) &&
                    carriedOutAnthropometricVisits.length === 0
                ) {
                    counter++;
                }
            }
            //check if the beneficiary missed 2 consecutives visites! with the last visit at 17PM
            const daysDiffInTime =
                new Date().getTime() - new Date(nextVisitDate).getTime();
            const daysDiff = Math.round(daysDiffInTime / (1000 * 3600 * 24));

            const sameDiffTime =
                removeTime(new Date()).getTime() -
                removeTime(new Date(secondNextVisitDate)).getTime();
            const sameDayDiff = Math.round(sameDiffTime / (1000 * 3600 * 24));

            if (
                secondNextVisitDate !== '' &&
                startPeriod <= secondNextVisitDate &&
                endPeriod >= secondNextVisitDate
            ) {
                lastVisitDate = secondNextVisitDate;
                //Check if the beneficiary missed the visit after 17PM
                if (
                    (sameDayDiff === 0 && currentTime >= 17) ||
                    sameDayDiff > 0
                ) {
                    if (program.includes('OTP')) {
                        if (daysDiff > 7) {
                            counter = counter + 2;
                        }
                    } else {
                        if (program.includes('TSFP')) {
                            if (daysDiff > 14) {
                                counter = counter + 2;
                            }
                        }
                    }
                }
            }
        });
        return {
            ...entity,
            assistances: assistanceVisitsByDate,
            anthropometrics: anthropometricVisits,
            counter: counter,
            dischargeDate: lastVisitDate,
            exitDate: lastVisitDate,
            exitWeight:
                assistanceVisitsByDate[assistanceVisitsByDate.length - 1]
                    ?.values?.previous_weight_kgs__decimal__,
            status: counter === 1 ? 'absentees' : entity?.status,
        };
    });
    return rows.filter(row => row.counter > 0);
};

const agregatedBeneficiaryFolloWup = (
    program: string,
    entities: Array<any>,
    startDate: Date,
    endDate: Date,
    entityType: string,
) => {
    let allCategories = [
        'absentees',
        'defaulters',
        'death',
        'referral_to_sc_itp',
        'medical_investigation',
        'home_visits',
        'transferred_to_otp',
        'referred_from_other_tsfp',
        'transferred_to_tsfp',
        'transfer_from_other_otp'
    ];

    let allData: any[] = [];
    let registers = eRegister(
        entities,
        program,
        startDate,
        endDate,
        entityType,
    );

    registers
        .filter(
            (entity: any) =>
               entity?.new_admission_type !== '' || entity?.admissionType !== '' || entity?.exit?.status !== '',
        )
        .forEach((entity: any) => {
            let admissionType = (entity?.new_admission_type !== '' || entity?.admissionType) || '';
            let status = entity?.exit?.status ?? '';
            const {
                caretaker_name,
                caretaker_Last_name,
                registration_number,
                registration_document,
            } = entity?.profile?.values;
            let profile = {
                id: entity?.id,
                name: `${entity?.firstName ?? ''} ${entity?.middleName ?? ''} ${
                    entity?.lastName ?? ''
                }`,
                age: entity?.age,
                gender: entity?.gender,
                careGiver: `${caretaker_name ?? ''} ${
                    caretaker_Last_name ?? ''
                }`,
                registrationNumber: registration_number,
                registrationDocument: registration_document,
            };

            if (allCategories?.includes(status) || allCategories?.includes(admissionType)) {
                allData.push({
                    ...profile,
                    status: status,
                });
            }
            if (allCategories?.includes(admissionType)) {
                allData.push({
                    ...profile,
                    status: admissionType,
                });
            }
        });
    return allData;
};

export {
    entitiesWithVisits,
    filterDataOnProgram,
    followUpData,
    dataCategory,
    filterDataOnAdmissionCriteria,
    assistanceGiven,
    visitsLinkedToForms,
    defaulterCases,
    agregatedBeneficiaryFolloWup,
    categoryWithData,
};
