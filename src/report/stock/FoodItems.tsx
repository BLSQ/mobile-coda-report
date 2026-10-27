import Form from '../../entity/Form';
import { processFoodStockData } from '../../stock/FoodStockLedger';

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

const tdTotal = { ...td, fontWeight: 'bold' } as const;

const FoodItems = ({
    submissions,
    startDate,
    endDate,
}: {
    submissions: Form[];
    startDate: Date;
    endDate: Date;
}) => {
    const items = processFoodStockData(submissions, startDate, endDate);

    return (
        <div style={root}>
            <h4>Food items</h4>
            {startDate && endDate && (
                <h3>
                    Period to report:{' '}
                    {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                </h3>
            )}
            <table style={table}>
                <thead>
                    <tr>
                        <th style={th} rowSpan={2}>
                            Item
                        </th>
                        <th style={th} rowSpan={2}>
                            Opening stock
                        </th>
                        <th style={th} rowSpan={2}>
                            Received
                        </th>
                        <th style={th} colSpan={3}>
                            Transferred
                        </th>
                        <th style={th} colSpan={5}>
                            Lost
                        </th>
                        <th style={th} rowSpan={2}>
                            End stock
                        </th>
                    </tr>
                    <tr>
                        <th style={th}>Loan and Borrowing</th>
                        <th style={th}>Other</th>
                        <th style={th}>Total</th>
                        <th style={th}>Infestation</th>
                        <th style={th}>Expired</th>
                        <th style={th}>Stolen</th>
                        <th style={th}>Other</th>
                        <th style={th}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && (
                        <tr>
                            <td style={td} colSpan={12}>
                                No stock data available
                            </td>
                        </tr>
                    )}
                    {items.map(row => (
                        <tr key={row.item}>
                            <td style={tdCategory}>{row.item}</td>
                            <td style={td}>{row.opening}</td>
                            <td style={td}>{row.received}</td>
                            <td style={td}>
                                {row.transferred.loanAndBorrowing}
                            </td>
                            <td style={td}>{row.transferred.other}</td>
                            <td style={tdTotal}>{row.transferred.total}</td>
                            <td style={td}>{row.lost.infestation}</td>
                            <td style={td}>{row.lost.expired}</td>
                            <td style={td}>{row.lost.stolen}</td>
                            <td style={td}>{row.lost.other}</td>
                            <td style={tdTotal}>{row.lost.total}</td>
                            <td style={tdTotal}>{row.end}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export { FoodItems };
