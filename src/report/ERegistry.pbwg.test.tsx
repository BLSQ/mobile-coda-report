import { render, screen, within } from '@testing-library/react';
import { ERegistry } from './ERegistry';
import { muacOf } from '../utils/DataByCategory';

const day = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString();
};

const visit = (formFormId: string, createdOn: number, values: any) => ({
    formFormId,
    createdAt: day(createdOn),
    values: { program: 'TSFP', visit_date: day(createdOn), ...values },
});

// A breastfeeding woman: her MUAC is mother_muac on the admission form and
// mothers_muac on the follow-ups.
const woman = {
    id: 'woman',
    entityTypeName: 'PBWG',
    profile: {
        createdAt: day(-20),
        values: {
            physiology_status: 'breastfeeding',
            program: 'TSFP',
            previous_muac: '20.5',
        },
    },
    visits: [
        visit('wfp_coda_pbwg_anthropometric', -20, {
            mother_muac: '20.5',
            weight_kgs: 47,
        }),
        visit('wfp_coda_pbwg_luctating_followup_anthro', -6, {
            previous_muac: '20.5',
            mothers_muac: '19.8',
            weight_kgs: 49,
            // Her baby's weight, not hers.
            child_weight_kgs: 10,
        }),
    ],
};

const renderRegister = (beneficiary: any = woman) =>
    render(
        <div>
            {ERegistry(
                'TSFP',
                [beneficiary],
                new Date(day(-30)),
                new Date(day(1)),
                'PBWG',
                'breastfeeding',
            )}
        </div>,
    );

const column = (label: string) =>
    screen
        .getAllByRole('columnheader')
        .findIndex(header => header.textContent === label);

describe('PBWG eRegister', () => {
    it('reads the MUAC of the PBWG forms', () => {
        expect(muacOf(woman.visits[0])).toBe('20.5');
        expect(muacOf(woman.visits[1])).toBe('19.8');
        expect(muacOf({ values: { muac: '12.9' } })).toBe('12.9');
    });

    it('shows the MUAC of every visit of the woman', () => {
        renderRegister();
        const muac = column('MUAC');
        const [, ...visitRows] = within(
            screen.getAllByRole('rowgroup')[1],
        ).getAllByRole('row');
        // Visit rows start after the 8 merged beneficiary columns.
        const visitMuac = visitRows.map(
            row => within(row).getAllByRole('cell')[muac - 8 + 1]?.textContent,
        );
        expect(visitMuac).toEqual(['20.5', '19.8']);
    });

    it('labels the exit column Exit/Action Date', () => {
        renderRegister();
        expect(column('Exit/Action Date')).toBeGreaterThan(-1);
        expect(column('Exit Date')).toBe(-1);
    });

    it('exits the absent woman with the weight last measured', () => {
        // Her assistance follow-up, which carries no weight, planned her
        // next visit on day -3: she missed it.
        renderRegister({
            ...woman,
            visits: [
                ...woman.visits,
                visit('wfp_coda_pbwg_assistance_followup', -6, {
                    new_next_visit__date__: day(-3),
                }),
            ],
        });
        const beneficiaryRow = within(
            screen.getAllByRole('rowgroup')[1],
        ).getAllByRole('row')[0];
        const cells = within(beneficiaryRow).getAllByRole('cell');
        expect(cells[column('Status')].textContent).toBe('Absentees');
        expect(cells[column('Exit Weight')].textContent).toBe('49');
        expect(cells[column('Exit MUAC')].textContent).toBe('19.8');
    });
});
