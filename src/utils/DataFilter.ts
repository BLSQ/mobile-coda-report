import Entity from '../entity/Entity';
import {
    BSFP_REFERRAL_FORMS,
    stepsLinkedToProgram,
    isStepLinkedToProgram,
    isStepWithoutProgram,
    filterStepsInPeriod,
    entitiesByStatus,
    visitsDataByStatus,
    isChecked,
    toDays,
} from './Filter';
import { timeStampToDate, removeTime } from './DateFormatter';
import { keyBy, orderBy, uniqBy } from 'lodash';
import {
    admissionChildUnder5ByStatus,
    sumDataWithCommonKeys,
    eRegister,
    admissionByStatus,
} from './DataByCategory';
import { groupBy } from './Array';
import { rationTypeOf } from './Ration';
import { countryConfig } from '../config/country';

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
    admissionTypesByCategoryOverride?: Record<string, string[]>,
) => {
    let mainData: any = [];
    let admissionTypes = null;
    if (admissionTypesByCategoryOverride) {
        admissionTypes = admissionTypesByCategoryOverride[category];
    } else if (entityType === 'Child Under 5') {
        admissionTypes = countryConfig.admissionTypesByCategory[category];
    } else {
        if (entityType === 'PBWG')
            admissionTypes =
                countryConfig.pbwgAdmissionTypesByCategory[category];
    }
    switch (category) {
        case 'Follow Ups':
            let data = followUpData(entities, program, 'followUps', entityType);
            let followUps = admissionByStatus(
                entityType,
                data,
                category,
                'Total Follow up',
                program,
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
            if (entityType === 'PBWG' && program === 'BSFP') {
                // BSFP-PBWG's discharges use a dedicated field/vocabulary,
                // distinct from every other program's cured/death/
                // defaulter/non_respondent shape above — rendered via
                // BsfpPbwgDischargeSummary, not the generic Summary().
                const rowsByValue = (rows: Array<[string, any, string]>) =>
                    rows.map(([field, value, label]) =>
                        admissionByStatus(
                            entityType,
                            visitsDataByStatus(entities, field, value),
                            category,
                            label,
                            program,
                        ),
                    );
                mainData[category] = rowsByValue(
                    [
                        'transferred_out',
                        'dismissed_due_to_cheating',
                        'voluntary',
                        'other',
                    ].map(reason => ['reason_not_continue', reason, reason]),
                );
                break;
            }
            // Read off the E-Register exit so the main report counts the same
            // absentees/defaulters as the Follow-up report: only beneficiaries
            // of this program in the period (TSFP and OTP share the same
            // forms), and only when no other exit (cured, transfer...) wins.
            const registers = eRegister(
                entities,
                program,
                startDate,
                endDate,
                entityType,
            );
            const exitsOfType = (exitType: string) =>
                registers
                    .filter((entity: any) => entity?.exit_type === exitType)
                    .map((entity: any) => entity?.exit);
            const allAbsentes = exitsOfType('absentees');
            const defaulted = exitsOfType('defaulters');
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
                admissionByStatus(
                    entityType,
                    cured,
                    category,
                    'cured',
                    program,
                ),
                admissionByStatus(
                    entityType,
                    allAbsentes,
                    category,
                    'absentees',
                    program,
                ),
                admissionByStatus(
                    entityType,
                    defaulted,
                    category,
                    'defaulter',
                    program,
                ),
                admissionByStatus(
                    entityType,
                    deathCases,
                    category,
                    'death',
                    program,
                ),
                admissionByStatus(
                    entityType,
                    non_respondent,
                    category,
                    'non_respondent__int__',
                    program,
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
                    program,
                ),
                admissionByStatus(
                    entityType,
                    dismissal,
                    category,
                    'dismissedduetocheating',
                    program,
                ),
                admissionByStatus(
                    entityType,
                    transferredout,
                    category,
                    'transferredout',
                    program,
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
                program,
            );
            let totalAdmissions = admissionByStatus(
                entityType,
                allAdmissions,
                category,
                'Total Admissions',
                program,
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
    admissionTypes: string[] | null,
    entityType: string,
) => {
    let records = admissionTypes?.map((admissionTypeValue: string) => {
        let admissionByTypeAndCriteria = filterDataByAdmissionType(
            caseTypes,
            admissionTypeValue,
            entityType,
            program,
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
                program,
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
    let criterias = countryConfig.admissionTypeWithCriteria(
        program,
        entityType,
    )[admissionType];
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
    admissionTypesByCategoryOverride?: Record<string, string[]>,
) => {
    let initialData = filterDataOnProgram(
        entities,
        program,
        startDate,
        endDate,
    );
    let categories: any[] = admissionTypesByCategoryOverride
        ? Object.keys(admissionTypesByCategoryOverride)
        : Object.keys(countryConfig.admissionTypesByCategory);
    if (!admissionTypesByCategoryOverride && entityType === 'PBWG') {
        categories = Object.keys(countryConfig.pbwgAdmissionTypesByCategory);
    }
    let rows = categories.map((category: any) => {
        let data = categoryWithData(
            initialData,
            program,
            category,
            startDate,
            endDate,
            entityType,
            admissionTypesByCategoryOverride,
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

const hasBsfpReferral = (entity: any, field: string) =>
    (entity?.visits ?? []).some(
        (visit: any) =>
            BSFP_REFERRAL_FORMS.includes(visit?.formFormId) &&
            isChecked(visit?.values?.[field]),
    );

const hasVisitFlag = (entity: any, field: string) =>
    (entity?.visits ?? []).some((visit: any) =>
        isChecked(visit?.values?.[field]),
    );

// OTP flags its transfer to TSFP with `_transfer_to_tsfp`.
const isTransferredToTsfp = (entity: any, program: string) =>
    program === 'BSFP'
        ? hasBsfpReferral(entity, 'confirm_tsfp_referral')
        : hasVisitFlag(entity, '_transfer_to_tsfp');

// TSFP flags its transfer to OTP with `_transfer_to_otp`.
const isTransferredToOtp = (entity: any, program: string) =>
    program === 'BSFP'
        ? hasBsfpReferral(entity, 'confirm_otp_referral')
        : hasVisitFlag(entity, '_transfer_to_otp');

// TSFP and OTP transfer to each other, and BSFP transfers to both: a
// beneficiary transferred out of the program has exited it, so missed visits
// afterwards are not absences.
const isTransferredOut = (entity: any, program: string) => {
    if (program === 'BSFP') {
        return (
            isTransferredToTsfp(entity, program) ||
            isTransferredToOtp(entity, program)
        );
    }
    if (program?.includes('TSFP')) {
        return isTransferredToOtp(entity, program);
    }
    if (program?.includes('OTP')) {
        return isTransferredToTsfp(entity, program);
    }
    return false;
};

// TSFP and OTP refer to SC: a beneficiary referred to SC has left the
// program for inpatient care, so missed visits afterwards are not absences.
// The SC referral is confirmed on the medical form.
const FAILURE_TO_GAIN_WEIGHT =
    'weight_loss_2_visits_or_no_weight_gain_in_3_visits__int__';

// The followup forms flag a beneficiary losing weight over 2 visits or not
// gaining weight over 3 visits.
const hasFailedToGainWeight = (entity: any) =>
    hasVisitFlag(entity, FAILURE_TO_GAIN_WEIGHT);

const isReferredToSc = (entity: any) =>
    (entity?.visits ?? []).some((visit: any) =>
        isChecked(visit?.values?.confirm_referral_medical_first__bool__),
    );

const followUpData = (
    entities: Array<Entity>,
    program: string,
    status: string,
    beneficiaryType: string,
) => {
    const entityType = countryConfig.entityTypeByProgram(
        program,
        beneficiaryType,
    );
    let forms: any = [];
    if (beneficiaryType === 'Child Under 5') {
        forms = countryConfig.formsByCategory[status][entityType] ?? [];
    } else {
        if (beneficiaryType === 'PBWG') {
            forms = countryConfig.pbwgFormsByCategory[status][entityType] ?? [];
        }
    }
    if (status === 'absentees' || status === 'defaulters') {
        entities = entities?.filter(
            entity =>
                !isTransferredOut(entity, program) &&
                !(
                    (program?.includes('TSFP') || program?.includes('OTP')) &&
                    isReferredToSc(entity)
                ),
        );
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
    const entityType = countryConfig.entityTypeByProgram(
        program,
        beneficiaryType,
    );
    let forms: any = [];

    if (beneficiaryType === 'Child Under 5') {
        forms = countryConfig.formsByCategory[status][entityType] ?? [];
    } else {
        if (beneficiaryType === 'PBWG') {
            forms = countryConfig.pbwgFormsByCategory[status][entityType] ?? [];
        }
    }

    let startPeriod = timeStampToDate(startDate.toISOString());
    let endPeriod = timeStampToDate(endDate.toISOString());
    const entitiesById = keyBy(entities, 'id');

    let assistanceData = initialData.map(entity => {
        // initialData only kept the visits tagged with this program, which
        // drops assistance forms that carry no program field at all — those
        // are taken back from the entity's full visit list, since `forms`
        // below already scopes them to this program.
        const candidateVisits = (entitiesById[entity.id]?.visits ?? []).filter(
            (visit: any) =>
                isStepLinkedToProgram(visit, program) ||
                isStepWithoutProgram(visit),
        );
        let visits = orderBy(candidateVisits, ['createdAt'], ['asc'])?.filter(
            (visit: any) => {
                let createdAt = timeStampToDate(visit?.createdAt);
                let visitDate = timeStampToDate(
                    visit?.values?._visit_date ?? visit?.values?.visit_date,
                );
                return (
                    forms.includes(visit?.formFormId) &&
                    !!rationTypeOf(visit) &&
                    ((startPeriod <= createdAt && endPeriod >= createdAt) ||
                        (startPeriod <= visitDate && endPeriod >= visitDate))
                );
            },
        );

        let groupByRationType = groupBy(visits, rationTypeOf);
        let rationType = Object.keys(groupByRationType);
        return {
            ...entity,
            ration: rationType.length > 0 ? rationType[0] : '',
            visits: visits,
        };
    });
    return assistanceData;
};

const filterDataOnMedicalCriteria = (
    entities: Array<any>,
    medicalTypes: any,
    entityType: string,
) => {
    return Object.keys(medicalTypes).map(field => {
        const value = medicalTypes[field];
        const dataByCriteria = visitsDataByStatus(entities, field, value);
        return admissionByStatus(entityType, dataByCriteria, field, '');
    });
};

const assistanceDataByCategory = (entities: Array<any>, entityType: string) => {
    const soapYes = filterDataOnMedicalCriteria(
        entities,
        { soap_given: 'yes', soap_given__bool__: '1', soap: '1' },
        entityType,
    );
    const rowSoapYes = sumDataWithCommonKeys(soapYes, 'soap_given', entityType);

    const soapNo = filterDataOnMedicalCriteria(
        entities,
        { soap_given: 'no', soap_given__bool__: '0', soap: '0' },
        entityType,
    );
    const rowSoapNo = sumDataWithCommonKeys(soapNo, 'soap_given', entityType);

    const netYes = filterDataOnMedicalCriteria(
        entities,
        { net_given: 'yes', net_given__bool__: '1', net: '1' },
        entityType,
    );
    const rowNetYes = sumDataWithCommonKeys(netYes, 'net_given', entityType);

    const netNo = filterDataOnMedicalCriteria(
        entities,
        { net_given: 'no', net_given__bool__: '0', net: '0' },
        entityType,
    );
    const rowNetNo = sumDataWithCommonKeys(netNo, 'net_given', entityType);

    return [
        {
            category: 'Soap',
            rows: [
                { ...rowSoapYes, status: 'Yes' },
                { ...rowSoapNo, status: 'No' },
            ],
        },
        {
            category: 'Mosquito Net',
            rows: [
                { ...rowNetYes, status: 'Yes' },
                { ...rowNetNo, status: 'No' },
            ],
        },
    ];
};

const filterDataByAdmissionType = (
    entities: Array<Entity>,
    admissionTypeValue: string,
    beneficiaryType?: string | null,
    program?: string,
) => {
    let admissions = entities.map(entity => {
        let matchedVisits = entity.visits
            .map((visit: any) => ({
                visit,
                match: countryConfig.matchAdmissionType(
                    visit?.values,
                    admissionTypeValue,
                    beneficiaryType,
                    program,
                ),
            }))
            .filter(({ match }) => match !== null);
        let groupByAdmissionCriteria = groupBy(
            matchedVisits,
            ({ match }) => `${match!.baseType} ${match!.criteria}`,
        );

        let admissionByCriteria = Object.keys(groupByAdmissionCriteria);
        return {
            ...entity,
            subCategory:
                admissionByCriteria.length > 0 ? admissionByCriteria[0] : '',
            visits: matchedVisits.map(({ visit }) => visit),
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
        'wfp_coda_pbwg_anthropometric',
        'Anthropometric visit child_U6',
        'child_antropometric_followUp_tsfp_2',
    ];
    const assistanceForms = [
        'child_assistance_admission',
        'assistance_admission_otp',
        'child_assistance_2nd_visit_tsfp',
        'assistance_admission_2nd_visit_otp',
        'ng_pbwg_assistance',
        'wfp_coda_pbwg_assistance_followup',
        'wfp_coda_pbwg_assistance',
        'child_assistance_admission_2_u6',
        'child_assistance_follow_up_2',
    ];
    let rows = entities.map(entity => {
        let lastVisitDate = null;
        const assistanceVisits = orderBy(
            entity.visits,
            ['createdAt'],
            ['asc'],
        ).filter((visit: any) => assistanceForms.includes(visit?.formFormId));
        //Keep only 1 assistance by form and date
        const assistanceVisitsByDate = uniqBy(
            assistanceVisits,
            (visit: any) => `${visit?.formFormId}|${visit?.createdAt}`,
        );
        const anthropometricVisits = orderBy(
            entity.visits,
            ['createdAt'],
            ['asc'],
        ).filter((visit: any) => {
            return anthropometricForms.includes(visit?.formFormId);
        });
        let counter = 0;
        assistanceVisitsByDate.forEach((visit: any) => {
            let nextVisitDays = toDays(
                visit?.values?.next_visit ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.next_visit_days,
            );
            const nextVisit =
                visit?.values?.new_next_visit__date__ ??
                visit?.values?._display_next_visit ??
                visit?.values?.next_visit__date__ ??
                visit?.values?.next_visit_date__date__;
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
        'referral_to_sc_itp',
        'medical_investigation',
        'home_visits',
        'non_respondent',
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
                !!entity?.admissionType || entity?.exit_type !== '',
        )
        .forEach((entity: any) => {
            let admissionType = entity?.admissionType ?? '';
            let status = entity?.exit_type ?? '';
            const {
                caretaker_name,
                caregiver_name,
                caretaker_Last_name,
                caregiver_Last_name,
                caregiver_phone_number,
                caretaker_phone_number,
                card_number,
                health_card,
                registration_number,
                path_address,
            } = entity?.profile?.values ?? {};
            let profile = {
                id: entity?.id,
                name: `${entity?.firstName ?? ''} ${entity?.middleName ?? ''} ${
                    entity?.lastName ?? ''
                }`,
                age: entity?.age,
                gender: entity?.gender,
                careGiver: `${caretaker_name ?? caregiver_name ?? ''} ${
                    caretaker_Last_name ?? caregiver_Last_name ?? ''
                }`,
                phoneNumber: caregiver_phone_number ?? caretaker_phone_number,
                address: path_address,
                registrationNumber:
                    health_card ?? card_number ?? registration_number,
            };

            if (allCategories?.includes(status)) {
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
            if (entity?.failureToGainWeight) {
                allData.push({
                    ...profile,
                    status: FAILURE_TO_GAIN_WEIGHT,
                });
            }
            // TSFP and OTP refer to SC, and transfer to each other.
            if (program === 'TSFP' || program === 'OTP') {
                if (entity?.referralToSc && status !== 'referral_to_sc_itp') {
                    allData.push({
                        ...profile,
                        status: 'referral_to_sc_itp',
                    });
                }
                if (program === 'TSFP' && entity?.transferToOtp) {
                    allData.push({
                        ...profile,
                        status: 'transfer_to_otp',
                    });
                }
                if (program === 'OTP' && entity?.transferToTsfp) {
                    allData.push({
                        ...profile,
                        status: 'transfer_to_tsfp',
                    });
                }
            }
            // BSFP transfers to TSFP and OTP.
            if (program === 'BSFP') {
                if (entity?.transferToTsfp) {
                    allData.push({
                        ...profile,
                        status: 'transfer_to_tsfp',
                    });
                }
                if (entity?.transferToOtp) {
                    allData.push({
                        ...profile,
                        status: 'transfer_to_otp',
                    });
                }
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
    assistanceDataByCategory,
    visitsLinkedToForms,
    defaulterCases,
    agregatedBeneficiaryFolloWup,
    categoryWithData,
    isReferredToSc,
    isTransferredToTsfp,
    isTransferredToOtp,
    hasFailedToGainWeight,
};
