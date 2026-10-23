import { useState } from 'react';
import { categoryDictionary } from '../utils/Array';
import { timeStampToDateString } from '../utils/DateFormatter';

const table = {
    margin: 'auto',
    padding: 'auto',
    alignItems: 'center',
    width: '10%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;

const fixedColumn = {
    ...table,
    width: '75px',
    minWidth: '75px',
    maxWidth: '75px',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'normal',
} as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;
// Sentinel page size meaning "show every beneficiary on one page".
const ALL = 0;

// Page numbers to show: always first/last, a window around the current
// page, and `null` where a gap should be rendered as an ellipsis.
const getPageItems = (current: number, total: number): Array<number | null> => {
    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = Array.from(pages)
        .filter(p => p >= 1 && p <= total)
        .sort((a, b) => a - b);
    const items: Array<number | null> = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) items.push(null);
        items.push(p);
    });
    return items;
};

type Props = {
    beneficiaries: Array<any>;
    program: string | undefined;
    physiology: string;
};

const EregistryBeneficiaries = ({
    beneficiaries,
    program,
    physiology,
}: Props) => {
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
    const [page, setPage] = useState<number>(1);

    const total = beneficiaries.length;
    const effectivePageSize = pageSize === ALL ? Math.max(total, 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
    // Clamp in case the dataset shrank since the page was selected.
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * effectivePageSize;
    const endIndex = Math.min(startIndex + effectivePageSize, total);
    const displayedBeneficiaries = beneficiaries.slice(startIndex, endIndex);

    return (
        <div>
            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={fixedColumn}>Admission Date</th>
                        <th style={table}>Name</th>
                        <th style={table}>Age</th>
                        <th style={table}>Birth Date</th>
                        {physiology === '' && <th style={table}>Gender</th>}
                        <th style={fixedColumn}>Address</th>

                        <th style={table}>Admission Type</th>
                        <th style={table}>Admission Criteria</th>
                        <th style={table}>Weight</th>
                        {physiology === '' && <th style={table}>WHZ</th>}

                        <th style={table}>Visit Date</th>
                        {program?.includes('OTP') && (
                            <th style={table}>Oedema</th>
                        )}
                        <th style={table}>MUAC</th>
                        {physiology === '' && <th style={table}>WHZ</th>}
                        <th style={table}>Status</th>
                        <th style={table}>Visit number</th>
                        <th style={table}>Exit Date</th>
                        <th style={table}>Exit Weight</th>
                        <th style={table}>Exit MUAC</th>
                        <th style={table}>Duration(days)</th>
                    </tr>
                </thead>
                <tbody style={table}>
                    {displayedBeneficiaries.map((beneficiary: any) => {
                        return [
                            <>
                                <tr style={table}>
                                    <td style={fixedColumn}>
                                        {beneficiary.admission_date}
                                    </td>
                                    <td style={table}>
                                        {beneficiary.firstName}{' '}
                                        {beneficiary.middleName}{' '}
                                        {beneficiary.lastName}
                                    </td>
                                    <td style={table}>{beneficiary.age}</td>

                                    <td style={table}>
                                        {beneficiary.birth_date}
                                    </td>

                                    {physiology === '' && (
                                        <td style={table}>
                                            {beneficiary.gender}
                                        </td>
                                    )}
                                    <td style={fixedColumn}>
                                        {beneficiary.address}
                                    </td>
                                    <td style={table}>
                                        {categoryDictionary(
                                            beneficiary.admissionType,
                                        )}
                                    </td>
                                    <td style={table}>
                                        {categoryDictionary(
                                            beneficiary.admissionChoice,
                                        )}
                                    </td>
                                    <td style={table}>{beneficiary.weight}</td>
                                    {physiology === '' && (
                                        <td style={table}>
                                            {beneficiary.whzScore}
                                        </td>
                                    )}

                                    <td style={table} />
                                    {program?.includes('OTP') && (
                                        <td style={table}>
                                            {beneficiary?.oedemaStatus}
                                        </td>
                                    )}

                                    <td style={table} />
                                    {physiology === '' && <td style={table} />}

                                    <td style={table}>
                                        {categoryDictionary(
                                            beneficiary.exit_type,
                                        )}
                                    </td>
                                    <td style={table}>
                                        {beneficiary.visit_number}
                                    </td>
                                    <td style={table}>
                                        {beneficiary?.exitDate}
                                    </td>
                                    <td style={table}>
                                        {beneficiary?.exit?.exitWeight}
                                    </td>
                                    <td style={table}>
                                        {beneficiary.exitMuac}
                                    </td>
                                    <td style={table}>
                                        {beneficiary?.lengthOfStay}
                                    </td>
                                </tr>
                                {beneficiary?.visits.map((visit: any) => {
                                    let oedemaStatus = null;

                                    if (
                                        visit?.values?.oedema_status__int__ !==
                                        '0'
                                    ) {
                                        oedemaStatus =
                                            visit?.values?.oedema_severity ===
                                            '1'
                                                ? '+'
                                                : visit?.values
                                                      ?.oedema_severity === '2'
                                                ? '++'
                                                : visit?.values
                                                      ?.oedema_severity === '3'
                                                ? '+++'
                                                : '';
                                    }
                                    return (
                                        <tr style={table}>
                                            {(physiology === '' && (
                                                <td
                                                    style={table}
                                                    colSpan={10}
                                                />
                                            )) || (
                                                <td style={table} colSpan={8} />
                                            )}

                                            <td style={table}>
                                                {timeStampToDateString(
                                                    visit?.values?.visit_date ??
                                                        visit?.createdAt,
                                                )}
                                            </td>
                                            {program?.includes('OTP') && (
                                                <td style={table}>
                                                    {oedemaStatus}
                                                </td>
                                            )}
                                            <td style={table}>
                                                {visit?.values?.muac}
                                            </td>

                                            {physiology === '' && (
                                                <td style={table}>
                                                    {visit?.values?._whz_score}
                                                </td>
                                            )}

                                            <td style={table} colSpan={7} />
                                        </tr>
                                    );
                                })}
                            </>,
                        ];
                    })}
                </tbody>
            </table>
            <div className="pagination">
                <div className="pagination-info">
                    {total === 0 ? (
                        'No beneficiaries'
                    ) : (
                        <>
                            Showing <strong>{startIndex + 1}</strong>–
                            <strong>{endIndex}</strong> of{' '}
                            <strong>{total}</strong> beneficiaries
                        </>
                    )}
                </div>
                <div className="pagination-pages">
                    <button
                        className="pagination-button"
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        aria-label="Previous page"
                    >
                        ‹
                    </button>
                    {getPageItems(currentPage, totalPages).map((item, i) =>
                        item === null ? (
                            <span
                                key={`gap-${i}`}
                                className="pagination-ellipsis"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                className={`pagination-button${
                                    item === currentPage ? ' active' : ''
                                }`}
                                onClick={() => setPage(item)}
                                aria-current={
                                    item === currentPage ? 'page' : undefined
                                }
                            >
                                {item}
                            </button>
                        ),
                    )}
                    <button
                        className="pagination-button"
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                    >
                        ›
                    </button>
                </div>
                <label className="pagination-size">
                    Rows per page
                    <select
                        value={pageSize}
                        onChange={e => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                        <option value={ALL}>All</option>
                    </select>
                </label>
            </div>
        </div>
    );
};
export { EregistryBeneficiaries };
