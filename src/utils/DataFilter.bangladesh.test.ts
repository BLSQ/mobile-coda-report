import { defaulterCases } from './DataFilter';
import { eRegister } from './DataByCategory';
import { reportConfig } from '../config/reportConfig';

// The BSFP and NSEP eRegister are Bangladesh's only.
jest.mock('../config/country', () => ({
    ...jest.requireActual('../config/country'),
    countryConfig: jest.requireActual('../config/country/bangladesh').default,
}));

const day = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString();
};

const visit = (formFormId: string, createdOn: number, values: any) => ({
    formFormId,
    createdAt: day(createdOn),
    values: { visit_date: day(createdOn), ...values },
});

const reportKeys = (entityType: string, program: string) =>
    reportConfig
        .find(option => option.key === entityType)
        ?.programs?.find(option => option.key === program)
        ?.reportOptions?.map(option => option.key);

describe('Bangladesh eRegister', () => {
    it('is offered for BSFP and NSEP', () => {
        expect(reportKeys('Child Under 5', 'BSFP')).toContain('BSFP_eRegister');
        expect(reportKeys('Child Under 5', 'NSEP')).toContain('NSEP_eRegister');
        expect(reportKeys('PBWG', 'BSFP')).toContain('PBWG_BSFP_eRegister');
    });
});

describe('defaulterCases for BSFP and NSEP', () => {
    // The BSFP/NSEP visit form both records the visit and books the next one.
    const bsfpVisit = (formFormId: string, createdOn: number, inDays: number) =>
        visit(formFormId, createdOn, {
            _programme: formFormId.startsWith('nsep') ? 'NSEP' : 'BSFP',
            next_visit_date__date__: day(createdOn + inDays),
        });

    const counterFor = (program: string, visits: Array<any>) =>
        defaulterCases(
            [{ id: 'child', visits }],
            new Date(day(-30)),
            new Date(day(1)),
            program,
        )[0]?.counter ?? 0;

    it('counts the missed visit booked on the BSFP visit form', () => {
        expect(
            counterFor('BSFP', [bsfpVisit('bsfp_child_visit', -10, 7)]),
        ).toBe(1);
    });

    it('does not count a visit the child came to', () => {
        expect(
            counterFor('NSEP', [
                bsfpVisit('nsep_child_visit', -14, 7),
                bsfpVisit('nsep_child_followup_visit', -7, 30),
            ]),
        ).toBe(0);
    });

    it('reads the date changed on the visit before the planned one', () => {
        expect(
            counterFor('BSFP', [
                visit('bsfp_pbwg_visit', -10, {
                    next_visit_date__date__: day(-3),
                    new_next_visit_date__date__: day(5),
                }),
            ]),
        ).toBe(0);
    });
});

describe('BSFP PBWG eRegister admission type', () => {
    // A pregnant woman admitted on bsfp_pbwg_visit, then followed up: her
    // registration carries no admission type.
    const woman = {
        id: 'woman',
        profile: {
            createdAt: day(-60),
            values: { physiology_status: 'pregnant', program: 'BSFP' },
        },
        visits: [
            visit('bsfp_pbwg_visit', -60, {
                _programme: 'BSFP',
                admission_type: 'new_case',
            }),
            visit('bsfp_pbwg_followup_visit', -5, { _programme: 'BSFP' }),
        ],
    };

    it('is read off the admission visit before the period', () => {
        const [beneficiary] = eRegister(
            [woman],
            'BSFP',
            new Date(day(-10)),
            new Date(day(1)),
            'BSFP',
        );
        expect(beneficiary.admissionType).toBe('new_case');
    });

    it('is read off the latest admission visit when one is in the period', () => {
        const readmitted = {
            ...woman,
            visits: [
                visit('bsfp_pbwg_visit', -60, {
                    _programme: 'BSFP',
                    admission_type: 'new_case',
                }),
                visit('bsfp_pbwg_visit', -20, {
                    _programme: 'BSFP',
                    admission_type: 'returned_defaulter',
                }),
                visit('bsfp_pbwg_visit', -8, {
                    _programme: 'BSFP',
                    admission_type: 'transfer_from_other_bsfp',
                }),
                visit('bsfp_pbwg_followup_visit', -5, { _programme: 'BSFP' }),
            ],
        };
        const [beneficiary] = eRegister(
            [readmitted],
            'BSFP',
            new Date(day(-30)),
            new Date(day(1)),
            'BSFP',
        );
        expect(beneficiary.admissionType).toBe('transfer_from_other_bsfp');
    });

    it('provides the admission visit and its weight, before the period', () => {
        const [beneficiary] = eRegister(
            [
                {
                    ...woman,
                    visits: [
                        visit('bsfp_pbwg_visit', -60, {
                            _programme: 'BSFP',
                            admission_type: 'new_case',
                            weight_kgs: 50,
                        }),
                        visit('bsfp_pbwg_followup_visit', -5, {
                            _programme: 'BSFP',
                            weight_kgs: 52,
                        }),
                    ],
                },
            ],
            'BSFP',
            new Date(day(-10)),
            new Date(day(1)),
            'BSFP',
        );
        expect(beneficiary.admissionVisit?.formFormId).toBe('bsfp_pbwg_visit');
        expect(beneficiary.weight).toBe(50);
    });

    it('reads the criteria baked into the admission type of a child', () => {
        const [child] = eRegister(
            [
                {
                    id: 'child',
                    entityTypeName: 'Child Under 5',
                    profile: { createdAt: day(-60), values: {} },
                    visits: [
                        visit('Anthropometric visit child_U6', -60, {
                            program: 'TSFP',
                            admission_type: 'new_case_MUAC',
                        }),
                        visit('child_antropometric_followUp_tsfp_2', -5, {
                            program: 'TSFP',
                        }),
                    ],
                },
            ],
            'TSFP',
            new Date(day(-10)),
            new Date(day(1)),
            'Child Under 5',
        );
        expect(child.admissionType).toBe('new_case_MUAC');
        expect(child.admissionChoice).toBe('muac');
    });

    it('ignores an admission visit after the period', () => {
        const [beneficiary] = eRegister(
            [
                {
                    ...woman,
                    visits: [
                        ...woman.visits,
                        visit('bsfp_pbwg_visit', -2, {
                            _programme: 'BSFP',
                            admission_type: 'transfer_from_other_bsfp',
                        }),
                    ],
                },
            ],
            'BSFP',
            new Date(day(-10)),
            new Date(day(-4)),
            'BSFP',
        );
        expect(beneficiary.admissionType).toBe('new_case');
    });
});
