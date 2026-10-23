import { BeneficiariesFollowup } from '../BeneficiariesFollowup';
import { agregatedBeneficiaryFolloWup } from '../../utils/DataFilter';
import { categoryDictionary } from '../../utils/Array';

const root = {
    width: '100%',
    height: '80%',
    textAlign: 'center',
    fontSize: '13.5px',
} as const;

const PBWGFollowUpCategories = (
    category: string,
    program: string,
    entities: Array<any>,
    startDate: Date,
    endDate: Date,
    entityType: string,
    physiologyStatus: string,
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    let beneficiariesFollowup = entities?.filter(
        entity =>
            entity?.profile?.values?.physiology_status === physiologyStatus,
    );
    let beneficiaries = agregatedBeneficiaryFolloWup(
        program,
        beneficiariesFollowup,
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
                <h3>{`${categoryDictionary(
                    physiologyStatus,
                )} admitted to ${program}`}</h3>
                <h3>{dateValue}</h3>
                {BeneficiariesFollowup(beneficiaries, category, undefined)}
            </div>
            <br />
        </div>
    );
};
export { PBWGFollowUpCategories };
