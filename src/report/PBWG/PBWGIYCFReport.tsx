import Entity from '../../entity/Entity';
import { iycfWomenReport } from '../../utils/IYCF';
import { ReportPBWGContent } from './ReportPBWGContent';

const root = {
    width: '100%',
    margin: 'auto',
    height: '80%',
    marginBottom: '70px',
    textAlign: 'center',
} as const;

const PBWGIYCFReport = (
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
) => {
    const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
    const sections = iycfWomenReport(entities, startDate, endDate);

    return (
        <div style={root}>
            <div>
                <h3>IYCF Report - Pregnant women</h3>
                <h3> {dateValue} </h3>
                <div>
                    {sections.map(section => (
                        <ReportPBWGContent
                            key={section.category}
                            onlyStatus="P"
                            {...section}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export { PBWGIYCFReport };
