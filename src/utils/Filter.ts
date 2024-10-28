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
    let startPeriod = timeStampToDate(startDate.toISOString());
    let endPeriod = timeStampToDate(endDate.toISOString());
    let orderedStepsByDate = orderBy(steps, ["createdAt"], ["asc"]);

    return orderedStepsByDate.filter((step: any) => {
        let createdAt = timeStampToDate(step?.createdAt);
        let visitDate = timeStampToDate(step?.values?._visit_date);
        let nextVisitDate = timeStampToDate(
            step?.values?.next_visit_date__date__ ||
            step?.values?.new_next_visit__date__
        );

        return (
            (startPeriod <= createdAt && endPeriod >= createdAt) ||
            (startPeriod <= visitDate && endPeriod >= visitDate) ||
            (startPeriod <= nextVisitDate && endPeriod >= nextVisitDate)
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
            let visits = row.visits.filter((visit: any) => {
                return (
                    visit?.values &&
                    visit?.values[fieldName] &&
                    visit?.values[fieldName] === value
                );
            });
            return {
                ...row,
                visits: visits,
                criteria: fieldName,
                visitsNumber: visits.length,
            };
        })
        .filter((row) => row.visitsNumber > 0);
};

export {
    stepsLinkedToProgram,
    filterStepsInPeriod,
    visitsDataByStatus,
    entitiesByStatus,
};