import { defaulterCases } from './DataFilter';

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

    it('checks every assistance visit, not only the first one', () => {
        expect(counterOf([assistance(-20, 7), assistance(-10, 7)])).toBe(2);
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
