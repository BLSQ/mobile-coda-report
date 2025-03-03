import { useState } from 'react';
import './App.css';
import LoadForms from './Android';
import 'react-calendar/dist/Calendar.css';
import 'react-date-picker/dist/DatePicker.css';
import DatePicker from 'react-date-picker';
import { ChildrenUnder5 } from './report/ChildrenUnder5';
import { PBWGMainReport } from './report/PBWG/PBWGMainReport';
import { MedicalChildrenUnder5Report } from './report/MedicalChildrenUnder5Report';
import { PBWGMedicalReport } from './report/PBWG/PBWGMedicalReport';
import { ERegistry } from './report/ERegistry';
import { FolloWupCategories } from './report/FollowUpCategories';
import { PBWGFollowUpCategories } from './report/PBWG/PBWGFollowUpCategories';
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
    const allEntities = LoadForms();
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
    let [validateCategory, setValidateCategory] = useState<string | null>(null);

    const beneficiaryCategory = beneficiaryFollowupCategories(program);
    const entitiesByEntityType = allEntities.filter(
        entity => entity.entityTypeName === entityType,
    );
    const entities = entitiesWithVisits(
        entitiesByEntityType,
        startDate,
        endDate,
    );

    return (
        <div className="App">
            {entityType && (
                <button
                    id="back"
                    className="back"
                    style={{ visibility: 'hidden' }}
                    onClick={() => {
                        if (reportType) {
                            setReportType(null);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setProgram(program);
                            setEntityType(entityType);
                            setIsValidated(true);
                            setCategory('');
                            setPhysiologyStatus(null);
                        } else if (program) {
                            setProgram(null);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setEntityType(entityType);
                            setReportType(reportType);
                            setIsValidated(isValidated);
                            setCategory('');
                            setPhysiologyStatus(physiologyStatus);
                        } else if (isValidated) {
                            setIsValidated(false);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setEntityType(entityType);
                            setReportType(reportType);
                            setProgram(program);
                            setCategory('');
                            setPhysiologyStatus(physiologyStatus);
                        } else if (startDate && endDate) {
                            setStartDate(null);
                            setEndDate(null);
                            setProgram(program);
                            setReportType(reportType);
                            setEntityType(entityType);
                            setIsValidated(false);
                            setCategory('');
                            setPhysiologyStatus(physiologyStatus);
                        } else if (entityType) {
                            setEntityType(null);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setProgram(program);
                            setReportType(reportType);
                            setIsValidated(true);
                            setCategory('');
                            setPhysiologyStatus(physiologyStatus);
                        } else if (category) {
                            setEntityType(entityType);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setProgram(program);
                            setReportType(reportType);
                            setIsValidated(true);
                            setCategory(category);
                            setPhysiologyStatus(physiologyStatus);
                            setValidateCategory(null);
                        } else if (validateCategory) {
                            setEntityType(entityType);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setProgram(program);
                            setReportType(reportType);
                            setIsValidated(true);
                            setCategory(category);
                            setValidateCategory(category);
                            setPhysiologyStatus(physiologyStatus);
                        } else if (physiologyStatus) {
                            setEntityType(entityType);
                            setStartDate(startDate);
                            setEndDate(endDate);
                            setProgram(program);
                            setReportType(reportType);
                            setIsValidated(true);
                            setCategory(category);
                            setValidateCategory(validateCategory);
                            setPhysiologyStatus(null);
                        }
                    }}
                >
                    &lt;back
                </button>
            )}
            {!entityType && (
                <div>
                    <h1>Choose beneficiary type </h1>
                    <button
                        className="EntityType"
                        onClick={() => setEntityType('Child Under 5')}
                    >
                        Children under 5
                    </button>

                    <button
                        className="EntityType"
                        onClick={() => setEntityType('PBWG')}
                    >
                        Pregnant and breastfeeding women and girls
                    </button>
                </div>
            )}
            {entityType &&
                ['Child Under 5', 'PBWG'].includes(entityType) &&
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
                entityType === 'Child Under 5' &&
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
                        <button
                            className="EntityType"
                            onClick={() => setProgram('TSFP')}
                        >
                            TSFP
                        </button>
                        <button
                            className="EntityType"
                            onClick={() => setProgram('OTP')}
                        >
                            OTP
                        </button>
                    </div>
                )}

            {entityType &&
                entityType === 'Child Under 5' &&
                startDate &&
                endDate &&
                isValidated &&
                program &&
                !reportType && (
                    <div>
                        <h4 style={period}>
                            Period to report:{' '}
                            {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                        </h4>
                        <h2> Choose the report type for {program} </h2>
                        {program.includes('TSFP') && !reportType && (
                            <div>
                                <button
                                    className="EntityType"
                                    onClick={() => setReportType('TSFP')}
                                >
                                    Main Report
                                </button>
                                <button
                                    className="EntityType"
                                    onClick={() =>
                                        setReportType('medical_TSFP')
                                    }
                                >
                                    Medical Report
                                </button>
                                <button
                                    className="EntityType"
                                    onClick={() =>
                                        setReportType('TSFP_followup_category')
                                    }
                                >
                                    Followup category
                                </button>

                                <button
                                    className="EntityType"
                                    onClick={() =>
                                        setReportType('TSFP_eRegister')
                                    }
                                >
                                    eRegister
                                </button>
                            </div>
                        )}

                        {program.includes('OTP') && !reportType && (
                            <div>
                                <button
                                    className="EntityType"
                                    onClick={() => setReportType('OTP')}
                                >
                                    Main Report
                                </button>

                                <button
                                    className="EntityType"
                                    onClick={() => setReportType('medical_OTP')}
                                >
                                    Medical Report
                                </button>
                                <button
                                    className="EntityType"
                                    onClick={() =>
                                        setReportType('OTP_followup_category')
                                    }
                                >
                                    Followup category
                                </button>
                                <button
                                    className="EntityType"
                                    onClick={() =>
                                        setReportType('OTP_eRegister')
                                    }
                                >
                                    eRegister
                                </button>
                            </div>
                        )}
                    </div>
                )}
            {entityType &&
                ['Child Under 5', 'PBWG']?.includes(entityType) &&
                startDate &&
                endDate &&
                isValidated &&
                ((program && program !== '') ||
                    (physiologyStatus && physiologyStatus !== '')) &&
                reportType &&
                [
                    'OTP_followup_category',
                    'TSFP_followup_category',
                    'PBWG_followup',
                ].includes(reportType) && (
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
                entityType === 'Child Under 5' &&
                startDate &&
                endDate &&
                isValidated &&
                program &&
                reportType &&
                ((['OTP', 'TSFP'].includes(reportType) &&
                    ChildrenUnder5(
                        entities,
                        startDate,
                        endDate,
                        program,
                        entityType,
                    )) ||
                    (['medical_OTP', 'medical_TSFP'].includes(reportType) &&
                        MedicalChildrenUnder5Report(
                            entities,
                            startDate,
                            endDate,
                            program,
                        )) ||
                    (['TSFP_eRegister', 'OTP_eRegister'].includes(reportType) &&
                        ERegistry(
                            program,
                            entities,
                            startDate,
                            endDate,
                            'Child Under 5',
                            '',
                        )) ||
                    (category !== null &&
                        [
                            'OTP_followup_category',
                            'TSFP_followup_category',
                        ].includes(reportType) &&
                        FolloWupCategories(
                            category,
                            program,
                            entities,
                            startDate,
                            endDate,
                            entityType,
                        )))}

            {entityType &&
                entityType === 'PBWG' &&
                startDate &&
                endDate &&
                isValidated &&
                !program &&
                !reportType && (
                    <div>
                        <h4 style={period}>
                            Period to report:{' '}
                            {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                        </h4>
                        <h2> Choose the report type for {entityType} </h2>
                        <button
                            className="EntityType"
                            onClick={() => setReportType('TSFP')}
                        >
                            TSFP
                        </button>

                        <button
                            className="EntityType"
                            onClick={() => setReportType('medical')}
                        >
                            Medical
                        </button>
                        <button
                            className="EntityType"
                            onClick={() => setReportType('PBWG_followup')}
                        >
                            Followup category
                        </button>
                        <button
                            className="EntityType"
                            onClick={() => setReportType('PBWG_eRegister')}
                        >
                            eRegister
                        </button>
                    </div>
                )}

            {
                //physiologyStatus
                entityType &&
                    entityType === 'PBWG' &&
                    startDate &&
                    endDate &&
                    isValidated &&
                    reportType &&
                    //program &&
                    ['PBWG_followup', 'PBWG_eRegister']?.includes(reportType) &&
                    (!physiologyStatus || physiologyStatus == null) && (
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
                                onClick={() =>
                                    setPhysiologyStatus('breastfeeding')
                                }
                            >
                                Breastfeeding
                            </button>
                        </div>
                    )
            }

            {entityType &&
                entityType === 'PBWG' &&
                startDate &&
                endDate &&
                isValidated &&
                //program &&
                reportType &&
                ((['TSFP'].includes(reportType) &&
                    PBWGMainReport(
                        entities,
                        startDate,
                        endDate,
                        reportType,
                        entityType,
                    )) ||
                    (['medical'].includes(reportType) &&
                        PBWGMedicalReport(
                            entities,
                            startDate,
                            endDate,
                            'TSFP',
                        )) ||
                    (physiologyStatus &&
                        category !== null &&
                        ['PBWG_followup'].includes(reportType) &&
                        PBWGFollowUpCategories(
                            category,
                            'TSFP',
                            entities,
                            startDate,
                            endDate,
                            entityType,
                            physiologyStatus,
                        )) ||
                    (physiologyStatus &&
                        ['PBWG_eRegister'].includes(reportType) &&
                        ERegistry(
                            'TSFP',
                            entities?.filter(
                                entity =>
                                    entity?.profile?.values
                                        ?.physiology_status ===
                                    physiologyStatus,
                            ),
                            startDate,
                            endDate,
                            entityType,
                            physiologyStatus,
                        )))}
        </div>
    );
}
export default App;
