"""The beneficiaries the fixtures are built from, as a field worker would fill them.

Every scenario is one beneficiary: the registration answers, then the forms of each visit with the
answers given on the phone. Whatever the forms calculate on top of that (programme, admission type,
colours, ration quantities, next visit date) comes from the forms themselves, so a change in the
configuration of the server shows up in the fixtures, and then in the tests of the reports.

Only answers a field worker actually gives belong here. Never put the name of a field of the
beneficiary record (for example `is_pregnant`) in the answers: the phone prefills those, and
overwriting them would hide the very bugs these tests look for.
"""

CHILD = {"id": 9, "name": "Child Under 5", "workflow": 9}
PBWG = {"id": 10, "name": "PBWG", "workflow": 10}

ORG_UNIT_ANSWERS = {"current_ou_id": "OU-1", "current_ou_name": "Camp 4 INF"}

CHILD_REGISTRATION = {
    "consent_two": "yes",
    "consent_three": "partners",
    "first_name": "Rahim",
    "last_name": "Uddin",
    "progress_id": "P-1001",
    "fcn_number": "1001",
    "case_id": "C-1001",
    "gender": "M",
    "age_entry": "months",
    "age_months": "11",
    "health_card": "HC-1",
    "parents_alive": "both_alive",
    "parents_living_together": "yes",
    "status_of_family": "host_community",
    "facility_id": "OU-1",
    "facility_name": "Camp 4 INF",
    "disability": "0",
    "general_food_assistance": "no",
    "caregiver_has_number": "no",
    "optional_number": "no",
    "current_ou_name": "Camp 4 INF",
}

ANTHROPOMETRY = {
    **ORG_UNIT_ANSWERS,
    "education_given": "1",
    "education_type": "hygiene_practices",
    "Time_to_arrive": "1",
    "Birth_order": "1",
    "Twin__int__": "0",
    "child_oedema__int__": "0",
    "who_referred": "self_referral",
}

MEDICAL = {
    **ORG_UNIT_ANSWERS,
    "start": "continue",
    "medical_appetite": "good",
    "have_complications": "0",
    "have_diarrhoea__bool__": "0",
    "child_vomiting__bool__": "0",
    "passing_urine__bool__": "1",
    "child_coughing__bool__": "0",
    "contact_tb__bool__": "0",
    "child_breastfeeding__bool__": "1",
    "immunization_status": "none",
    "measles_status": "1",
    "deworming": "0",
    "respiratory_rate": "4049",
    "chest_drawing__bool__": "0",
    "medical_temperature": "37",
    "palmar_pallor": "normal",
    "eyes": "normal",
    "eyes_infection__bool__": "0",
    "signs_vad__bool__": "0",
    "signs_dehydration__bool__": "0",
    "ears_status": "normal",
    "mouth_issues__bool__": "0",
    "skin_issues__bool__": "0",
    "dermatosis_dermatosis": "none",
    "malaria_applicable": "0",
}

TSFP_ASSISTANCE = {
    **ORG_UNIT_ANSWERS,
    "start": "continue",
    "ration_type_tsfp": "rusf",
    "TSFP_next_visit": "14",
    "confirm_distribution_OTP__bool__": "1",
}

TSFP_ASSISTANCE_FOLLOW_UP = {
    **ORG_UNIT_ANSWERS,
    "start": "continue",
    "ration_type_tsfp": "rusf",
    "tsfp_next_visit": "14",
    "confirm_distribution_OTP__bool__": "1",
}

IYCF = {**ORG_UNIT_ANSWERS}

BSFP_VISIT = {
    **ORG_UNIT_ANSWERS,
    "caregiver_attended_health_education": "1",
    "health_education_topic_given": "hygiene_practices",
    "is_child_alive": "1",
    "child_oedema__int__": "0",
    "muac": "13.5",
    "take_height_and_weight": "0",
    "opt_out_of_assistance": "0",
    "assistance_given": "in_kind",
    "ration_given": "lns_mq",
    "ration_days": "30",
    "another_ration_provided": "0",
    "admission_type": "new_admission",
    "entry_care_point": "self_referral",
    "beneficiary_continuing_facility": "1",
    "confirm_assistance_deviation__bool__": "1",
}

# A yellow MUAC admitted into TSFP, then one follow-up visit two weeks later.
CHILD_TSFP = {
    "name": "child-tsfp-muac",
    "entity_type": CHILD,
    "registration": CHILD_REGISTRATION,
    "visits": [
        (
            77,
            {
                **ANTHROPOMETRY,
                "muac": "12.0",
                "weight_kgs": "8.0",
                "height_cm": "75",
                "facility_continues__int__": "1",
                "admission_criteria_yellow": "muac",
                "admission_type": "new_case_MUAC",
            },
        ),
        (78, MEDICAL),
        (92, IYCF),
        (80, TSFP_ASSISTANCE),
        (
            82,
            {
                **ORG_UNIT_ANSWERS,
                "education_given": "1",
                "education_type": "hygiene_practices",
                "oedema_status__int__": "0",
                "muac": "12.4",
                "weight_kgs": "8.4",
                "continue_at_facility__int__": "1",
            },
        ),
        (79, {**MEDICAL, "have_complications__bool__": "0"}),
        (92, IYCF),
        (81, TSFP_ASSISTANCE_FOLLOW_UP),
    ],
}

# A red MUAC referred to OTP at the enrollment visit.
CHILD_OTP = {
    "name": "child-otp-red",
    "entity_type": CHILD,
    "registration": {
        **CHILD_REGISTRATION,
        "first_name": "Karim",
        "progress_id": "P-1002",
        "fcn_number": "1002",
        "case_id": "C-1002",
    },
    "visits": [
        (
            77,
            {
                **ANTHROPOMETRY,
                "muac": "10.5",
                "weight_kgs": "6.0",
                "height_cm": "75",
                "confirm_otp": "1",
                "facility_continues__int__": "1",
                "admission_criteria_yellow": "muac",
                "admission_type": "new_case_MUAC",
            },
        ),
        (78, MEDICAL),
        (92, IYCF),
        (80, TSFP_ASSISTANCE),
    ],
}

# A green MUAC enrolled in BSFP, with one follow-up visit.
CHILD_BSFP = {
    "name": "child-bsfp-green",
    "entity_type": CHILD,
    "registration": {
        **CHILD_REGISTRATION,
        "first_name": "Sultana",
        "gender": "F",
        "progress_id": "P-1003",
        "fcn_number": "1003",
        "case_id": "C-1003",
    },
    "visits": [
        (94, BSFP_VISIT),
        (106, {**BSFP_VISIT, "muac": "13.2"}),
    ],
}

FIXTURES = {
    "child_under5": [CHILD_TSFP, CHILD_OTP, CHILD_BSFP],
}
