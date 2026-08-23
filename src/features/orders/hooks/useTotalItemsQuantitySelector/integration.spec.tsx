import {
  makeOrdersServiceMock,
  type MockedOrdersService,
} from "../../repositories/ordersRepository/utils/testing";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTotalItemsQuantitySelector } from "./useTotalItemsQuantitySelector";
import { render, screen } from "@testing-library/react";
import { memo, type FC, type PropsWithChildren } from "react";
import type { UserEvent } from "@testing-library/user-event";
import { output } from "../../../../utils/testing";
import { useDeleteOrderMutation, useDeleteOrderItemMutation } from "../../repositories";
import type { OrderEntity, OrderEntityId, ItemEntityId } from "../../repositories";
import { resetOrderEntitiesFactories, makeOrderEntities } from "../../utils/testing";
import { makeComponentFixture } from "../../utils/testing/makeComponentFixture";

vi.mock(import("../../repositories/ordersRepository/OrdersService"));

interface LocalTestContext {
  Fixture: FC<PropsWithChildren<unknown>>;
  user: UserEvent;
  orders: OrderEntity[];
  ordersServiceMock: MockedOrdersService;
}

interface Output {
  quantity: number;
}

const outputTestId = "output-test-id";
const deleteOrderButtonTestId = "delete-order-button-test-id";
const deleteItemButtonTestId = "delete-item-button-test-id";

describe(`${useTotalItemsQuantitySelector.name} Integration Test for Order deletion`, () => {
  const ordersServiceMock = makeOrdersServiceMock();

  type OrderDeletionTextContext = LocalTestContext & {
    Sut: FC<{ orderId: OrderEntityId }>;
  };

  beforeEach<OrderDeletionTextContext>((context) => {
    vi.useFakeTimers();

    resetOrderEntitiesFactories();

    const { Fixture, user } = makeComponentFixture();
    context.Fixture = Fixture;
    context.user = user;
    context.orders = makeOrderEntities();

    const Component: FC<{ orderId: OrderEntityId }> = memo((props) => {
      const quantity = useTotalItemsQuantitySelector();
      const [deleteOrder] = useDeleteOrderMutation();
      return (
        <>
          <div data-testid={outputTestId}>
            {output<Output>({
              quantity,
            })}
          </div>
          <button
            data-testid={deleteOrderButtonTestId}
            onClick={() => void deleteOrder({ orderId: props.orderId })}
          ></button>
        </>
      );
    });
    context.Sut = (props) => (
      <context.Fixture>
        <Component {...props} />
      </context.Fixture>
    );
    context.ordersServiceMock = ordersServiceMock.mock;
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it<OrderDeletionTextContext>("changes value once an order is deleted", async (context) => {
    const orderId = context.orders.at(0)!.id;

    const initialOrders = context.orders.slice();
    const ordersAfterOrderDeletion = context.orders.slice(1);

    context.ordersServiceMock.getOrders
      .mockResolvedValueOnce(initialOrders)
      .mockResolvedValueOnce(ordersAfterOrderDeletion);
    context.ordersServiceMock.deleteOrder.mockResolvedValueOnce();

    render(<context.Sut orderId={orderId} />);

    await vi.runAllTimersAsync();

    const deleteButton = screen.getByTestId(deleteOrderButtonTestId);

    context.user.click(deleteButton);

    await vi.runAllTimersAsync();

    expect(screen.getByTestId(outputTestId)).toHaveOutput<Output>({
      quantity: 1460,
    });
  });
});

describe(`${useTotalItemsQuantitySelector.name} Integration Test for Order deletion followed by item deletion`, () => {
  const ordersServiceMock = makeOrdersServiceMock();

  type OrderAndItemDeletionTestContext = LocalTestContext & {
    Sut: FC<{ orderIdToDelete: OrderEntityId; itemOrderId: OrderEntityId; itemId: ItemEntityId }>;
  };

  beforeEach<OrderAndItemDeletionTestContext>((context) => {
    vi.useFakeTimers();

    resetOrderEntitiesFactories();

    const { Fixture, user } = makeComponentFixture();
    context.Fixture = Fixture;
    context.user = user;
    context.orders = makeOrderEntities();

    const Component: FC<{
      orderIdToDelete: OrderEntityId;
      itemOrderId: OrderEntityId;
      itemId: ItemEntityId;
    }> = memo((props) => {
      const quantity = useTotalItemsQuantitySelector();
      const [deleteOrder] = useDeleteOrderMutation();
      const [deleteItem] = useDeleteOrderItemMutation();
      return (
        <>
          <div data-testid={outputTestId}>
            {output<Output>({
              quantity,
            })}
          </div>
          <button
            data-testid={deleteOrderButtonTestId}
            onClick={() => void deleteOrder({ orderId: props.orderIdToDelete })}
          ></button>
          <button
            data-testid={deleteItemButtonTestId}
            onClick={() => void deleteItem({ orderId: props.itemOrderId, itemId: props.itemId })}
          ></button>
        </>
      );
    });
    context.Sut = (props) => (
      <context.Fixture>
        <Component {...props} />
      </context.Fixture>
    );
    context.ordersServiceMock = ordersServiceMock.mock;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it<OrderAndItemDeletionTestContext>("changes value once an order deletion is followed by an item deletion (mocked gateway)", async (context) => {
    const orderIdToDelete = context.orders.at(0)!.id;
    const remainingOrder = context.orders.at(1)!;
    const itemOrderId = remainingOrder.id;
    const itemId = remainingOrder.itemEntities.at(0)!.id;

    const initialOrders = context.orders.slice();
    const ordersAfterOrderDeletion = context.orders.slice(1);
    const ordersAfterItemDeletion = [
      { ...remainingOrder, itemEntities: remainingOrder.itemEntities.slice(1) },
      ...context.orders.slice(2),
    ];

    context.ordersServiceMock.getOrders
      .mockResolvedValueOnce(initialOrders)
      .mockResolvedValueOnce(ordersAfterOrderDeletion)
      .mockResolvedValueOnce(ordersAfterItemDeletion);
    context.ordersServiceMock.deleteOrder.mockResolvedValueOnce();
    context.ordersServiceMock.deleteItem.mockResolvedValueOnce();

    render(
      <context.Sut orderIdToDelete={orderIdToDelete} itemOrderId={itemOrderId} itemId={itemId} />,
    );

    await vi.runAllTimersAsync();

    expect(screen.getByTestId(outputTestId)).toHaveOutput<Output>({
      quantity: 1825,
    });

    const deleteOrderButton = screen.getByTestId(deleteOrderButtonTestId);
    context.user.click(deleteOrderButton);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(outputTestId)).toHaveOutput<Output>({
      quantity: 1460,
    });

    const deleteItemButton = screen.getByTestId(deleteItemButtonTestId);
    context.user.click(deleteItemButton);
    await vi.runAllTimersAsync();

    expect(screen.getByTestId(outputTestId)).toHaveOutput<Output>({
      quantity: 1385,
    });
  });
});
