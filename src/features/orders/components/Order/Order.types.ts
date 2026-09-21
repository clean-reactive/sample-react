import type { ItemEntityId, OrderEntityId } from "../../repositories";

export interface OrderParams {
  orderId: OrderEntityId;
}

/**
 * Presenter contract consumed by Order's JSX. Each property is a behaviorless
 * ViewModel value.
 */
export interface Presenter {
  hasOrder: boolean;
  orderId: string;
  userId: string;
  itemIds: ItemEntityId[];
  summaryLabel: string;
  isDeleteOrderButtonDisabled: boolean;
}

/** User interactions emitted by Order's JSX. */
export interface Controller {
  deleteOrderButtonClicked: () => void;
}
