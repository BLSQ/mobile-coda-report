import { categoryDictionary } from '../utils/Array';

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

// The age columns of a table, in months: 0-5 only when its rows carry it.
const AGE_BANDS = [
    { title: '0 - 5', field: 'under6' },
    { title: '6 - 23', field: 'between6And23' },
    { title: '24-59', field: 'between24And59' },
];

const BandHeader = ({ title }: { title: string }) => (
    <th colSpan={2} style={td}>
        <table width={72}>
            <tr style={td}>
                <td colSpan={2} style={td}>
                    {title}
                </td>
            </tr>
            <tr style={td}>
                <td className="align" style={td}>
                    M
                </td>
                <td className="align" style={td}>
                    F
                </td>
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
    return (
        subCategory?.label ??
        categoryDictionary(subCategory?.key) ??
        subCategory?.key
    );
};

const ReportContent = (category: any): any => {
    const rows = (category?.rows ?? []).filter(
        (row: { key: string }) => row && row?.key !== 'absentees',
    );
    const bands = AGE_BANDS.filter(
        band => band.field !== 'under6' || rows.some((row: any) => row.under6),
    );
    // [boys, girls] of a row in a band.
    const cells = (row: any, field: string) => [
        row[field]?.[0] ?? 0,
        row[field]?.[1] ?? 0,
    ];
    const bandTotal = (field: string) =>
        rows.reduce(
            (total: number, row: any) =>
                total + cells(row, field)[0] + cells(row, field)[1],
            0,
        );
    return (
        <div style={root}>
            <br />
            <div>{category?.category} </div>
            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={table}> Months </th>
                        {bands.map(band => (
                            <BandHeader title={band.title} />
                        ))}
                        <BandHeader title="Total" />
                    </tr>
                </thead>

                <tbody style={table}>
                    {rows.map((subCategory: any) => {
                        const byBand = bands.map(band =>
                            cells(subCategory, band.field),
                        );
                        const boys = byBand.reduce((sum, [b]) => sum + b, 0);
                        const girls = byBand.reduce((sum, [, g]) => sum + g, 0);
                        return (
                            <tr style={table}>
                                <td style={th}>{rowLabel(subCategory)}</td>
                                {byBand.flat().map(value => (
                                    <td className="align" style={td}>
                                        {value}
                                    </td>
                                ))}
                                <td className="align" style={td}>
                                    {boys}
                                </td>
                                <td className="align" style={td}>
                                    {girls}
                                </td>
                            </tr>
                        );
                    })}
                    {category?.showTotal && (
                        <tr style={table}>
                            <td style={th}>{category?.total?.status}</td>
                            {bands.map(band => (
                                <td colSpan={2} className="align" style={td}>
                                    {bandTotal(band.field)}
                                </td>
                            ))}
                            <td colSpan={2} className="align" style={td}>
                                {bands.reduce(
                                    (sum, band) => sum + bandTotal(band.field),
                                    0,
                                )}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export { ReportContent };
