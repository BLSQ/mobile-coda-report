import { processFoodStockData } from './FoodStock';
import { noQuantity } from './FoodQuantity';

const day = (date: string) => new Date(`${date}T00:00:00`).getTime();

// A food_item_stock submission as returned by Android.loadForms().
const submission = (id: string, date: string, values: any) => ({
    id,
    formId: '102',
    formName: 'Food Items Stock Report',
    formFormId: 'food_item_stock',
    createdAt: `${date}T10:00:00`,
    orgUnitId: '5846',
    values: {
        stock_management_date: day(date),
        unit: 'sachet_packet',
        quantity_unit_label: 'sachets/packets',
        packaging_size: '150',
        ...values,
    },
});

const WSBP = 'Super Cerial Plus Plus/ WSB++';

// Android.getStockValueAt() balances at the start of the period, all the
// batches of an item combined.
const OPENING_STOCK = JSON.stringify({
    'Super Cerial Plus/ WSB+': 319,
    [WSBP]: 100,
    Oil: 12,
});

const SUBMISSIONS = [
    // Before the period: already in the opening stock, only its expiry date
    // is used.
    submission('r0', '2026-08-01', {
        activity: 'receive',
        commodity: 'wsbp',
        batch_number: 'B1',
        expiry_date: day('2027-01-31'),
        total_wsbp: '99',
    }),
    submission('l0', '2026-08-15', {
        activity: 'losses',
        commodity: 'wsbp',
        batch_number: 'B1',
        reason_loss: 'stolen',
        total_wsbp_losses: '9',
    }),
    submission('r1', '2026-09-10', {
        activity: 'receive',
        commodity: 'wsbp',
        batch_number_entry: 'B2',
        batch_number: 'B2',
        expiry_date: day('2027-06-30'),
        total_wsbp: '40',
        total_oil: '0',
    }),
    // Same batch, packed in another box size: a row of its own.
    submission('r2', '2026-09-10', {
        activity: 'receive',
        commodity: 'wsbp',
        batch_number: 'B2',
        box_size: '15',
        quantity: 30,
        total_packets: '30',
        total_wsbp: '30',
        total_weight: '45',
        tonnage: '0.045',
    }),
    submission('t1', '2026-09-11', {
        activity: 'transfer',
        commodity: 'wsbp',
        batch_number: 'B1',
        reason_transfer: 'loan_borrowing',
        total_wsbp_transfered: '5',
    }),
    submission('t2', '2026-09-12', {
        activity: 'transfer',
        commodity: 'wsbp',
        batch_number: 'B2',
        total_wsbp_transfered: '3',
    }),
    submission('l1', '2026-09-13', {
        activity: 'losses',
        commodity: 'oil',
        batch_number: 'O1',
        reason_loss: 'infestation',
        total_oil_losses: '2',
    }),
    submission('l2', '2026-09-30', {
        activity: 'losses',
        commodity: 'oil',
        batch_number: 'O1',
        reason_loss: 'expired_stock',
        total_oil_losses: '1',
    }),
    // After the period.
    submission('l3', '2026-10-01', {
        activity: 'losses',
        commodity: 'oil',
        batch_number: 'O1',
        reason_loss: 'stolen',
        total_oil_losses: '4',
    }),
    {
        ...submission('n1', '2026-09-15', { total_oil_losses: '7' }),
        formFormId: 'nfi_stocks',
    },
];

// A row of Android.loadStockLedgerItems().
const ledger = (
    questionName: string,
    formName: string,
    value: number,
    impact: string,
    date: string,
) => ({
    id: `${questionName}-${date}`,
    questionName,
    submissionId: '1',
    orgUnitId: '5846',
    formName,
    value,
    impact,
    synced: true,
    createdAt: new Date(`${date}T10:00:00`).getTime(),
});

const LEDGER = [
    ledger('_wsb_packets', 'PBWG TSFP Assistance', 4, 'SUBTRACT', '2026-09-05'),
    ledger(
        '_wsb_packets',
        'PBWG TSFP Assistance Follow Up',
        4,
        'SUBTRACT',
        '2026-09-20',
    ),
    ledger('oil_ration', 'PBWG TSFP Assistance', 1, 'SUBTRACT', '2026-09-20'),
    // Before and after the period.
    ledger('_wsb_packets', 'PBWG TSFP Assistance', 4, 'SUBTRACT', '2026-08-31'),
    ledger('oil_ration', 'PBWG TSFP Assistance', 1, 'SUBTRACT', '2026-10-01'),
    // Stock report rows: already counted as received, transferred or lost.
    ledger(
        'total_wsbp_transfered',
        'Food Items Stock Report',
        3,
        'SUBTRACT',
        '2026-09-12',
    ),
    ledger('total_wsbp', 'Food Items Stock Report', 40, 'ADD', '2026-09-10'),
];

describe('processFoodStockData', () => {
    beforeEach(() => {
        (global as any).Android = {
            currentOrgUnit: () => '{"id":"5846","name":"Camp 1W_C2"}',
            loadForms: jest.fn(() => JSON.stringify(SUBMISSIONS)),
            getStockValueAt: jest.fn(() => OPENING_STOCK),
            loadStockLedgerItems: jest.fn(() => JSON.stringify(LEDGER)),
        };
    });

    afterEach(() => {
        delete (global as any).Android;
    });

    const LNS_MQ = 'LNS - Medium Quantity (LNS- MQ)';
    const LNS_SQ = 'LNS - Small Quantity (LNS- SQ)';
    const RUSF = 'Ready-to-Use Supplementary Food (RUSF) Large Quantity';
    const RUTF = 'Ready to use Therapeutic Food (RUTF)';

    // The item of the report named `name`.
    const itemNamed = (name: string) =>
        process().find(item => item.item === name)!;

    const process = () =>
        processFoodStockData(
            new Date('2026-09-01T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );

    it('loads the food_item_stock submissions of the current org unit', () => {
        process();
        expect((global as any).Android.loadForms).toHaveBeenCalledWith(
            '5846',
            null,
            null,
            null,
            'food_item_stock',
            null,
            null,
        );
    });

    it('takes the opening stock of each item, all batches combined', () => {
        const items = process();
        expect((global as any).Android.getStockValueAt).toHaveBeenCalledWith(
            '2026-09-01',
            '5846',
        );
        expect(items.map(item => [item.item, item.opening, item.end])).toEqual([
            // 319 - 8 distributed
            ['Super Cerial Plus/ WSB+', 319, 311],
            // 100 + 40 + 30 received - 5 - 3 transferred
            [WSBP, 100, 162],
            // No stock nor activity: shown with 0.
            [LNS_MQ, 0, 0],
            [LNS_SQ, 0, 0],
            [RUSF, 0, 0],
            [RUTF, 0, 0],
            // 12 - 3 lost - 1 distributed
            ['Oil', 12, 8],
        ]);
    });

    it('counts the assistance visits distributions of the period', () => {
        expect(
            (global as any).Android.loadStockLedgerItems,
        ).not.toHaveBeenCalled();
        const items = process();
        expect(
            (global as any).Android.loadStockLedgerItems,
        ).toHaveBeenCalledWith('5846');
        expect(items.map(item => [item.item, item.distributed])).toEqual([
            ['Super Cerial Plus/ WSB+', 8],
            [WSBP, 0],
            [LNS_MQ, 0],
            [LNS_SQ, 0],
            [RUSF, 0],
            [RUTF, 0],
            ['Oil', 1],
        ]);
    });

    it('makes one row per batch and packing of the period, sorted', () => {
        const [wsb, wsbp, , , , , oil] = process();
        expect(wsbp.batches.map(batch => [batch.batch, batch.boxSize])).toEqual(
            [
                ['B1', ''],
                ['B2', ''],
                ['B2', '15'],
            ],
        );
        expect(oil.batches.map(batch => batch.batch)).toEqual(['O1']);
        expect(wsb.batches).toEqual([]);
    });

    it('shows the expiry date of the batch, even received before the period', () => {
        const none = noQuantity();
        // Without total_packets, the commodity quantity is used.
        const five = {
            sachets: 5,
            boxes: { full: 0, looseSachets: 5, sachetsPerBox: 150 },
            kg: 0,
            mt: 0,
        };
        expect(itemNamed(WSBP).batches[0]).toEqual({
            batch: 'B1',
            expiryDate: '2027-01-31',
            unit: 'sachets/packets',
            packagingSize: '150',
            boxSize: '',
            received: none,
            transferred: { loanAndBorrowing: five, other: none, total: five },
            lost: {
                infestation: none,
                expired: none,
                stolen: none,
                other: none,
                total: none,
            },
        });
    });

    it('separates the quantities of a batch by box size', () => {
        const [, b2, b2Box15] = itemNamed(WSBP).batches;
        expect(b2).toMatchObject({
            expiryDate: '2027-06-30',
            received: { sachets: 40 },
            transferred: { other: { sachets: 3 }, total: { sachets: 3 } },
        });
        expect(b2Box15).toMatchObject({
            expiryDate: '2027-06-30',
            received: { sachets: 30 },
        });
    });

    it('sums the batch rows into the item movements', () => {
        expect(itemNamed(WSBP)).toMatchObject({
            received: { sachets: 70 },
            transferred: {
                loanAndBorrowing: { sachets: 5 },
                other: { sachets: 3 },
                total: { sachets: 8 },
            },
        });
        expect(itemNamed('Oil')).toMatchObject({
            lost: {
                infestation: { sachets: 2 },
                expired: { sachets: 1 },
                stolen: { sachets: 0 },
                other: { sachets: 0 },
                total: { sachets: 3 },
            },
        });
    });

    it('takes the sachets, weight and tonnage recorded on the submissions', () => {
        // r1: 40 sachets without weight; r2: 30 packets weighing 45 kg.
        const [, , b2Box15] = itemNamed(WSBP).batches;
        expect(b2Box15.received).toEqual({
            sachets: 30,
            boxes: { full: 0, looseSachets: 30, sachetsPerBox: 150 },
            kg: 45,
            mt: 0.045,
        });
        expect(itemNamed(WSBP).received).toEqual({
            sachets: 70,
            boxes: { full: 0, looseSachets: 70, sachetsPerBox: 150 },
            kg: 45,
            mt: 0.045,
        });
    });

    it('counts the distributions of an item without opening stock', () => {
        (global as any).Android.loadStockLedgerItems = () =>
            JSON.stringify([
                ledger(
                    '_total_number_of_sachets_rusf',
                    'Child TSFP Assistance',
                    14,
                    'SUBTRACT',
                    '2026-09-21',
                ),
            ]);
        expect(itemNamed(RUSF)).toMatchObject({
            item: RUSF,
            opening: 0,
            distributed: 14,
            end: -14,
            batches: [],
        });
    });

    it('shows every food item, with 0 when it has no stock nor activity', () => {
        (global as any).Android.getStockValueAt = () => '{}';
        (global as any).Android.loadForms = () => '[]';
        (global as any).Android.loadStockLedgerItems = () => '[]';
        const items = process();
        expect(items.map(item => item.item)).toEqual([
            'Super Cerial Plus/ WSB+',
            WSBP,
            LNS_MQ,
            LNS_SQ,
            RUSF,
            RUTF,
            'Oil',
        ]);
        items.forEach(item =>
            expect(item).toMatchObject({
                opening: 0,
                distributed: 0,
                end: 0,
                received: noQuantity(),
                lost: { total: noQuantity() },
                transferred: { total: noQuantity() },
                batches: [],
            }),
        );
    });

    it('returns no rows without a native bridge', () => {
        delete (global as any).Android;
        expect(processFoodStockData(new Date(), new Date())).toEqual([]);
    });
});
