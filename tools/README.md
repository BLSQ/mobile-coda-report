# Scenario fixtures

`src/test/fixtures/*.json` holds beneficiaries filled in the **real forms of the server**: a
registration and the visits of a scenario (child TSFP, OTP, BSFP...), in the exact shape the native
WebView bridge sends to the report (see `InstanceToReportCache.kt` in the mobile app).

The answers go through JavaRosa, the form engine of the phone, so the fixtures carry what the forms
of the server actually compute — programme, admission type, MUAC colour, ration quantities, next
visit date. A test therefore fails when the configuration of the forms and what the report expects
drift apart, which is the point: the report reads field names and option codes that only exist by
convention between the two projects.

For example the Bangladesh config matches `admission_type === 'new_case_MUAC'`. Between 14 and
16 September 2026 the form saved `new_case_muac` in lower case; with fixtures regenerated in that
window, the "New admissions" line of the report falls to zero and the test fails.

## Regenerating the fixtures

```bash
CODA_QA_TOKEN=<token> REPLAY_DIR=<path to the replay harness> python3 tools/generate_fixtures.py
```

The replay harness (`wf.py`, `fetch_inputs.py`, `odk.jar`, `driver/`) fills a form with JavaRosa and
applies the change mapping of the workflow the way the phone does. Before generating, run
`python3 fetch_inputs.py` in that folder to download the current forms and workflows of the server;
the fixtures then describe that configuration.

`JAVA=/path/to/java` points at a Java 17 runtime when the one on the PATH is older.

## Adding a scenario

`tools/scenarios.py` holds them. A scenario is a registration plus a list of `(form id, answers)`
visits, and only contains what a field worker types: everything else is computed by the form, and
the answers a form requires but the scenario does not mention are filled with a neutral value.

Two rules:

-   Never put the name of a field of the beneficiary record (for example `is_pregnant`) in the
    answers. The phone prefills those from the record, and overwriting them hides the bugs these
    tests look for.
-   The form engine reads the system clock for `today()`, which the forms use for the visit date, the
    age and the next visit date. Every scenario is therefore filled as of the day the fixtures are
    generated, with its visits half an hour apart, and the tests read the period of the report from
    the fixture itself. Spreading a scenario over real weeks needs a fake clock for the JVM
    (`faketime`), which is not set up here.
