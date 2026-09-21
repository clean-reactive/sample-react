import { useCallback } from "react";
import type { UseCase } from "../../../../@types";
import {
  type OrderEntityId,
  useDeleteOrderMutation,
  makeDeleteOrderFixedCacheKey,
} from "../../repositories";

/**
 * Application-level delete operation. It owns mutation orchestration and the
 * error boundary, keeping those concerns out of the controller and repository.
 */
export const useDeleteOrderUseCase = (params: { orderId: OrderEntityId }): UseCase => {
  const [deleteOrder] = useDeleteOrderMutation({
    fixedCacheKey: makeDeleteOrderFixedCacheKey(params.orderId),
  });

  const execute = useCallback(async () => {
    try {
      await deleteOrder({ orderId: params.orderId }).unwrap();
    } catch (error: unknown) {
      console.error(error);
    }
  }, [deleteOrder, params.orderId]);

  return { execute };
};
