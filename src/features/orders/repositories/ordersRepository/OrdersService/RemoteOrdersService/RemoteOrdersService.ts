import { makeApiOrders, type ApiOrderDto, type ApiOrders } from "../../../../api";
import type {
  ItemEntityId,
  OrderEntity,
  OrderEntityId,
  OrdersGateway,
} from "../../ordersRepository.types";
import { toOrderEntity } from "./mappers";

export const getOrders = async (api: ApiOrders): Promise<OrderEntity[]> => {
  const ordersDto = await api.getOrders();
  return ordersDto.map(toOrderEntity);
};

export const deleteOrder = (api: ApiOrders, orderId: OrderEntityId): Promise<void> =>
  api.deleteOrder(orderId);

export const deleteItem = async (
  api: ApiOrders,
  orderId: OrderEntityId,
  itemId: ItemEntityId,
): Promise<void> => {
  const orderDto = await api.getOrder(orderId);
  const itemExists = orderDto.items.some((item) => item.id === itemId);

  if (!itemExists) {
    return;
  }

  const updatedOrder: ApiOrderDto = {
    ...orderDto,
    items: orderDto.items.filter((item) => item.id !== itemId),
  };
  await api.updateOrder(orderId, updatedOrder);
};

export const makeRemoteOrdersService = (api: ApiOrders = makeApiOrders()): OrdersGateway => ({
  getOrders: () => getOrders(api),
  deleteOrder: (orderId) => deleteOrder(api, orderId),
  deleteItem: (orderId, itemId) => deleteItem(api, orderId, itemId),
});
