import { Fragment } from 'react';
import { FoodStockMovements } from '../../stock/FoodStockItem';
import { processFoodStockData } from '../../stock/FoodStock';

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

const trSubtotal = { backgroundColor: '#f2f2f2' } as const;

const COLUMNS = 17;

const MovementCells = ({ row }: { row: FoodStockMovements }) => (
    <>
        <td style={td}>{row.received}</td>
        <td style={td}>{row.transferred.loanAndBorrowing}</td>
        <td style={td}>{row.transferred.other}</td>
        <td style={tdTotal}>{row.transferred.total}</td>
        <td style={td}>{row.lost.infestation}</td>
        <td style={td}>{row.lost.expired}</td>
        <td style={td}>{row.lost.stolen}</td>
        <td style={td}>{row.lost.other}</td>
        <td style={tdTotal}>{row.lost.total}</td>
    </>
);

const FoodItems = ({
    startDate,
    endDate,
}: {
    startDate: Date;
    endDate: Date;
}) => {
    const items = processFoodStockData(startDate, endDate);

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
                            Batch number
                        </th>
                        <th style={th} rowSpan={2}>
                            Expiry date
                        </th>
                        <th style={th} rowSpan={2}>
                            Unit
                        </th>
                        <th style={th} rowSpan={2}>
                            Packaging size
                        </th>
                        <th style={th} rowSpan={2}>
                            Box size
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
                            <td style={td} colSpan={COLUMNS}>
                                No stock data available
                            </td>
                        </tr>
                    )}
                    {items.map(item => {
                        // The item, its opening and end stock span all its
                        // batch rows and their total row.
                        const rowSpan = item.batches.length
                            ? item.batches.length + 1
                            : 1;
                        const itemCell = (
                            <td style={tdCategory} rowSpan={rowSpan}>
                                {item.item}
                            </td>
                        );
                        const openingCell = (
                            <td style={tdTotal} rowSpan={rowSpan}>
                                {item.opening}
                            </td>
                        );
                        const endCell = (
                            <td style={tdTotal} rowSpan={rowSpan}>
                                {item.end}
                            </td>
                        );
                        return (
                            <Fragment key={item.item}>
                                {item.batches.length === 0 && (
                                    <tr>
                                        {itemCell}
                                        <td style={td} colSpan={5}>
                                            No activity in the period
                                        </td>
                                        {openingCell}
                                        <MovementCells row={item} />
                                        {endCell}
                                    </tr>
                                )}
                                {item.batches.map((batch, index) => (
                                    <tr
                                        key={[
                                            batch.batch,
                                            batch.unit,
                                            batch.packagingSize,
                                            batch.boxSize,
                                        ].join('|')}
                                    >
                                        {index === 0 && itemCell}
                                        <td style={td}>{batch.batch || '-'}</td>
                                        <td style={td}>
                                            {batch.expiryDate || '-'}
                                        </td>
                                        <td style={td}>{batch.unit || '-'}</td>
                                        <td style={td}>
                                            {batch.packagingSize || '-'}
                                        </td>
                                        <td style={td}>
                                            {batch.boxSize || '-'}
                                        </td>
                                        {index === 0 && openingCell}
                                        <MovementCells row={batch} />
                                        {index === 0 && endCell}
                                    </tr>
                                ))}
                                {item.batches.length > 0 && (
                                    <tr style={trSubtotal}>
                                        <td style={tdTotal} colSpan={5}>
                                            Total
                                        </td>
                                        <MovementCells row={item} />
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export { FoodItems };
