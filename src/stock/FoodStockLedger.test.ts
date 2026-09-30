import Form from '../entity/Form';
import { processFoodStockData } from './FoodStockLedger';
import FAKE_STOCK from '../fake/FakeStockData';

const day = (date: string) => new Date(`${date}T10:00:00`).getTime();

const submission = (id: string, values: any) =>
    ({ id, formFormId: 'food_item_stock', values } as unknown as Form);

describe('processFoodStockData', () => {
    beforeEach(() => {
        (global as any).Android = {
            currentOrgUnit: () => '{"id":"5846","name":"Camp 1W_C2"}',
            loadForms: () => '[]',
            getStockValueAt: jest.fn(() =>
                FAKE_STOCK.replace('"Oil":0', '"Oil":12'),
            ),
            loadStockLedgerItems: jest.fn(() =>
                JSON.stringify([
                    {
                        questionName: 'total_wsbp',
                        submissionId: 'r1',
                        value: 40,
                        impact: 'ADD',
                        createdAt: day('2026-09-10'),
                    },
                    {
                        questionName: 'total_wsbp',
                        submissionId: 'r0',
                        value: 99,
                        impact: 'ADD',
                        createdAt: day('2026-08-01'),
                    },
                    {
                        questionName: 'total_wsbp_transfered',
                        submissionId: 't1',
                        value: 5,
                        impact: 'SUBTRACT',
                        createdAt: day('2026-09-11'),
                    },
                    {
                        questionName: 'total_wsbp_transfered',
                        submissionId: 't2',
                        value: 3,
                        impact: 'SUBTRACT',
                        createdAt: day('2026-09-12'),
                    },
                    {
                        questionName: 'total_oil_losses',
                        submissionId: 'l1',
                        value: 2,
                        impact: 'SUBTRACT',
                        createdAt: day('2026-09-13'),
                    },
                    {
                        questionName: 'total_oil_losses',
                        submissionId: 'l2',
                        value: 1,
                        impact: 'SUBTRACT',
                        createdAt: day('2026-09-14'),
                    },
                    {
                        questionName: 'total_oil_losses',
                        submissionId: 'l3',
                        value: 4,
                        impact: 'SUBTRACT',
                        createdAt: day('2026-09-15'),
                    },
                    {
                        questionName: 'unrelated_question',
                        submissionId: 'x',
                        value: 7,
                        impact: 'ADD',
                        createdAt: day('2026-09-15'),
                    },
                ]),
            ),
        };
    });

    afterEach(() => {
        delete (global as any).Android;
    });

    it('aggregates ledger items of the period by item and reason', () => {
        const rows = processFoodStockData(
            [
                submission('t1', { reason_transfer: 'loan_borrowing' }),
                submission('t2', {}),
                submission('l1', { reason_loss: 'infestation' }),
                submission('l2', { reason_loss: 'expired_stock' }),
                submission('l3', { reason_loss: 'stolen' }),
            ],
            new Date('2026-09-01T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );

        expect((global as any).Android.getStockValueAt).toHaveBeenCalledWith(
            '2026-09-01',
            '5846',
        );
        expect(rows).toHaveLength(6);
        expect(
            rows.find(row => row.item === 'Super Cerial Plus Plus/ WSB++'),
        ).toEqual({
            item: 'Super Cerial Plus Plus/ WSB++',
            opening: 0,
            received: 40,
            transferred: { loanAndBorrowing: 5, other: 3, total: 8 },
            lost: { infestation: 0, expired: 0, stolen: 0, other: 0, total: 0 },
            end: 32,
        });
        expect(rows.find(row => row.item === 'Oil')).toMatchObject({
            opening: 12,
            received: 0,
            lost: { infestation: 2, expired: 1, stolen: 4, other: 0, total: 7 },
            end: 5,
        });
    });

    it('requests the ledger items up to the end of the last day', () => {
        processFoodStockData(
            [],
            new Date('2026-09-01T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );
        expect(
            (global as any).Android.loadStockLedgerItems,
        ).toHaveBeenCalledWith('5846', null, null, '2026-09-01', '2026-10-01');
    });

    it('takes the opening stock from the first date of the period having some', () => {
        const android = (global as any).Android;
        android.getStockValueAt = jest.fn((date: string) =>
            date >= '2026-09-11'
                ? FAKE_STOCK.replace(
                      '"Super Cerial Plus Plus\\/ WSB++":0',
                      '"Super Cerial Plus Plus\\/ WSB++":40',
                  )
                : FAKE_STOCK,
        );

        const rows = processFoodStockData(
            [submission('t1', { reason_transfer: 'loan_borrowing' })],
            new Date('2026-09-01T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );

        // Only the dates right after a movement are looked up: WSB++ is
        // found on the 11th, Oil (never in stock) keeps being looked up on
        // the day after each of its losses.
        expect(
            android.getStockValueAt.mock.calls.map((call: any[]) => call[0]),
        ).toEqual([
            '2026-09-01',
            '2026-09-11',
            '2026-09-12',
            '2026-09-13',
            '2026-09-14',
            '2026-09-15',
            '2026-09-16',
        ]);
        // The reception of the 10th is part of the opening stock of the 11th,
        // so it isn't counted a second time as received.
        expect(
            rows.find(row => row.item === 'Super Cerial Plus Plus/ WSB++'),
        ).toMatchObject({
            opening: 40,
            received: 0,
            transferred: { loanAndBorrowing: 5, other: 3, total: 8 },
            end: 32,
        });
        // Oil has no stock on any date: it keeps 0 and all its movements.
        expect(rows.find(row => row.item === 'Oil')).toMatchObject({
            opening: 0,
            lost: { total: 7 },
            end: -7,
        });
    });

    it('returns no rows without a native bridge', () => {
        delete (global as any).Android;
        expect(processFoodStockData([], new Date(), new Date())).toEqual([]);
    });
});
