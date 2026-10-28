import { beneficiaryFollowupCategories } from './Array';

const keysOf = (program: string | null) =>
    beneficiaryFollowupCategories(program).map(row => row.key);

describe('beneficiaryFollowupCategories', () => {
    it('offers the SC referral and the transfer to OTP for TSFP', () => {
        expect(keysOf('TSFP')).toEqual([
            '',
            'absentees',
            'defaulters',
            'non_respondent',
            'medical_investigation',
            'weight_loss_2_visits_or_no_weight_gain_in_3_visits__int__',
            'referral_to_sc_itp',
            'transfer_to_otp',
        ]);
    });

    it('offers the SC referral and the transfer to TSFP for OTP', () => {
        expect(keysOf('OTP')).toEqual([
            '',
            'absentees',
            'defaulters',
            'non_respondent',
            'medical_investigation',
            'weight_loss_2_visits_or_no_weight_gain_in_3_visits__int__',
            'referral_to_sc_itp',
            'transfer_to_tsfp',
        ]);
    });

    it('offers the transfers to TSFP and OTP but not Transfer to PHC for BSFP', () => {
        expect(keysOf('BSFP')).toEqual([
            '',
            'absentees',
            'defaulters',
            'non_respondent',
            'weight_loss_2_visits_or_no_weight_gain_in_3_visits__int__',
            'transfer_to_tsfp',
            'transfer_to_otp',
        ]);
    });

    it('excludes Transfer to PHC and the referrals for NSEP, keeping the other categories', () => {
        expect(keysOf('NSEP')).toEqual([
            '',
            'absentees',
            'defaulters',
            'non_respondent',
            'weight_loss_2_visits_or_no_weight_gain_in_3_visits__int__',
        ]);
    });

    it('defaults to including Transfer to PHC when no program is given', () => {
        expect(keysOf(null)).toContain('medical_investigation');
    });

    it('offers no referral when no program is given (PBWG)', () => {
        const keys = keysOf(null);
        expect(keys).not.toContain('referral_to_sc_itp');
        expect(keys).not.toContain('transfer_to_otp');
        expect(keys).not.toContain('transfer_to_tsfp');
    });
});
