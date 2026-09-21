import {
  type OrderEntityId,
  useDeleteOrderMutation,
  makeDeleteOrderFixedCacheKey,
} from "../repositories";

/** Reports whether the current order has a pending delete mutation in RTK Query. */
export const useIsDeleteOrderMutatingSelector = (orderId: OrderEntityId): boolean => {
  const [, { isLoading }] = useDeleteOrderMutation({
    fixedCacheKey: makeDeleteOrderFixedCacheKey(orderId),
  });
  return isLoading;
};
