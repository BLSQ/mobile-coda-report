import {
    processScreeningData,
    IScreeningData,
} from '../utils/ScreeningDataFormatter';
import Form from '../entity/Form';

const root = {
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
    alignItems: 'center',
} as const;

const table = {
    margin: 'auto',
    alignItems: 'center',
    width: '80%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
    marginTop: '20px',
} as const;

const th = {
    border: '1pt solid black',
    textAlign: 'center',
    padding: '8px',
    backgroundColor: '#f2f2f2',
} as const;

const td = {
    border: '1pt solid black',
    textAlign: 'center',
    padding: '8px',
} as const;

const tdCategory = {
    border: '1pt solid black',
    textAlign: 'left',
    padding: '8px',
    fontWeight: 'bold',
} as const;

function ScreeningData({
    submissions,
    startDate,
    endDate,
}: {
    submissions: Form[];
    startDate: Date;
    endDate: Date;
}) {
    const screeningData: IScreeningData = processScreeningData(
        submissions,
        startDate,
        endDate,
    );

    return (
        <div style={root}>
            <h3>Screening Tally Report</h3>

            {startDate && endDate && (
                <h3>
                    Period to report:{' '}
                    {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                </h3>
            )}
            {/* Children Under 5 Table */}
            <h4>Children Under 5</h4>
            <table style={table}>
                <thead>
                    <tr>
                        <th style={th}>Status</th>
                        <th style={th}>Male</th>
                        <th style={th}>Female</th>
                        <th style={th}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdCategory}>Green</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.male +
                                screeningData.childrenUnder5.green.female}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Yellow</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.yellow.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.yellow.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.yellow.male +
                                screeningData.childrenUnder5.yellow.female}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Red</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.red.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.red.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.red.male +
                                screeningData.childrenUnder5.red.female}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Oedema</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.oedema.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.oedema.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.oedema.male +
                                screeningData.childrenUnder5.oedema.female}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td style={tdCategory}>Total Active Screening</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.male +
                                screeningData.childrenUnder5.yellow.male +
                                screeningData.childrenUnder5.red.male +
                                screeningData.childrenUnder5.oedema.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.female +
                                screeningData.childrenUnder5.yellow.female +
                                screeningData.childrenUnder5.red.female +
                                screeningData.childrenUnder5.oedema.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.male +
                                screeningData.childrenUnder5.yellow.male +
                                screeningData.childrenUnder5.red.male +
                                screeningData.childrenUnder5.oedema.male +
                                screeningData.childrenUnder5.green.female +
                                screeningData.childrenUnder5.yellow.female +
                                screeningData.childrenUnder5.red.female +
                                screeningData.childrenUnder5.oedema.female}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Total Passive Screening</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.passive.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.passive.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.passive.male +
                                screeningData.childrenUnder5.passive.female}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Total Screening</td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.male +
                                screeningData.childrenUnder5.yellow.male +
                                screeningData.childrenUnder5.red.male +
                                screeningData.childrenUnder5.oedema.male +
                                screeningData.childrenUnder5.passive.male}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.female +
                                screeningData.childrenUnder5.yellow.female +
                                screeningData.childrenUnder5.red.female +
                                screeningData.childrenUnder5.oedema.female +
                                screeningData.childrenUnder5.passive.female}
                        </td>
                        <td style={td}>
                            {screeningData.childrenUnder5.green.male +
                                screeningData.childrenUnder5.yellow.male +
                                screeningData.childrenUnder5.red.male +
                                screeningData.childrenUnder5.oedema.male +
                                screeningData.childrenUnder5.green.female +
                                screeningData.childrenUnder5.yellow.female +
                                screeningData.childrenUnder5.red.female +
                                screeningData.childrenUnder5.oedema.female +
                                screeningData.childrenUnder5.passive.male +
                                screeningData.childrenUnder5.passive.female}
                        </td>
                    </tr>
                </tfoot>
            </table>
            {/* Pregnant & Breastfeeding Women Table */}
            <h4>Pregnant & Breastfeeding Women</h4>
            <table style={table}>
                <thead>
                    <tr>
                        <th style={th}>Status</th>
                        <th style={th}>Pregnant</th>
                        <th style={th}>Breastfeeding</th>
                        <th style={th}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdCategory}>Green (MUAC &gt; 23)</td>
                        <td style={td}>{screeningData.pbw.green.pregnant}</td>
                        <td style={td}>{screeningData.pbw.green.lactating}</td>
                        <td style={td}>
                            {screeningData.pbw.green.pregnant +
                                screeningData.pbw.green.lactating}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Red (MUAC &lt;= 23)</td>
                        <td style={td}>{screeningData.pbw.red.pregnant}</td>
                        <td style={td}>{screeningData.pbw.red.lactating}</td>
                        <td style={td}>
                            {screeningData.pbw.red.pregnant +
                                screeningData.pbw.red.lactating}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td style={tdCategory}>Total Active Screening</td>
                        <td style={td}>
                            {screeningData.pbw.green.pregnant +
                                screeningData.pbw.red.pregnant}
                        </td>
                        <td style={td}>
                            {screeningData.pbw.green.lactating +
                                screeningData.pbw.red.lactating}
                        </td>
                        <td style={td}>
                            {screeningData.pbw.green.pregnant +
                                screeningData.pbw.red.pregnant +
                                screeningData.pbw.green.lactating +
                                screeningData.pbw.red.lactating}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Total Passive Screening</td>
                        <td style={td}>{screeningData.pbw.passive.pregnant}</td>
                        <td style={td}>
                            {screeningData.pbw.passive.lactating}
                        </td>
                        <td style={td}>
                            {screeningData.pbw.passive.pregnant +
                                screeningData.pbw.passive.lactating}
                        </td>
                    </tr>
                    <tr>
                        <td style={tdCategory}>Total Screening</td>
                        <td style={td}>
                            {screeningData.pbw.green.pregnant +
                                screeningData.pbw.red.pregnant +
                                screeningData.pbw.passive.pregnant}
                        </td>
                        <td style={td}>
                            {screeningData.pbw.green.lactating +
                                screeningData.pbw.red.lactating +
                                screeningData.pbw.passive.lactating}
                        </td>
                        <td style={td}>
                            {screeningData.pbw.green.pregnant +
                                screeningData.pbw.red.pregnant +
                                screeningData.pbw.passive.pregnant +
                                screeningData.pbw.green.lactating +
                                screeningData.pbw.red.lactating +
                                screeningData.pbw.passive.lactating}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export { ScreeningData };
