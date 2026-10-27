import {
    filterDataOnProgram,
    hasFailedToGainWeight,
    isTransferredToOtp,
    isTransferredToTsfp,
} from './DataFilter';

const BSFP_FORMS = [
    'bsfp_child_visit',
    'bsfp_child_followup_visit',
    'bsfp_pbwg_visit',
    'bsfp_pbwg_followup_visit',
];

const entityWith = (formFormId: string, values: Record<string, string>) => ({
    visits: [{ formFormId, values }],
});

describe.each([
    [
        'TSFP',
        isTransferredToTsfp,
        'confirm_tsfp_referral',
        '_transfer_to_tsfp',
        'OTP',
    ],
    [
        'OTP',
        isTransferredToOtp,
        'confirm_otp_referral',
        '_transfer_to_otp',
        'TSFP',
    ],
])(
    'BSFP transfer to %s',
    (_target, isTransferred, bsfpField, flagField, flagProgram) => {
        it.each(BSFP_FORMS)(`reads ${bsfpField} on the BSFP form %s`, form => {
            expect(
                isTransferred(entityWith(form, { [bsfpField]: '1' }), 'BSFP'),
            ).toBe(true);
        });

        it(`ignores ${bsfpField} on forms other than the BSFP admission and followup`, () => {
            expect(
                isTransferred(
                    entityWith('nsep_child_followup_visit', {
                        [bsfpField]: '1',
                    }),
                    'BSFP',
                ),
            ).toBe(false);
        });

        it(`ignores ${flagField} for BSFP`, () => {
            expect(
                isTransferred(
                    entityWith('bsfp_child_followup_visit', {
                        [flagField]: '1',
                    }),
                    'BSFP',
                ),
            ).toBe(false);
        });

        it('is false when the BSFP form does not confirm the referral', () => {
            expect(
                isTransferred(
                    entityWith('bsfp_child_followup_visit', {
                        [bsfpField]: '0',
                    }),
                    'BSFP',
                ),
            ).toBe(false);
            expect(isTransferred({}, 'BSFP')).toBe(false);
        });

        it(`still reads ${flagField} for ${flagProgram}`, () => {
            expect(
                isTransferred(
                    entityWith('Anthropometric visit child', {
                        [flagField]: '1',
                    }),
                    flagProgram,
                ),
            ).toBe(true);
            expect(
                isTransferred(
                    entityWith('bsfp_child_followup_visit', {
                        [bsfpField]: '1',
                    }),
                    flagProgram,
                ),
            ).toBe(false);
        });
    },
);

describe('BSFP referral visit', () => {
    // The BSFP followup confirming the TSFP referral sets `_programme` to
    // NONE, and the next visits belong to TSFP.
    const entity: any = {
        id: 'child',
        visits: [
            {
                formFormId: 'bsfp_child_visit',
                createdAt: '2026-03-30T10:26:47+02:00',
                values: { _programme: 'BSFP', admission_type: 'new_admission' },
            },
            {
                formFormId: 'bsfp_child_followup_visit',
                createdAt: '2026-04-29T10:50:50+02:00',
                values: {
                    _programme: 'NONE',
                    _suggested_programme: 'TSFP',
                    confirm_tsfp_referral: '1',
                },
            },
            {
                formFormId: 'Anthropometric visit child_U6',
                createdAt: '2026-04-29T10:52:38+02:00',
                values: { _programme: 'TSFP', program: 'TSFP' },
            },
        ],
    };
    const [start, end] = [new Date('2026-03-01'), new Date('2026-05-31')];

    it('stays linked to BSFP, so the referral to TSFP is counted', () => {
        const [bsfpEntity] = filterDataOnProgram([entity], 'BSFP', start, end);
        expect(bsfpEntity.visits.map((v: any) => v.formFormId)).toEqual([
            'bsfp_child_visit',
            'bsfp_child_followup_visit',
        ]);
        expect(isTransferredToTsfp(bsfpEntity, 'BSFP')).toBe(true);
    });

    it('is not linked to TSFP', () => {
        const [tsfpEntity] = filterDataOnProgram([entity], 'TSFP', start, end);
        expect(tsfpEntity.visits.map((v: any) => v.formFormId)).toEqual([
            'Anthropometric visit child_U6',
        ]);
    });
});

describe('hasFailedToGainWeight', () => {
    const field = 'weight_loss_2_visits_or_no_weight_gain_in_3_visits__int__';

    it.each(['1', 1])('is true when a followup visit flags %p', value => {
        expect(
            hasFailedToGainWeight(
                entityWith('nsep_child_followup_visit', {
                    [field]: value as any,
                }),
            ),
        ).toBe(true);
    });

    it('is false when no visit flags it', () => {
        expect(
            hasFailedToGainWeight(
                entityWith('nsep_child_followup_visit', { [field]: '0' }),
            ),
        ).toBe(false);
        expect(hasFailedToGainWeight({})).toBe(false);
    });
});
