import Entity from '../entity/Entity';
import { medicalReports } from '../utils/DataByCategory';
import { ReportContent } from './ReportContent';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

const MedicalChildrenUnder5Report = (
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
        'Child Under 5',
    );

    return (
        <div style={root}>
            <div>
                <h3>{`Medical Report ${program}`} </h3>
                <h3> {dateValue} </h3>
                <div>
                    <div>
                        {medicalData.map((category: any) => {
                            return <ReportContent {...category} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
export { MedicalChildrenUnder5Report };
