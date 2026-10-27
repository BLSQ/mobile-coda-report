import { categoryDictionary } from '../../utils/Array';

const root = {
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
} as const;

const table = {
    margin: 'auto',
    alignItems: 'center',
    width: '80%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;

const th = {
    border: '1pt solid black',
    textAlign: 'left',
} as const;

const td = {
    border: '1pt solid black',
} as const;

// Physiology status columns of each age band, at their index in a row's
// under19/over19 counts.
const STATUSES = [
    { title: 'P', index: 0 },
    { title: 'B', index: 1 },
];

// A single status needs no P/B sub-header: the band is its only column.
const BandHeader = ({
    title,
    statuses,
}: {
    title: string;
    statuses: typeof STATUSES;
}) =>
    statuses.length === 1 ? (
        <th className="align" style={td}>
            {title}
        </th>
    ) : (
        <th colSpan={statuses.length} style={td}>
            <table width={36 * statuses.length}>
                <tr style={table}>
                    <td colSpan={statuses.length} style={td}>
                        {title}
                    </td>
                </tr>
                <tr style={table}>
                    {statuses.map(status => (
                        <td className="align" style={td}>
                            {status.title}
                        </td>
                    ))}
                </tr>
            </table>
        </th>
    );

const rowLabel = (subCategory: any) => {
    if (subCategory && subCategory.admissionType) {
        const admissionType = categoryDictionary(subCategory?.admissionType);
        const admissionCriteria = categoryDictionary(
            subCategory?.admissionCriteria,
        );
        return admissionCriteria
            ? `${admissionType} ${admissionCriteria}`
            : admissionType;
    }
    return categoryDictionary(subCategory?.key) ?? subCategory?.key;
};

// With onlyStatus ('P' or 'B'), only that physiology status column of each
// age band is shown.
const ReportPBWGContent = (category: any): any => {
    const statuses = category?.onlyStatus
        ? STATUSES.filter(status => status.title === category.onlyStatus)
        : STATUSES;
    const rows = (category?.rows ?? []).filter(
        (row: { key: string }) => row && row?.key !== 'absentees',
    );
    const cell = (counts: number[] | undefined, index: number) =>
        counts?.[index] || 0;
    const bandTotal = (band: 'under19' | 'over19') =>
        rows.reduce(
            (total: number, row: any) =>
                total +
                statuses.reduce(
                    (sum, status) => sum + cell(row[band], status.index),
                    0,
                ),
            0,
        );
    const under19 = bandTotal('under19');
    const over19 = bandTotal('over19');

    return (
        <div style={root}>
            <br />
            <div>{category?.category} </div>

            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={table}>Year</th>
                        <BandHeader title="<= 19" statuses={statuses} />
                        <BandHeader title="> 19" statuses={statuses} />
                        <BandHeader title="Total" statuses={statuses} />
                    </tr>
                </thead>
                <tbody style={table}>
                    {rows.map((subCategory: any) => (
                        <tr style={table}>
                            <td style={th}>{rowLabel(subCategory)}</td>
                            {statuses.map(status => (
                                <td className="align" style={td}>
                                    {cell(subCategory.under19, status.index)}
                                </td>
                            ))}
                            {statuses.map(status => (
                                <td className="align" style={td}>
                                    {cell(subCategory.over19, status.index)}
                                </td>
                            ))}
                            {statuses.map(status => (
                                <td className="align" style={td}>
                                    {cell(subCategory.under19, status.index) +
                                        cell(subCategory.over19, status.index)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {category?.showTotal && (
                        <tr style={table}>
                            <td style={th}>{category?.total?.status}</td>
                            <td
                                colSpan={statuses.length}
                                className="align"
                                style={td}
                            >
                                {under19}
                            </td>
                            <td
                                colSpan={statuses.length}
                                className="align"
                                style={td}
                            >
                                {over19}
                            </td>
                            <td
                                colSpan={statuses.length}
                                className="align"
                                style={td}
                            >
                                {under19 + over19}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <br />
        </div>
    );
};

export { ReportPBWGContent };
