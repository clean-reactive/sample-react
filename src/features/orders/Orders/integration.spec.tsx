import {
  makeOrdersServiceMock,
  type MockedOrdersService,
} from "../repositories/ordersRepository/utils/testing";
import type { FC, PropsWithChildren } from "react";
import { Deferred } from "@esfx/async-deferred";
import { describe, beforeEach, vi, afterEach, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import type { OrderEntity } from "../repositories";
import type { OrdersResource } from "../stores";
import { makeOrderEntities, resetOrderEntitiesFactories } from "../utils/testing";
import { makeComponentFixture } from "../utils/testing/makeComponentFixture";
import {
  deleteItemButtonTestId,
  totalItemQuantityTestId,
  deleteOrderButtonTestId,
} from "../testIds";
import { Orders } from "./Orders";

vi.mock(import("../repositories/ordersRepository/OrdersService"));

describe(`${Orders.displayName} Integration Test`, () => {
  const ordersServiceMock = makeOrdersServiceMock();

  interface IntegrationTestContext {
    Fixture: FC<PropsWithChildren<unknown>>;
    Sut: FC<{ resource?: OrdersResource }>;
    user: UserEvent;
    orderEntities: OrderEntity[];
    ordersServiceMock: MockedOrdersService;
  }

  beforeEach<IntegrationTestContext>((context) => {
    vi.useFakeTimers();
    resetOrderEntitiesFactories();

    const { Fixture, user } = makeComponentFixture();

    context.orderEntities = makeOrderEntities();
    context.ordersServiceMock = ordersServiceMock.mock;

    let currentOrders = context.orderEntities;

    context.ordersServiceMock.getOrders.mockImplementation(() =>
      Promise.resolve([...currentOrders]),
    );
    context.ordersServiceMock.deleteOrder.mockImplementation(async (orderId) => {
      currentOrders = currentOrders.filter((o) => o.id !== orderId);
    });
    context.ordersServiceMock.deleteItem.mockImplementation(async (orderId, itemId) => {
      currentOrders = currentOrders.map((o) =>
        o.id === orderId
          ? { ...o, itemEntities: o.itemEntities.filter((i) => i.id !== itemId) }
          : o,
      );
    });

    context.Fixture = Fixture;
    context.Sut = () => (
      <Fixture>
        <Orders />
      </Fixture>
    );
    context.user = user;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it<IntegrationTestContext>("displays orders", async (context) => {
    render(<context.Sut />);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1825");
  });

  it<IntegrationTestContext>("handles order deletion", async (context) => {
    render(<context.Sut />);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1825");

    const deleteButtons = screen.getAllByTestId(deleteOrderButtonTestId);
    context.user.click(deleteButtons[0]);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1460");
  });

  it<IntegrationTestContext>("shows mutation status until an optimistic deletion finishes", async (context) => {
    const deletion = new Deferred<void>();
    context.ordersServiceMock.deleteOrder.mockReturnValue(deletion.promise);
    render(<context.Sut />);
    await vi.runAllTimersAsync();

    const click = context.user.click(screen.getAllByTestId(deleteOrderButtonTestId)[0]);
    await vi.runAllTimersAsync();
    await click;

    expect(screen.getByText("mutating")).toBeInTheDocument();
    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1460");

    context.ordersServiceMock.getOrders.mockResolvedValue(context.orderEntities.slice(1));
    deletion.resolve();
    await vi.runAllTimersAsync();

    expect(screen.getByText("idle")).toBeInTheDocument();
    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1460");
  });

  it<IntegrationTestContext>("handles order deletion followed by item deletion", async (context) => {
    render(<context.Sut />);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1825");

    const deleteOrderButtons = screen.getAllByTestId(deleteOrderButtonTestId);
    context.user.click(deleteOrderButtons[0]);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1460");

    const detailsElements = screen.getAllByTestId(deleteItemButtonTestId);
    context.user.click(detailsElements[0]);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(totalItemQuantityTestId)).toHaveTextContent("1385");
  });
});
