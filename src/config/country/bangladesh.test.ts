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

    it("leaves PBWG on South Sudan's plain new_case, untouched", () => {
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

    it('does not add any NSEP types to the shared table TSFP/OTP/BSFP also read', () => {
        const nsepTypes = [
            'new_admission',
            'readmission_after_default',
            'returned_defaulter_old_case',
            'transferred_from_bsfp_nsep',
            'transferred_from_tsfp',
        ];
        const allSharedTypes = Object.values(
            bangladesh.admissionTypesByCategory,
        ).flat();
        nsepTypes.forEach(nsepType => {
            expect(allSharedTypes).not.toContain(nsepType);
        });
    });
});

describe('bangladesh NSEP support', () => {
    it('bsfpnsepAdmissionTypesByCategory has exactly the 4 requested sections with the 5 NSEP types split into New admissions / Old cases', () => {
        expect(bangladesh.bsfpnsepAdmissionTypesByCategory).toEqual({
            'Follow Ups': ['Total Follow up'],
            'New admissions': ['new_admission', 'readmission_after_default'],
            'Old cases': [
                'returned_defaulter_old_case',
                'transferred_from_bsfp_nsep',
                'transferred_from_tsfp',
            ],
            Total: ['Total Admissions', 'Follow Ups'],
        });
    });

    it('entityTypeByProgram resolves NSEP to its own key for Child Under 5', () => {
        expect(bangladesh.entityTypeByProgram('NSEP', 'Child Under 5')).toBe(
            'NSEP',
        );
    });

    it.each([
        'new_admission',
        'readmission_after_default',
        'returned_defaulter_old_case',
        'transferred_from_bsfp_nsep',
        'transferred_from_tsfp',
    ])(
        'matchAdmissionType matches %s off admission_type with empty criteria',
        nsepType => {
            expect(
                bangladesh.matchAdmissionType(
                    { admission_type: nsepType },
                    nsepType,
                    'Child Under 5',
                ),
            ).toEqual({ baseType: nsepType, criteria: '' });
        },
    );

    it('matchAdmissionType returns null for an NSEP type that does not match', () => {
        expect(
            bangladesh.matchAdmissionType(
                { admission_type: 'new_admission' },
                'readmission_after_default',
                'Child Under 5',
            ),
        ).toBeNull();
    });

    it('admissionTypeWithCriteria gives each NSEP type a single empty-string criteria, matching matchAdmissionType', () => {
        const criteria = bangladesh.admissionTypeWithCriteria(
            'NSEP',
            'Child Under 5',
        );
        expect(criteria.new_admission).toEqual(['']);
        expect(criteria.readmission_after_default).toEqual(['']);
        expect(criteria.returned_defaulter_old_case).toEqual(['']);
        expect(criteria.transferred_from_bsfp_nsep).toEqual(['']);
        expect(criteria.transferred_from_tsfp).toEqual(['']);
    });

    it('formsByCategory routes NSEP through both nsep_child_visit and nsep_child_followup_visit, except followUps which is the followup form alone', () => {
        const bothNsepForms = ['nsep_child_visit', 'nsep_child_followup_visit'];
        expect(bangladesh.formsByCategory.admission.NSEP).toEqual(
            bothNsepForms,
        );
        expect(bangladesh.formsByCategory.oldCase.NSEP).toEqual(bothNsepForms);
        expect(bangladesh.formsByCategory.followUps.NSEP).toEqual([
            'nsep_child_followup_visit',
        ]);
        expect(bangladesh.formsByCategory.rationGiven.NSEP).toEqual(
            bothNsepForms,
        );
    });
});

describe('southSudan NSEP absence', () => {
    it('does not define NSEP forms or an NSEP entityType — NSEP is Bangladesh-only', () => {
        expect(southSudan.formsByCategory.admission.NSEP).toBeUndefined();
        expect(southSudan.entityTypeByProgram('NSEP', 'Child Under 5')).toBe(
            '',
        );
        expect(southSudan.bsfpnsepAdmissionTypesByCategory).toBeUndefined();
    });
});

describe('bangladesh BSFP reuses the NSEP report format', () => {
    it('formsByCategory routes BSFP through both bsfp_child_visit and bsfp_child_followup_visit, except followUps which is the followup form alone', () => {
        const bothBsfpForms = ['bsfp_child_visit', 'bsfp_child_followup_visit'];
        expect(bangladesh.formsByCategory.admission.BSFP).toEqual(
            bothBsfpForms,
        );
        expect(bangladesh.formsByCategory.oldCase.BSFP).toEqual(bothBsfpForms);
        expect(bangladesh.formsByCategory.followUps.BSFP).toEqual([
            'bsfp_child_followup_visit',
        ]);
        expect(bangladesh.formsByCategory.rationGiven.BSFP).toEqual(
            bothBsfpForms,
        );
    });

    it.each([
        'new_admission',
        'readmission_after_default',
        'returned_defaulter_old_case',
        'transferred_from_bsfp_nsep',
        'transferred_from_tsfp',
    ])(
        'matchAdmissionType matches %s for BSFP the same as NSEP — with empty criteria, since the check is keyed by baseType, not program',
        nsepType => {
            expect(
                bangladesh.matchAdmissionType(
                    { admission_type: nsepType },
                    nsepType,
                    'Child Under 5',
                ),
            ).toEqual({ baseType: nsepType, criteria: '' });
        },
    );

    it('admissionTypeWithCriteria gives BSFP the same single empty-string criteria per type as NSEP', () => {
        const criteria = bangladesh.admissionTypeWithCriteria(
            'BSFP',
            'Child Under 5',
        );
        expect(criteria.new_admission).toEqual(['']);
        expect(criteria.returned_defaulter_old_case).toEqual(['']);
    });
});

describe('bangladesh PBWG BSFP support', () => {
    it('entityTypeByProgram resolves BSFP to its own key for PBWG', () => {
        expect(bangladesh.entityTypeByProgram('BSFP', 'PBWG')).toBe('BSFP');
    });

    it('entityTypeByProgram leaves every other PBWG program on TSFP, untouched', () => {
        expect(bangladesh.entityTypeByProgram('TSFP', 'PBWG')).toBe('TSFP');
        expect(bangladesh.entityTypeByProgram('', 'PBWG')).toBe('TSFP');
    });

    it('bsfpPbwgAdmissionTypesByCategory has the requested sections, including Discharges', () => {
        expect(bangladesh.bsfpPbwgAdmissionTypesByCategory).toEqual({
            'Follow Ups': ['Total Follow up'],
            'New admissions': ['new_case'],
            'Old cases': [
                'returned_defaulter',
                'transfer_from_other_bsfp',
                'transfer_from_other_tsfp',
            ],
            Discharges: [
                'transferred_out',
                'dismissed_due_to_cheating',
                'voluntary',
                'other',
            ],
            Total: ['Total Admissions', 'Follow Ups'],
        });
    });

    it.each(['new_case', 'returned_defaulter', 'transfer_from_other_bsfp', 'transfer_from_other_tsfp'])(
        'matchAdmissionType matches %s for BSFP+PBWG off admission_type with empty criteria',
        bsfpPbwgType => {
            expect(
                bangladesh.matchAdmissionType(
                    { admission_type: bsfpPbwgType },
                    bsfpPbwgType,
                    'PBWG',
                    'BSFP',
                ),
            ).toEqual({ baseType: bsfpPbwgType, criteria: '' });
        },
    );

    it('matchAdmissionType returns null for a BSFP+PBWG type that does not match', () => {
        expect(
            bangladesh.matchAdmissionType(
                { admission_type: 'new_case' },
                'returned_defaulter',
                'PBWG',
                'BSFP',
            ),
        ).toBeNull();
    });

    it('matchAdmissionType leaves TSFP-PBWG on South-Sudan-style matching for the same type names, since program disambiguates them', () => {
        // Without program='BSFP' (or with program='TSFP'), 'new_case' still
        // falls through to South Sudan's criteria-field-based matcher —
        // same behavior as before this feature existed.
        expect(
            bangladesh.matchAdmissionType(
                { admission_type: 'new_case', admission_criteria: 'muac' },
                'new_case',
                'PBWG',
                'TSFP',
            ),
        ).toEqual({ baseType: 'new_case', criteria: 'muac' });
    });

    it('admissionTypeWithCriteria gives each BSFP+PBWG type a single empty-string criteria', () => {
        const criteria = bangladesh.admissionTypeWithCriteria('BSFP', 'PBWG');
        expect(criteria.new_case).toEqual(['']);
        expect(criteria.returned_defaulter).toEqual(['']);
        expect(criteria.transfer_from_other_bsfp).toEqual(['']);
        expect(criteria.transfer_from_other_tsfp).toEqual(['']);
    });

    it("leaves TSFP's PBWG criteria untouched", () => {
        const criteria = bangladesh.admissionTypeWithCriteria('TSFP', 'PBWG');
        expect(criteria.new_case).toEqual(['child_wasted', 'muac']);
    });

    it('pbwgFormsByCategory routes BSFP through bsfp_pbwg_visit and bsfp_pbwg_followup_visit, except followUps which is the followup form alone', () => {
        const bothForms = ['bsfp_pbwg_visit', 'bsfp_pbwg_followup_visit'];
        expect(bangladesh.pbwgFormsByCategory.admission.BSFP).toEqual(
            bothForms,
        );
        expect(bangladesh.pbwgFormsByCategory.oldCase.BSFP).toEqual(
            bothForms,
        );
        expect(bangladesh.pbwgFormsByCategory.defaulters.BSFP).toEqual(
            bothForms,
        );
        expect(bangladesh.pbwgFormsByCategory.absentees.BSFP).toEqual(
            bothForms,
        );
        expect(bangladesh.pbwgFormsByCategory.rationGiven.BSFP).toEqual(
            bothForms,
        );
        expect(bangladesh.pbwgFormsByCategory.followUps.BSFP).toEqual([
            'bsfp_pbwg_followup_visit',
        ]);
    });
});

describe('bangladesh.resolveRationType', () => {
    it('reads ration_given when present', () => {
        expect(bangladesh.resolveRationType?.({ ration_given: 'rusf' })).toBe(
            'rusf',
        );
    });

    it('falls back to assistance_given when ration_given is absent', () => {
        expect(
            bangladesh.resolveRationType?.({ assistance_given: 'in_kind' }),
        ).toBe('in_kind');
    });

    it('prefers ration_given over assistance_given when both are present', () => {
        expect(
            bangladesh.resolveRationType?.({
                ration_given: 'wsbp',
                assistance_given: 'cash_voucher',
            }),
        ).toBe('wsbp');
    });

    it('returns undefined when neither field is present', () => {
        expect(bangladesh.resolveRationType?.({})).toBeUndefined();
    });
});
