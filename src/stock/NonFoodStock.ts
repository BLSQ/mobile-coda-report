import { orderBy } from 'lodash';
import Form from '../entity/Form';
import { NON_FOOD_STOCK_ITEMS } from '../utils/Array';

interface NonFoodStockItem {
    readonly code: string;
    readonly label: string;
    unit: string;
    balanceStart: number;
    received: number;
    utilized: number;
    discarded: number;
    balanceEnd: number;
    stockOutDays: number;
}

const NON_FOOD_STOCK_FORM = 'nfi_stocks';

const toNumber = (value: any) => Number(value) || 0;

// Day the stock report was filled for, falling back to the submission date.
const reportDate = (submission: Form) =>
    new Date(submission.values?.today ?? submission.createdAt).getTime();

const emptyRow = (code: string): NonFoodStockItem => ({
    code,
    label: NON_FOOD_STOCK_ITEMS[code] ?? code,
    unit: '',
    balanceStart: 0,
    received: 0,
    utilized: 0,
    discarded: 0,
    balanceEnd: 0,
    stockOutDays: 0,
});

// Codes of the items filled in a submission, from its "stock_item" select
// ("[S1505046_group, LLITN_group, ...]") or, failing that, its *_balance
// questions.
const itemCodes = (values: any): string[] => {
    const selected = `${values?.stock_item ?? ''}`
        .replace(/[[\]]/g, '')
        .split(',')
        .map(item => item.trim().replace(/_group$/, ''))
        .filter(item => item !== '');
    if (selected.length > 0) return selected;
    return Object.keys(values ?? {})
        .filter(key => key.endsWith('_balance'))
        .map(key => key.replace(/_balance$/, ''));
};

const processNonFoodStockData = (
    submissions: Form[],
    startDate: Date,
    endDate: Date,
): NonFoodStockItem[] => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const reports = orderBy(
        submissions.filter(submission => {
            const date = reportDate(submission);
            return (
                submission.formFormId === NON_FOOD_STOCK_FORM &&
                date >= start.getTime() &&
                date <= end.getTime()
            );
        }),
        [reportDate],
        ['asc'],
    );

    const rows = new Map<string, NonFoodStockItem>(
        Object.keys(NON_FOOD_STOCK_ITEMS).map(code => [code, emptyRow(code)]),
    );
    const seen = new Set<string>();

    reports.forEach(({ values }) => {
        itemCodes(values).forEach(code => {
            if (!rows.has(code)) rows.set(code, emptyRow(code));
            const row = rows.get(code)!;
            // The first report of the period gives the opening balance,
            // the last one the closing balance; movements add up.
            if (!seen.has(code)) {
                row.balanceStart = toNumber(values[`${code}_balance`]);
                seen.add(code);
            }
            row.received += toNumber(values[`${code}_received`]);
            row.utilized += toNumber(values[`${code}_utilised`]);
            row.discarded += toNumber(values[`${code}_discarded`]);
            row.stockOutDays += toNumber(values[`${code}_stock_out_days`]);
            row.balanceEnd = toNumber(values[code]);
            row.unit = values[`${code}_unit`] ?? row.unit;
        });
    });

    return Array.from(rows.values()).map(row =>
        row.code === 'other' && reports.length > 0
            ? {
                  ...row,
                  label:
                      reports
                          .map(({ values }) => values?.other_name)
                          .filter(name => !!name)
                          .pop() ?? row.label,
              }
            : row,
    );
};

export { processNonFoodStockData, NON_FOOD_STOCK_FORM };
export type { NonFoodStockItem };
