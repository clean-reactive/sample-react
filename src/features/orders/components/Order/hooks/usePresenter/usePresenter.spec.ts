import {
  makeOrdersServiceMock,
  type MockedOrdersService,
} from "../../../../repositories/ordersRepository/utils/testing";
import { renderHook } from "@testing-library/react";
import type { FC, PropsWithChildren } from "react";
import { describe, beforeEach, vi, afterEach, it, expect } from "vitest";
import type { OrderEntity } from "../../../../repositories";
import { makeOrderEntities, resetOrderEntitiesFactories } from "../../../../utils/testing";
import { makeComponentFixture } from "../../../../utils/testing/makeComponentFixture";
import { usePresenter } from "./usePresenter";
import { Deferred } from "@esfx/async-deferred";
import { useDeleteOrderMutation, makeDeleteOrderFixedCacheKey } from "../../../../repositories";

vi.mock(import("../../../../repositories/ordersRepository/OrdersService"));

interface LocalTestContext {
  Fixture: FC<PropsWithChildren<unknown>>;
  orders: OrderEntity[];
  ordersServiceMock: MockedOrdersService;
}

describe(`${usePresenter.name}`, () => {
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

  it<LocalTestContext>("optimistically removes order once deletion is triggered", async (context) => {
    const order0 = context.orders.at(1)!;
    const { promise } = new Deferred<void>();
    context.ordersServiceMock.getOrders.mockResolvedValue(context.orders);
    context.ordersServiceMock.deleteOrder.mockReturnValue(promise);

    const { result: resultPresenter } = renderHook(() => usePresenter({ orderId: order0.id }), {
      wrapper: context.Fixture,
    });
    const { result: resultDeleteOrder } = renderHook(
      () => useDeleteOrderMutation({ fixedCacheKey: makeDeleteOrderFixedCacheKey(order0.id) }),
      { wrapper: context.Fixture },
    );

    await vi.runAllTimersAsync();

    const result0 = resultPresenter.current.hasOrder;

    void resultDeleteOrder.current[0]({ orderId: order0.id });

    await vi.runAllTimersAsync();

    const result1 = resultPresenter.current.hasOrder;

    expect(result0).toBe(true);
    expect(result1).toBe(false);
  });
});
