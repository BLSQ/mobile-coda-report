import Entity from '../entity/Entity';
import {
    filterDataOnProgram,
    assistanceGiven,
    assistanceDataByCategory,
} from '../utils/DataFilter';
import { admissionByStatus } from '../utils/DataByCategory';
import { ReportContent } from './ReportContent';
import { RationData } from './RationData';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

// Generic "Main Report": total admissions (by age/gender), the soap/mosquito
// net assistance given, and the ration given for the period. Meant for
// simple, single-form programs such as BSFP where the richer category
// breakdown used by TSFP/OTP/PBWG does not apply.
function MainReport(
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
    program: string,
    entityType: string,
) {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    const programEntities = filterDataOnProgram(
        entities,
        program,
        startDate,
        endDate,
    );
    const entitiesWithVisits = programEntities.filter(
        entity => entity?.visits?.length > 0,
    );

    const totalAdmissions = admissionByStatus(
        entityType,
        entitiesWithVisits,
        'Total Admissions',
        '',
    );

    const soapAndMosquitoNet = assistanceDataByCategory(
        entitiesWithVisits,
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
                        <ReportContent
                            category="Admissions"
                            rows={[totalAdmissions]}
                        />
                    </div>
                    <div>
                        {soapAndMosquitoNet.map((category: any) => (
                            <ReportContent {...category} />
                        ))}
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
export { MainReport };
