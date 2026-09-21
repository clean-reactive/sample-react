import type { Presenter } from "../../Order.types";
import type { OrderEntityId } from "../../../../repositories";
import { useOrderByIdSelector, useIsDeleteOrderMutatingSelector } from "../../../../hooks";

/**
 * Converts selector results into stable, JSX-ready values. The presenter
 * performs no mutations and returns safe defaults while the order is unavailable.
 */
export const usePresenter = (params: { orderId: OrderEntityId }): Presenter => {
  const order = useOrderByIdSelector(params.orderId);
  const isDeleteOrderInProgress = useIsDeleteOrderMutatingSelector(params.orderId);

  if (!order) {
    return {
      hasOrder: false,
      orderId: "",
      userId: "",
      itemIds: [],
      summaryLabel: "",
      isDeleteOrderButtonDisabled: false,
    };
  }

  const itemIds = order.itemEntities.map((itemEntity) => itemEntity.id);

  return {
    hasOrder: true,
    userId: order.userId,
    orderId: order.id,
    itemIds,
    summaryLabel: `${itemIds.length} item${itemIds.length !== 1 ? "s" : ""}`,
    isDeleteOrderButtonDisabled: isDeleteOrderInProgress,
  };
};
