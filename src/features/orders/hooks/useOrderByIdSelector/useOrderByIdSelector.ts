import type { OrderEntity, OrderEntityId } from "../../repositories";
import { useOrdersSelector } from "../useOrdersSelector";

/** Derives one Order entity from the shared orders collection. */
export const useOrderByIdSelector = (orderId: OrderEntityId): OrderEntity | undefined => {
  const data = useOrdersSelector();

  return data.find((orderEntity) => orderEntity.id === orderId);
};
