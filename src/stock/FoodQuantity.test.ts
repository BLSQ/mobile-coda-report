import { addQuantities, noQuantity, submissionQuantity } from './FoodQuantity';

describe('submissionQuantity', () => {
    it('takes the quantities computed by the form', () => {
        // 3457 boxes of 9 packets of CSB++ (13.5 kg).
        expect(
            submissionQuantity(
                {
                    unit: 'box_carton',
                    quantity: 3457,
                    packaging_size: '9',
                    total_packets: '31113',
                    packs: '3457',
                    total_weight: '46669.5',
                    tonnage: '46.6695',
                },
                31113,
            ),
        ).toEqual({
            sachets: 31113,
            boxes: { full: 3457, looseSachets: 0, sachetsPerBox: 9 },
            kg: 46669.5,
            mt: 46.6695,
        });
    });

    it('counts the full boxes and the sachets left over', () => {
        // packs is rounded: 10 sachets of LNS-MQ give 0 packs.
        expect(
            submissionQuantity(
                {
                    unit: 'sachet_packet',
                    packaging_size: '300',
                    total_packets: '10',
                    packs: '0',
                    total_weight: '0.5',
                    tonnage: '5.0E-4',
                },
                10,
            ),
        ).toEqual({
            sachets: 10,
            boxes: { full: 0, looseSachets: 10, sachetsPerBox: 300 },
            kg: 0.5,
            mt: 0.0005,
        });
        expect(
            submissionQuantity(
                {
                    unit: 'sachet_packet',
                    packaging_size: '150',
                    total_packets: '319',
                },
                319,
            ).boxes,
        ).toEqual({ full: 2, looseSachets: 19, sachetsPerBox: 150 });
    });

    it('has no boxes for the items not packed in boxes', () => {
        // Oil bottles: no unit is entered.
        expect(
            submissionQuantity(
                {
                    packaging_size: '1',
                    total_packets: '2500',
                    total_weight: '1150',
                    tonnage: '1.15',
                },
                2500,
            ),
        ).toEqual({ sachets: 2500, boxes: null, kg: 1150, mt: 1.15 });
    });

    it('uses the commodity quantity without total_packets', () => {
        expect(submissionQuantity({}, 12)).toEqual({
            sachets: 12,
            boxes: null,
            kg: 0,
            mt: 0,
        });
    });
});

describe('addQuantities', () => {
    const quantity = (
        sachets: number,
        full: number,
        looseSachets: number,
        sachetsPerBox: number | null,
    ) => ({
        sachets,
        boxes: { full, looseSachets, sachetsPerBox },
        kg: 0,
        mt: 0,
    });

    it('fills full boxes with the sachets left over of the same box size', () => {
        // 2 boxes + 100 sachets and 100 sachets, packed by 150.
        expect(
            addQuantities(
                quantity(400, 2, 100, 150),
                quantity(100, 0, 100, 150),
            ).boxes,
        ).toEqual({ full: 3, looseSachets: 50, sachetsPerBox: 150 });
    });

    it('adds up the boxes of batches packed in different box sizes', () => {
        // 3457 boxes of 9 packets and 3 boxes of 10 packets + 8 packets.
        expect(
            addQuantities(quantity(31113, 3457, 0, 9), quantity(38, 3, 8, 10))
                .boxes,
        ).toEqual({ full: 3460, looseSachets: 8, sachetsPerBox: null });
    });

    it('keeps the box size of a quantity added to nothing', () => {
        expect(
            addQuantities(noQuantity(), quantity(100, 0, 100, 150)).boxes,
        ).toEqual({ full: 0, looseSachets: 100, sachetsPerBox: 150 });
    });

    it('adds up the sachets, weight and tonnage', () => {
        expect(
            addQuantities(
                { ...quantity(10, 0, 10, 300), kg: 0.5, mt: 0.0005 },
                { ...quantity(20, 0, 20, 300), kg: 1, mt: 0.001 },
            ),
        ).toMatchObject({ sachets: 30, kg: 1.5 });
    });

    it('has no boxes once a quantity has none', () => {
        expect(
            addQuantities(noQuantity(), {
                sachets: 2500,
                boxes: null,
                kg: 1150,
                mt: 1.15,
            }).boxes,
        ).toBeNull();
    });
});
