// Quantity of a food item moved by food_item_stock submissions, as computed
// by the form itself: sachets/packets (total_packets), weight in kg
// (total_weight) and metric tons (tonnage).
interface FoodBoxes {
    full: number;
    looseSachets: number;
    // Sachets per box; null when boxes of different sizes are added up.
    sachetsPerBox: number | null;
}

interface FoodQuantity {
    sachets: number;
    // Full boxes/cartons and the sachets left over (319 sachets packed by 150:
    // 2 boxes + 19 sachets); null for the items not packed in boxes (oil
    // bottles).
    boxes: FoodBoxes | null;
    kg: number;
    mt: number;
}

const noQuantity = (): FoodQuantity => ({
    sachets: 0,
    boxes: { full: 0, looseSachets: 0, sachetsPerBox: null },
    kg: 0,
    mt: 0,
});

// Fills full boxes with the sachets left over.
const packInBoxes = (
    full: number,
    looseSachets: number,
    sachetsPerBox: number,
): FoodBoxes => {
    const filled = Math.floor(looseSachets / sachetsPerBox);
    return {
        full: full + filled,
        looseSachets: looseSachets - filled * sachetsPerBox,
        sachetsPerBox,
    };
};

const isEmpty = (boxes: FoodBoxes) =>
    boxes.full === 0 && boxes.looseSachets === 0;

// Sum of boxes: the sachets left over fill full boxes when both are packed in
// the same box size (100 + 100 sachets packed by 150: 1 box + 50 sachets);
// boxes of different sizes are added up as they are.
const addBoxes = (a: FoodBoxes, b: FoodBoxes): FoodBoxes => {
    if (isEmpty(a)) return b;
    if (isEmpty(b)) return a;
    const full = a.full + b.full;
    const looseSachets = a.looseSachets + b.looseSachets;
    if (a.sachetsPerBox != null && a.sachetsPerBox === b.sachetsPerBox) {
        return packInBoxes(full, looseSachets, a.sachetsPerBox);
    }
    return { full, looseSachets, sachetsPerBox: null };
};

// Quantity moved by one submission. The boxes are counted from the sachets
// and the packaging size (sachets per box) entered on it: its `packs` field
// is rounded to one decimal (10 sachets of 300 per box give 0 packs).
const submissionQuantity = (values: any, moved: number): FoodQuantity => {
    const sachets = Number(values?.total_packets) || moved;
    const sachetsPerBox = Number(values?.packaging_size);
    return {
        sachets,
        boxes:
            values?.unit && sachetsPerBox > 0
                ? packInBoxes(0, sachets, sachetsPerBox)
                : null,
        kg: Number(values?.total_weight) || 0,
        mt: Number(values?.tonnage) || 0,
    };
};

const addQuantities = (a: FoodQuantity, b: FoodQuantity): FoodQuantity => ({
    sachets: a.sachets + b.sachets,
    boxes: a.boxes && b.boxes ? addBoxes(a.boxes, b.boxes) : null,
    kg: a.kg + b.kg,
    mt: a.mt + b.mt,
});

export { noQuantity, submissionQuantity, addQuantities };
export type { FoodQuantity, FoodBoxes };
