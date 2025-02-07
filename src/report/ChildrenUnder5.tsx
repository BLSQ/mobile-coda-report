import Entity from '../entity/Entity';
import { dataCategory, assistanceGiven } from '../utils/DataFilter';
import { ReportContent } from './ReportContent';
import { RationData } from './RationData';
import { categoryWithData } from '../utils/DataFilter';
import { Summary } from './Summary';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

function ChildrenUnder5(
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
    program: string,
    entityType: string,
) {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    const categories = dataCategory(
        entities,
        program,
        startDate,
        endDate,
        entityType,
    );
    const rationsGivens = assistanceGiven(
        entities,
        program,
        startDate,
        endDate,
        'rationGiven',
        entityType,
    );
    const discharged = categoryWithData(
        entities,
        program,
        'Discharges',
        startDate,
        endDate,
        entityType,
    );

    return (
        <div style={root}>
            <div>
                <h3>{`Report ${program}`} </h3>
                <h3> {dateValue} </h3>
                <div>
                    <div>
                        {categories.map((category: any) => {
                            return <ReportContent showTotal {...category} />;
                        })}
                    </div>
                    <br />
                    <div>Ration</div>
                    <div>
                        <RationData {...rationsGivens} />
                    </div>
                    <br />
                    <div>{Summary(discharged)}</div>
                </div>
            </div>
        </div>
    );
}
export { ChildrenUnder5 };
