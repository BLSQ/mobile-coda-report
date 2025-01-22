import Entity from '../../entity/Entity';
import { medicalReports } from '../../utils/DataByCategory';
import { ReportPBWGContent } from './ReportPBWGContent';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

const PBWGMedicalReport = (
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
    program: string,
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    let medicalData = medicalReports(
        entities,
        program,
        startDate,
        endDate,
        'PBWG',
    );

    return (
        <div style={root}>
            <div>
                <h3>{`${program} Report `} </h3>
                <h3> {dateValue} </h3>
                <div>
                    <div>
                        {medicalData.map((category: any) => {
                            return <ReportPBWGContent {...category} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
export { PBWGMedicalReport };
