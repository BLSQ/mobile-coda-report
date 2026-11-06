import { processFoodStockData } from './FoodStock';

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
        total_wsbp: '30',
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

describe('processFoodStockData', () => {
    beforeEach(() => {
        (global as any).Android = {
            currentOrgUnit: () => '{"id":"5846","name":"Camp 1W_C2"}',
            loadForms: jest.fn(() => JSON.stringify(SUBMISSIONS)),
            getStockValueAt: jest.fn(() => OPENING_STOCK),
        };
    });

    afterEach(() => {
        delete (global as any).Android;
    });

    const process = () =>
        processFoodStockData(
            new Date('2026-09-01T00:00:00'),
            new Date('2026-09-30T00:00:00'),
        );

    it('loads the food_item_stock submissions of the current org unit', () => {
        process();
        expect((global as any).Android.loadForms).toHaveBeenLastCalledWith(
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
            // No activity in the period: its opening stock is kept.
            ['Super Cerial Plus/ WSB+', 319, 319],
            // 100 + 40 + 30 received - 5 - 3 transferred
            [WSBP, 100, 162],
            // 12 - 3 lost
            ['Oil', 12, 9],
        ]);
    });

    it('makes one row per batch and packing of the period, sorted', () => {
        const [wsb, wsbp, oil] = process();
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
        expect(process()[1].batches[0]).toEqual({
            batch: 'B1',
            expiryDate: '2027-01-31',
            unit: 'sachets/packets',
            packagingSize: '150',
            boxSize: '',
            received: 0,
            transferred: { loanAndBorrowing: 5, other: 0, total: 5 },
            lost: { infestation: 0, expired: 0, stolen: 0, other: 0, total: 0 },
        });
    });

    it('separates the quantities of a batch by box size', () => {
        const [, b2, b2Box15] = process()[1].batches;
        expect(b2).toMatchObject({
            expiryDate: '2027-06-30',
            received: 40,
            transferred: { other: 3, total: 3 },
        });
        expect(b2Box15).toMatchObject({
            expiryDate: '2027-06-30',
            received: 30,
        });
    });

    it('sums the batch rows into the item movements', () => {
        expect(process()[1]).toMatchObject({
            received: 70,
            transferred: { loanAndBorrowing: 5, other: 3, total: 8 },
        });
        expect(process()[2]).toMatchObject({
            lost: { infestation: 2, expired: 1, stolen: 0, other: 0, total: 3 },
        });
    });

    it('returns no rows without a native bridge', () => {
        delete (global as any).Android;
        expect(processFoodStockData(new Date(), new Date())).toEqual([]);
    });
});
