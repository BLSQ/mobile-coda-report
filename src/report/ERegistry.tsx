import { eRegister } from '../utils/DataByCategory';
import { EregistryBeneficiaries } from './EregistryBeneficiaries';
import { categoryDictionary } from '../utils/Array';

const root = {
    width: '100%',
    height: '80%',
    textAlign: 'center',
    fontSize: '12px',
} as const;

const ERegistry = (
    program: string,
    entities: Array<any>,
    startDate: Date,
    endDate: Date,
    entityType: string,
    physiology: string,
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    const rows = eRegister(entities, program, startDate, endDate, entityType);

    return (
        <div style={root}>
            <div>
                <h3>{`E-Register Report ${program}`} </h3>
                <h3>{categoryDictionary(physiology)} </h3>
                <h3> {dateValue} </h3>
                <div>
                    <div>{EregistryBeneficiaries(rows, '', program)}</div>
                </div>
            </div>
        </div>
    );
};
export { ERegistry };
