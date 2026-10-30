import FoodStockItem, {
    FoodStockBatch,
    FoodStockMovements,
} from './FoodStockItem';
import { foodInitialStock } from '../config/country';
import { callStockBridge } from './StockBridge';
import { addQuantities, noQuantity, submissionQuantity } from './FoodQuantity';
//import FAKE_DATA from '../fake/FakeData';
//import FAKE_LOCAL_HF from '../fake/FakeLocalHealthFacility';

// One submission of the food_item_stock form, as returned by
// Android.loadForms(): a single activity (receive, transfer, losses...) on
// one commodity and one batch.
interface FoodStockSubmission {
    id: string;
    formFormId: string;
    createdAt: string;
    values: any;
}

const FOOD_STOCK_FORM = 'food_item_stock';

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

// TODO: confirm the reason question names/choices of the food_item_stock
// form; the first non-empty field found on the submission is used.
const LOSS_REASON_FIELDS = ['reason_loss', 'loss_reason', 'reason_losses'];
const TRANSFER_REASON_FIELDS = [
    'reason_transfer',
    'transfer_reason',
    'transfer_type',
];

// Batch number of the activity, entered for every activity of the form.
const BATCH_NUMBER_FIELDS = ['batch_number', 'batch_number_entry'];

const firstValue = (values: any, fields: string[]): string =>
    `${fields.map(field => values?.[field]).find(value => !!value) ?? ''}`;

const lossReason = (values: any) => {
    const reason = firstValue(values, LOSS_REASON_FIELDS).toLowerCase();
    if (reason.includes('infest')) return 'infestation';
    if (reason.includes('expir')) return 'expired';
    if (reason.includes('stol') || reason.includes('theft')) return 'stolen';
    return 'other';
};

const transferReason = (values: any) => {
    const reason = firstValue(values, TRANSFER_REASON_FIELDS).toLowerCase();
    if (reason.includes('loan') || reason.includes('borrow')) {
        return 'loanAndBorrowing';
    }
    return 'other';
};

const batchNumber = (values: any) =>
    firstValue(values, BATCH_NUMBER_FIELDS).trim();

const text = (value: any) => (value == null ? '' : `${value}`.trim());

// LocalDate (yyyy-MM-dd), as expected by getStockValueAt(); toISOString()
// would shift the day for timezones ahead of UTC.
const toLocalDateString = (date: Date) =>
    `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(
        2,
        '0',
    )}-${`${date.getDate()}`.padStart(2, '0')}`;

// Day the activity happened: the stock management date entered on the
// form, or the submission creation when it is missing.
const activityTime = (submission: FoodStockSubmission) =>
    Number(submission.values?.stock_management_date) ||
    Date.parse(submission.createdAt);

const currentOrgUnitId = (): string | null => {
    try {
        // @ts-ignore Android is injected globally by the native WebView bridge
        return JSON.parse(Android.currentOrgUnit())?.id ?? null;
        //return JSON.parse(FAKE_LOCAL_HF)?.id ?? null;
    } catch {
        return null;
    }
};

const loadFoodStockSubmissions = (orgUnitId: string): FoodStockSubmission[] => {
    try {
        const submissions = callStockBridge<FoodStockSubmission[]>(
            orgUnitId,
            () =>
                // @ts-ignore Android is injected globally by the native WebView bridge
                Android.loadForms(
                    orgUnitId,
                    null,
                    null,
                    null,
                    FOOD_STOCK_FORM,
                    null,
                    null,
                ),
        );
        //const submissions = JSON.parse(FAKE_DATA);
        return Array.isArray(submissions)
            ? submissions.filter(
                  submission => submission?.formFormId === FOOD_STOCK_FORM,
              )
            : [];
    } catch {
        return [];
    }
};

// Fields separating the batch rows of a food item: a batch packed in
// different units, packaging or box sizes gets one row per way of packing it.
const batchFields = (values: any) => ({
    batch: batchNumber(values),
    unit: text(values?.quantity_unit_label) || text(values?.unit),
    packagingSize: text(values?.packaging_size),
    boxSize: text(values?.box_size),
});

const batchKey = (fields: ReturnType<typeof batchFields>) =>
    JSON.stringify([
        fields.batch,
        fields.unit,
        fields.packagingSize,
        fields.boxSize,
    ]);

const noMovements = (): FoodStockMovements => ({
    received: noQuantity(),
    transferred: {
        loanAndBorrowing: noQuantity(),
        other: noQuantity(),
        total: noQuantity(),
    },
    lost: {
        infestation: noQuantity(),
        expired: noQuantity(),
        stolen: noQuantity(),
        other: noQuantity(),
        total: noQuantity(),
    },
});

const emptyItem = (item: string, opening: number) => ({
    item,
    opening,
    ...noMovements(),
    batches: new Map<string, FoodStockBatch>(),
});

// Quantities of one commodity moved by a submission.
const quantities = (values: any, commodity: string) => ({
    received: Number(values?.[`total_${commodity}`]) || 0,
    transferred:
        Number(values?.[`total_${commodity}_transfered`]) ||
        Number(values?.[`total_${commodity}_transferred`]) ||
        0,
    lost: Number(values?.[`total_${commodity}_losses`]) || 0,
});

// Adds the quantity moved by a submission, in sachets, boxes, kg and metric
// tons as recorded on it, to the movement of its activity.
const addMovements = (
    target: FoodStockMovements,
    values: any,
    { received, transferred, lost }: ReturnType<typeof quantities>,
) => {
    if (received) {
        target.received = addQuantities(
            target.received,
            submissionQuantity(values, received),
        );
    }
    if (transferred) {
        const quantity = submissionQuantity(values, transferred);
        const reason = transferReason(values);
        target.transferred[reason] = addQuantities(
            target.transferred[reason],
            quantity,
        );
        target.transferred.total = addQuantities(
            target.transferred.total,
            quantity,
        );
    }
    if (lost) {
        const quantity = submissionQuantity(values, lost);
        const reason = lossReason(values);
        target.lost[reason] = addQuantities(target.lost[reason], quantity);
        target.lost.total = addQuantities(target.lost.total, quantity);
    }
};

const itemOrder = Object.values(COMMODITY_TO_SKU);
const itemRank = (item: string) => {
    const rank = itemOrder.indexOf(item);
    return rank === -1 ? itemOrder.length : rank;
};

const processFoodStockData = (
    startDate: Date,
    endDate: Date,
): FoodStockItem[] => {
    const orgUnitId = currentOrgUnitId();
    if (orgUnitId == null) return [];

    // Balance of every item before the first day of the period, all its
    // batches combined.
    const openingStock: Record<string, number> =
        foodInitialStock(toLocalDateString(startDate), orgUnitId) ?? {};
    const items = new Map(
        Object.entries(openingStock).map(([item, opening]) => [
            item,
            emptyItem(item, Number(opening) || 0),
        ]),
    );

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Expiry date of each batch, only entered on its reception, which may
    // be before the period.
    const expiryDates = new Map<string, string>();

    loadFoodStockSubmissions(orgUnitId)
        .filter(submission => activityTime(submission) <= end.getTime())
        .forEach(submission => {
            const { values } = submission;
            const inPeriod = activityTime(submission) >= start.getTime();
            Object.entries(COMMODITY_TO_SKU).forEach(([commodity, sku]) => {
                const moved = quantities(values, commodity);
                if (!moved.received && !moved.transferred && !moved.lost) {
                    return;
                }

                const fields = batchFields(values);
                const expiry = Number(values?.expiry_date);
                if (expiry) {
                    expiryDates.set(
                        JSON.stringify([sku, fields.batch]),
                        toLocalDateString(new Date(expiry)),
                    );
                }
                if (!inPeriod) return;

                if (!items.has(sku)) items.set(sku, emptyItem(sku, 0));
                const item = items.get(sku)!;
                const key = batchKey(fields);
                if (!item.batches.has(key)) {
                    item.batches.set(key, {
                        ...fields,
                        expiryDate: '',
                        ...noMovements(),
                    });
                }
                addMovements(item.batches.get(key)!, values, moved);
                addMovements(item, values, moved);
            });
        });

    return Array.from(items.values())
        .sort((a, b) => itemRank(a.item) - itemRank(b.item))
        .map(item => ({
            ...item,
            // Stock at the end of the period, once every activity is
            // counted.
            end:
                item.opening +
                item.received.sachets -
                item.transferred.total.sachets -
                item.lost.total.sachets,
            batches: Array.from(item.batches.values())
                .map(batch => ({
                    ...batch,
                    expiryDate:
                        expiryDates.get(
                            JSON.stringify([item.item, batch.batch]),
                        ) ?? '',
                }))
                .sort(
                    (a, b) =>
                        a.batch.localeCompare(b.batch) ||
                        a.unit.localeCompare(b.unit) ||
                        a.packagingSize.localeCompare(
                            b.packagingSize,
                            undefined,
                            { numeric: true },
                        ) ||
                        a.boxSize.localeCompare(b.boxSize, undefined, {
                            numeric: true,
                        }),
                ),
        }));
};

export { processFoodStockData };
export type { FoodStockSubmission };
