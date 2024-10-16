import React, { useState } from "react";
import "./App.css";
import LoadForms from "./Android";
import "react-calendar/dist/Calendar.css";
import "react-date-picker/dist/DatePicker.css";
import DatePicker from "react-date-picker";
import { ChildrenUnder5 } from "./report/ChildrenUnder5";

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

  console.info("ENTITY TYPE ...:", entityType);
  console.info("REPORT TYPE ...:", reportType);
  console.info("PROGRAM ...:", program);
  console.info("START DATE ...:", startDate);
  console.info("END DATE ...:", endDate);
  console.info("IS VALIDATED ...:", isValidated);

  return (
    <div className="App">
      {entityType && (
        <button
          id="back"
          className="back"
          style={{ visibility: "visible" }}
          onClick={() => {
            if (reportType) {
              setReportType(null);
              setStartDate(startDate);
              setEndDate(endDate);
              setProgram(program);
              setEntityType(entityType);
              setIsValidated(true);
            } else {
              if (program) {
                setProgram(null);
                setEntityType(entityType);
                setReportType(reportType);
                setStartDate(startDate);
                setEndDate(endDate);
                setIsValidated(isValidated);
              } else {
                if (isValidated) {
                  setIsValidated(false);
                  setStartDate(startDate);
                  setEndDate(endDate);
                  setEntityType(entityType);
                  setReportType(reportType);
                  setProgram(program);
                } else {
                  if(startDate && endDate){
                    setStartDate(null);
													setEndDate(null);
													setProgram(program);
													setReportType(reportType);
													setEntityType(entityType);
													setIsValidated(false);
                  }else{
                    if (entityType) {
                    setEntityType(null);
                    setStartDate(startDate);
                    setEndDate(endDate);
                    setProgram(program);
                    setReportType(reportType);
                    setIsValidated(true);
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
            onClick={() => setEntityType("SSD_CHILDREN")}
          >
            SSD Children under 5
          </button>
        </div>
      )}

      {entityType &&
        ["SSD_CHILDREN"].includes(entityType) &&
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

            {entityType &&
              ["SSD_CHILDREN"].includes(entityType) &&
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
                    onClick={() => setProgram("TSFP")}
                  >
                    TSFP
                  </button>
                  <button
                    className="EntityType"
                    onClick={() => setProgram("OTP")}
                  >
                    OTP
                  </button>
                </div>
              )}
            {entityType &&
              entityType === "SSD_CHILDREN" &&
              startDate &&
              endDate &&
              isValidated &&
              program &&
              (
                <div>
                  <h4 style={period}>
                    Period to report:{" "}
                    {`${startDate.toDateString()} to ${endDate.toDateString()}`}
                  </h4>
                  <h2> Choose the report type for {program} </h2>
                  {program === "TSFP" && !reportType && (
                    <div>
                      <button
                        className="EntityType"
                        onClick={() => setReportType("TSFP")}
                      >
                        Main Report
                      </button>
                    </div>
                  )}

                  {program === "OTP" && !reportType && (
                    <div>
                      <button
                        className="EntityType"
                        onClick={() => setReportType("OTP")}
                      >
                        Main Report
                      </button>
                    </div>
                  )}
                </div>
              )}

            {entityType &&
              entityType === "SSD_CHILDREN" &&
              startDate &&
              endDate &&
              isValidated &&
              program &&
              reportType &&
              ["OTP", "TSFP"].includes(reportType) &&
              ChildrenUnder5(entities, startDate, endDate, program)}
          </div>
        )}
    </div>
  );
}
export default App;
