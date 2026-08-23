import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteItem,
  deleteOrder,
  getOrders,
  makeInMemoryOrdersService,
  makeService,
  setOrders,
  type OrdersMap,
} from "./InMemoryOrdersService";
import type { OrderEntity } from "../../ordersRepository.types";
import {
  itemEntityFactory,
  makeOrderEntities,
  orderEntityFactory,
} from "../../../../utils/testing";
import { makeOrderEntityId } from "../../../../repositories";
import { mockSleep } from "../../../../../../utils/testing/mockSleep";

interface LocalTestContext {
  orders: OrderEntity[];
  ordersMap: OrdersMap;
}

describe("InMemoryOrdersService", () => {
  beforeEach<LocalTestContext>((context) => {
    mockSleep();
    orderEntityFactory.resetCount();
    itemEntityFactory.resetCount();
    const orders = makeOrderEntities();
    context.orders = orders;
    context.ordersMap = new Map();
    setOrders(context.ordersMap, orders);
  });

  describe(`${getOrders.name}`, () => {
    it<LocalTestContext>("returns the list of orders", async (context) => {
      const result = await getOrders(context.ordersMap);

      expect(result).toEqual(context.orders);
    });

    it("returns an empty array if no orders are available", async () => {
      const result = await getOrders(new Map());

      expect(result).toEqual([]);
    });
  });

  describe(`${deleteOrder.name}`, () => {
    it<LocalTestContext>("deletes the order", async (context) => {
      const order_3 = context.orders.at(3)!;

      await deleteOrder(context.ordersMap, order_3.id);

      const result = await getOrders(context.ordersMap);

      expect(result).not.toContain(order_3);
    });

    it<LocalTestContext>("throws an error if the order does not exist", async (context) => {
      const nonExistingOrderId = makeOrderEntityId("9999");

      const result = deleteOrder(context.ordersMap, nonExistingOrderId);

      await expect(result).rejects.toThrowError();
    });
  });

  describe(`${deleteItem.name}`, () => {
    it<LocalTestContext>("deletes the item", async (context) => {
      const order_1 = context.orders.at(1)!;
      const item_1_3 = context.orders.at(1)!.itemEntities.at(3)!;

      await deleteItem(context.ordersMap, order_1.id, item_1_3.id);

      const result = await getOrders(context.ordersMap);

      expect(result).toContainEqual({
        ...order_1,
        itemEntities: expect.not.arrayContaining([item_1_3]),
      });
    });

    it<LocalTestContext>("throws an error if the order does not exist", async (context) => {
      const nonExistingOrderId = makeOrderEntityId("9999");
      const item_1_1 = context.orders.at(1)!.itemEntities.at(2)!;

      const result = deleteItem(context.ordersMap, nonExistingOrderId, item_1_1.id);

      await expect(result).rejects.toThrowError();
    });
  });

  describe(`${setOrders.name}`, () => {
    it<LocalTestContext>("adds new orders to the existing ones", async (context) => {
      const ordersMap: OrdersMap = new Map();

      setOrders(ordersMap, context.orders);

      const result = await getOrders(ordersMap);

      expect(result).toEqual(context.orders);
    });
  });

  describe(`${makeService.name}`, () => {
    it<LocalTestContext>("gives every instance its own orders", async (context) => {
      const serviceA = makeService(context.orders);
      const serviceB = makeService([]);

      expect(await serviceA.getOrders()).toEqual(context.orders);
      expect(await serviceB.getOrders()).toEqual([]);
    });
  });

  describe(`${makeInMemoryOrdersService.name}`, () => {
    it("returns the same instance on every call", () => {
      expect(makeInMemoryOrdersService()).toBe(makeInMemoryOrdersService());
    });
  });
});
