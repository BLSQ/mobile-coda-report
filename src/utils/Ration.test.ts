import { quantityOf, suppliesGiven, suppliesByVisit } from './Ration';

const visit = (values: Record<string, any>) => ({ values });

describe('suppliesGiven', () => {
    it('sums the quantity of each ration type over the visits', () => {
        expect(
            suppliesGiven([
                visit({
                    ration_type_tsfp: 'rusf',
                    _total_number_of_sachets: '14',
                }),
                visit({ ration_type: 'wsbp', _wsbp_packets: '3' }),
                visit({
                    ration_type_tsfp: 'rusf',
                    _total_number_of_sachets: '14',
                }),
            ]),
        ).toEqual([
            { type: 'rusf', quantity: 28 },
            { type: 'wsbp', quantity: 3 },
        ]);
    });

    it('reads the cash total of a cash voucher', () => {
        expect(
            suppliesGiven([
                visit({ ration: 'cash_voucher', _cash_total: '3' }),
            ]),
        ).toEqual([{ type: 'cash_voucher', quantity: 3 }]);
    });

    it('reads ration_quantity when the form records it', () => {
        expect(
            suppliesGiven([
                visit({
                    ration: 'lns_mq',
                    ration_quantity: '2',
                    _total_number_of_sachets: '30',
                }),
            ]),
        ).toEqual([{ type: 'lns_mq', quantity: 2 }]);
    });

    it('ignores the visits recording no ration type', () => {
        expect(
            suppliesGiven([visit({ _total_number_of_sachets: '14' })]),
        ).toEqual([]);
    });

    it('counts a missing or empty quantity as 0', () => {
        expect(
            suppliesGiven([
                visit({ ration: 'rusf' }),
                visit({ ration: 'rusf', _total_number_of_sachets: '' }),
            ]),
        ).toEqual([{ type: 'rusf', quantity: 0 }]);
    });
});

describe('the rations of the medical forms', () => {
    // The medical forms record the ration type as the assistance forms do,
    // but its quantity in `quantity`.
    const medical = (ration: string, quantity: number) =>
        visit({ ration_type_tsfp: ration, quantity });

    it('reads their quantity', () => {
        expect(quantityOf(medical('wsb', 123), '_wsb_packets')).toBe(123);
    });

    it('still reads the field of the ration type first', () => {
        expect(
            quantityOf(
                visit({ ration: 'wsb', _wsb_packets: '3', quantity: 9 }),
                '_wsb_packets',
            ),
        ).toBe(3);
    });

    it('adds them to the rations of the assistance forms', () => {
        expect(
            suppliesGiven([
                medical('wsb', 123),
                visit({ ration: 'lns_mq', _total_number_of_sachets: '30' }),
                medical('rusf', 1),
                visit({
                    ration_type_tsfp: 'rusf',
                    _total_number_of_sachets: '14',
                }),
            ]),
        ).toEqual([
            { type: 'wsb', quantity: 123 },
            { type: 'lns_mq', quantity: 30 },
            { type: 'rusf', quantity: 15 },
        ]);
    });
});

describe('suppliesByVisit', () => {
    const at = (createdAt: string, values: Record<string, any> = {}) => ({
        createdAt: new Date(createdAt),
        values,
    });
    const rusf = (createdAt: string, sachets: string) =>
        at(createdAt, { ration: 'rusf', _total_number_of_sachets: sachets });

    it('gives each assistance visit to the last visit created before it', () => {
        expect(
            suppliesByVisit(
                [at('2026-09-01T09:00'), at('2026-09-15T09:00')],
                [rusf('2026-09-01T11:00', '14'), rusf('2026-09-15T11:00', '7')],
            ),
        ).toEqual([
            [{ type: 'rusf', quantity: 14 }],
            [{ type: 'rusf', quantity: 7 }],
        ]);
    });

    it('gives the assistance visits of the same day to the visit they follow', () => {
        expect(
            suppliesByVisit(
                [at('2026-09-16T09:30'), at('2026-09-16T11:30')],
                [
                    rusf('2026-09-16T11:00', '14'),
                    rusf('2026-09-16T13:00', '14'),
                ],
            ),
        ).toEqual([
            [{ type: 'rusf', quantity: 14 }],
            [{ type: 'rusf', quantity: 14 }],
        ]);
    });

    it('gives an assistance visit created before every visit to the first one', () => {
        expect(
            suppliesByVisit(
                [at('2026-09-15T09:00'), at('2026-09-01T09:00')],
                [rusf('2026-08-30T11:00', '5')],
            ),
        ).toEqual([[{ type: 'rusf', quantity: 5 }], []]);
    });

    it('shows nothing on the visits no assistance visit follows', () => {
        expect(suppliesByVisit([at('2026-09-01T09:00')], [])).toEqual([[]]);
        expect(suppliesByVisit([], [rusf('2026-09-01T11:00', '14')])).toEqual(
            [],
        );
    });
});

describe('suppliesGiven with another ration', () => {
    it('lists the other ration after the main one', () => {
        expect(
            suppliesGiven([
                visit({
                    ration_given: 'rusf',
                    ration_quantity: '14',
                    another_ration_provided: '1',
                    other_ration_specify: 'Oil',
                    other_ration_quantity: 2,
                    other_ration_unit: 'kg',
                }),
            ]),
        ).toEqual([
            { type: 'rusf', quantity: 14 },
            { type: 'Oil (kg)', quantity: 2 },
        ]);
    });
});
