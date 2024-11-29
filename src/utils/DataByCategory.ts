import { sumByAge, sumByAgeOnField, groupBy } from "./Array";
import {
    visitsDataByFieldList,
    visitsDataByValuesList,
    visitsDataByStatus,
} from "./Filter";
import {
    filterDataOnProgram,
    followUpData,
    visitsLinkedToForms,
    defaulterCases,
} from "./DataFilter";
import { timeStampToDateString, removeTime } from "./DateFormatter";

const admissionTypesByCategory: any = {
    "Follow Ups": ["Total Follow up"],
    "New admissions": ["new_case", "readmission_as_non_respondent", "relapse"],
    "Old cases": [
        "returned_defaulter",
        "referred_from_other_tsfp",
        "referred_from_otp",
        //"referred_from_sc_itp",
    ],
    Discharges: ["cured", "death", "defaulter", "non_respondent__int__"],
    "Other Exits": [
        "voluntarywithdrawal",
        "dismissedduetocheating",
        "transfer_to_sc_itp",
        "transferred_out",
    ],
    Total: ["Total Admissions", "Follow Ups"],
};

const medicalStatusByCategory: any = {
    "": [
        "have_diarrhoea",
        "passing_urine__bool__",
        "tb_therapy",
        "state_appetite",
        "appetite_test_result",
        "child_vomiting",
        "respiratory_rate",
        "conjuctivae_palm",
        "eyes",
        "disability_status",
    ],
    HIV: ["positive", "negative", "nottested"],
    Complications: [
        "lethargynotalert",
        "unconsciousness",
        "highfever",
        "hypothermia",
        "severedehydration",
        "lowerrespiratorytractinfection",
        "severeanemia",
        "eyesignsofvitadeficiency",
        "skinlesions",
        "other",
    ],
};

const formsByCategory: any = {
    admission: {
        "NG - TSFP Child": [
            "anthropometric_admission",
            "Anthropometric visit child",
        ],
        "NG - OTP Child": [
            "anthropometric_admission",
            "anthropometric_admission_otp",
        ],
    },
    oldCase: {
        "NG - TSFP Child": [
            "anthropometric_admission",
            "Anthropometric visit child",
        ],
        "NG - OTP Child": [
            "anthropometric_admission",
            "anthropometric_admission_otp",
        ],
    },
    followUps: {
        "NG - TSFP Child": ["anthropometric_second_visit_tsfp"],
        "NG - OTP Child": ["anthropometric_second_visit_otp"],
    },
    defaulters: {
        "NG - TSFP Child": [
            "anthropometric_admission",
            "Anthropometric visit child",
            "child_assistance_admission",
            "anthropometric_second_visit_tsfp",
            "child_assistance_2nd_visit_tsfp",
        ],
        "NG - OTP Child": [
            "anthropometric_admission",
            "anthropometric_admission_otp",
            "assistance_admission_otp",
            "anthropometric_second_visit_otp",
            "assistance_admission_2nd_visit_otp",
        ],
    },
    nonRespondent: {
        "NG - TSFP Child": [
            "Anthropometric visit child",
            "anthropometric_second_visit_tsfp",
        ],
        "NG - OTP Child": [
            "anthropometric_admission_otp",
            "anthropometric_second_visit_otp",
        ],
    },
    rationGiven: {
        "NG - TSFP Child": [
            "child_assistance_admission",
            "child_assistance_2nd_visit_tsfp",
        ],
        "NG - OTP Child": [
            "assistance_admission_otp",
            "assistance_admission_2nd_visit_otp",
        ],
    },
    medicals: {
        "NG - TSFP Child": [
            "anthropometric_admission",
            "anthropometric_second_visit_tsfp",
            "Child Medical Admission",
            "Child Medical Follow Up TSFP",
        ],
        "NG - OTP Child": [
            "anthropometric_admission",
            "anthropometric_second_visit_otp",
            "Child Medical Admission",
            "Child Medical Follow Up OTP",
        ],
    },
};

const admissionByStatus = (
    entities: Array<any>,
    status: string,
    key: string
) => {
    let boys = entities?.filter((entity: any) =>
        ["Male", "M"].includes(entity.profile?.values?.gender)
    );

    let girls = entities?.filter((entity: any) =>
        ["Female", "F"].includes(entity.profile?.values?.gender)
    );

    let boyBetween6And23,
        girlBetween6And23,
        boyBetween24And59,
        girlBetween24And59 = 0;

    let fieldToSum = "";

    if (
        status === "defaulter" ||
        !["Total Follow up", "Follow Ups"].includes(status)
    ) {
        boyBetween6And23 = sumByAge(boys, (age) => age <= 23);
        girlBetween6And23 = sumByAge(girls, (age) => age <= 23);
        boyBetween24And59 = sumByAge(boys, (age) => age > 23);
        girlBetween24And59 = sumByAge(girls, (age) => age > 23);
    } else {
        if (["Total Follow up", "Follow Ups"].includes(status)) {
            fieldToSum = "visitsNumber";
        } else {
            key = "";
            fieldToSum = status;
        }
        boyBetween6And23 = sumByAgeOnField(boys, (age) => age <= 23, fieldToSum);
        girlBetween6And23 = sumByAgeOnField(girls, (age) => age <= 23, fieldToSum);
        boyBetween24And59 = sumByAgeOnField(boys, (age) => age > 23, fieldToSum);
        girlBetween24And59 = sumByAgeOnField(girls, (age) => age > 23, fieldToSum);
    }

    return {
        key: key !== "undefined" ? key : "",
        status: status,
        between6And23: [boyBetween6And23, girlBetween6And23],
        between24And59: [boyBetween24And59, girlBetween24And59],
    };
};

const sumDataWithCommonKeys = (rows: any[], mainStatus: string) => {
    let between6And23 = [0, 0];
    let between24And59 = [0, 0];
    rows.forEach((row: any) => {
        between6And23 = [
            between6And23[0] + row["between6And23"][0],
            between6And23[1] + row["between6And23"][1],
        ];
        between24And59 = [
            between24And59[0] + row["between24And59"][0],
            between24And59[1] + row["between24And59"][1],
        ];
    });
    return {
        key: "",
        status: mainStatus,
        between6And23: between6And23,
        between24And59: between24And59,
    };
};

const childrenUnder5MedicalReport = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date
) => {
    let initialData = filterDataOnProgram(entities, program, startDate, endDate);
    let rows = followUpData(initialData, program, "medicals");

    let defaultData = visitsDataByFieldList(rows, {
        have_diarrhoea: "1",
        passing_urine__bool__: "0",
        tb_therapy: "1",
        state_appetite: "poor",
        appetite_test_result: "failure",
        child_vomiting: "1",
        conjuctivae_palm: "pale",
        eyes: "sunken",
        disability_status__bool__: "1",
        respiratory_rate: "",
    }).flat();
    let groupDefaultDataByMedicalTypes = groupBy(
        defaultData,
        (visit: any) => visit?.criteria
    );

    let hivStatus = visitsDataByValuesList(rows, "hiv_status", [
        "positive",
        "negative",
        "nottested",
    ]);

    let groupHIVDataByMedicalTypes = groupBy(
        hivStatus.flat(),
        (visit: any) => visit?.value
    );
    let complications = visitsDataByValuesList(rows, "specify_signs", [
        "lethargynotalert",
        "unconsciousness",
        "highfever",
        "hypothermia",
        "severedehydration",
        "lowerrespiratorytractinfection",
        "severeanemia",
        "eyesignsofvitadeficiency",
        "skinlesions",
        "other",
    ]);
    let groupComplicationsDataByMedicalTypes = groupBy(
        complications.flat(),
        (visit: any) => visit?.value
    );
    return {
        "": groupDefaultDataByMedicalTypes,
        HIV: groupHIVDataByMedicalTypes,
        Complications: groupComplicationsDataByMedicalTypes,
    };
};

const medicalReports = (
    entities: Array<any>,
    program: string,
    startDate: Date,
    endDate: Date
) => {
    let rows: any = childrenUnder5MedicalReport(
        entities,
        program,
        startDate,
        endDate
    );
    let medicalCategories = Object.keys(medicalStatusByCategory);
    return medicalCategories.map((category) => {
        let subCategories = medicalStatusByCategory[category];
        let subCategoriesData = subCategories.map((subCategory: any) => {
            let currentSubCategory = rows[category] && rows[category][subCategory];
            let dataWithStatus = admissionByStatus(
                currentSubCategory,
                category,
                subCategory
            );
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
    endDate: Date
) => {
    let initialData = filterDataOnProgram(entities, program, startDate, endDate);
    let defaulters = followUpData(entities, program, "defaulters");
    let entitiesToDefaults = defaulterCases(
        defaulters,
        startDate,
        endDate,
        program
    );
    const deaths = visitsDataByStatus(entities, "reason_not_continue", "death");
    const nonRespondents = visitsDataByStatus(
        entities,
        "non_respondent__int__",
        1
    );

    const cured = visitsDataByStatus(entities, "cured__bool__", true);

    const anthropometricForms = [
        "Anthropometric visit child",
        "anthropometric_admission_otp",
        "anthropometric_second_visit_tsfp",
        "anthropometric_second_visit_otp",
    ];

    let beneficiaries = initialData.map((entity) => {
        let discharges: any = {
            cured: cured.find(
                (current_entity: any) => current_entity.id === entity.id
            ),
            non_respondent: nonRespondents.find(
                (current_entity: any) => current_entity.id === entity.id
            ),
            defaulters: entitiesToDefaults
                .filter((entity) => entity?.counter > 1)
                .find((current_entity: any) => current_entity.id === entity.id),
            absentees: entitiesToDefaults
                .filter((entity) => entity?.counter === 1)
                .find((current_entity: any) => current_entity.id === entity.id),
            death: deaths.find(
                (current_entity: any) => current_entity.id === entity.id
            ),
        };

        const exit_type = discharges.cured
            ? "cured"
            : discharges.non_respondent
                ? "non_respondent"
                : discharges.defaulters
                    ? "defaulters"
                    : discharges.absentees
                        ? "absentees"
                        : discharges.death
                            ? "death"
                            : "";
        const visits = visitsLinkedToForms(
            startDate,
            endDate,
            entity?.visits,
            anthropometricForms,
            program
        );
        let exitDate = null;
        let exitWeight = discharges && discharges[exit_type]?.exitWeight;

        exitDate =
            discharges &&
            discharges[exit_type] &&
            timeStampToDateString(
                discharges[exit_type]["exitDate"] || discharges[exit_type]["createdAt"]
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
                entity?.profile?.values?.registration_date
            ),
            birth_date: timeStampToDateString(
                entity?.profile?.values?.actual_birthday__date__
            ),
            visits: visits,
            weight:
                visits[0]?.values?.previous_weight_kgs__decimal__ ||
                visits[0]?.values?.weight_kgs,
            muac: visits[0]?.values?.muac,
            whzScore: visits[0]?.values?._whz_score,
            admissionType:
                entity?.visitLinkedToProgram?.values?.admission_type ??
                visits[0]?.values?.admission_type ??
                visits[0]?.values?.admission_type_yellow ??
                visits[0]?.values?.admission_type_red ??
                entity?.profile?.values?.admission_type,
            admissionChoice:
                entity?.visitLinkedToProgram?.values?.admission_choice ??
                visits[0]?.values?.admission_choice ??
                visits[0]?.values?.admission_criteria_yellow ??
                visits[0]?.values?.admission_criteria_red ??
                visits[0]?.values?.admission_criteria ??
                entity?.profile?.values?.admission_choice,
            visit_number: visits.length,
            oedemaStatus:
                visits[0]?.values?.oedema_severity === "1"
                    ? "+"
                    : visits[0]?.values?.oedema_severity === "2"
                        ? "++"
                        : visits[0]?.values?.oedema_severity === "3"
                            ? "+++"
                            : "",
            exit_type: exit_type,
            exit: discharges && discharges[exit_type],
            exitWeight: exitWeight,
            exitVisit:
                discharges &&
                discharges[exit_type] &&
                timeStampToDateString(
                    discharges[exit_type]["exitDate"] ||
                    discharges[exit_type]["createdAt"]
                ),
            lengthOfStay: lengthOfStay,
            exitMuac:
                exit_type !== "" &&
                (visits[visits.length - 1]?.values?.muac ??
                    visits[visits.length - 1]?.values?.previous_muac ??
                    visits[visits.length - 1]?.values?.previous_oedema_status__int__),
        };
    });
    return beneficiaries;
};

export {
    admissionTypesByCategory,
    formsByCategory,
    admissionByStatus,
    sumDataWithCommonKeys,
    childrenUnder5MedicalReport,
    medicalStatusByCategory,
    medicalReports,
    eRegister,
};