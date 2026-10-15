// Scenario tests: beneficiaries filled in the real CODA forms of the server (see
// tools/generate_fixtures.py) are sent through the native bridge and the report is rendered, so a
// test fails when the configuration of the forms and the expectations of the report drift apart.
import './bridge';
import { useSubmissions } from './bridge';
import { render, screen, within } from '@testing-library/react';
import LoadFormsForEntityType from '../Android';
import { ChildrenUnder5 } from '../report/ChildrenUnder5';
import Entity from '../entity/Entity';
import submissions from './fixtures/child_under5.json';

const CHILD_UNDER_5 = 'Child Under 5';

// The fixtures are filled on the day they are generated (the form engine reads the system clock
// for today()), so the period of the report is read from the submissions themselves.
const days = submissions.map(row => row.createdAt);
const START = new Date(Math.min(...days) - 24 * 3600 * 1000);
const END = new Date(Math.max(...days) + 24 * 3600 * 1000);

function loadEntities(entityTypeName: string): Promise<Array<Entity>> {
    return new Promise(resolve =>
        LoadFormsForEntityType(entityTypeName, ({ entities }) =>
            resolve(entities),
        ),
    );
}

// The cells of the row of a report table, starting with its label.
function rowOf(label: string): string[] {
    const row = screen.getAllByRole('row').find(candidate =>
        within(candidate)
            .queryAllByRole('cell')
            .some(cell => cell.textContent?.trim() === label),
    );
    if (row == null) {
        throw new Error(`no row labelled "${label}" in the report`);
    }
    return within(row)
        .getAllByRole('cell')
        .map(cell => cell.textContent?.trim() ?? '');
}

describe('Child Under 5 report, with the forms of the server', () => {
    beforeEach(() => {
        useSubmissions(submissions);
    });

    it('groups the submissions of every beneficiary into a profile and its visits', async () => {
        const entities = await loadEntities(CHILD_UNDER_5);

        expect(entities.map(entity => entity.id).sort()).toEqual([
            'child-bsfp-green',
            'child-otp-red',
            'child-tsfp-muac',
        ]);
        const tsfp = entities.find(entity => entity.id === 'child-tsfp-muac');
        expect(tsfp?.profile?.formFormId).toBe('wfp_coda_child_registration');
        expect(tsfp?.profile?.values?.first_name).toBe('Rahim');
        // Registration is the profile, the 8 forms of the two visits are the visits.
        expect(tsfp?.visits).toHaveLength(8);
    });

    it('counts the TSFP child under the admission type and criteria its form saved', async () => {
        const entities = await loadEntities(CHILD_UNDER_5);

        render(
            <div>
                {ChildrenUnder5(entities, START, END, 'TSFP', CHILD_UNDER_5)}
            </div>,
        );

        // The child is 11 months old and a boy: first column of "6 - 23", and the admission form
        // recorded admission_type = new_case_MUAC, which the report shows as its own line.
        expect(rowOf('New admission (MUAC <11.5 cm) MUAC')).toEqual([
            'New admission (MUAC <11.5 cm) MUAC',
            '1',
            '0',
            '0',
            '0',
            '1',
            '0',
        ]);
        // The other criteria of the same admission type stay empty.
        expect(rowOf('New admission (MUAC <11.5 cm) Z-Score')).toEqual([
            'New admission (MUAC <11.5 cm) Z-Score',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
        ]);
    });

    it('counts the follow-up visit of the TSFP child', async () => {
        const entities = await loadEntities(CHILD_UNDER_5);

        render(
            <div>
                {ChildrenUnder5(entities, START, END, 'TSFP', CHILD_UNDER_5)}
            </div>,
        );

        // One anthropometric follow-up visit was filled after the enrollment.
        expect(rowOf('Total Follow up')).toEqual([
            'Total Follow up',
            '1',
            '0',
            '0',
            '0',
            '1',
            '0',
        ]);
    });

    it('does not count the OTP child in the TSFP report', async () => {
        const entities = await loadEntities(CHILD_UNDER_5);

        render(
            <div>
                {ChildrenUnder5(entities, START, END, 'TSFP', CHILD_UNDER_5)}
            </div>,
        );

        // Only the TSFP child is counted: its admission form saved programme TSFP, the other two
        // saved OTP and BSFP.
        const admissions = rowOf('New admission (MUAC <11.5 cm) MUAC');
        expect(admissions[5]).toBe('1');
    });

    it('counts the OTP child in the OTP report', async () => {
        const entities = await loadEntities(CHILD_UNDER_5);

        render(
            <div>
                {ChildrenUnder5(entities, START, END, 'OTP', CHILD_UNDER_5)}
            </div>,
        );

        expect(rowOf('New admission (MUAC <11.5 cm) MUAC')).toEqual([
            'New admission (MUAC <11.5 cm) MUAC',
            '1',
            '0',
            '0',
            '0',
            '1',
            '0',
        ]);
    });
});
