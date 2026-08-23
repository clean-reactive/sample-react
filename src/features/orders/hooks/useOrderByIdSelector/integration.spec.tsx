import {
  makeOrdersServiceMock,
  type MockedOrdersService,
} from "../../repositories/ordersRepository/utils/testing";
import type { FC, PropsWithChildren } from "react";
import { describe, beforeEach, vi, afterEach, it, expect } from "vitest";
import { output } from "../../../../utils/testing";
import type { OrderEntity, OrderEntityId } from "../../repositories";
import { makeOrderEntities, resetOrderEntitiesFactories } from "../../utils/testing";
import { makeComponentFixture } from "../../utils/testing/makeComponentFixture";
import { render, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import {
  useDeleteOrderMutation,
  useDeleteOrderItemMutation,
  makeOrderEntityId,
} from "../../repositories";
import { useOrderByIdSelector } from "./useOrderByIdSelector";
import { useOrdersSelector } from "../useOrdersSelector";

vi.mock(import("../../repositories/ordersRepository/OrdersService"));

describe(`${useOrderByIdSelector.name}: Delete Order and Item`, () => {
  const ordersServiceMock = makeOrdersServiceMock();

  interface IntegrationTestContext {
    Fixture: FC<PropsWithChildren<unknown>>;
    Sut: FC;
    user: UserEvent;
    orderEntities: OrderEntity[];
    ordersServiceMock: MockedOrdersService;
  }

  type IntegrationOutput = {
    orders: OrderEntity[];
    firstOrderIdFromSelector?: OrderEntityId;
  };

  const unknownOrderEntityId = makeOrderEntityId("unknown");

  const integrationOutputTestId = "integration-output-test-id";
  const deleteOrderButtonTestId = "delete-order-button-test-id";
  const deleteItemButtonTestId = "delete-item-button-test-id";

  beforeEach<IntegrationTestContext>((context) => {
    vi.useFakeTimers();
    resetOrderEntitiesFactories();

    const { Fixture, user } = makeComponentFixture();

    const Component: FC = () => {
      const [deleteOrder] = useDeleteOrderMutation();
      const [deleteOrderItem] = useDeleteOrderItemMutation();
      const orders = useOrdersSelector();

      const firstOrder = orders.at(0);
      const secondOrderIdOrUnknown = firstOrder?.id ?? unknownOrderEntityId;
      const secondOrderFromSelector = useOrderByIdSelector(secondOrderIdOrUnknown);

      const onDeleteOrderButtonClick = () => {
        const order = orders.at(0)!;
        void deleteOrder({ orderId: order.id });
      };

      const onDeleteItemButtonClick = () => {
        const order = orders.at(0)!;
        const item = order.itemEntities.at(0)!;
        void deleteOrderItem({
          orderId: order.id,
          itemId: item.id,
        });
      };

      return (
        <>
          <button data-testid={deleteOrderButtonTestId} onClick={onDeleteOrderButtonClick}>
            Delete Order
          </button>
          <button data-testid={deleteItemButtonTestId} onClick={onDeleteItemButtonClick}>
            Delete Item
          </button>
          <div data-testid={integrationOutputTestId}>
            {output<IntegrationOutput>({
              orders,
              firstOrderIdFromSelector: secondOrderFromSelector?.id,
            })}
          </div>
        </>
      );
    };
    context.Fixture = Fixture;
    context.Sut = () => (
      <Fixture>
        <Component />
      </Fixture>
    );
    context.user = user;
    context.orderEntities = makeOrderEntities();
    context.ordersServiceMock = ordersServiceMock.mock;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it<IntegrationTestContext>("deletes an order and then deletes an item from a remaining order", async (context) => {
    const initialOrders = context.orderEntities;
    const orderToDelete = initialOrders.at(0)!;
    const remainingOrderWithItem = initialOrders.at(1)!;
    const itemToDelete = remainingOrderWithItem.itemEntities.at(0)!;

    const ordersAfterOrderDeletion = initialOrders.slice(1);

    const updatedRemainingOrder = {
      ...remainingOrderWithItem,
      itemEntities: remainingOrderWithItem.itemEntities.slice(1),
    };
    const ordersAfterItemDeletion = [updatedRemainingOrder, ...ordersAfterOrderDeletion.slice(1)];

    context.ordersServiceMock.getOrders
      .mockResolvedValueOnce(initialOrders)
      .mockResolvedValueOnce(ordersAfterOrderDeletion)
      .mockResolvedValueOnce(ordersAfterItemDeletion);

    context.ordersServiceMock.deleteOrder.mockResolvedValue();
    context.ordersServiceMock.deleteItem.mockResolvedValue();

    render(<context.Sut />);

    await vi.runAllTimersAsync();

    expect(screen.getByTestId(integrationOutputTestId)).toHaveOutput<IntegrationOutput>({
      orders: initialOrders,
      firstOrderIdFromSelector: initialOrders.at(0)!.id,
    });

    const deleteOrderButton = screen.getByTestId(deleteOrderButtonTestId);
    context.user.click(deleteOrderButton);
    await vi.runAllTimersAsync();

    expect(context.ordersServiceMock.deleteOrder).toHaveBeenCalledWith(orderToDelete.id);
    expect(screen.getByTestId(integrationOutputTestId)).toHaveOutput<IntegrationOutput>({
      orders: ordersAfterOrderDeletion,
      firstOrderIdFromSelector: ordersAfterOrderDeletion.at(0)!.id,
    });

    const deleteItemButton = screen.getByTestId(deleteItemButtonTestId);
    context.user.click(deleteItemButton);
    await vi.runAllTimersAsync();

    expect(context.ordersServiceMock.deleteItem).toHaveBeenCalledWith(
      remainingOrderWithItem.id,
      itemToDelete.id,
    );

    expect(screen.getByTestId(integrationOutputTestId)).toHaveOutput<IntegrationOutput>({
      orders: ordersAfterItemDeletion,
      firstOrderIdFromSelector: ordersAfterItemDeletion.at(0)?.id,
    });
  });
});
