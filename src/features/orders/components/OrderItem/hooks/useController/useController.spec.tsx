import {
  makeOrdersServiceMock,
  type MockedOrdersService,
} from "../../../../repositories/ordersRepository/utils/testing";
import { useController } from "./useController";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren, FC } from "react";
import { makeComponentFixture } from "../../../../utils/testing/makeComponentFixture";
import type { OrderEntity } from "../../../../repositories";
import { makeOrderEntities, resetOrderEntitiesFactories } from "../../../../utils/testing";

vi.mock(import("../../../../repositories/ordersRepository/OrdersService"));

interface LocalTestContext {
  Fixture: FC<PropsWithChildren<unknown>>;
  orders: OrderEntity[];
  ordersServiceMock: MockedOrdersService;
}

describe(`${useController.name}`, () => {
  const ordersServiceMock = makeOrdersServiceMock();

  beforeEach<LocalTestContext>((context) => {
    vi.useFakeTimers();
    resetOrderEntitiesFactories();

    const { Fixture } = makeComponentFixture();
    context.Fixture = Fixture;
    context.orders = makeOrderEntities();
    context.ordersServiceMock = ordersServiceMock.mock;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it<LocalTestContext>("triggers order item deletion on the gateway", async (context) => {
    const order = context.orders.at(0)!;
    const item = order.itemEntities.at(0)!;

    context.ordersServiceMock.getOrders.mockResolvedValue(context.orders);
    context.ordersServiceMock.deleteItem.mockResolvedValue();

    const { result } = renderHook(() => useController({ itemId: item.id, orderId: order.id }), {
      wrapper: context.Fixture,
    });

    await vi.runAllTimersAsync();

    result.current.deleteOrderItemButtonClicked();
    await vi.runAllTimersAsync();

    expect(context.ordersServiceMock.deleteItem).toHaveBeenCalledWith(order.id, item.id);
    expect(context.ordersServiceMock.deleteOrder).not.toHaveBeenCalled();
  });

  it<LocalTestContext>("triggers order deletion when the item is the last one in the order", async (context) => {
    const baseOrder = context.orders.at(0)!;
    const lastItem = baseOrder.itemEntities.at(0)!;
    const order = { ...baseOrder, itemEntities: [lastItem] };
    const orders = [order, ...context.orders.slice(1)];

    context.ordersServiceMock.getOrders.mockResolvedValue(orders);
    context.ordersServiceMock.deleteOrder.mockResolvedValue();

    const { result } = renderHook(() => useController({ itemId: lastItem.id, orderId: order.id }), {
      wrapper: context.Fixture,
    });

    await vi.runAllTimersAsync();

    result.current.deleteOrderItemButtonClicked();
    await vi.runAllTimersAsync();

    expect(context.ordersServiceMock.deleteOrder).toHaveBeenCalledWith(order.id);
    expect(context.ordersServiceMock.deleteItem).not.toHaveBeenCalled();
  });
});
