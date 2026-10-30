import { CSSProperties, Fragment } from 'react';
import { FoodStockMovements } from '../../stock/FoodStockItem';
import { processFoodStockData } from '../../stock/FoodStock';
import { FoodQuantity } from '../../stock/FoodQuantity';

const root = {
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
    alignItems: 'center',
    fontSize: '12px',
} as const;

// The quantity columns make the table wide: it scrolls instead of squeezing
// its cells.
const tableWrapper = {
    width: '100%',
    overflowX: 'auto',
    marginTop: '20px',
} as const;

const table = {
    margin: 'auto',
    alignItems: 'center',
    borderCollapse: 'collapse',
    border: '1pt solid black',
    fontVariantNumeric: 'tabular-nums',
} as const;

const th = {
    border: '1pt solid black',
    textAlign: 'center',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    borderCollapse: 'collapse',
} as const;

// Columns describing the rows, with fixed widths. The pinned ones stay on the
// left while the quantities scroll horizontally, each starting where the
// pinned ones before it end; the others scroll under them.
const ROW_COLUMNS = [
    { label: 'Item', width: 150, pinned: true },
    { label: 'Batch number', width: 115, pinned: false },
    { label: 'Expiry date', width: 100, pinned: false },
    { label: 'Unit', width: 120, pinned: false },
    { label: 'Packaging size', width: 105, pinned: false },
    { label: 'Box size', width: 60, pinned: true },
];

const columnsWidth = (columns: typeof ROW_COLUMNS) =>
    columns.reduce((width, column) => width + column.width, 0);

// Style of a cell in the row columns, spanning `span` of them. Collapsed
// borders do not follow a sticky cell: its right border is drawn with a
// shadow, thicker after the last column, and a background hides the cells
// scrolling under it.
const columnStyle = (index: number, span = 1): CSSProperties => {
    const width = columnsWidth(ROW_COLUMNS.slice(index, index + span));
    const style: CSSProperties = {
        width,
        minWidth: width,
        maxWidth: width,
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
    };
    if (!ROW_COLUMNS[index].pinned) return style;
    const last = index + span === ROW_COLUMNS.length;
    return {
        ...style,
        position: 'sticky',
        left: columnsWidth(
            ROW_COLUMNS.slice(0, index).filter(column => column.pinned),
        ),
        zIndex: 1,
        backgroundColor: 'white',
        boxShadow: `inset -${last ? 2.5 : 1}pt 0 0 black`,
    };
};

const tdCategory = {
    border: '1pt solid black',
    textAlign: 'left',
    padding: '8px',
    fontWeight: 'bold',
    borderCollapse: 'collapse',
    ...columnStyle(0),
} as const;

const td = {
    border: '1pt solid black',
    textAlign: 'center',
    padding: '8px',
    borderCollapse: 'collapse',
} as const;

const tdTotal = { ...td, fontWeight: 'bold' } as const;

const trSubtotal = { backgroundColor: '#f2f2f2' } as const;

// Each quantity is split into one column per unit, tinted alike in the
// header and the body; a thicker border opens each activity.
const UNITS = [
    { key: 'sachets', label: 'Sachets', color: undefined },
    { key: 'boxes', label: 'Boxes / cartons', color: '#e8f1fb' },
    { key: 'kg', label: 'Weight (kg)', color: '#fdf4e3' },
    { key: 'mt', label: 'MT', color: '#e9f6ec' },
] as const;

const groupStart = { borderLeft: '2.5pt solid black' } as const;

const unitTh = {
    ...th,
    padding: '4px 6px',
    fontSize: '12px',
    fontWeight: 'normal',
    whiteSpace: 'nowrap',
} as const;

const unitTd = {
    padding: '8px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
} as const;

// Zeros are dimmed so the quantities moved stand out.
const zero = { color: '#9e9e9e', fontWeight: 'normal' } as const;

// The sachets left over beyond the full boxes, tagged under them.
const looseSachetsStyle = {
    display: 'inline-block',
    marginTop: '3px',
    padding: '1px 6px',
    borderRadius: '8px',
    backgroundColor: '#fff1cc',
    color: '#7a4f00',
    fontSize: '12px',
    fontWeight: 'bold',
} as const;

const formatNumber = (value: number, digits: number) =>
    value.toLocaleString('en-US', { maximumFractionDigits: digits });

// Full boxes/cartons and the sachets left over: 2 + 19 sachets; a dash for
// the items not packed in boxes.
const plural = (count: number, one: string, many: string) =>
    `${formatNumber(count, 2)} ${count === 1 ? one : many}`;

// Full boxes/cartons, with the sachets left over tagged under them
// (13 boxes, + 50 sachets); less than a box shows its sachets only.
const Boxes = ({ boxes }: { boxes: FoodQuantity['boxes'] }) => {
    if (!boxes) return <>-</>;
    const { full, looseSachets } = boxes;
    if (full === 0 && looseSachets === 0) return <>0</>;
    if (full === 0) return <>{plural(looseSachets, 'sachet', 'sachets')}</>;
    return (
        <>
            {plural(full, 'box', 'boxes')}
            {looseSachets !== 0 && (
                <>
                    <br />
                    <span style={looseSachetsStyle}>
                        + {plural(looseSachets, 'sachet', 'sachets')}
                    </span>
                </>
            )}
        </>
    );
};

// Quantity in sachets/packets, boxes/cartons, weight and metric tons, as
// recorded on the food_item_stock submissions.
const QuantityCells = ({
    quantity,
    bold = false,
}: {
    quantity: FoodQuantity;
    bold?: boolean;
}) => {
    const cell = {
        ...(bold ? tdTotal : td),
        ...(quantity.sachets === 0 && zero),
    };
    const values = {
        sachets: formatNumber(quantity.sachets, 2),
        boxes: <Boxes boxes={quantity.boxes} />,
        kg: formatNumber(quantity.kg, 2),
        mt: formatNumber(quantity.mt, 4),
    };
    return (
        <>
            {UNITS.map((unit, index) => (
                <td
                    key={unit.key}
                    style={{
                        ...cell,
                        ...unitTd,
                        ...(unit.color && { backgroundColor: unit.color }),
                        ...(index === 0 && groupStart),
                    }}
                >
                    {values[unit.key]}
                </td>
            ))}
        </>
    );
};

const MOVEMENTS: {
    key: string;
    quantity: (row: FoodStockMovements) => FoodQuantity;
    bold?: boolean;
}[] = [
    { key: 'received', quantity: row => row.received },
    {
        key: 'transferredLoan',
        quantity: row => row.transferred.loanAndBorrowing,
    },
    { key: 'transferredOther', quantity: row => row.transferred.other },
    {
        key: 'transferredTotal',
        quantity: row => row.transferred.total,
        bold: true,
    },
    { key: 'lostInfestation', quantity: row => row.lost.infestation },
    { key: 'lostExpired', quantity: row => row.lost.expired },
    { key: 'lostStolen', quantity: row => row.lost.stolen },
    { key: 'lostOther', quantity: row => row.lost.other },
    { key: 'lostTotal', quantity: row => row.lost.total, bold: true },
];

// The item columns, the opening and end stock in sachets, and the movements
// split per unit.
const COLUMNS = 6 + 2 + MOVEMENTS.length * UNITS.length;

// Opening and end stock of an item, in sachets only: they are not split per
// batch, so their box size is unknown.
const StockCell = ({
    sachets,
    rowSpan,
}: {
    sachets: number;
    rowSpan: number;
}) => (
    <td
        style={{ ...tdTotal, ...groupStart, ...(sachets === 0 && zero) }}
        rowSpan={rowSpan}
    >
        {formatNumber(sachets, 2)}
    </td>
);

const SachetsTh = () => <th style={{ ...unitTh, ...groupStart }}>Sachets</th>;

// Movements of a batch row, or of the item: its batch rows added up.
const MovementCells = ({ row }: { row: FoodStockMovements }) => (
    <>
        {MOVEMENTS.map(movement => (
            <QuantityCells
                key={movement.key}
                quantity={movement.quantity(row)}
                bold={movement.bold}
            />
        ))}
    </>
);

const GroupTh = ({ label, rowSpan }: { label: string; rowSpan?: number }) => (
    <th
        style={{ ...th, ...groupStart }}
        colSpan={UNITS.length}
        rowSpan={rowSpan}
    >
        {label}
    </th>
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
            <div style={tableWrapper}>
                <table style={table}>
                    <thead>
                        <tr>
                            {ROW_COLUMNS.map((column, index) => (
                                <th
                                    key={column.label}
                                    style={{
                                        ...th,
                                        ...columnStyle(index),
                                        backgroundColor: th.backgroundColor,
                                        zIndex: 2,
                                    }}
                                    rowSpan={3}
                                >
                                    {column.label}
                                </th>
                            ))}
                            <th style={{ ...th, ...groupStart }} rowSpan={2}>
                                Opening stock
                            </th>
                            <GroupTh label="Received" rowSpan={2} />
                            <th
                                style={{ ...th, ...groupStart }}
                                colSpan={3 * UNITS.length}
                            >
                                Transferred
                            </th>
                            <th
                                style={{ ...th, ...groupStart }}
                                colSpan={5 * UNITS.length}
                            >
                                Lost
                            </th>
                            <th style={{ ...th, ...groupStart }} rowSpan={2}>
                                End stock
                            </th>
                        </tr>
                        <tr>
                            <GroupTh label="Loan and Borrowing" />
                            <GroupTh label="Other" />
                            <GroupTh label="Total" />
                            <GroupTh label="Infestation" />
                            <GroupTh label="Expired" />
                            <GroupTh label="Stolen" />
                            <GroupTh label="Other" />
                            <GroupTh label="Total" />
                        </tr>
                        <tr>
                            <SachetsTh />
                            {MOVEMENTS.flatMap(movement =>
                                UNITS.map((unit, index) => (
                                    <th
                                        key={`${movement.key}-${unit.key}`}
                                        style={{
                                            ...unitTh,
                                            ...(unit.color && {
                                                backgroundColor: unit.color,
                                            }),
                                            ...(index === 0 && groupStart),
                                        }}
                                    >
                                        {unit.label}
                                    </th>
                                )),
                            )}
                            <SachetsTh />
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
                            // The item, its opening and end stock span all
                            // its batch rows and their total row.
                            const rowSpan = item.batches.length
                                ? item.batches.length + 1
                                : 1;
                            const itemCell = (
                                <td style={tdCategory} rowSpan={rowSpan}>
                                    {item.item}
                                </td>
                            );
                            const openingCells = (
                                <StockCell
                                    sachets={item.opening}
                                    rowSpan={rowSpan}
                                />
                            );
                            const endCells = (
                                <StockCell
                                    sachets={item.end}
                                    rowSpan={rowSpan}
                                />
                            );
                            return (
                                <Fragment key={item.item}>
                                    {item.batches.length === 0 && (
                                        <tr>
                                            {itemCell}
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(1, 4),
                                                }}
                                                colSpan={4}
                                            >
                                                No activity in the period
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(5),
                                                }}
                                            >
                                                -
                                            </td>
                                            {openingCells}
                                            <MovementCells row={item} />
                                            {endCells}
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
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(1),
                                                }}
                                            >
                                                {batch.batch || '-'}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(2),
                                                }}
                                            >
                                                {batch.expiryDate || '-'}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(3),
                                                }}
                                            >
                                                {/* Wraps after the slash of
                                                sachets/packets. */}
                                                {batch.unit.replace(
                                                    '/',
                                                    '/\u200b',
                                                ) || '-'}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(4),
                                                }}
                                            >
                                                {batch.packagingSize || '-'}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(5),
                                                }}
                                            >
                                                {batch.boxSize || '-'}
                                            </td>
                                            {index === 0 && openingCells}
                                            <MovementCells row={batch} />
                                            {index === 0 && endCells}
                                        </tr>
                                    ))}
                                    {item.batches.length > 0 && (
                                        <tr style={trSubtotal}>
                                            <td
                                                style={{
                                                    ...td,
                                                    ...columnStyle(1, 4),
                                                }}
                                                colSpan={4}
                                            />
                                            <td
                                                style={{
                                                    ...tdTotal,
                                                    ...columnStyle(5),
                                                    backgroundColor:
                                                        trSubtotal.backgroundColor,
                                                }}
                                            >
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
        </div>
    );
};

export { FoodItems };
