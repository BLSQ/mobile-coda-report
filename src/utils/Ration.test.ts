import {
    quantityOf,
    suppliesGiven,
    suppliesByVisit,
    rationsOf,
} from './Ration';

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

describe('several rations given at one visit', () => {
    const form = (formFormId: string, values: Record<string, any>) => ({
        formFormId,
        values,
    });

    // A ration of the ration_repeat group, as the PBWG forms save it.
    const repeated = (ration: string, packets: string) => ({
        ration,
        _sachets_rep: packets,
        _wsb_packets_rep: ration === 'wsb' ? packets : '0',
        _wsbp_packets_rep: ration === 'wsbp' ? packets : '0',
        _rusf_packets_rep: ration === 'rusf' ? packets : '0',
    });

    it('reads the ration_repeat group of the medical forms', () => {
        expect(
            rationsOf(
                form('wfp_coda_medical_follow_up_visit_PBWG', {
                    ration_type: 'RUSF, WSB+, WSB++',
                    ration_repeat: JSON.stringify([
                        repeated('wsb', '2'),
                        repeated('wsbp', '3'),
                        repeated('rusf', '28'),
                    ]),
                    // What the assistance forms read, not the medical ones.
                    _selected_rusf: 'rusf',
                    _rusf_packets: '99',
                }),
            ),
        ).toEqual([
            { type: 'wsb', quantity: 2 },
            { type: 'wsbp', quantity: 3 },
            { type: 'rusf', quantity: 28 },
        ]);
    });

    it('reads the _selected_ fields of the assistance forms', () => {
        expect(
            rationsOf(
                form('wfp_coda_pbwg_assistance_followup', {
                    ration_type: 'RUSF, WSB+, WSB++',
                    _selected_rusf: 'rusf',
                    _selected_wsb: 'wsb',
                    _selected_wsbp: 'wsbp',
                    _rusf_packets: '28',
                    _wsb_packets: '2',
                    _wsbp_packets: '2',
                    // Not selected: not given.
                    _rutf_packets: '5',
                }),
            ),
        ).toEqual([
            { type: 'rusf', quantity: 28 },
            { type: 'wsb', quantity: 2 },
            { type: 'wsbp', quantity: 2 },
        ]);
    });

    it('reads RUTF the same way', () => {
        expect(
            rationsOf(
                form('wfp_coda_pbwg_assistance', {
                    _selected_rutf: 'rutf',
                    _rutf_packets: '35',
                }),
            ),
        ).toEqual([{ type: 'rutf', quantity: 35 }]);
        expect(
            rationsOf(
                form('wfp_coda_medical_visit_PBWG', {
                    ration_repeat: [
                        { ration: 'rutf', _rutf_packets_rep: '35' },
                    ],
                }),
            ),
        ).toEqual([{ type: 'rutf', quantity: 35 }]);
    });

    it('falls back on the other way of recording several rations', () => {
        expect(
            rationsOf(
                form('wfp_coda_pbwg_assistance', {
                    ration_repeat: JSON.stringify([repeated('wsb', '3')]),
                }),
            ),
        ).toEqual([{ type: 'wsb', quantity: 3 }]);
        expect(
            rationsOf(
                form('wfp_coda_medical_visit_PBWG', {
                    _selected_wsb: 'wsb',
                    _wsb_packets: '20',
                }),
            ),
        ).toEqual([{ type: 'wsb', quantity: 20 }]);
    });

    it('reads the totals of the rations selected on the child assistance forms', () => {
        expect(
            rationsOf(
                form('child_assistance_admission_2_u6', {
                    _selected_rutf: 'rutf',
                    _selected_wsb: 'wsb',
                    _selected_wsbp: 'wsbp',
                    _selected_lns_mq: 'lns_mq',
                    _total_number_of_sachets_rusf: '0',
                    _total_number_of_sachets_rutf: '35',
                    _total_wsb_packets: '1',
                    _total_wsbp_packets: '1',
                    _total_lns_packets: '7',
                    _total_number_of_sachets: '35',
                }),
            ),
        ).toEqual([
            { type: 'rutf', quantity: 35 },
            { type: 'wsb', quantity: 1 },
            { type: 'wsbp', quantity: 1 },
            { type: 'lns_mq', quantity: 7 },
        ]);
    });

    it('leaves out a selected type its form gives no quantity for', () => {
        expect(
            rationsOf(
                form('child_assistance_admission_2_u6', {
                    _selected_wsb: 'wsb',
                    _selected_csb: 'csb',
                    _total_wsb_packets: '1',
                }),
            ),
        ).toEqual([{ type: 'wsb', quantity: 1 }]);
    });

    it('sums each ration type over the visits', () => {
        expect(
            suppliesGiven([
                form('wfp_coda_medical_visit_PBWG', {
                    ration_repeat: JSON.stringify([
                        repeated('wsb', '20'),
                        repeated('wsbp', '14'),
                    ]),
                }),
                form('wfp_coda_pbwg_assistance', {
                    _selected_wsb: 'wsb',
                    _selected_rusf: 'rusf',
                    _wsb_packets: '3',
                    _rusf_packets: '14',
                }),
            ]),
        ).toEqual([
            { type: 'wsb', quantity: 23 },
            { type: 'wsbp', quantity: 14 },
            { type: 'rusf', quantity: 14 },
        ]);
    });

    it('ignores a ration_repeat it cannot read', () => {
        expect(
            rationsOf(
                form('wfp_coda_medical_visit_PBWG', {
                    ration_repeat: 'not json',
                    ration: 'rusf',
                    _total_number_of_sachets: '14',
                }),
            ),
        ).toEqual([{ type: 'rusf', quantity: 14 }]);
    });
});
