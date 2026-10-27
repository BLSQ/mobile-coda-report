// NSEP's admission-type vocabulary, declared once and shared by both
// country configs. NSEP is currently a Bangladesh-only program — South
// Sudan has no nsep_child_visit/nsep_child_followup_visit forms, so this
// table is inert there — but CountryConfig requires every country to
// declare it (see southSudan.ts), matching this codebase's existing
// pattern for programs not deployed in every country (cf. BSFP's
// provisioned-but-unused Child Under 5 form lists in bangladesh.ts).
//
// Kept out of admissionTypesByCategory (the table TSFP/OTP/BSFP's
// ChildrenUnder5 report reads) so these 5 types never show up as extra
// always-empty rows on those programs' reports — NSEP's report passes
// this table explicitly to dataCategory/categoryWithData instead.
export const bsfpnsepAdmissionTypesByCategory: Record<string, string[]> = {
    'Follow Ups': ['Total Follow up'],
    'New admissions': ['new_admission', 'readmission_after_default'],
    'Old cases': [
        'returned_defaulter_old_case',
        'transferred_from_bsfp_nsep',
        'transferred_from_tsfp',
    ],
    Total: ['Total Admissions', 'Follow Ups'],
};
