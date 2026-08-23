import { describe, it, beforeEach, beforeAll, afterAll, expect, vi } from "vitest";
import { makeRemoteOrdersService, getOrders, deleteOrder, deleteItem } from "./RemoteOrdersService";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { makeItemEntityId, makeOrderEntityId } from "../../../../repositories";
import type { OrderEntity, OrdersGateway } from "../../ordersRepository.types";
import { apiOrderDtoFactory, makeApiOrders, apiOrdersResource } from "../../../../api/OrdersApi";

const server = setupServer();

interface LocalTestContext {
  gateway: OrdersGateway;
}

describe(`${makeRemoteOrdersService.name}`, () => {
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: "error",
    });
  });
  beforeEach<LocalTestContext>((context) => {
    apiOrderDtoFactory.resetCount();
    context.gateway = makeRemoteOrdersService();
  });
  afterAll(() => {
    server.close();
  });
  describe(`${getOrders.name}`, () => {
    it<LocalTestContext>("fetches order entities", async (context) => {
      const ordersDto = apiOrderDtoFactory.list({ count: 1 });

      const expected: OrderEntity[] = [
        {
          id: makeOrderEntityId("1"),
          userId: "75",
          itemEntities: [
            { id: makeItemEntityId("1"), productId: "59", quantity: 75 },
            { id: makeItemEntityId("2"), productId: "17", quantity: 50 },
            { id: makeItemEntityId("3"), productId: "93", quantity: 60 },
          ],
        },
      ];

      server.use(
        http.get(apiOrdersResource, () => HttpResponse.json(ordersDto), {
          once: true,
        }),
      );
      const result = await context.gateway.getOrders();
      expect(result).toEqual(expected);
    });
  });

  describe(`${deleteOrder.name}`, () => {
    it<LocalTestContext>("deletes order", async (context) => {
      const orderId = makeOrderEntityId("1");

      server.use(
        http.delete(`${apiOrdersResource}/${orderId}`, () => HttpResponse.json(), {
          once: true,
        }),
      );

      await context.gateway.deleteOrder(orderId);
    });
  });

  describe(`${deleteItem.name}`, () => {
    it<LocalTestContext>("deletes item from order", async () => {
      const api = makeApiOrders();
      const gateway = makeRemoteOrdersService(api);

      vi.spyOn(api, "updateOrder");

      const orderDto = apiOrderDtoFactory.item();
      const orderId = makeOrderEntityId(orderDto.id);
      const itemId = makeItemEntityId(orderDto.items[0].id);

      const expectedOrderDto = {
        id: orderDto.id,
        items: orderDto.items.filter((item) => item.id !== itemId),
        userId: orderDto.userId,
      };

      server.use(
        http.get(`${apiOrdersResource}/${orderId}`, () => HttpResponse.json(orderDto), {
          once: true,
        }),
        http.put(`${apiOrdersResource}/${orderId}`, () => HttpResponse.json(), {
          once: true,
        }),
      );

      await gateway.deleteItem(orderId, itemId);

      expect(api.updateOrder).toHaveBeenCalledExactlyOnceWith("1", expectedOrderDto);
    });

    it<LocalTestContext>("does nothing when item is not found in order", async () => {
      const api = makeApiOrders();
      const gateway = makeRemoteOrdersService(api);

      vi.spyOn(api, "updateOrder");

      const orderDto = apiOrderDtoFactory.item();
      const orderId = makeOrderEntityId(orderDto.id);
      const nonExistentItemId = makeItemEntityId("non-existent");

      server.use(
        http.get(`${apiOrdersResource}/${orderId}`, () => HttpResponse.json(orderDto), {
          once: true,
        }),
      );

      await gateway.deleteItem(orderId, nonExistentItemId);

      expect(api.updateOrder).not.toHaveBeenCalled();
    });
  });
});
