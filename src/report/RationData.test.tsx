import { render, screen, within } from '@testing-library/react';
import { RationData } from './RationData';

// The quantity shown on the row of the ration type labelled so.
const quantityOf = (label: string) => {
    const row = screen
        .getAllByRole('row')
        .find(candidate => within(candidate).queryByText(label));
    return row && within(row).getAllByRole('cell')[1].textContent;
};

describe('RationData', () => {
    it('counts each visit under its own ration type', () => {
        // The medical form gave wsb and the assistance form lns_mq, on the
        // same day: the beneficiary's first ration type (wsb) must not take
        // both.
        const beneficiary = {
            ration: 'wsb',
            visits: [
                { values: { ration_type_tsfp: 'wsb', quantity: 123 } },
                {
                    values: {
                        ration: 'lns_mq',
                        _total_number_of_sachets: '30',
                    },
                },
            ],
        };

        render(<RationData {...[beneficiary]} />);

        expect(quantityOf('Super Cerial Plus/ WSB+')).toBe('123');
        expect(quantityOf('LNS-MQ')).toBe('30');
    });

    it('reads the quantity field given for every ration type', () => {
        const beneficiary = {
            ration: 'rusf',
            visits: [
                {
                    values: {
                        assistance_given: 'rusf',
                        ration: 'rusf',
                        ration_quantity: '4',
                        _total_number_of_sachets: '30',
                    },
                },
            ],
        };

        render(
            <RationData
                {...[beneficiary]}
                rationTypes={['rusf']}
                quantityField="ration_quantity"
            />,
        );

        expect(quantityOf('RUSF')).toBe('4');
    });

    it('adds the other rations given, by name and unit', () => {
        const nsepVisit = (other: string, quantity: number, unit: string) => ({
            values: {
                ration_given: 'lns_mq',
                ration_quantity: '28',
                another_ration_provided: '1',
                other_ration_specify: other,
                other_ration_quantity: quantity,
                _other_ration_unit_label: unit,
            },
        });
        const beneficiary = {
            visits: [
                nsepVisit('Tuur', 14, 'Packets'),
                nsepVisit('Tuur', 6, 'Packets'),
                nsepVisit('Tuur', 2, 'Kg'),
            ],
        };

        render(
            <RationData
                {...[beneficiary]}
                rationTypes={['lns_mq']}
                quantityField="ration_quantity"
            />,
        );

        expect(quantityOf('LNS-MQ')).toBe('84');
        expect(quantityOf('Tuur (Packets)')).toBe('20');
        expect(quantityOf('Tuur (Kg)')).toBe('2');
    });

    it('ignores the other ration once not provided any more', () => {
        const beneficiary = {
            visits: [
                {
                    values: {
                        ration_given: 'lns_mq',
                        ration_quantity: '28',
                        another_ration_provided: '0',
                        other_ration_specify: 'Tuur',
                        other_ration_quantity: 14,
                    },
                },
            ],
        };

        render(<RationData {...[beneficiary]} rationTypes={['lns_mq']} />);

        expect(screen.queryByText(/Tuur/)).toBeNull();
    });

    it('adds the ration types given outside the program list, with their own quantity field', () => {
        const beneficiary = {
            visits: [
                { values: { ration_given: 'lns_mq', ration_quantity: '28' } },
                { values: { ration_given: 'cash_voucher', _cash_total: '3' } },
            ],
        };

        render(
            <RationData
                {...[beneficiary]}
                rationTypes={['lns_mq']}
                quantityField="ration_quantity"
            />,
        );

        expect(quantityOf('Cash Voucher')).toBe('3');
    });
});
