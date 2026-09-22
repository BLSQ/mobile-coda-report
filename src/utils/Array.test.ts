import { beneficiaryFollowupCategories } from './Array';

describe('beneficiaryFollowupCategories', () => {
    it.each(['TSFP', 'OTP'])(
        'includes Transfer to PHC for %s',
        program => {
            const keys = beneficiaryFollowupCategories(program).map(
                row => row.key,
            );
            expect(keys).toEqual([
                '',
                'absentees',
                'defaulters',
                'non_respondent',
                'medical_investigation',
            ]);
        },
    );

    it.each(['BSFP', 'NSEP'])(
        'excludes Transfer to PHC for %s, keeping the other categories',
        program => {
            const keys = beneficiaryFollowupCategories(program).map(
                row => row.key,
            );
            expect(keys).toEqual([
                '',
                'absentees',
                'defaulters',
                'non_respondent',
            ]);
        },
    );

    it('defaults to including Transfer to PHC when no program is given', () => {
        const keys = beneficiaryFollowupCategories(null).map(row => row.key);
        expect(keys).toContain('medical_investigation');
    });
});
