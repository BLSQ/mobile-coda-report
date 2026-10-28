import { MedicalRow } from './types';

// Building blocks for the rows of each country's Child Under 5 medical
// report (see MedicalSection in ./types).

// The codes of a select_multiple field, saved as "a b", "a,b" or "[a, b]".
const codesOf = (value: any): string[] =>
    value == null
        ? []
        : String(value)
              .replace(/[[\]]/g, '')
              .split(/[\s,]+/)
              .filter(Boolean);

// The field holds one of these values.
export const is =
    (field: string, ...values: string[]) =>
    (visit: any) =>
        values.includes(visit?.[field]);

// The select_multiple field has one of these codes selected.
export const has =
    (field: string, ...codes: string[]) =>
    (visit: any) =>
        codesOf(visit?.[field]).some(code => codes.includes(code));

// The select_multiple field has something selected other than these codes.
export const hasAnyExcept =
    (field: string, ...codes: string[]) =>
    (visit: any) => {
        const selected = codesOf(visit?.[field]);
        return selected.length > 0 && !selected.some(c => codes.includes(c));
    };

// Breathing faster than normal for the child's age: 50 and more under 12
// months, 40 and more after.
export const isPoorRespiratoryRate = (visit: any, ageMonths?: number) => {
    const rate = visit?.respiratory_rate;
    if (!rate || ageMonths == null) {
        return false;
    }
    const normal = ['<30', '30', '3039', '30-39'];
    return !(ageMonths <= 12 ? [...normal, '4049'] : normal).includes(rate);
};

const COMPLICATION_LABELS: Record<string, string> = {
    intractablevomit: 'Intractable vomit',
    convulsions: 'Convulsions',
    lethargynotalert: 'Lethargy/not alert',
    unconsciousness: 'Unconsciousness',
    hypoglycaemia: 'Hypoglycaemia',
    highfever: 'High fever',
    hypothermia: 'Hypothermia',
    severedehydration: 'Severe dehydration',
    lowerrespiratorytractinfection: 'Lower respiratory tract infection',
    severeanemia: 'Severe anemia',
    eyesignsofvitadeficiency: 'Eye signs of vit A deficiency',
    skinlesions: 'Skin lesions',
    difficultydrinkingbreastfeeding: 'Difficulty Drinking or Breastfeeding',
    hyperbilirubinaemiajaundice: 'hyperbilirubinaemia/\nJaundice',
};

// One row per medical_complications code.
export const complicationRows = (codes: string[]): MedicalRow[] =>
    codes.map(code => ({
        label: COMPLICATION_LABELS[code] ?? code,
        match: has('medical_complications', code),
    }));

export const SOUTH_SUDAN_COMPLICATIONS = [
    'intractablevomit',
    'convulsions',
    'lethargynotalert',
    'unconsciousness',
    'hypoglycaemia',
    'highfever',
    'hypothermia',
    'severedehydration',
    'lowerrespiratorytractinfection',
    'severeanemia',
    'eyesignsofvitadeficiency',
    'skinlesions',
];
