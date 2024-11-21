import { useState } from "react";
import "./App.css";
import LoadForms from "./Android";
import { some } from "lodash";
import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";
import DatePicker from "react-date-picker";
import { ChildrenUnder5 } from "./report/ChildrenUnder5";
import { MedicalChildrenUnder5Report } from "./report/MedicalChildrenUnder5Report";
import { ERegistry } from "./report/ERegistry";
import { FolloWupCategories } from "./report/FollowUpCategories";
import { removeTime } from "./utils/DateFormatter";
import { beneficiaryFollowupCategories } from "./utils/Array";

const box = {
  width: "100%",
  margin: "auto",
  marginBottom: "55px",
  textAlign: "center",
  alignItems: "center",
  display: "flex",
} as const;

const calendarStyle = {
  width: "51%",
  textAlign: "center",
  alignItems: "center",
} as const;

const selector = {
  width: "100%",
  textAlign: "center",
  alignItems: "center",
  display: "flex",
} as const;

const period = {
  width: "90%",
  margin: "auto",
  textAlign: "center",
} as const;

const validatePeriod = {
  width: "80%",
  margin: "auto",
  textAlign: "center",
  alignItems: "center",
} as const;

function App() {
  const entities = LoadForms();
  const [entityType, setEntityType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  let [program, setProgram] = useState<string | null>(null);
  let [reportType, setReportType] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  let [category, setCategory] = useState<string | null>("");;

  let beneficiaryCategory = beneficiaryFollowupCategories(program);

  return (
    <div className="App">
      {entityType && (
        <button
          id="back"
          className="back"
          style={{ visibility: "hidden" }}
          onClick={() => {
            if (reportType) {
              setReportType(null);
              setStartDate(startDate);
              setEndDate(endDate);
              setProgram(program);
              setEntityType(entityType);
              setIsValidated(true);
              setCategory("");
            } else {
              if (program) {
                setProgram(null);
                setStartDate(startDate);
                setEndDate(endDate);
                setEntityType(entityType);
                setReportType(reportType);
                setIsValidated(isValidated);
                setCategory("");
              } else {
                if (isValidated) {
                  setIsValidated(false);
                  setStartDate(startDate);
                  setEndDate(endDate);
                  setEntityType(entityType);
                  setReportType(reportType);
                  setProgram(program);
                  setCategory("");
                } else {
                  if (startDate && endDate) {
                    setStartDate(null);
                    setEndDate(null);
                    setProgram(program);
                    setReportType(reportType);
                    setEntityType(entityType);
                    setIsValidated(false);
                    setCategory("");
                  } else {
                    if (entityType) {
                      setEntityType(null);
                      setStartDate(startDate);
                      setEndDate(endDate);
                      setProgram(program);
                      setReportType(reportType);
                      setIsValidated(true);
                      setCategory("");
                    } else {
                      if (category) {
                        setEntityType(entityType);
                        setStartDate(startDate);
                        setEndDate(endDate);
                        setProgram(program);
                        setReportType(reportType);
                        setIsValidated(true);
                        setCategory(category);
                      }
                    }
                  }
                }
              }
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
            onClick={() => setEntityType("CHILDRENUNDER5")}
          >
            Children under 5
          </button>
        </div>
      )}
      {entityType &&
        ["CHILDRENUNDER5"].includes(entityType) &&
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
        entityType === "CHILDRENUNDER5" &&
        startDate &&
        endDate &&
        isValidated &&
        !program && (
          <div>
            <h4 style={period}>
              Period to report:{" "}
              {`${startDate.toDateString()} to ${endDate.toDateString()}`}
            </h4>
            <h2> Choose the program </h2>
            <button
              className="EntityType"
              onClick={() => setProgram("TSFP-MAM")}
            >
              TSFP
            </button>
            <button
              className="EntityType"
              onClick={() => setProgram("OTP-SAM")}
            >
              OTP
            </button>
          </div>
        )}

      {entityType &&
        entityType === "CHILDRENUNDER5" &&
        startDate &&
        endDate &&
        isValidated &&
        program &&
        !reportType && (
          <div>
            <h4 style={period}>
              Period to report:{" "}
              {`${startDate.toDateString()} to ${endDate.toDateString()}`}
            </h4>
            <h2> Choose the report type for {program} </h2>
            {program.includes("TSFP") && !reportType && (
              <div>
                <button
                  className="EntityType"
                  onClick={() => setReportType("TSFP")}
                >
                  Main Report
                </button>
                <button
                  className="EntityType"
                  onClick={() => setReportType("medical_TSFP")}
                >
                  Medical Report
                </button>
                <button
                  className="EntityType"
                  onClick={() => setReportType("TSFP_followup_category")}
                >
                  Followup category
                </button>

                <button
                  className="EntityType"
                  onClick={() => setReportType("TSFP_eRegister")}
                >
                  eRegister
                </button>
              </div>
            )}

            {program.includes("OTP") && !reportType && (
              <div>
                <button
                  className="EntityType"
                  onClick={() => setReportType("OTP")}
                >
                  Main Report
                </button>

                <button
                  className="EntityType"
                  onClick={() => setReportType("medical_OTP")}
                >
                  Medical Report
                </button>
                <button
                  className="EntityType"
                  onClick={() => setReportType("OTP_followup_category")}
                >
                  Followup category
                </button>
                <button
                  className="EntityType"
                  onClick={() => setReportType("OTP_eRegister")}
                >
                  eRegister
                </button>
              </div>
            )}
          </div>
        )}
      {
        entityType &&
        entityType === "CHILDRENUNDER5" &&
        startDate &&
        endDate &&
        isValidated &&
        program &&
        reportType && ["OTP_followup_category", "TSFP_followup_category"].includes(reportType) &&
        (
          <div style={selector}>
            <select
              style={validatePeriod}
              name="category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {beneficiaryCategory.map((row: any) => (
                <option value={row.key} key={row.key}>
                  {row.label}
                </option>
              ))}
            </select>
          </div>
        )
      }

      {entityType &&
        entityType === "CHILDRENUNDER5" &&
        startDate &&
        endDate &&
        isValidated &&
        program &&
        reportType &&
        ((["OTP", "TSFP"].includes(reportType) &&
          ChildrenUnder5(
            entities.filter((entity) => {
              let startDateIsoString = removeTime(
                new Date(startDate.toISOString())
              );
              let endDateIsoString = removeTime(
                new Date(endDate.toISOString())
              );

              const visits = entity.visits.filter((visit) => {
                let nextVisitDays =
                  visit?.values?.next_visit ??
                  visit?.values?.next_visit_days ??
                  visit?.values?.number_of_days__int__ ??
                  visit?.values?.tsfp_next_visit ??
                  visit?.values?.TSFP_next_visit ??
                  visit?.values?.otp_next_visit ??
                  visit?.values?.OTP_next_visit;

                const nextVisit =
                  visit?.values?._display_next_visit ??
                  visit?.values?.new_next_visit__date__;
                const secondNextVisit = new Date(nextVisit).setDate(
                  new Date(nextVisit).getDate() + nextVisitDays
                );

                return (
                  (startDateIsoString <= removeTime(visit.createdAt) &&
                    endDateIsoString >= removeTime(visit.createdAt)) ||
                  (startDateIsoString <=
                    removeTime(new Date(visit?.values?.visit_date)) &&
                    endDateIsoString >=
                    removeTime(new Date(visit?.values?.visit_date))) ||
                  (startDateIsoString <=
                    removeTime(
                      new Date(visit?.values?.new_next_visit__date__)
                    ) &&
                    endDateIsoString >=
                    removeTime(
                      new Date(visit?.values?.new_next_visit__date__)
                    )) ||
                  (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                    endDateIsoString >= removeTime(new Date(nextVisit))) ||
                  (startDateIsoString <=
                    removeTime(new Date(secondNextVisit)) &&
                    endDateIsoString >= removeTime(new Date(secondNextVisit)))
                );
              });
              return some(visits, (visit) => {
                let nextVisitDays =
                  visit?.values?.next_visit_days ??
                  visit?.values?.number_of_days__int__ ??
                  visit?.values?.tsfp_next_visit ??
                  visit?.values?.TSFP_next_visit ??
                  visit?.values?.otp_next_visit ??
                  visit?.values?.OTP_next_visit;
                const nextVisit =
                  visit?.values?._display_next_visit ??
                  visit?.values?.new_next_visit__date__;
                const secondNextVisit = new Date(nextVisit).setDate(
                  new Date(nextVisit).getDate() + nextVisitDays
                );

                return (
                  (startDateIsoString <= removeTime(visit.createdAt) &&
                    endDateIsoString >= removeTime(visit.createdAt)) ||
                  (startDateIsoString <=
                    removeTime(new Date(visit?.values?.visit_date)) &&
                    endDateIsoString >=
                    removeTime(new Date(visit?.values?.visit_date))) ||
                  (startDateIsoString <=
                    removeTime(
                      new Date(visit?.values?.new_next_visit__date__)
                    ) &&
                    endDateIsoString >=
                    removeTime(
                      new Date(visit?.values?.new_next_visit__date__)
                    )) ||
                  (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                    endDateIsoString >= removeTime(new Date(nextVisit))) ||
                  (startDateIsoString <=
                    removeTime(new Date(secondNextVisit)) &&
                    endDateIsoString >= removeTime(new Date(secondNextVisit)))
                );
              });
            }),
            startDate,
            endDate,
            program
          )) ||
          (["medical_OTP", "medical_TSFP"].includes(reportType) &&
            MedicalChildrenUnder5Report(
              entities.filter((entity) => {
                let startDateIsoString = removeTime(
                  new Date(startDate.toISOString())
                );
                let endDateIsoString = removeTime(
                  new Date(endDate.toISOString())
                );

                const visits = entity.visits.filter((visit) => {
                  let nextVisitDays =
                    visit?.values?.next_visit ??
                    visit?.values?.next_visit_days ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.tsfp_next_visit ??
                    visit?.values?.TSFP_next_visit ??
                    visit?.values?.otp_next_visit ??
                    visit?.values?.OTP_next_visit;

                  const nextVisit =
                    visit?.values?._display_next_visit ??
                    visit?.values?.new_next_visit__date__;
                  const secondNextVisit = new Date(nextVisit).setDate(
                    new Date(nextVisit).getDate() + nextVisitDays
                  );

                  return (
                    (startDateIsoString <= removeTime(visit.createdAt) &&
                      endDateIsoString >= removeTime(visit.createdAt)) ||
                    (startDateIsoString <=
                      removeTime(new Date(visit?.values?.visit_date)) &&
                      endDateIsoString >=
                      removeTime(new Date(visit?.values?.visit_date))) ||
                    (startDateIsoString <=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      ) &&
                      endDateIsoString >=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      )) ||
                    (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                      endDateIsoString >= removeTime(new Date(nextVisit))) ||
                    (startDateIsoString <=
                      removeTime(new Date(secondNextVisit)) &&
                      endDateIsoString >= removeTime(new Date(secondNextVisit)))
                  );
                });
                return some(visits, (visit) => {
                  let nextVisitDays =
                    visit?.values?.next_visit_days ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.tsfp_next_visit ??
                    visit?.values?.TSFP_next_visit ??
                    visit?.values?.otp_next_visit ??
                    visit?.values?.OTP_next_visit;
                  const nextVisit =
                    visit?.values?._display_next_visit ??
                    visit?.values?.new_next_visit__date__;
                  const secondNextVisit = new Date(nextVisit).setDate(
                    new Date(nextVisit).getDate() + nextVisitDays
                  );

                  return (
                    (startDateIsoString <= removeTime(visit.createdAt) &&
                      endDateIsoString >= removeTime(visit.createdAt)) ||
                    (startDateIsoString <=
                      removeTime(new Date(visit?.values?.visit_date)) &&
                      endDateIsoString >=
                      removeTime(new Date(visit?.values?.visit_date))) ||
                    (startDateIsoString <=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      ) &&
                      endDateIsoString >=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      )) ||
                    (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                      endDateIsoString >= removeTime(new Date(nextVisit))) ||
                    (startDateIsoString <=
                      removeTime(new Date(secondNextVisit)) &&
                      endDateIsoString >= removeTime(new Date(secondNextVisit)))
                  );
                });
              }),
              startDate,
              endDate,
              program
            ))

          || (["TSFP_eRegister", "OTP_eRegister"].includes(reportType) &&
            ERegistry(program,
              entities.filter((entity) => {
                let startDateIsoString = removeTime(
                  new Date(startDate.toISOString())
                );
                let endDateIsoString = removeTime(
                  new Date(endDate.toISOString())
                );

                const visits = entity.visits.filter((visit) => {
                  let nextVisitDays =
                    visit?.values?.next_visit ??
                    visit?.values?.next_visit_days ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.tsfp_next_visit ??
                    visit?.values?.TSFP_next_visit ??
                    visit?.values?.otp_next_visit ??
                    visit?.values?.OTP_next_visit;

                  const nextVisit =
                    visit?.values?._display_next_visit ??
                    visit?.values?.new_next_visit__date__;
                  const secondNextVisit = new Date(nextVisit).setDate(
                    new Date(nextVisit).getDate() + nextVisitDays
                  );

                  return (
                    (startDateIsoString <= removeTime(visit.createdAt) &&
                      endDateIsoString >= removeTime(visit.createdAt)) ||
                    (startDateIsoString <=
                      removeTime(new Date(visit?.values?.visit_date)) &&
                      endDateIsoString >=
                      removeTime(new Date(visit?.values?.visit_date))) ||
                    (startDateIsoString <=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      ) &&
                      endDateIsoString >=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      )) ||
                    (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                      endDateIsoString >= removeTime(new Date(nextVisit))) ||
                    (startDateIsoString <=
                      removeTime(new Date(secondNextVisit)) &&
                      endDateIsoString >= removeTime(new Date(secondNextVisit)))
                  );
                });
                return some(visits, (visit) => {
                  let nextVisitDays =
                    visit?.values?.next_visit_days ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.tsfp_next_visit ??
                    visit?.values?.TSFP_next_visit ??
                    visit?.values?.otp_next_visit ??
                    visit?.values?.OTP_next_visit;
                  const nextVisit =
                    visit?.values?._display_next_visit ??
                    visit?.values?.new_next_visit__date__;
                  const secondNextVisit = new Date(nextVisit).setDate(
                    new Date(nextVisit).getDate() + nextVisitDays
                  );

                  return (
                    (startDateIsoString <= removeTime(visit.createdAt) &&
                      endDateIsoString >= removeTime(visit.createdAt)) ||
                    (startDateIsoString <=
                      removeTime(new Date(visit?.values?.visit_date)) &&
                      endDateIsoString >=
                      removeTime(new Date(visit?.values?.visit_date))) ||
                    (startDateIsoString <=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      ) &&
                      endDateIsoString >=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      )) ||
                    (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                      endDateIsoString >= removeTime(new Date(nextVisit))) ||
                    (startDateIsoString <=
                      removeTime(new Date(secondNextVisit)) &&
                      endDateIsoString >= removeTime(new Date(secondNextVisit)))
                  );
                });
              }),
              startDate,
              endDate
            )
          ) ||
          (
            category !== null && ["OTP_followup_category", "TSFP_followup_category"].includes(reportType) &&
            FolloWupCategories(category, program,
              entities.filter((entity) => {
                let startDateIsoString = removeTime(
                  new Date(startDate.toISOString())
                );
                let endDateIsoString = removeTime(
                  new Date(endDate.toISOString())
                );

                const visits = entity.visits.filter((visit) => {
                  let nextVisitDays =
                    visit?.values?.next_visit ??
                    visit?.values?.next_visit_days ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.tsfp_next_visit ??
                    visit?.values?.TSFP_next_visit ??
                    visit?.values?.otp_next_visit ??
                    visit?.values?.OTP_next_visit;

                  const nextVisit =
                    visit?.values?._display_next_visit ??
                    visit?.values?.new_next_visit__date__;
                  const secondNextVisit = new Date(nextVisit).setDate(
                    new Date(nextVisit).getDate() + nextVisitDays
                  );

                  return (
                    (startDateIsoString <= removeTime(visit.createdAt) &&
                      endDateIsoString >= removeTime(visit.createdAt)) ||
                    (startDateIsoString <=
                      removeTime(new Date(visit?.values?.visit_date)) &&
                      endDateIsoString >=
                      removeTime(new Date(visit?.values?.visit_date))) ||
                    (startDateIsoString <=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      ) &&
                      endDateIsoString >=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      )) ||
                    (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                      endDateIsoString >= removeTime(new Date(nextVisit))) ||
                    (startDateIsoString <=
                      removeTime(new Date(secondNextVisit)) &&
                      endDateIsoString >= removeTime(new Date(secondNextVisit)))
                  );
                });
                return some(visits, (visit) => {
                  let nextVisitDays =
                    visit?.values?.next_visit_days ??
                    visit?.values?.number_of_days__int__ ??
                    visit?.values?.tsfp_next_visit ??
                    visit?.values?.TSFP_next_visit ??
                    visit?.values?.otp_next_visit ??
                    visit?.values?.OTP_next_visit;
                  const nextVisit =
                    visit?.values?._display_next_visit ??
                    visit?.values?.new_next_visit__date__;
                  const secondNextVisit = new Date(nextVisit).setDate(
                    new Date(nextVisit).getDate() + nextVisitDays
                  );

                  return (
                    (startDateIsoString <= removeTime(visit.createdAt) &&
                      endDateIsoString >= removeTime(visit.createdAt)) ||
                    (startDateIsoString <=
                      removeTime(new Date(visit?.values?.visit_date)) &&
                      endDateIsoString >=
                      removeTime(new Date(visit?.values?.visit_date))) ||
                    (startDateIsoString <=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      ) &&
                      endDateIsoString >=
                      removeTime(
                        new Date(visit?.values?.new_next_visit__date__)
                      )) ||
                    (startDateIsoString <= removeTime(new Date(nextVisit)) &&
                      endDateIsoString >= removeTime(new Date(nextVisit))) ||
                    (startDateIsoString <=
                      removeTime(new Date(secondNextVisit)) &&
                      endDateIsoString >= removeTime(new Date(secondNextVisit)))
                  );
                });
              }),
              startDate,
              endDate)
          )
        )}
    </div>
  );
}
export default App;