//import { processFoodItemData } from "../../utils/StockDataFormatter";

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
    colSpan: 2,
} as const;

const tdCategory = {
    border: '1pt solid black',
    textAlign: 'left',
    padding: '8px',
    fontWeight: 'bold',
    borderCollapse: 'collapse',
} as const;

const FoodItems = ({
    submissions,
    startDate,
    endDate,
}: {
    submissions: any[];
    startDate: Date;
    endDate: Date;
}) => {
    console.info(
        'SUBMISSIONS ....',
        submissions,
        'START DATE ....:',
        startDate,

        'END DATE ...',
        endDate,
    );
    //const foodStockData = processFoodItemData(submissions, startDate, endDate);
    //const items = foodStockData.filter((row) => row.commodity !== undefined);

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
                    <tr style={th}>
                        <th style={th}>Item</th>
                        <th style={th}>Opening</th>
                        <th style={th}>Received</th>
                        <th style={th}>Distributed</th>
                        <th style={th}>Lost</th>
                        <th style={th}>Damaged</th>
                        <th style={th}>Expired</th>
                        <th style={th}>Transferred</th>
                        <th style={th}>End</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                        <td style={tdCategory}></td>
                    </tr>
                </tbody>
                <tfoot></tfoot>
            </table>
        </div>
    );
};

export { FoodItems };
