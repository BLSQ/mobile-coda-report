import Entity from '../entity/Entity';
import { dataCategory, assistanceGiven } from '../utils/DataFilter';
import { ReportContent } from './ReportContent';
import { RationData } from './RationData';

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
) {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    const categories = dataCategory(entities, program, startDate, endDate);
    const rationsGivens = assistanceGiven(
        entities,
        program,
        startDate,
        endDate,
        'rationGiven',
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
                </div>
            </div>
        </div>
    );
}
export { ChildrenUnder5 };
