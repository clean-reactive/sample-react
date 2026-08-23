import { sleep } from "../../../../../../utils";
import type { OrderEntity, OrderEntityId, OrdersGateway } from "../../ordersRepository.types";
import { makeOrderEntitiesMock } from "./makeOrderEntitiesMock";

export type OrdersMap = Map<OrderEntityId, OrderEntity>;

export const setOrders = (orders: OrdersMap, orderEntities: OrderEntity[]): void => {
  orderEntities.forEach((order) => orders.set(order.id, order));
};

export const getOrders = async (orders: OrdersMap): Promise<OrderEntity[]> => {
  await sleep(1000);

  return Array.from(orders.values());
};

export const deleteOrder = async (orders: OrdersMap, orderId: OrderEntityId): Promise<void> => {
  await sleep(3000);

  if (!orders.has(orderId)) {
    throw new Error(`Order with id ${orderId} not found`);
  }
  orders.delete(orderId);
};

export const deleteItem = async (
  orders: OrdersMap,
  orderId: OrderEntityId,
  itemId: string,
): Promise<void> => {
  await sleep(2000);

  const order = orders.get(orderId);

  if (!order) {
    throw new Error(`Order with id ${orderId} not found`);
  }

  orders.set(orderId, {
    ...order,
    itemEntities: order.itemEntities.filter((item) => item.id !== itemId),
  });
};

export const makeService = (initialOrders: OrderEntity[]): OrdersGateway => {
  const orders: OrdersMap = new Map(initialOrders.map((order) => [order.id, order]));

  return {
    getOrders: () => getOrders(orders),
    deleteOrder: (orderId) => deleteOrder(orders, orderId),
    deleteItem: (orderId, itemId) => deleteItem(orders, orderId, itemId),
  };
};

let instance: OrdersGateway | null = null;

export const makeInMemoryOrdersService = (initialOrders?: OrderEntity[]): OrdersGateway => {
  instance ??= makeService(initialOrders ?? makeOrderEntitiesMock());

  return instance;
};
