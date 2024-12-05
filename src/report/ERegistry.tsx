import { eRegister } from '../utils/DataByCategory';
import { EregistryBeneficiaries } from './EregistryBeneficiaries';

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
    endDate: Date
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    console.info("PROGRAM ...:", program, entities)
    const rows = eRegister(entities, program, startDate, endDate);
    console.info('GOT ALL ROWS ...:', rows)

    return (
        <div style={root}>
            <div>
                <h3>{`E-Register Report ${program}`} </h3>
                <h3> {dateValue} </h3>
                <div>
                    <div>
                        {EregistryBeneficiaries(rows, "", program)}
                    </div>
                </div>
            </div>
        </div>
    );
};
export { ERegistry };
