import { sumByAge, sumByAgeOnField, groupBy } from "./Array";
import { visitsDataByFieldList, visitsDataByValuesList } from "./Filter";
import { filterDataOnProgram, followUpData } from "./DataFilter";

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
    ],
    Immunization: [
        "respiratory_rate",
        "conjuctivae_palm",
        "eyes",
        "disability_status",
    ],
    HIV: ["positive", "negative", "nottested"],
    Complications: [
        "intractablevomit",
        "convulsions",
        "lethargynotalert",
        "unconsciousness",
        "hypoglycaemia",
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
        "NG - TSFP Child": ["Anthropometric visit child"],
        "NG - OTP Child": ["anthropometric_admission_otp"],
    },
    oldCase: {
        "NG - TSFP Child": ["Anthropometric visit child"],
        "NG - OTP Child": ["anthropometric_admission_otp"],
    },
    followUps: {
        "NG - TSFP Child": ["anthropometric_second_visit_tsfp"],
        "NG - OTP Child": ["anthropometric_second_visit_otp"],
    },
    defaulters: {
        "NG - TSFP Child": [
            "Anthropometric visit child",
            "Child Medical Admission",
            "child_assistance_admission",
            "anthropometric_second_visit_tsfp",
            "Child Medical Follow Up Visit TSFP",
            "child_assistance_2nd_visit_tsfp",
        ],
        "NG - OTP Child": [
            "anthropometric_admission_otp",
            "Child Medical Admission",
            "assistance_admission_otp",
            "anthropometric_second_visit_otp",
            "child_medical_admission",
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
            "anthropometric_second_visit_tsfp",
            "Child Medical Admission",
            "Child Medical Follow Up TSFP",
        ],
        "NG - OTP Child": [
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
    }).flat();
    let groupDefaultDataByMedicalTypes = groupBy(
        defaultData,
        (visit: any) => visit?.criteria
    );
    let immunizations = visitsDataByFieldList(rows, {
        conjuctivae_palm: "pale",
        eyes: "sunken",
        disability_status__bool__: "1",
        respiratory_rate: "",
    }).flat();
    let groupImmunizationDataByMedicalTypes = groupBy(
        immunizations.flat(),
        (visit: any) => visit?.value
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
        "intractablevomit",
        "convulsions",
        "lethargynotalert",
        "unconsciousness",
        "hypoglycaemia",
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
        Immunization: groupImmunizationDataByMedicalTypes,
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

export {
    admissionTypesByCategory,
    formsByCategory,
    admissionByStatus,
    sumDataWithCommonKeys,
    childrenUnder5MedicalReport,
    medicalStatusByCategory,
    medicalReports,
};