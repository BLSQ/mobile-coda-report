import Entity from '../entity/Entity';
import { iycfReport } from '../utils/IYCF';
import { ReportContent } from './ReportContent';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

const IYCFReport = (
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    const sections = iycfReport(entities, startDate, endDate);

    return (
        <div style={root}>
            <div>
                <h3>IYCF Report</h3>
                <h3> {dateValue} </h3>
                <div>
                    {sections.map(section => (
                        <ReportContent key={section.category} {...section} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export { IYCFReport };
