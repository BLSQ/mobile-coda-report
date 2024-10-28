import Entity from "../entity/Entity";
import {
    stepsLinkedToProgram,
    filterStepsInPeriod,
    entitiesByStatus,
    visitsDataByStatus,
} from "./Filter";
import { timeStampToDate } from "./DateFormatter";
import { orderBy } from "lodash";
import {
    formsByCategory,
    admissionTypesByCategory,
    admissionByStatus,
    sumDataWithCommonKeys,
} from "./DataByCategory";
import {
    entityTypeByProgram,
    groupBy,
    admissionTypeWithCriteria,
} from "./Array";

const filterDataOnProgram = (
    entities: Array<Entity>,
    program: string,
    startDate: Date,
    endDate: Date
) => {
    let entityType =
        program === "TSFP-MAM"
            ? "NG - TSFP Child"
            : program === "OTP-SAM"
                ? "NG - OTP Child"
                : null;
    let rows = entities
        .filter((entity) => entity?.entityTypeName === entityType)
        .map((entity) => {
            let visits = orderBy(entity.visits, ["createdAt"], ["asc"]);
            let visitsInPeriod = filterStepsInPeriod(visits, startDate, endDate);
            let visitsLinkedToProgram = stepsLinkedToProgram(visitsInPeriod, program);
            return {
                ...entity,
                visits: visitsLinkedToProgram,
                visitLinkedToProgram: visitsLinkedToProgram && visitsLinkedToProgram[0],
                program: program,
            };
        });
    let dataLinkedToProgram = rows.filter(
        (row) => row.visitLinkedToProgram !== undefined
    );
    return dataLinkedToProgram;
};

const categoryWithData = (
    entities: Array<Entity>,
    program: string,
    category: string
) => {
    let categories: any[] = Object.keys(admissionTypesByCategory);
    console.info("CATEGORIES ", categories);

    let typeWithCriteria = admissionTypeWithCriteria(program);
    console.info("TYPE WITH CRITERIA ", typeWithCriteria);

    console.info("ENTITIES ", entities);

    let subCategories = admissionTypesByCategory;
    console.info(
        "SUB CATEGORIES ",
        subCategories,
        category,
        subCategories[category]
    );
    let mainData: any = [];
    let admissionTypes = admissionTypesByCategory[category];

    switch (category) {
        case "Follow Ups":
            let data = followUpData(entities, program, "followUps");

            console.info("FOLLOW UP DATA ...:", data);

            let followUps = admissionByStatus(data, category, "Total Follow up");
            console.info("ALL FOLLOWS UP DATA ...:", followUps);
            mainData[category] = [followUps];
            break;

        case "New admissions":
            let newAdmissions = followUpData(entities, program, "admission");
            mainData[category] = subMainCategoryData(
                program,
                category,
                newAdmissions,
                admissionTypes
            );
            break;

        case "Old cases":
            let oldCases = followUpData(entities, program, "oldCase");
            mainData[category] = subMainCategoryData(
                program,
                category,
                oldCases,
                admissionTypes
            );
            break;

        case "Discharges":
            const defaulters = followUpData(entities, program, "defaulters");
            console.info("DEFAULTERS ...:", defaulters);

            const deathCases = visitsDataByStatus(
                entities,
                "reason_not_continue",
                "death"
            );
            console.info("DEATHS ...:", deathCases);

            const non_respondent = visitsDataByStatus(
                entities,
                "non_respondent__int__",
                1
            );

            mainData[category] = [
                admissionByStatus(defaulters, category, "defaulter"),
                admissionByStatus(deathCases, category, "death"),
                admissionByStatus(non_respondent, category, "non_respondent__int__"),
            ];
            console.info("ADMISSION TYPES ...:", admissionTypes);

            break;

        case "Other Exits":
            const withdrawal = visitsDataByStatus(
                entities,
                "reason_not_continue",
                "voluntarywithdrawal"
            );
            const dismissal = visitsDataByStatus(
                entities,
                "reason_not_continue",
                "dismissalduetocheating"
            );
            const transferredout = visitsDataByStatus(
                entities,
                "reason_not_continue",
                "transferredout"
            );

            mainData[category] = [
                admissionByStatus(withdrawal, category, "voluntarywithdrawal"),
                admissionByStatus(dismissal, category, "dismissedduetocheating"),
                admissionByStatus(transferredout, category, "transferredout"),
            ];

            break;

        case "Total":
            let allFolloWup = followUpData(entities, program, "followUps");
            let allAdmissions = followUpData(entities, program, "admission");

            let totalFolloWups = admissionByStatus(
                allFolloWup,
                category,
                "Follow Ups"
            );
            console.info("TOTAL FOLLOW UPS DATA ...:", totalFolloWups, allFolloWup);

            let totalAdmissions = admissionByStatus(
                allAdmissions,
                category,
                "Total Admissions"
            );
            console.info(
                "TOTAL ADMISSIONS DATA ...:",
                totalAdmissions,
                allAdmissions
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
    admissionTypes: []
) => {
    let records = admissionTypes.map((admissionTypeValue: string) => {
        let admissionByTypeAndCriteria = filterDataByAdmissionType(
            caseTypes,
            admissionTypeValue
        ).filter((entity) => entity?.visits.length > 0);
        console.info(
            "ADMISSION BY TYPE AND CRITERIAS ...:",
            admissionByTypeAndCriteria
        );
        let criterias = admissionTypeByCriteriaMapper(admissionTypeValue, program);
        console.info("CRITERIAS ...:", criterias);
        return criterias.map((criteria: any) => {
            console.info(
                "CCDQQ ..... ",
                criteria,
                admissionTypeValue,
                admissionByTypeAndCriteria
            );
            let filteredEntities = entitiesByStatus(
                admissionByTypeAndCriteria,
                "subCategory",
                criteria?.admissionTypeWithCriteria
            );
            console.info("FILTERED ENTITIES ..... ", filteredEntities);
            let admissionsByStatus = admissionByStatus(
                filteredEntities,
                category,
                criteria
            );
            return {
                ...admissionsByStatus,
                admissionType: admissionTypeValue,
                admissionCriteria: criteria?.criteria,
            };
            //return admissionByStatus(filteredEntities, category, criteria);
        });
    });
    let data = records.flat();
    return data;
};

const admissionTypeByCriteriaMapper = (
    admissionType: string,
    program: string
) => {
    let criterias = admissionTypeWithCriteria(program)[admissionType];
    let admissionTypeByCriteria = criterias?.map(
        (criteria: string) => {
            return {
                admissionTypeWithCriteria: `${admissionType} ${criteria}`,
                admissionType,
                criteria,
            };
        }
        //`${admissionType} ${criteria}`
        /*{
                return {
                    key: `${admissionType} ${criteria}`,
                    admissionType,
                    criteria
                }
            }*/
    );
    return admissionTypeByCriteria;
};

const dataCategory = (
    entities: Array<Entity>,
    program: string,
    startDate: Date,
    endDate: Date
) => {
    let initialData = filterDataOnProgram(entities, program, startDate, endDate);
    let categories: any[] = Object.keys(admissionTypesByCategory);
    let rows = categories.map((category: any) => {
        let data = categoryWithData(initialData, program, category);
        console.info("DDDD ...:", data);
        let total = null;
        if (data) {
            total = sumDataWithCommonKeys(data, "Total");
        }
        return {
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
    status: string
) => {
    const entityType = entityTypeByProgram(program);
    let forms = formsByCategory[status][entityType];
    console.info("GOT FORMS ...:", forms, program, entityType, entities);

    let beneficiariesAdmissions = entities
        .filter((entity) => entity?.entityTypeName === entityType)
        .map((entity) => {
            let visits = orderBy(entity.visits, ["createdAt"], ["asc"])?.filter(
                (visit: any) => forms.includes(visit?.formFormId)
            );
            let visitsCounter = visits.length;
            return {
                ...entity,
                visits: visits,
                visitsNumber: visitsCounter,
            };
        })
        .filter((entity) => entity.visitsNumber > 0);
    return beneficiariesAdmissions;
};
const assistanceGiven = (
    entities: Array<Entity>,
    program: string,
    startDate: Date,
    endDate: Date,
    status: string
) => {
    let initialData = filterDataOnProgram(entities, program, startDate, endDate);
    const entityType = entityTypeByProgram(program);
    let forms = formsByCategory[status][entityType];
    console.info(
        "INITIAL FORMS ...:",
        forms,
        program,
        entityType,
        entities,
        initialData
    );
    let startPeriod = timeStampToDate(startDate.toISOString());
    let endPeriod = timeStampToDate(endDate.toISOString());

    let assistanceData = initialData.map((entity) => {
        let visits = orderBy(entity.visits, ["createdAt"], ["asc"])?.filter(
            (visit: any) => {
                let createdAt = timeStampToDate(visit?.createdAt);
                let visitDate = timeStampToDate(visit?.values?._visit_date);
                return (
                    forms.includes(visit?.formFormId) &&
                    visit?.values &&
                    visit?.values?.ration_type !== "" &&
                    ((startPeriod <= createdAt && endPeriod >= createdAt) ||
                        (startPeriod <= visitDate && endPeriod >= visitDate))
                );
            }
        );

        let groupByRationType = groupBy(
            visits,
            (visit: any) => visit.values?.ration_type
        );
        console.info("GROUP BY RATION ...:", groupByRationType);
        let rationType = Object.keys(groupByRationType);
        return {
            ...entity,
            ration: rationType.length > 0 ? rationType[0] : "",
            visits: visits,
        };
    });
    //let assistances =
    console.info("ASSISTANCE GROUP BY RATION ...:", assistanceData);

    return assistanceData;
};

const filterDataByAdmissionType = (
    entities: Array<Entity>,
    admissionTypeValue: string
) => {
    let admissions = entities.map((entity) => {
        let admissionByType = entity.visits.filter(
            (visit: any) => visit?.values?.admission_type === admissionTypeValue
        );
        let groupByAdmissionCriteria = groupBy(
            admissionByType,
            (visit: any) =>
                visit.values?.admission_type + " " + visit.values?.admission_criteria
        );

        let admissionByCriteria = Object.keys(groupByAdmissionCriteria);
        return {
            ...entity,
            subCategory: admissionByCriteria.length > 0 ? admissionByCriteria[0] : "",
            visits: admissionByType,
        };
    });
    return admissions;
};

const filterDataOnAdmissionCriteria = (
    entities: Array<Entity>,
    status: string,
    key: string
) => {
    return admissionByStatus(entities, status, key);
};

export {
    filterDataOnProgram,
    followUpData,
    dataCategory,
    filterDataOnAdmissionCriteria,
    assistanceGiven,
};