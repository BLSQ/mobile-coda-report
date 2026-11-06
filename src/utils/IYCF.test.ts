import { iycfReport, iycfWomenReport } from './IYCF';

const START = new Date('2026-09-01T00:00:00');
const END = new Date('2026-09-30T00:00:00');

const visit = (values: any, createdAt = '2026-09-10T10:00:00') => ({
    id: `${Math.random()}`,
    formFormId: 'iycf_child_under2',
    createdAt: new Date(createdAt),
    values,
});

const child = (gender: string, visits: any[], ageMonths = 10) =>
    ({
        id: `${Math.random()}`,
        profile: { values: { gender, age_months: ageMonths } },
        visits,
    } as any);

const firstAssessment = {
    _visit_number: '1',
    start: 'continue',
};

// [boys, girls] of a row by age band, as shown in the report.
const row = (sections: any[], section: string, label: string) => {
    const found = sections
        .find(s => s.category === section)
        .rows.find((r: any) => r.label === label);
    return [found.under6, found.between6And23, found.between24And59];
};

describe('iycfReport', () => {
    it('shows the four sections with a 0-5 column', () => {
        const sections = iycfReport([], START, END);
        expect(sections.map(s => s.category)).toEqual([
            'New Assessments',
            'Counselling and Support',
            'Referrals',
            'Follow Ups',
        ]);
        expect(sections[0].rows[0]).toMatchObject({
            under6: [0, 0],
            between6And23: [0, 0],
            between24And59: [0, 0],
        });
    });

    it('counts new assessments on first visits only, by age and gender', () => {
        const sections = iycfReport(
            [
                child('M', [
                    visit({
                        ...firstAssessment,
                        caregiver_relationship: 'mother',
                        is_breastfeeding: '0',
                        bf_difficulty: '1',
                    }),
                    // A follow-up re-assessed isn't a new assessment.
                    visit({
                        ...firstAssessment,
                        _visit_number: '2',
                        caregiver_relationship: 'mother',
                        is_breastfeeding: '0',
                    }),
                ]),
                child(
                    'F',
                    [
                        visit({
                            ...firstAssessment,
                            caregiver_relationship: 'grandmother',
                            is_breastfeeding: '1',
                            receiving_other_u6: '0',
                        }),
                    ],
                    3,
                ),
                child(
                    'F',
                    [
                        visit({
                            ...firstAssessment,
                            caregiver_relationship: 'mother',
                            is_breastfeeding: '1',
                            receiving_other_o6: '1',
                        }),
                    ],
                    30,
                ),
                // Opted out: not assessed.
                child('M', [visit({ _visit_number: '1', start: 'optout' })]),
            ],
            START,
            END,
        );

        expect(
            row(sections, 'New Assessments', 'Rapid/Pre assessments'),
        ).toEqual([
            [0, 1],
            [1, 0],
            [0, 1],
        ]);
        // Not the mother (girl, 3 months) or not breastfed (boy, 10 months).
        expect(row(sections, 'New Assessments', 'Full assessment')).toEqual([
            [0, 1],
            [1, 0],
            [0, 0],
        ]);
        expect(row(sections, 'New Assessments', 'Not breastfed')).toEqual([
            [0, 0],
            [1, 0],
            [0, 0],
        ]);
        expect(row(sections, 'New Assessments', 'Breastfed')).toEqual([
            [0, 1],
            [0, 0],
            [0, 1],
        ]);
    });

    it('counts complementary feeding issues from the FATVAH answers', () => {
        const sections = iycfReport(
            [
                child('F', [
                    visit({
                        ...firstAssessment,
                        receiving_other_o6: '1',
                        _fatvah_score: '3',
                        _fatvah_frequency: '1',
                        _fatvah_hygiene: '0',
                    }),
                ]),
            ],
            START,
            END,
        );
        const issues = (label: string) =>
            row(sections, 'New Assessments', label)[1];
        expect(issues('Complementary feeding issues')).toEqual([0, 1]);
        expect(issues('Poor feeding hygiene')).toEqual([0, 1]);
        expect(issues('Low feeding frequency')).toEqual([0, 0]);
    });

    it('counts the children given support or referred on any visit', () => {
        const sections = iycfReport(
            [
                child('M', [
                    visit({
                        ...firstAssessment,
                        support_to_be_given:
                            '[basic_iycf_support, skilled_bf_support, hygiene_care]',
                        refer_therapeutic: '1',
                        first_time_sc: '1',
                    }),
                    visit({
                        ...firstAssessment,
                        _visit_number: '2',
                        support_to_be_given: '[basic_iycf_support]',
                        psychosocial_support: '1',
                    }),
                ]),
            ],
            START,
            END,
        );
        const total = (section: string, label: string) =>
            row(sections, section, label)[1][0];
        // Counselled on both visits: counted once.
        expect(total('Counselling and Support', 'Basic IYCF counselling')).toBe(
            1,
        );
        expect(total('Counselling and Support', 'Breastfeeding support')).toBe(
            1,
        );
        expect(total('Counselling and Support', 'Hygiene counselling')).toBe(1);
        expect(total('Counselling and Support', 'Wet nursing support')).toBe(0);
        expect(total('Referrals', 'Therapeutic feeding')).toBe(1);
        expect(total('Referrals', 'Psychosocial referral')).toBe(1);
        expect(total('Referrals', 'Medical referral')).toBe(0);
    });

    it('counts the follow-up visits, progress, continued support and total counselling', () => {
        const sections = iycfReport(
            [
                child('F', [
                    // Full assessment.
                    visit({
                        ...firstAssessment,
                        caregiver_relationship: 'mother',
                        bf_difficulty: '1',
                    }),
                    // Progress, exited.
                    visit({
                        ...firstAssessment,
                        _visit_number: '2',
                        prograss_exist: '1',
                        _discharge_IYCF: '1',
                    }),
                    // No progress.
                    visit({
                        ...firstAssessment,
                        _visit_number: '3',
                        prograss_exist: '0',
                    }),
                    // Progress, not exited.
                    visit({
                        ...firstAssessment,
                        _visit_number: '4',
                        prograss_exist: '1',
                    }),
                    // Opted out: not a follow-up.
                    visit({
                        ...firstAssessment,
                        _visit_number: '5',
                        start: 'optout',
                    }),
                    // Out of the period.
                    visit(
                        { ...firstAssessment, _visit_number: '6' },
                        '2026-10-01T10:00:00',
                    ),
                ]),
            ],
            START,
            END,
        );
        const girls = (label: string) =>
            row(sections, 'Follow Ups', label)[1][1];
        expect(girls('Total follow-ups')).toBe(3);
        expect(girls('Progress made/improved')).toBe(2);
        expect(girls('Continued support')).toBe(2);
        expect(girls('Total Counselling')).toBe(4);
    });
});

describe('iycfWomenReport', () => {
    const womanVisit = (values: any, createdAt = '2026-09-10T10:00:00') => ({
        ...visit(values, createdAt),
        formFormId: 'iycf_pregnant_women',
    });

    const woman = (visits: any[], profile: any = {}) =>
        ({
            id: `${Math.random()}`,
            profile: { values: { age__int__: 25, ...profile } },
            visits,
        } as any);

    const pregnant = {
        _visit_number: '1',
        start: 'continue',
        is_pregnant: '1',
    };

    // [≤19, >19] pregnant women of a row.
    const women = (sections: any[], section: string, label: string) => {
        const found = sections
            .find(s => s.category === section)
            .rows.find((r: any) => r.key === label);
        return [found.under19[0], found.over19[0]];
    };

    it('shows the four sections', () => {
        expect(iycfWomenReport([], START, END).map(s => s.category)).toEqual([
            'New Assessments',
            'Counselling and Support',
            'Referrals',
            'Follow Ups',
        ]);
    });

    it('counts pregnant women only, by is_adolescent', () => {
        const sections = iycfWomenReport(
            [
                woman([
                    womanVisit({
                        ...pregnant,
                        is_adolescent: '1',
                        feed_plan_6m: 'breast_milk',
                    }),
                ]),
                woman([
                    womanVisit({
                        ...pregnant,
                        is_adolescent: '0',
                        lactating_or_child_u24: '1',
                        mother_difficulties: '1',
                        feed_plan_6m: 'mix',
                    }),
                ]),
                // Sick: no full assessment.
                woman([
                    womanVisit({
                        ...pregnant,
                        is_adolescent: '0',
                        lactating_or_child_u24: '1',
                        physically_sick_mentally_abnormal: '1',
                        feed_plan_6m: 'formula',
                    }),
                ]),
                // Breastfeeding: not in the report.
                woman([
                    womanVisit({
                        ...pregnant,
                        is_pregnant: '0',
                        child_under_6: '1',
                        is_adolescent: '1',
                    }),
                ]),
                // No start answered: not classified as pregnant.
                woman([
                    womanVisit({
                        _visit_number: '1',
                        is_pregnant: '1',
                        is_adolescent: '1',
                    }),
                ]),
            ],
            START,
            END,
        );

        expect(
            women(sections, 'New Assessments', 'Rapid/Pre assessments'),
        ).toEqual([1, 2]);
        // Adolescents qualify through is_adolescent.
        expect(women(sections, 'New Assessments', 'Full Assessments')).toEqual([
            1, 1,
        ]);
        expect(
            women(sections, 'New Assessments', 'Currently breastfeeding'),
        ).toEqual([0, 2]);
        expect(women(sections, 'New Assessments', 'Not breastfeeding')).toEqual(
            [1, 0],
        );
        // feed_plan_6m: mix or formula.
        expect(
            women(sections, 'New Assessments', 'Attachment difficulties'),
        ).toEqual([0, 2]);
        expect(
            women(sections, 'New Assessments', 'Breastfeeding difficulties'),
        ).toEqual([0, 1]);
        expect(
            women(sections, 'New Assessments', 'Maternal wellbeing concerns'),
        ).toEqual([0, 1]);
        expect(women(sections, 'Referrals', 'Medical referral')).toEqual([
            0, 1,
        ]);
    });

    it('counts support and referrals of any visit', () => {
        const sections = iycfWomenReport(
            [
                woman([
                    womanVisit({
                        ...pregnant,
                        is_adolescent: '1',
                        support_to_be_given:
                            '[adequate_rest, exclusive_breastfeeding, hygiene_practices]',
                        psychosocial_support: '1',
                        refer_tsfp_bsfp_cp: '1',
                    }),
                ]),
            ],
            START,
            END,
        );
        expect(
            women(
                sections,
                'Counselling and Support',
                'Basic IYCF counselling',
            ),
        ).toEqual([1, 0]);
        expect(
            women(sections, 'Counselling and Support', 'Hygiene counselling'),
        ).toEqual([1, 0]);
        expect(
            women(sections, 'Counselling and Support', 'Wet nursing support'),
        ).toEqual([1, 0]);
        expect(
            women(
                sections,
                'Counselling and Support',
                'Complementary feeding counselling',
            ),
        ).toEqual([0, 0]);
        expect(
            women(sections, 'Counselling and Support', 'Psychosocial support'),
        ).toEqual([1, 0]);
        expect(
            women(sections, 'Referrals', 'Therapeutic feeding referral'),
        ).toEqual([1, 0]);
        expect(women(sections, 'Referrals', 'Other referrals')).toEqual([0, 0]);
    });

    it('counts follow-up visits, classified by the profile when not asked again', () => {
        const sections = iycfWomenReport(
            [
                // Follow-ups with progress don't ask whether she is
                // pregnant: her pregnant profile tells.
                woman(
                    [
                        womanVisit({
                            _visit_number: '2',
                            start: 'continue',
                            prograss_exist: '1',
                            _discharge_IYCF: '1',
                        }),
                        womanVisit({
                            _visit_number: '3',
                            start: 'continue',
                            prograss_exist: '0',
                        }),
                    ],
                    { physiology_status: 'pregnant', age__int__: 18 },
                ),
                woman(
                    [
                        womanVisit({
                            _visit_number: '2',
                            start: 'continue',
                            prograss_exist: '1',
                        }),
                    ],
                    { physiology_status: 'breastfeeding' },
                ),
            ],
            START,
            END,
        );
        const followUps = (label: string) =>
            women(sections, 'Follow Ups', label);
        expect(followUps('Total follow-ups')).toEqual([2, 0]);
        expect(followUps('Breastfeeding improved')).toEqual([1, 0]);
        expect(followUps('Difficulties resolved')).toEqual([1, 0]);
        expect(followUps('Continued support')).toEqual([1, 0]);
        expect(followUps('Total counselling')).toEqual([2, 0]);
    });
});
