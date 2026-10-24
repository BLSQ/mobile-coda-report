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
});
