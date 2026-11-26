// The Follow Ups section counts the beneficiaries followed up in the period,
// once each. The Total section counts a beneficiary admitted and followed up
// in the same period as an admission only.
import '../test/bridge';
import { useSubmissions, ORG_UNIT } from '../test/bridge';
import LoadFormsForEntityType from '../Android';
import FAKE_DATA from '../fake/FakeData';
import { dataCategory } from './DataFilter';

// Two women, admitted on 10 April and followed up on 24 April: a pregnant
// one under 19 and a breastfeeding one over 19.
const rows = JSON.parse(FAKE_DATA);

const loadPbwg = (): Promise<any[]> =>
    new Promise(resolve =>
        LoadFormsForEntityType('PBWG', ({ entities }: any) =>
            resolve(entities),
        ),
    );

const report = async (start: string, end: string) => {
    const categories: any[] = dataCategory(
        await loadPbwg(),
        'TSFP',
        new Date(start),
        new Date(`${end}T23:59:59`),
        'PBWG',
    );
    const rowsOf = (category: string) =>
        categories
            .find((c: any) => c.category === category)
            .rows.map(({ under19, over19 }: any) => [under19, over19]);
    return {
        followUps: rowsOf('Follow Ups')[0],
        // [Follow Ups, Total Admissions]
        total: rowsOf('Total'),
        newAdmissions: categories.find(
            (c: any) => c.category === 'New admissions',
        ).total,
    };
};

describe('Follow Ups of the main report', () => {
    beforeEach(() => {
        ORG_UNIT.id = rows[0].orgUnitId;
        useSubmissions(rows);
    });

    it('counts the women admitted and followed up in the period as admissions in the Total', async () => {
        const { followUps, total } = await report('2026-04-01', '2026-04-30');

        // Followed up on 24 April: counted once in the Follow Ups section.
        expect(followUps).toEqual([
            [1, 0],
            [0, 1],
        ]);
        // Admitted on 10 April: the Total keeps the admission only.
        expect(total).toEqual([
            [
                [0, 0],
                [0, 0],
            ],
            [
                [1, 0],
                [0, 1],
            ],
        ]);
    });

    it('counts the women followed up, not admitted, in the period', async () => {
        // The follow-up forms (medical, IYCF, assistance) are the ones of
        // the admission too: they don't make the follow-up an admission.
        const { followUps, total, newAdmissions } = await report(
            '2026-04-20',
            '2026-04-30',
        );

        expect(followUps).toEqual([
            [1, 0],
            [0, 1],
        ]);
        expect(total).toEqual([
            [
                [1, 0],
                [0, 1],
            ],
            [
                [0, 0],
                [0, 0],
            ],
        ]);
        expect(newAdmissions!.under19).toEqual([0, 0]);
        expect(newAdmissions!.over19).toEqual([0, 0]);
    });

    it('counts nothing in a period without visits, even with a next visit planned in it', async () => {
        const { followUps, total } = await report('2026-05-01', '2026-05-31');

        expect(followUps).toEqual([
            [0, 0],
            [0, 0],
        ]);
        expect(total.flat(2)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
});
