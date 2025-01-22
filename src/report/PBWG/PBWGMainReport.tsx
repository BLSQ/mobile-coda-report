import Entity from '../../entity/Entity';
import { dataCategory, assistanceGiven } from '../../utils/DataFilter';
import { ReportPBWGContent } from './ReportPBWGContent';
import { RationData } from '../RationData';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

function PBWGMainReport(
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

    return (
        <div style={root}>
            <div>
                <h3>{`Report ${program}`} </h3>
                <h3> {dateValue} </h3>
                <div>
                    <br />
                    <div>
                        {categories.map((category: any) => {
                            return (
                                <ReportPBWGContent showTotal {...category} />
                            );
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
export { PBWGMainReport };
