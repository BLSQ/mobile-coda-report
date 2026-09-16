"""Build report fixtures by filling the real CODA forms with the ODK form engine.

Every fixture is one beneficiary: a registration submission plus the visits of a scenario
(child TSFP, OTP, BSFP...), in the exact shape the native WebView bridge sends to the report
(`InstanceToReportCache.kt`): one row per submission, with `values` holding the answers and the
calculated fields of the form.

The answers go through JavaRosa, the engine the phone uses, so the fixtures carry what the forms
of the server really compute (programme, admission type, colours, calculated dates) instead of
values typed by hand in a test.

Usage
-----
    CODA_QA_TOKEN=... REPLAY_DIR=/path/to/replay python3 tools/generate_fixtures.py

`REPLAY_DIR` is the replay harness (`wf.py`, `fetch_inputs.py`, `odk.jar`, `driver/`). Run
`python3 fetch_inputs.py` there first to download the current forms and workflows of the server;
the fixtures then match the configuration of that moment, which is the point of the exercise.
`JAVA` can point at a Java 17 runtime when the one on the PATH is older. Questions a scenario
leaves out but the form requires are answered automatically with a neutral value (no, none,
normal...), so a scenario only has to state what matters to the report.
"""

import importlib.util
import json
import os
import sys

from datetime import datetime, timedelta, timezone
from pathlib import Path


autofill = None


REPLAY_DIR = Path(os.environ.get("REPLAY_DIR", "")).expanduser()
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "test" / "fixtures"
ORG_UNIT = {"id": "OU-1", "name": "Camp 4 INF"}
# The form engine reads the system clock for today(), which the forms use for the visit date, the
# age and the next visit date. Every scenario is therefore filled as of the day the fixtures are
# generated, with the visits half an hour apart; the tests read the period from the fixture itself.
# Spreading a scenario over real weeks would need a fake clock for the JVM (faketime).
GENERATED_AT = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)
MINUTES_BETWEEN_VISITS = 30


def load_harness():
    if not (REPLAY_DIR / "wf.py").exists():
        sys.exit("Set REPLAY_DIR to the replay harness (the folder holding wf.py and odk.jar).")
    os.chdir(REPLAY_DIR)
    spec = importlib.util.spec_from_file_location("wf", REPLAY_DIR / "wf.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules["wf"] = module
    spec.loader.exec_module(module)
    return module


def load_autofill():
    """Answers the required questions a scenario does not mention, with a neutral value."""
    spec = importlib.util.spec_from_file_location("autofill", REPLAY_DIR / "autofill.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules["autofill"] = module
    spec.loader.exec_module(module)
    return module


def epoch_millis(moment):
    return int(moment.timestamp() * 1000)


def row(wf, entity_id, instance_id, form_id, values, moment, entity_type_id, entity_type_name):
    """One submission, as `InstanceToReportCache.kt` writes it into the report cache."""
    form = wf.FORMS[form_id]
    version = (form.get("latest_form_version") or {}).get("version_id")
    return {
        "id": instance_id,
        "entityId": entity_id,
        "entityTypeId": str(entity_type_id),
        "entityTypeName": entity_type_name,
        "formId": str(form_id),
        "formName": form["name"],
        "formFormId": form["form_id"],
        "formVersionId": version,
        "createdAt": epoch_millis(moment),
        "updatedAt": epoch_millis(moment),
        "orgUnitId": ORG_UNIT["id"],
        "orgUnitName": ORG_UNIT["name"],
        "parentOrgUnitId": None,
        "periodId": None,
        "values": values,
    }


def build(wf, scenario):
    """Fill the registration form and every visit of a scenario, and return the rows."""
    entity_type = scenario["entity_type"]
    reference_form = wf.REF[wf.resolve(entity_type["workflow"])]
    profile_values, error = wf.fill(reference_form, scenario["registration"])
    if error:
        sys.exit(f"{scenario['name']}: the registration form could not be filled: {error}")
    profile, _ = wf.show_profile_from_ref(profile_values, wf.resolve(entity_type["workflow"]))

    entity_id = scenario["name"]
    rows = [
        row(
            wf,
            entity_id,
            entity_id,  # the profile row carries the id of the entity itself
            reference_form,
            profile_values,
            GENERATED_AT,
            entity_type["id"],
            entity_type["name"],
        )
    ]

    for index, (form_id, answers) in enumerate(scenario["visits"], start=1):
        moment = GENERATED_AT + timedelta(minutes=MINUTES_BETWEEN_VISITS * index)
        prefilled = dict(wf.profile_answers_for_form(form_id, profile))
        prefilled.update(answers)
        values, error, _ = autofill.fill_auto(
            wf.fill, form_id, prefilled, prefer=["0", "no", "none", "continue", "good", "normal"]
        )
        if error:
            sys.exit(f"{scenario['name']}: form {form_id} could not be filled: {error}")
        rows.append(
            row(
                wf,
                entity_id,
                f"{entity_id}-{index}",
                form_id,
                values,
                moment,
                entity_type["id"],
                entity_type["name"],
            )
        )
        # The workflow copies some answers into the beneficiary record, which changes what the
        # next form is prefilled with.
        profile, _, _ = wf.apply_changes(wf.resolve(entity_type["workflow"]), form_id, values, profile)

    return rows


def main():
    wf = load_harness()
    global autofill
    autofill = load_autofill()
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import scenarios  # noqa: E402  (imported once the harness is loaded)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for fixture_name, definitions in scenarios.FIXTURES.items():
        rows = []
        for scenario in definitions:
            rows.extend(build(wf, scenario))
        path = OUTPUT_DIR / f"{fixture_name}.json"
        path.write_text(json.dumps(rows, indent=2, default=str) + "\n")
        print(f"{path.relative_to(OUTPUT_DIR.parent.parent.parent)}: {len(rows)} submissions")


if __name__ == "__main__":
    main()
