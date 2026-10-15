import Form from '../../entity/Form';
import { processNonFoodStockData } from '../../stock/NonFoodStock';

const root = {
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
    alignItems: 'center',
    fontSize: '11px',
} as const;

const table = {
    margin: 'auto',
    alignItems: 'center',
    width: '90%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
    marginTop: '20px',
} as const;

const th = {
    border: '1pt solid black',
    textAlign: 'center',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    borderCollapse: 'collapse',
} as const;

const tdCategory = {
    border: '1pt solid black',
    textAlign: 'left',
    padding: '8px',
    fontWeight: 'bold',
    borderCollapse: 'collapse',
} as const;

const td = {
    border: '1pt solid black',
    textAlign: 'center',
    padding: '8px',
    borderCollapse: 'collapse',
} as const;

const NonFoodItems = ({
    submissions,
    startDate,
    endDate,
}: {
    submissions: Form[];
    startDate: Date;
    endDate: Date;
}) => {
    const items = processNonFoodStockData(submissions, startDate, endDate);

    return (
        <div style={root}>
            <h4>Non food items</h4>
            {startDate && endDate && (
                <h3>
                    Period to report:{' '}
                    {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                </h3>
            )}
            <table style={table}>
                <thead>
                    <tr>
                        <th style={th}>Item</th>
                        <th style={th}>Code</th>
                        <th style={th}>Unit</th>
                        <th style={th}>Stock balance start of period</th>
                        <th style={th}>Stock received</th>
                        <th style={th}>Stock utilized</th>
                        <th style={th}>Damaged/ Expired stock</th>
                        <th style={th}>Stock balance end of period</th>
                        <th style={th}>No. of days stock out</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(row => (
                        <tr key={row.code}>
                            <td style={tdCategory}>{row.label}</td>
                            <td style={td}>{row.code}</td>
                            <td style={td}>{row.unit}</td>
                            <td style={td}>{row.balanceStart}</td>
                            <td style={td}>{row.received}</td>
                            <td style={td}>{row.utilized}</td>
                            <td style={td}>{row.discarded}</td>
                            <td style={td}>{row.balanceEnd}</td>
                            <td style={td}>{row.stockOutDays}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export { NonFoodItems };
