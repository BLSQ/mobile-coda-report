import { useEffect, useMemo, useState } from 'react';
import './App.css';
import LoadFormsForEntityType from './Android';
import Entity from './entity/Entity';
import Form from './entity/Form';
import 'react-calendar/dist/Calendar.css';
import 'react-date-picker/dist/DatePicker.css';
import DatePicker from 'react-date-picker';
import { reportConfig, ReportContext } from './config/reportConfig';
import { beneficiaryFollowupCategories } from './utils/Array';
import { entitiesWithVisits } from './utils/DataFilter';

const box = {
    width: '100%',
    margin: 'auto',
    marginBottom: '55px',
    textAlign: 'center',
    alignItems: 'center',
    display: 'flex',
} as const;

const calendarStyle = {
    width: '51%',
    textAlign: 'center',
    alignItems: 'center',
} as const;

const selector = {
    width: '100%',
    textAlign: 'center',
    alignItems: 'center',
    display: 'flex',
} as const;

const period = {
    width: '90%',
    margin: 'auto',
    textAlign: 'center',
} as const;

const validatePeriod = {
    width: '80%',
    margin: 'auto',
    textAlign: 'center',
    alignItems: 'center',
} as const;

function App() {
    const [entityType, setEntityType] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<any>(null);
    const [endDate, setEndDate] = useState<any>(null);
    const [program, setProgram] = useState<string | null>(null);
    const [reportType, setReportType] = useState<string | null>(null);
    const [isValidated, setIsValidated] = useState<boolean | null>(null);
    const [category, setCategory] = useState<string | null>('');
    const [physiologyStatus, setPhysiologyStatus] = useState<string | null>(
        null,
    );
    const [allForms, setAllForms] = useState<Form[]>([]);
    const [allEntities, setAllEntities] = useState<Entity[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Fetches only the submissions for the chosen beneficiary type — the
    // bridge call is scoped to `entityType`, so this re-runs each time the
    // user picks a different one (including back to null, which resolves
    // immediately with nothing to show).
    useEffect(() => {
        setIsLoading(true);
        LoadFormsForEntityType(entityType, ({ forms, entities }) => {
            setAllForms(forms);
            setAllEntities(entities);
            setIsLoading(false);
        });
    }, [entityType]);

    const beneficiaryCategory = beneficiaryFollowupCategories(program);
    const entities = useMemo(
        () => entitiesWithVisits(allEntities, startDate, endDate),
        [allEntities, startDate, endDate],
    );

    const entityTypeConfig =
        reportConfig.find(option => option.key === entityType) ?? null;
    // Child Under 5 asks for a program (TSFP/OTP/BSFP) before showing
    // report types; PBWG has no program step and goes straight to its
    // report options.
    const needsProgramStep = !!entityTypeConfig?.programs;
    const programConfig = needsProgramStep
        ? entityTypeConfig?.programs?.find(option => option.key === program) ??
          null
        : entityTypeConfig;
    // Mirrors the original per-entity-type rule: Child Under 5 needs a
    // program selected before showing report types; PBWG has no program
    // step at all, so it must stay unset.
    const programStepSatisfied = needsProgramStep ? !!program : !program;
    const reportOption =
        programConfig?.reportOptions?.find(
            option => option.key === reportType,
        ) ?? null;
    // A report is ready to render once its option is selected and, if it
    // needs one, a physiology status has been chosen.
    const gatesSatisfied =
        !!reportOption &&
        (!reportOption.needsPhysiologyStatus || !!physiologyStatus);

    const reportContext: ReportContext = useMemo(
        () => ({
            entities,
            forms: allForms,
            startDate,
            endDate,
            program: program ?? '',
            reportType: reportType ?? '',
            entityType: entityType ?? '',
            category: category ?? '',
            physiologyStatus,
        }),
        [
            entities,
            allForms,
            startDate,
            endDate,
            program,
            reportType,
            entityType,
            category,
            physiologyStatus,
        ],
    );
    // The heaviest computation in the app (each report crunches the full
    // entity/visit list) — worth skipping when neither the resolved report
    // option nor its context actually changed.
    const renderedReport = useMemo(
        () => (gatesSatisfied ? reportOption?.render(reportContext) : null),
        [gatesSatisfied, reportOption, reportContext],
    );

    return (
        <div className="App">
            {isLoading && (
                <div className="Loading">
                    We are fetching the data, please wait.
                </div>
            )}
            {entityType && (
                <button
                    id="back"
                    className="back"
                    style={{ visibility: 'hidden' }}
                    onClick={() => {
                        // `entityType` is always truthy here (this button
                        // only renders once it's set), so it's the
                        // guaranteed fallthrough once the earlier steps are
                        // cleared — each step is undone in turn, one per
                        // click, and the category filter always resets.
                        if (reportType) {
                            setReportType(null);
                            setPhysiologyStatus(null);
                        } else if (program) {
                            setProgram(null);
                        } else if (isValidated) {
                            setIsValidated(false);
                        } else if (startDate && endDate) {
                            setStartDate(null);
                            setEndDate(null);
                        } else if (entityType) {
                            setEntityType(null);
                        }
                        setCategory('');
                    }}
                >
                    &lt;back
                </button>
            )}

            {!entityType && (
                <div>
                    <h1>Choose beneficiary type </h1>
                    {reportConfig.map(option => (
                        <button
                            key={option.key}
                            className="EntityType"
                            onClick={() => setEntityType(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {entityType &&
                entityTypeConfig &&
                (!startDate || !endDate || !isValidated) && (
                    <div>
                        <h1>Choose a period </h1>
                        <div style={box}>
                            <div style={calendarStyle}>
                                <h4>From </h4>
                                <DatePicker
                                    className="react-date-picker"
                                    calendarAriaLabel="Toggle calendar"
                                    onChange={setStartDate}
                                    value={startDate}
                                    maxDate={endDate ?? new Date()}
                                />
                            </div>
                            <div style={calendarStyle}>
                                <h4>Until </h4>
                                <DatePicker
                                    className="react-date-picker"
                                    calendarAriaLabel="Toggle calendar"
                                    onChange={setEndDate}
                                    value={endDate}
                                    minDate={startDate}
                                    maxDate={new Date()}
                                />
                            </div>
                        </div>

                        {startDate && endDate && (
                            <div style={validatePeriod}>
                                <button
                                    className="EntityType"
                                    style={validatePeriod}
                                    onClick={() => setIsValidated(true)}
                                >
                                    Validate
                                </button>
                            </div>
                        )}
                    </div>
                )}

            {entityType &&
                needsProgramStep &&
                startDate &&
                endDate &&
                isValidated &&
                !program && (
                    <div>
                        <h4 style={period}>
                            Period to report:{' '}
                            {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                        </h4>
                        <h2> Choose the program </h2>
                        {entityTypeConfig?.programs?.map(option => (
                            <button
                                key={option.key}
                                className="EntityType"
                                onClick={() => setProgram(option.key)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}

            {entityType &&
                programConfig &&
                startDate &&
                endDate &&
                isValidated &&
                programStepSatisfied &&
                !reportType && (
                    <div>
                        <h4 style={period}>
                            Period to report:{' '}
                            {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                        </h4>
                        <h2>
                            {' '}
                            Choose the report type for{' '}
                            {needsProgramStep ? program : entityType}{' '}
                        </h2>
                        {programConfig.reportOptions?.map(option => (
                            <button
                                key={option.key}
                                className="EntityType"
                                onClick={() => setReportType(option.key)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}

            {entityType &&
                startDate &&
                endDate &&
                isValidated &&
                reportOption?.needsCategory &&
                gatesSatisfied && (
                    <div style={selector}>
                        <select
                            style={validatePeriod}
                            name="category"
                            onChange={e => setCategory(e.target.value)}
                        >
                            {beneficiaryCategory.map((row: any) => (
                                <option value={row.key} key={row.key}>
                                    {row.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

            {entityType &&
                startDate &&
                endDate &&
                isValidated &&
                reportOption?.needsPhysiologyStatus &&
                !physiologyStatus && (
                    <div>
                        <h4 style={period}>
                            Period to report:{' '}
                            {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                        </h4>
                        <h2> Choose the physiology type </h2>
                        <button
                            className="EntityType"
                            onClick={() => setPhysiologyStatus('pregnant')}
                        >
                            Pregnant
                        </button>

                        <button
                            className="EntityType"
                            onClick={() => setPhysiologyStatus('breastfeeding')}
                        >
                            Breastfeeding
                        </button>
                    </div>
                )}

            {entityType &&
                startDate &&
                endDate &&
                isValidated &&
                gatesSatisfied &&
                renderedReport}
        </div>
    );
}
export default App;
