import type { ItemEntityId, OrderEntityId } from "../../repositories";

export interface OrderParams {
  orderId: OrderEntityId;
}

export interface Presenter {
  hasOrder: boolean;
  orderId: string;
  userId: string;
  itemIds: ItemEntityId[];
  summaryLabel: string;
  isDeleteOrderButtonDisabled: boolean;
}

export interface Controller {
  deleteOrderButtonClicked: () => void;
}
