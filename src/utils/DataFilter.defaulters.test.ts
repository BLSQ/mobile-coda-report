import { defaulterCases } from './DataFilter';
import { nextVisitDateOf } from './Filter';
import { timeStampToDate } from './DateFormatter';
import { reportConfig } from '../config/reportConfig';

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

// A TSFP assistance follow-up booking the next visit in `inDays` days.
const assistance = (createdOn: number, inDays: number) =>
    visit('child_assistance_follow_up_2', createdOn, {
        new_next_visit__date__: day(createdOn + inDays),
        number_of_days__int__: '30',
    });

const counterOf = (visits: Array<any>) =>
    defaulterCases(
        [{ id: 'child', visits }],
        new Date(day(-30)),
        new Date(day(1)),
        'TSFP',
    )[0]?.counter ?? 0;

describe('defaulterCases', () => {
    it('counts a missed visit once when the anthropometric follow-up books it too', () => {
        expect(
            counterOf([
                visit('child_antropometric_followUp_tsfp_2', -10, {
                    next_visit_date__date__: day(-3),
                }),
                assistance(-10, 7),
            ]),
        ).toBe(1);
    });

    it('only checks the visit planned last: the child came to the ones before', () => {
        // Planned at -13, came late at -10, then missed -3.
        expect(counterOf([assistance(-20, 7), assistance(-10, 7)])).toBe(1);
    });

    it('does not count a visit the child came to late', () => {
        expect(
            counterOf([
                assistance(-10, 5),
                visit('child_antropometric_followUp_tsfp_2', -3, {}),
            ]),
        ).toBe(0);
    });

    it('does not count a visit planned later', () => {
        expect(counterOf([assistance(-10, 7), assistance(-3, 14)])).toBe(0);
    });

    it('does not count a visit the child came to', () => {
        expect(
            counterOf([
                assistance(-10, 7),
                visit('child_antropometric_followUp_tsfp_2', -3, {}),
            ]),
        ).toBe(0);
    });
});

// The PBWG of the fake data: admitted on day -45, came back on day -31 and
// was then planned on day -3, every 14 days. The assistance forms of the
// breastfeeding women don't give the interval.
describe('nextVisitDateOf', () => {
    const planned = (values: any) => nextVisitDateOf({ values });

    it('takes the date changed on the visit over the one planned before', () => {
        expect(
            planned({
                next_visit__date__: day(-3),
                new_next_visit__date__: day(10),
            }),
        ).toBe(timeStampToDate(day(10)));
        expect(
            planned({
                next_visit_date__date__: day(-3),
                new_next_visit_date__date__: day(10),
            }),
        ).toBe(timeStampToDate(day(10)));
    });

    it('falls back to the planned date when the changed one is empty', () => {
        expect(
            planned({
                new_next_visit__date__: '',
                next_visit__date__: day(-3),
            }),
        ).toBe(timeStampToDate(day(-3)));
    });

    it('is empty when no date is planned', () => {
        expect(planned({ next_visit_date__date__: '' })).toBe('');
    });
});

describe('defaulterCases with a changed next visit', () => {
    const followUp = (values: any) =>
        visit('wfp_coda_pbwg_assistance_followup', -10, {
            program: 'TSFP',
            ...values,
        });
    const counterOf = (values: any) =>
        defaulterCases(
            [{ id: 'woman', visits: [followUp(values)] }],
            new Date(day(-30)),
            new Date(day(1)),
            'TSFP',
        )[0]?.counter ?? 0;

    it('waits for the changed date', () => {
        expect(
            counterOf({
                next_visit__date__: day(-3),
                new_next_visit__date__: day(4),
            }),
        ).toBe(0);
    });

    it('counts the changed date once missed', () => {
        expect(
            counterOf({
                next_visit__date__: day(4),
                new_next_visit__date__: day(-3),
            }),
        ).toBe(1);
    });

    it('exits the absentee on the day of the missed visit', () => {
        const [absentee] = defaulterCases(
            [
                {
                    id: 'woman',
                    visits: [
                        followUp({
                            next_visit__date__: day(-10),
                            new_next_visit__date__: day(-3),
                        }),
                    ],
                },
            ],
            new Date(day(-30)),
            new Date(day(1)),
            'TSFP',
        );
        expect(absentee.exitDate).toBe(timeStampToDate(day(-3)));
    });

    it('counts the planned date when the changed one is empty', () => {
        expect(
            counterOf({
                next_visit__date__: day(-3),
                new_next_visit__date__: '',
            }),
        ).toBe(1);
    });
});

describe('defaulterCases for PBWG', () => {
    const anthro = (formFormId: string, createdOn: number) =>
        visit(formFormId, createdOn, { program: 'TSFP' });
    const pbwgAssistance = (
        formFormId: string,
        createdOn: number,
        nextOn: number,
        values: any = {},
    ) =>
        visit(formFormId, createdOn, {
            program: 'TSFP',
            new_next_visit__date__: day(nextOn),
            ...values,
        });

    const woman = (lactating: boolean, today: number) => [
        anthro('wfp_coda_pbwg_anthropometric', -45 - today),
        pbwgAssistance(
            'wfp_coda_pbwg_assistance',
            -45 - today,
            -31 - today,
            lactating ? {} : { next_visit_days: 14 },
        ),
        anthro(
            lactating
                ? 'wfp_coda_pbwg_luctating_followup_anthro'
                : 'wfp_coda_pbwg_followup_anthro',
            -31 - today,
        ),
        pbwgAssistance(
            'wfp_coda_pbwg_assistance_followup',
            -31 - today,
            -3 - today,
        ),
    ];

    // `today` days later than the day the fake data is looked at.
    const counterOn = (lactating: boolean, today: number) =>
        defaulterCases(
            [{ id: 'woman', visits: woman(lactating, today) }],
            new Date(day(-60)),
            new Date(day(1)),
            'TSFP',
        )[0]?.counter ?? 0;

    it.each([
        ['pregnant', false],
        ['breastfeeding', true],
    ])('keeps the %s woman who came to her visits', (_, lactating) => {
        // Day -3 is still ahead of her: 11 days earlier.
        expect(counterOn(lactating as boolean, -11)).toBe(0);
    });

    it.each([
        ['pregnant', false],
        ['breastfeeding', true],
    ])(
        'counts the %s woman absent once her planned visit is missed',
        (_, lactating) => {
            expect(counterOn(lactating as boolean, 0)).toBe(1);
        },
    );

    it.each([
        ['pregnant', false],
        ['breastfeeding', true],
    ])(
        'counts the %s woman a defaulter once the next visit is missed too',
        (_, lactating) => {
            // 14 days after day -3: the visit after is missed too.
            expect(counterOn(lactating as boolean, 12)).toBe(2);
        },
    );
});

describe('South Sudan eRegister', () => {
    const reportKeys = (entityType: string, program: string) =>
        reportConfig
            .find(option => option.key === entityType)
            ?.programs?.find(option => option.key === program)
            ?.reportOptions?.map(option => option.key);

    it('is not offered for BSFP and NSEP', () => {
        expect(reportKeys('Child Under 5', 'BSFP')).not.toContain(
            'BSFP_eRegister',
        );
        expect(reportKeys('Child Under 5', 'NSEP')).not.toContain(
            'NSEP_eRegister',
        );
        expect(reportKeys('PBWG', 'BSFP')).not.toContain('PBWG_BSFP_eRegister');
        expect(reportKeys('Child Under 5', 'TSFP')).toContain('TSFP_eRegister');
    });
});
