// The fields an admission is saved in, which differ by form: the first one
// filled is read.
const firstFilled = (values: any, fields: string[]) =>
    fields
        .map(field => values?.[field])
        .find(value => value != null && value !== '');

// The admission type, colour-coded on some forms (yellow for TSFP, red for
// OTP).
export const admissionTypeOf = (values: any) =>
    firstFilled(values, [
        'new_admission_type',
        'admission_type',
        'admission_type_yellow',
        'admission_type_red',
    ]);

// The admission criteria (muac, whz...), saved separately from the type.
export const admissionCriteriaOf = (values: any) =>
    firstFilled(values, [
        'admission_criteria',
        'admission_choice',
        'admission_criteria_yellow',
        'admission_criteria_red',
    ]);
