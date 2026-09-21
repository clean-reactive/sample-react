import { useGetOrdersQuery, type OrderEntity } from "../repositories";

const DEFAULT_ORDERS: OrderEntity[] = [];

/** Normalizes repository query state into the shared Order entity collection. */
export const useOrdersSelector = (): OrderEntity[] => {
  const { data } = useGetOrdersQuery();
  return data ?? DEFAULT_ORDERS;
};
