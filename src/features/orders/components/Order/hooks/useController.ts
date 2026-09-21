import { useCallback } from "react";
import type { Controller } from "../Order.types";
import type { OrderEntityId } from "../../../repositories";
import { useDeleteOrderUseCase } from "../../../hooks";

/**
 * Adapts UI events to application use cases. Business orchestration stays in
 * the use case; this controller only supplies the order ID.
 */
export const useController = (params: { orderId: OrderEntityId }): Controller => {
  const { execute: executeDeleteOrderUseCase } = useDeleteOrderUseCase(params);

  const deleteOrderButtonClicked = useCallback(() => {
    executeDeleteOrderUseCase();
  }, [executeDeleteOrderUseCase]);

  return { deleteOrderButtonClicked };
};
