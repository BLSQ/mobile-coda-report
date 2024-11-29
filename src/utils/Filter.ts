import Entity from "../entity/Entity";
import Form from "../entity/Form";
import { timeStampToDate } from "./DateFormatter";
import { orderBy } from "lodash";

const stepsLinkedToProgram = (steps: Array<Form>, program: string) => {
    let orderedStepsByDate = orderBy(steps, ["createdAt"], ["asc"]);
    return orderedStepsByDate.filter(
        (step: any) =>
            step?.values?._programme === program ||
            step?.values?.programme === program ||
            step?.values?._program === program ||
            step?.values?.program === program ||
            step?.values?._display_programme === program ||
            step?.values?.new_programme === program
    );
};

const filterStepsInPeriod = (
    steps: Array<Form>,
    startDate: Date,
    endDate: Date
) => {
    let startPeriod = timeStampToDate(startDate?.toISOString());
    let endPeriod = timeStampToDate(endDate?.toISOString());
    let orderedStepsByDate = orderBy(steps, ["createdAt"], ["asc"]);

    return orderedStepsByDate.filter((step: any) => {
        let createdAt = timeStampToDate(step?.createdAt);
        let visitDate = timeStampToDate(step?.values?._visit_date);
        let nextVisitDate = timeStampToDate(
            step?.values?.next_visit_date__date__ ||
            step?.values?.new_next_visit__date__
        );
        let nextVisitDays =
            step?.values?.next_visit_days ??
            step?.values?.number_of_days__int__ ??
            step?.values?.tsfp_next_visit ??
            step?.values?.TSFP_next_visit ??
            step?.values?.otp_next_visit ??
            step?.values?.OTP_next_visit;
        const secondNextVisit = timeStampToDate(
            new Date(nextVisitDate).setDate(
                new Date(nextVisitDate).getDate() + nextVisitDays
            )
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
    value: any
) => {
    return entities.filter((entity: any) => entity[fieldName] === value);
};

const visitsDataByStatus = (
    entities: Array<Entity>,
    fieldName: string,
    value: any
) => {
    return entities
        .map((row) => {
            let age =
                row.profile?.values?.age_months ??
                row.profile?.values?.age ??
                row.profile?.values?.age__int__;

            let visits = row.visits.filter((visit: any) => {
                let response = visit?.values[fieldName] === value;
                switch (fieldName) {
                    case "disability_status__bool__":
                        value = "yes";
                        fieldName = "disability_status";
                        response = true;
                        break;

                    case "respiratory_rate":
                        let rate = visit?.values && visit?.values[fieldName];
                        if (
                            (age <= 12 && !["<30", "30", "3039", "4049"].includes(rate)) ||
                            (age > 12 && !["<30", "30", "3039"].includes(rate))
                        ) {
                            value = "poor";
                            response = true;
                        }
                        break;
                    case "specify_signs":
                        response = visit?.values && visit?.values[fieldName]?.includes(value);
                        break;

                    case "fully_immunization":
                        response = visit?.values && visit?.values?.immunization_status === "1";

                        break;

                    case "not_fully_immunization":
                        response = visit?.values && visit?.values?.immunization_status === "0";
                        break;

                    case "measles_vacc_proof":
                        response = visit?.values && visit?.values?.measles_vacc === "1";
                        break;

                    case "no_measles_vacc_proof":
                        response = visit?.values && visit?.values?.measles_vacc === "0";
                        break;

                    case "apatheticpassive":
                        response =
                            visit?.values &&
                            visit?.values?.state_consciousness === "apatheticpassive";
                        break;

                    default:
                        response = visit?.values[fieldName] === value;
                        break;
                }
                return response;
            });
            return {
                ...row,
                visits: visits,
                criteria: fieldName,
                value: value,
                visitsNumber: visits.length,
            };
        })
        .filter((row) => row.visitsNumber > 0);
};

const visitsDataByFieldList = (entities: Array<any>, fieldsWithValues: any) => {
    return Object.keys(fieldsWithValues).map((fieldName: string) => {
        let value = fieldsWithValues[fieldName];
        const entitiesWithVisitByStatus = visitsDataByStatus(
            entities,
            fieldName,
            value
        );
        return entitiesWithVisitByStatus;
    });
};

const visitsDataByValuesList = (
    entities: Array<any>,
    fieldName: any,
    fieldValues: Array<string>
) => {
    return fieldValues.map((value) => {
        const entitiesWithVisitByStatus = visitsDataByStatus(
            entities,
            fieldName,
            value
        );
        return entitiesWithVisitByStatus;
    });
};

export {
    stepsLinkedToProgram,
    filterStepsInPeriod,
    visitsDataByStatus,
    entitiesByStatus,
    visitsDataByFieldList,
    visitsDataByValuesList,
};