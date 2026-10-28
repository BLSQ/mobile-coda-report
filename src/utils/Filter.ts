import Entity from '../entity/Entity';
import Form from '../entity/Form';
import { timeStampToDate, toDays } from './DateFormatter';
import { orderBy } from 'lodash';

const PROGRAM_FIELDS = [
    '_programme',
    'programme',
    '_program',
    'program',
    '_display_programme',
    'new_programme',
];

// BSFP confirms its transfers to TSFP and OTP with `confirm_tsfp_referral`
// and `confirm_otp_referral` on its admission and followup forms (Child
// Under 5 and PBWG).
const BSFP_REFERRAL_FORMS = [
    'bsfp_child_visit',
    'bsfp_child_followup_visit',
    'bsfp_pbwg_visit',
    'bsfp_pbwg_followup_visit',
];

// The BSFP visit confirming a referral sets `_programme` to NONE (the
// beneficiary leaves BSFP), so it is only linked to BSFP through its form.
const isBsfpReferralStep = (step: any) =>
    BSFP_REFERRAL_FORMS.includes(step?.formFormId) &&
    (isChecked(step?.values?.confirm_tsfp_referral) ||
        isChecked(step?.values?.confirm_otp_referral));

const isStepLinkedToProgram = (step: any, program: string) =>
    PROGRAM_FIELDS.some(field => step?.values?.[field]?.includes(program)) ||
    (program === 'BSFP' && isBsfpReferralStep(step));

// Some forms (e.g. Bangladesh's BSFP-PBWG assistance forms) don't record
// which program they belong to at all — they can only be attributed to a
// program through their formFormId.
const isStepWithoutProgram = (step: any) =>
    PROGRAM_FIELDS.every(field => !step?.values?.[field]);

const stepsLinkedToProgram = (steps: Array<Form>, program: string) => {
    let orderedStepsByDate = orderBy(steps, ['createdAt'], ['asc']);
    return orderedStepsByDate.filter((step: any) =>
        isStepLinkedToProgram(step, program),
    );
};

const filterStepsInPeriod = (
    steps: Array<Form>,
    startDate: Date,
    endDate: Date,
) => {
    let startPeriod = timeStampToDate(startDate?.toISOString());
    let endPeriod = timeStampToDate(endDate?.toISOString());
    let orderedStepsByDate = orderBy(steps, ['createdAt'], ['asc']);

    return orderedStepsByDate.filter((step: any) => {
        let createdAt = timeStampToDate(step?.createdAt);
        let visitDate = timeStampToDate(
            step?.values?._visit_date || step?.values?.visit_date,
        );
        let nextVisitDate = timeStampToDate(
            step?.values?.next_visit_date__date__ ||
                step?.values?.new_next_visit__date__ ||
                step?.values?.next_visit__date__ ||
                step?.values?._display_next_visit,
        );
        let nextVisitDays = toDays(
            step?.values?.next_visit_days ??
                step?.values?.number_of_days__int__ ??
                step?.values?.tsfp_next_visit ??
                step?.values?.TSFP_next_visit ??
                step?.values?.otp_next_visit ??
                step?.values?.OTP_next_visit,
        );
        const secondNextVisit = timeStampToDate(
            new Date(nextVisitDate).setDate(
                new Date(nextVisitDate).getDate() + nextVisitDays,
            ),
        );

        return (
            (startPeriod <= createdAt && endPeriod >= createdAt) ||
            (startPeriod <= visitDate && endPeriod >= visitDate) ||
            (startPeriod <= nextVisitDate && endPeriod >= nextVisitDate) ||
            (startPeriod <= secondNextVisit && endPeriod >= secondNextVisit)
        );
    });
};

const entitiesByStatus = (
    entities: Array<Entity>,
    fieldName: string,
    value: any,
) => {
    return entities.filter((entity: any) => entity[fieldName] === value);
};

const visitsDataByStatus = (
    entities: Array<Entity>,
    fieldName: string,
    value: any,
) => {
    return entities
        .map(row => {
            let visits = row.visits.filter(
                (visit: any) => visit?.values?.[fieldName] === value,
            );
            return {
                ...row,
                visits: visits,
                criteria: fieldName,
                value: value,
                visitsNumber: visits.length,
            };
        })
        .filter(row => row.visitsNumber > 0);
};

const visitsDataByValuesList = (
    entities: Array<any>,
    fieldName: any,
    fieldValues: Array<string>,
) => {
    return fieldValues.map(value => {
        const entitiesWithVisitByStatus = visitsDataByStatus(
            entities,
            fieldName,
            value,
        );
        return entitiesWithVisitByStatus;
    });
};
const isChecked = (value: any) =>
    value === '1' || value === 1 || value === true || value === 'true';

export {
    BSFP_REFERRAL_FORMS,
    stepsLinkedToProgram,
    isStepLinkedToProgram,
    isStepWithoutProgram,
    filterStepsInPeriod,
    visitsDataByStatus,
    entitiesByStatus,
    visitsDataByValuesList,
    isChecked,
    toDays,
};
