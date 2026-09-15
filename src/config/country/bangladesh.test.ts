import bangladesh from './bangladesh';
import southSudan from './southSudan';

describe('bangladesh.matchAdmissionType', () => {
    it.each([
        ['new_case_MUAC', 'muac'],
        ['new_case_WHZ', 'whz'],
        ['new_case_MUAC_WHZ', 'muac_whz'],
        ['new_case_OEDEMA', 'oedema'],
    ])(
        '%s is its own admission type, matching with criteria %s, for Child Under 5',
        (admissionType, criteria) => {
            expect(
                bangladesh.matchAdmissionType(
                    { admission_type: admissionType },
                    admissionType,
                    'Child Under 5',
                ),
            ).toEqual({ baseType: admissionType, criteria });
        },
    );

    it('does not match a compound type against a different base type', () => {
        expect(
            bangladesh.matchAdmissionType(
                { admission_type: 'new_case_MUAC' },
                'new_case_WHZ',
                'Child Under 5',
            ),
        ).toBeNull();
    });

    it('returns null when admission_type is missing', () => {
        expect(
            bangladesh.matchAdmissionType({}, 'new_case_MUAC', 'Child Under 5'),
        ).toBeNull();
    });

    it('for beneficiary types other than Child Under 5, falls through to South-Sudan-style matching instead of self-decoding', () => {
        // South Sudan's matcher does match here (admission_type === baseType
        // still holds), but its criteria comes from a separate
        // admission_criteria field, which this visit doesn't have — so it
        // is NOT the clean 'muac' criteria the Child Under 5 path produces.
        expect(
            bangladesh.matchAdmissionType(
                { admission_type: 'new_case_MUAC' },
                'new_case_MUAC',
                'PBWG',
            ),
        ).toEqual({ baseType: 'new_case_MUAC', criteria: undefined });
    });

    it('still matches South Sudan-style plain admission_type + separate admission_criteria for every other admission type', () => {
        expect(
            bangladesh.matchAdmissionType(
                {
                    admission_type: 'returned_defaulter',
                    admission_criteria: 'whz',
                },
                'returned_defaulter',
                'Child Under 5',
            ),
        ).toEqual({ baseType: 'returned_defaulter', criteria: 'whz' });
    });
});

describe('bangladesh.admissionTypeWithCriteria', () => {
    it('replaces new_case with the 4 compound types for Child Under 5, each broken into all 4 criteria', () => {
        const criteria = bangladesh.admissionTypeWithCriteria(
            'TSFP',
            'Child Under 5',
        );
        const allCriteria = ['muac', 'whz', 'muac_whz', 'oedema'];
        expect(criteria.new_case).toBeUndefined();
        expect(criteria.new_case_MUAC).toEqual(allCriteria);
        expect(criteria.new_case_WHZ).toEqual(allCriteria);
        expect(criteria.new_case_MUAC_WHZ).toEqual(allCriteria);
        expect(criteria.new_case_OEDEMA).toEqual(allCriteria);
    });

    it('leaves PBWG on South Sudan\'s plain new_case, untouched', () => {
        const criteria = bangladesh.admissionTypeWithCriteria('TSFP', 'PBWG');
        expect(criteria.new_case).toBeDefined();
        expect(criteria.new_case_MUAC).toBeUndefined();
    });
});

describe('bangladesh.admissionTypesByCategory', () => {
    it('replaces new_case with the 4 compound types under New admissions', () => {
        const newAdmissions =
            bangladesh.admissionTypesByCategory['New admissions'];
        expect(newAdmissions).not.toContain('new_case');
        expect(newAdmissions).toEqual(
            expect.arrayContaining([
                'new_case_MUAC',
                'new_case_WHZ',
                'new_case_MUAC_WHZ',
                'new_case_OEDEMA',
                'readmission_as_non_respondent',
                'relapse',
            ]),
        );
    });

    it('leaves every other category, and PBWG entirely, the same as South Sudan', () => {
        expect(bangladesh.admissionTypesByCategory['Old cases']).toEqual(
            southSudan.admissionTypesByCategory['Old cases'],
        );
        expect(bangladesh.admissionTypesByCategory['Discharges']).toEqual(
            southSudan.admissionTypesByCategory['Discharges'],
        );
        expect(bangladesh.pbwgAdmissionTypesByCategory).toEqual(
            southSudan.pbwgAdmissionTypesByCategory,
        );
    });
});
