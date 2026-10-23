interface FoodStockItem {
    readonly item: string;
    readonly opening: number;
    received: number;
    readonly transferred: {
        loanAndBorrowing: number;
        other: number;
        total: number;
    };
    readonly lost: {
        infestation: number;
        expired: number;
        stolen: number;
        other: number;
        total: number;
    };
    end: number;
}

export default FoodStockItem;
