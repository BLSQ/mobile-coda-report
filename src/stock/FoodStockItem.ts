interface FoodStockItem {
  readonly label: string;
  readonly code: string;
  readonly commodity: string;
  readonly lost: number;
  readonly opening: number;
  readonly received: number;
  readonly distributed: number;
  readonly damaged: number;
  readonly expired: number;
  readonly transferred: number;
  readonly end: number;
};

export default FoodStockItem;

