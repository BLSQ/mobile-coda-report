import Entity from '../entity/Entity';
import { MedicalSection } from '../config/country';
import { is, has } from '../config/country/medical';
import { entitiesWithVisits } from './DataFilter';
import {
    sectionsReport,
    childUnder5Counter,
    admissionPBWGByStatus,
} from './DataByCategory';
import { getBeneficiaryAge } from './Array';

// IYCF reports of the Child Under 5 and of the pregnant women, built
// from their IYCF visits.
const IYCF_CHILD_FORM = 'iycf_child_under2';
const IYCF_WOMEN_FORM = 'iycf_pregnant_women';

type Match = (visit: any) => boolean;

// The caregiver chose to opt out: nothing was assessed nor given.
const optedOut = is('start', 'optout');

// New assessments count first visits only, otherwise a re-assessed
// follow-up child would be counted twice in the Total Counselling.
const firstVisit =
    (match: Match): Match =>
    visit =>
        Number(visit?._visit_number) === 1 && !optedOut(visit) && match(visit);

const anyVisit =
    (match: Match): Match =>
    visit =>
        !optedOut(visit) && match(visit);

const isFollowUp: Match = visit =>
    Number(visit?._visit_number) > 1 && is('start', 'continue')(visit);

const followUp =
    (match: Match): Match =>
    visit =>
        isFollowUp(visit) && match(visit);

// No progress sends the beneficiary back through the full assessment;
// progress without exit keeps the support going.
const continuedSupport = followUp(
    visit =>
        is('prograss_exist', '0')(visit) || !is('_discharge_IYCF', '1')(visit),
);

const notMother: Match = visit =>
    !!visit?.caregiver_relationship &&
    !is('caregiver_relationship', 'mother')(visit);

const fullAssessment = firstVisit(
    visit =>
        notMother(visit) ||
        is('is_breastfeeding', '0')(visit) ||
        is('bf_difficulty', '1')(visit) ||
        is('receiving_other_u6', '1')(visit) ||
        is('receiving_other_o6', '0')(visit),
);

const lowFatvahScore: Match = visit =>
    visit?._fatvah_score != null &&
    visit._fatvah_score !== '' &&
    Number(visit._fatvah_score) < 6;

const supportGiven = (choice: string) =>
    anyVisit(has('support_to_be_given', choice));

const IYCF_SECTIONS: MedicalSection[] = [
    {
        title: 'New Assessments',
        rows: [
            {
                label: 'Rapid/Pre assessments',
                match: firstVisit(
                    visit =>
                        is('start', 'continue')(visit) &&
                        !!visit?.caregiver_relationship,
                ),
            },
            { label: 'Full assessment', match: fullAssessment },
            {
                label: 'Breastfed',
                match: firstVisit(is('is_breastfeeding', '1')),
            },
            {
                label: 'Not breastfed',
                match: firstVisit(is('is_breastfeeding', '0')),
            },
            {
                label: 'Breastfeeding difficulties',
                match: firstVisit(is('bf_difficulty', '1')),
            },
            {
                label: 'Breast conditions',
                match: firstVisit(is('any_breast_condition', '1')),
            },
            {
                label: 'Non-exclusive breastfeeding',
                match: firstVisit(is('receiving_other_u6', '1')),
            },
            {
                label: 'Complementary feeding issues',
                match: firstVisit(
                    visit =>
                        is('receiving_other_o6', '0')(visit) ||
                        lowFatvahScore(visit),
                ),
            },
            {
                label: 'Low feeding frequency',
                match: firstVisit(is('_fatvah_frequency', '0')),
            },
            {
                label: 'Inadequate feeding amount',
                match: firstVisit(is('_fatvah_amount', '0')),
            },
            {
                label: 'Inappropriate food texture',
                match: firstVisit(is('_fatvah_thickness', '0')),
            },
            {
                label: 'Low dietary diversity',
                match: firstVisit(is('_fatvah_variety', '0')),
            },
            {
                label: 'Responsive feeding issues',
                match: firstVisit(is('_fatvah_active', '0')),
            },
            {
                label: 'Poor feeding hygiene',
                match: firstVisit(is('_fatvah_hygiene', '0')),
            },
        ],
    },
    {
        title: 'Counselling and Support',
        rows: [
            {
                label: 'Basic IYCF counselling',
                match: supportGiven('basic_iycf_support'),
            },
            {
                label: 'Breastfeeding support',
                match: supportGiven('skilled_bf_support'),
            },
            {
                label: 'Re-lactation support',
                match: supportGiven('relactation_support'),
            },
            {
                label: 'Wet nursing support',
                match: supportGiven('wet_nurse_support'),
            },
            {
                label: 'Complementary feeding',
                match: supportGiven('comp_feeding_counselling'),
            },
            {
                label: 'Psychosocial support',
                match: supportGiven('psychosocial_support_mother'),
            },
            {
                label: 'Hygiene counselling',
                match: supportGiven('hygiene_care'),
            },
        ],
    },
    {
        title: 'Referrals',
        rows: [
            {
                label: 'Medical referral',
                match: anyVisit(is('refer_medical', '1')),
            },
            {
                label: 'Therapeutic feeding',
                match: anyVisit(is('refer_therapeutic', '1')),
            },
            {
                label: 'Psychosocial referral',
                match: anyVisit(is('psychosocial_support', '1')),
            },
            {
                label: 'Other referrals',
                match: anyVisit(is('any_other_support', '1')),
            },
        ],
    },
    {
        // Named as the other reports' follow-up sections so that its rows
        // count visits, not children.
        title: 'Follow Ups',
        rows: [
            { label: 'Total follow-ups', match: isFollowUp },
            {
                label: 'Progress made/improved',
                match: followUp(is('prograss_exist', '1')),
            },
            { label: 'Continued support', match: continuedSupport },
            {
                label: 'Total Counselling',
                match: visit => fullAssessment(visit) || isFollowUp(visit),
            },
        ],
    },
];

// Fields left blank by a form (e.g. the maternal well-being questions not
// asked to adolescents) never match, so the rows need no age condition.
const womanFullAssessment = firstVisit(
    visit =>
        (is('is_adolescent', '1')(visit) ||
            is('anc_support_sought', '0')(visit) ||
            is('mother_difficulties', '1')(visit) ||
            is('extra_meal', '0')(visit) ||
            is('lactating_or_child_u24', '1')(visit)) &&
        !is('physically_sick_mentally_abnormal', '1')(visit),
);

// The rows of the IYCF template, each read from the pregnancy question the
// form has in its place.
const noQuestion: Match = () => false;

const IYCF_WOMEN_SECTIONS: MedicalSection[] = [
    {
        title: 'New Assessments',
        rows: [
            {
                label: 'Rapid/Pre assessments',
                match: firstVisit(is('is_pregnant', '1')),
            },
            { label: 'Full Assessments', match: womanFullAssessment },
            {
                label: 'Currently breastfeeding',
                match: firstVisit(is('lactating_or_child_u24', '1')),
            },
            {
                label: 'Not breastfeeding',
                match: firstVisit(is('feed_plan_6m', 'breast_milk')),
            },
            {
                label: 'Breastfeeding difficulties',
                match: firstVisit(is('mother_difficulties', '1')),
            },
            {
                label: 'Attachment difficulties',
                match: firstVisit(
                    is('feed_plan_6m', 'formula', 'mix', 'others'),
                ),
            },
            {
                label: 'Positioning difficulties',
                match: firstVisit(
                    visit =>
                        !!visit?.first_feed_plan &&
                        !is('first_feed_plan', 'breast_milk')(visit),
                ),
            },
            // Can't apply during pregnancy: the form has no question.
            { label: 'Breast conditions', match: noQuestion },
            { label: 'Poor suckling', match: noQuestion },
            { label: 'Re-lactation needs', match: noQuestion },
            {
                label: 'Maternal wellbeing concerns',
                match: firstVisit(
                    visit =>
                        is('emotional_state', 'not_well')(visit) ||
                        is('physically_sick_mentally_abnormal', '1')(visit),
                ),
            },
        ],
    },
    {
        title: 'Counselling and Support',
        rows: [
            {
                label: 'Basic IYCF counselling',
                match: anyVisit(
                    has(
                        'support_to_be_given',
                        'early_initiation_of_breastfeeding',
                        'exclusive_breastfeeding',
                        'risk_of_infant_formula',
                    ),
                ),
            },
            {
                label: 'Skilled breastfeeding support',
                match: supportGiven('importance_of_facility_based_deliveries'),
            },
            {
                label: 'Re-lactation support',
                match: supportGiven('danger_signs'),
            },
            {
                label: 'Wet nursing support',
                match: supportGiven('adequate_rest'),
            },
            {
                label: 'Complementary feeding counselling',
                match: supportGiven('maternal_nutrition'),
            },
            {
                label: 'Psychosocial support',
                match: anyVisit(is('psychosocial_support', '1')),
            },
            {
                label: 'Hygiene counselling',
                match: supportGiven('hygiene_practices'),
            },
        ],
    },
    {
        title: 'Referrals',
        rows: [
            {
                label: 'Medical referral',
                match: anyVisit(
                    visit =>
                        is('refer_medical_treatment', '1')(visit) ||
                        is('physically_sick_mentally_abnormal', '1')(visit),
                ),
            },
            {
                label: 'Therapeutic feeding referral',
                match: anyVisit(
                    visit =>
                        is('refer_tsfp_bsfp_cp', '1')(visit) ||
                        is('refer_tsfp', '1')(visit) ||
                        is('refer_bsfp', '1')(visit),
                ),
            },
            // No question of its own: psychosocial_support is the support row.
            { label: 'Psychosocial referral', match: noQuestion },
            {
                label: 'Other referrals',
                match: anyVisit(is('any_other_support', '1')),
            },
        ],
    },
    {
        title: 'Follow Ups',
        rows: [
            { label: 'Total follow-ups', match: isFollowUp },
            {
                label: 'Breastfeeding improved',
                match: followUp(is('prograss_exist', '1')),
            },
            {
                label: 'Difficulties resolved',
                match: followUp(is('_discharge_IYCF', '1')),
            },
            { label: 'Continued support', match: continuedSupport },
            {
                label: 'Total counselling',
                match: visit => womanFullAssessment(visit) || isFollowUp(visit),
            },
        ],
    },
];

// The beneficiaries with only their visits of the period on an IYCF form.
const withVisitsOfForm = (
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
    formFormId: string,
) =>
    entitiesWithVisits(entities, startDate, endDate).map(entity => ({
        ...entity,
        visits: entity.visits.filter(visit => visit.formFormId === formFormId),
    }));

const iycfReport = (entities: Array<Entity>, startDate: Date, endDate: Date) =>
    sectionsReport(
        withVisitsOfForm(entities, startDate, endDate, IYCF_CHILD_FORM),
        IYCF_SECTIONS,
        childUnder5Counter(true),
    );

// A follow-up with progress doesn't ask again whether the woman is
// pregnant, has a child under 6 months or is an adolescent: her latest
// visit answering it tells, else her profile.
const womanAnswers = (entity: Entity) =>
    [...entity.visits]
        .reverse()
        .find(
            visit =>
                visit.values?.is_pregnant != null &&
                visit.values.is_pregnant !== '',
        )?.values;

const isPregnantWoman = (entity: Entity) => {
    const answers = womanAnswers(entity);
    return answers
        ? is('start', 'continue')(answers) && is('is_pregnant', '1')(answers)
        : entity.profile?.values?.physiology_status === 'pregnant';
};

// The form has no age: is_adolescent only tells 19 or younger (counted as
// 19) or older (counted as 20), else the age of her profile is used.
const womanAge = (entity: Entity) => {
    const answers = womanAnswers(entity);
    if (is('is_adolescent', '1')(answers)) return 19;
    if (is('is_adolescent', '0')(answers)) return 20;
    return getBeneficiaryAge(entity);
};

const iycfWomenReport = (
    entities: Array<Entity>,
    startDate: Date,
    endDate: Date,
) =>
    sectionsReport(
        withVisitsOfForm(entities, startDate, endDate, IYCF_WOMEN_FORM)
            .filter(isPregnantWoman)
            // Read before the visits are narrowed to the ones of each row.
            .map(entity => ({ ...entity, iycfAge: womanAge(entity) })),
        IYCF_WOMEN_SECTIONS,
        (women, status, label) =>
            admissionPBWGByStatus(
                women,
                status,
                label,
                () => 'pregnant',
                woman => woman.iycfAge,
            ),
    );

export { iycfReport, iycfWomenReport };
