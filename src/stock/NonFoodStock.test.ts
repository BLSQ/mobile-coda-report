import Form from '../entity/Form';
import { processNonFoodStockData } from './NonFoodStock';

const report = (id: string, today: string, values: any) =>
    ({
        id,
        formFormId: 'nfi_stocks',
        createdAt: new Date(today),
        values: { today: new Date(today).getTime(), ...values },
    } as unknown as Form);

const firstReport = report('r1', '2026-09-25T00:00:00', {
    stock_item: '[S1505046_group, LLITN_group, other_group]',
    S1505046_balance: 5545,
    S1505046_received: 100,
    S1505046_utilised: 102,
    S1505046_discarded: 12,
    S1505046_unit: 'BOT',
    S1505046: '5531',
    S1505046_stock_out_days: 455,
    LLITN_balance: 45478,
    LLITN_received: 45,
    LLITN_utilised: 56,
    LLITN_discarded: 7,
    LLITN_unit: 'EACH',
    LLITN: '45460',
    LLITN_stock_out_days: 458,
    other_name: 'Test',
    other_balance: 645,
    other_received: 45,
    other_utilised: 5,
    other_discarded: 97,
    other_unit: 'BOT',
    other: '588',
    other_stock_out_days: 545,
});

const secondReport = report('r2', '2026-09-28T00:00:00', {
    stock_item: '[S1505046_group]',
    S1505046_balance: 5531,
    S1505046_received: 10,
    S1505046_utilised: 1,
    S1505046_discarded: 0,
    S1505046_unit: 'BOT',
    S1505046: '5540',
    S1505046_stock_out_days: 2,
});

describe('processNonFoodStockData', () => {
    it('keeps the opening balance of the first report, the closing balance of the last one and sums the movements', () => {
        const rows = processNonFoodStockData(
            // Out of order on purpose: reports are sorted by their date.
            [secondReport, firstReport],
            new Date('2026-09-01T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );

        expect(rows.find(row => row.code === 'S1505046')).toEqual({
            code: 'S1505046',
            label: 'Amoxillin pdr oral sus 125 mg bot 100 ml',
            unit: 'BOT',
            balanceStart: 5545,
            received: 110,
            utilized: 103,
            discarded: 12,
            balanceEnd: 5540,
            stockOutDays: 457,
        });
        expect(rows.find(row => row.code === 'LLITN')).toMatchObject({
            balanceStart: 45478,
            balanceEnd: 45460,
        });
        expect(rows.find(row => row.code === 'other')).toMatchObject({
            label: 'Test',
            balanceEnd: 588,
        });
    });

    it('ignores reports outside of the period', () => {
        const rows = processNonFoodStockData(
            [firstReport, secondReport],
            new Date('2026-09-26T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );
        expect(rows.find(row => row.code === 'S1505046')).toMatchObject({
            balanceStart: 5531,
            received: 10,
            balanceEnd: 5540,
        });
        expect(rows.find(row => row.code === 'LLITN')?.balanceEnd).toBe(0);
    });
});
