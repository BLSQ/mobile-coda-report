import Form from '../entity/Form';
import FoodStockItem from './FoodStockItem';
import { foodInitialStock } from '../config/country';
import { callStockBridge } from './StockBridge';
//import FAKE_STOCK_LEDGER_ITEMS from '../fake/FakeStockLedgerItems';
//import FAKE_LOCAL_HF from '../fake/FakeLocalHealthFacility';

// One row of Android.loadStockLedgerItems(): a single stock movement created
// by a stock rule on one question of a submission.
interface StockLedgerItem {
    id: string;
    questionName: string | null;
    submissionId: string | null;
    orgUnitId: string;
    formId: string | null;
    formName: string | null;
    value: number;
    impact: 'ADD' | 'SUBTRACT';
    createdAt: number;
}

type Movement = 'received' | 'transferred' | 'lost';

// Commodity code used in the food_item_stock question names
// (total_<code>, total_<code>_losses, total_<code>_transfered) mapped to the
// SKU name returned as key by Android.getStockValueAt().
const COMMODITY_TO_SKU: Record<string, string> = {
    wsb: 'Super Cerial Plus/ WSB+',
    wsbp: 'Super Cerial Plus Plus/ WSB++',
    lns_mq: 'LNS - Medium Quantity (LNS- MQ)',
    rusf: 'Ready-to-Use Supplementary Food (RUSF) Large Quantity',
    rutf: 'Ready to use Therapeutic Food (RUTF)',
    oil: 'Oil',
};

const QUESTION_SUFFIX_TO_MOVEMENT: Record<string, Movement> = {
    '': 'received',
    _losses: 'lost',
    _transfered: 'transferred',
    _transferred: 'transferred',
};

// TODO: confirm the reason question names/choices of the food_item_stock
// form; the first non-empty field found on the submission is used.
const LOSS_REASON_FIELDS = ['reason_loss', 'loss_reason', 'reason_losses'];
const TRANSFER_REASON_FIELDS = [
    'reason_transfer',
    'transfer_reason',
    'transfer_type',
];

const firstValue = (values: any, fields: string[]): string =>
    `${
        fields.map(field => values?.[field]).find(value => !!value) ?? ''
    }`.toLowerCase();

const lossReason = (values: any) => {
    const reason = firstValue(values, LOSS_REASON_FIELDS);
    if (reason.includes('infest')) return 'infestation';
    if (reason.includes('expir')) return 'expired';
    if (reason.includes('stol') || reason.includes('theft')) return 'stolen';
    return 'other';
};

const transferReason = (values: any) => {
    const reason = firstValue(values, TRANSFER_REASON_FIELDS);
    if (reason.includes('loan') || reason.includes('borrow')) {
        return 'loanAndBorrowing';
    }
    return 'other';
};

const parseQuestion = (
    questionName: string | null,
): { sku: string; movement: Movement } | null => {
    const match = questionName?.match(
        /^total_(.+?)(_losses|_transfered|_transferred)?$/,
    );
    if (!match) return null;
    const sku = COMMODITY_TO_SKU[match[1]];
    if (!sku) return null;
    return { sku, movement: QUESTION_SUFFIX_TO_MOVEMENT[match[2] ?? ''] };
};

// getStockValueAt() expects a LocalDate (yyyy-MM-dd); toISOString() would
// shift the day for timezones ahead of UTC.
const toLocalDateString = (date: Date) =>
    `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(
        2,
        '0',
    )}-${`${date.getDate()}`.padStart(2, '0')}`;

const DAY = 24 * 60 * 60 * 1000;

// getStockValueAt(date) sums the ledger items created strictly before
// midnight UTC of `date` (the native side reads the day as a UTC midnight),
// so this is the moment its balance is taken at.
const stockCutoff = (date: string) => Date.parse(`${date}T00:00:00Z`);

// First date getStockValueAt() can return a balance including an item
// created at `createdAt`: the day after its UTC day.
const firstDateIncluding = (createdAt: number) =>
    new Date(Math.floor(createdAt / DAY) * DAY + DAY)
        .toISOString()
        .substring(0, 10);

const currentOrgUnitId = (): string | null => {
    try {
        // @ts-ignore Android is injected globally by the native WebView bridge
        return JSON.parse(Android.currentOrgUnit())?.id ?? null;
        //return JSON.parse(FAKE_LOCAL_HF)?.id ?? null;
    } catch {
        return null;
    }
};

const loadStockLedgerItems = (
    orgUnitId: string,
    startDate: string | null,
    endDate: string | null,
): StockLedgerItem[] => {
    try {
        const items = callStockBridge<StockLedgerItem[]>(orgUnitId, () =>
            // @ts-ignore Android is injected globally by the native WebView bridge
            Android.loadStockLedgerItems(
                orgUnitId,
                null,
                null,
                startDate,
                endDate,
            ),
        );
        console.info(
            'Load stock items ...:',
            orgUnitId,
            items,
            startDate,
            endDate,
        );
        //const items = JSON.parse(FAKE_STOCK_LEDGER_ITEMS).filter((item:any) => item?.orgUnitId === orgUnitId || item?.parentOrgUnitId === orgUnitId);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
};

const emptyRow = (item: string, opening: number): FoodStockItem => ({
    item,
    opening,
    received: 0,
    transferred: { loanAndBorrowing: 0, other: 0, total: 0 },
    lost: {
        infestation: 0,
        expired: 0,
        stolen: 0,
        other: 0,
        total: 0,
    },
    end: 0,
});

const processFoodStockData = (
    submissions: Form[],
    startDate: Date,
    endDate: Date,
): FoodStockItem[] => {
    const orgUnitId = currentOrgUnitId();
    if (orgUnitId == null) return [];

    const startDay = toLocalDateString(startDate);
    const endDay = toLocalDateString(endDate);
    // Balance of every SKU before the first day of the period.
    const openingStock: Record<string, number> =
        foodInitialStock(startDay, orgUnitId) ?? {};
    console.info('OPENING STOCK ...:', openingStock);

    // The native end date is exclusive (createdAt <= its midnight), so the
    // day after is requested to keep the movements of the last day.
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const ledgerItems = loadStockLedgerItems(
        orgUnitId,
        startDay,
        toLocalDateString(nextDay),
    );

    // const start = new Date(startDate);
    // start.setHours(0, 0, 0, 0);
    // const end = new Date(endDate);
    // end.setHours(23, 59, 59, 999);

    const submissionsById = new Map(
        submissions.map(submission => [submission.id, submission]),
    );

    const rows = new Map<string, FoodStockItem>(
        Object.entries(openingStock).map(([item, opening]) => [
            item,
            emptyRow(item, Number(opening) || 0),
        ]),
    );
    console.info('ALL ROWS ...:', rows);

    const movements = ledgerItems.flatMap(ledgerItem => {
        const question = parseQuestion(ledgerItem.questionName);
        return question ? [{ ledgerItem, ...question }] : [];
    });
    movements.forEach(({ sku }) => {
        if (!rows.has(sku)) rows.set(sku, emptyRow(sku, 0));
    });

    // Moment from which each item's movements are counted: the one its
    // opening balance was taken at.
    const countFrom = new Map<string, number>(
        Array.from(rows.keys()).map(sku => [sku, stockCutoff(startDay)]),
    );

    // Items without opening stock on the start date take it from the first
    // date of the period having some. Their balance only changes with a
    // movement, so only the dates right after one are looked at.
    const withoutOpening = new Set(
        Array.from(rows.values())
            .filter(row => row.opening === 0)
            .map(row => row.item),
    );
    const candidateDates = Array.from(
        new Set(
            movements
                .filter(({ sku }) => withoutOpening.has(sku))
                .map(({ ledgerItem }) =>
                    firstDateIncluding(ledgerItem.createdAt),
                ),
        ),
    )
        .filter(date => date > startDay && date <= endDay)
        .sort();
    for (const date of candidateDates) {
        if (withoutOpening.size === 0) break;
        const stock: Record<string, number> =
            foodInitialStock(date, orgUnitId) ?? {};
        withoutOpening.forEach(sku => {
            const opening = Number(stock[sku]) || 0;
            if (opening === 0) return;
            rows.set(sku, { ...rows.get(sku)!, opening });
            countFrom.set(sku, stockCutoff(date));
            withoutOpening.delete(sku);
        });
    }

    movements
        .filter(
            ({ sku, ledgerItem }) =>
                ledgerItem.createdAt >= countFrom.get(sku)!,
        )
        .forEach(({ ledgerItem, sku, movement }) => {
            console.info('LEDGER ITEM ....:', ledgerItem);
            const row = rows.get(sku)!;
            const quantity = Number(ledgerItem.value) || 0;
            const values = submissionsById.get(
                ledgerItem.submissionId ?? '',
            )?.values;

            if (movement === 'received') {
                row.received += quantity;
            } else if (movement === 'transferred') {
                row.transferred[transferReason(values)] += quantity;
                row.transferred.total += quantity;
            } else {
                row.lost[lossReason(values)] += quantity;
                row.lost.total += quantity;
            }
            console.info('ROW ...:', row);
        });

    // Stock at the end of the period, once every movement is counted.
    return Array.from(rows.values()).map(row => ({
        ...row,
        end:
            row.opening + row.received - row.transferred.total - row.lost.total,
    }));
};

export { processFoodStockData };
export type { StockLedgerItem };
