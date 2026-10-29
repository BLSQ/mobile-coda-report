import { FoodQuantity } from './FoodQuantity';

interface FoodStockMovements {
    received: FoodQuantity;
    readonly transferred: {
        loanAndBorrowing: FoodQuantity;
        other: FoodQuantity;
        total: FoodQuantity;
    };
    readonly lost: {
        infestation: FoodQuantity;
        expired: FoodQuantity;
        stolen: FoodQuantity;
        other: FoodQuantity;
        total: FoodQuantity;
    };
}

// Activities of the period on one batch of a food item, for one way of
// packing it: rows of the same batch are separated when their unit,
// packaging or box size differ.
interface FoodStockBatch extends FoodStockMovements {
    readonly batch: string;
    // Expiry date of the batch (yyyy-MM-dd), entered when it was received.
    expiryDate: string;
    readonly unit: string;
    readonly packagingSize: string;
    readonly boxSize: string;
}

// Stock of a food item: its opening and end stock, in sachets, combine all
// its batches, the movements of the period are the sum of its batch rows.
interface FoodStockItem extends FoodStockMovements {
    readonly item: string;
    readonly opening: number;
    end: number;
    readonly batches: FoodStockBatch[];
}

export default FoodStockItem;
export type { FoodStockBatch, FoodStockMovements };
