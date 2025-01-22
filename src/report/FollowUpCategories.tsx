import { agregatedBeneficiaryFolloWup } from '../utils/DataFilter';
import { BeneficiariesFollowup } from './BeneficiariesFollowup';

const root = {
    width: '100%',
    height: '80%',
    textAlign: 'center',
    fontSize: '13.5px',
} as const;

const FolloWupCategories = (
    category: string,
    program: string,
    entities: Array<any>,
    startDate: Date,
    endDate: Date,
    entityType: string,
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    let beneficiaries = agregatedBeneficiaryFolloWup(
        program,
        entities,
        startDate,
        endDate,
        entityType,
    );

    if (category !== '') {
        beneficiaries = beneficiaries.filter(
            (entity: any) => entity?.status === category,
        );
    }

    return (
        <div style={root}>
            <div>
                <h3>{`${program} beneficiary followup`}</h3>
                <h3>{dateValue}</h3>
                {BeneficiariesFollowup(beneficiaries, category)}
            </div>
            <br />
        </div>
    );
};
export { FolloWupCategories };
