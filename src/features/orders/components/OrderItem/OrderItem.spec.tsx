import { Deferred } from "@esfx/async-deferred";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderItem } from "./OrderItem";
import { makeOrdersServiceMock } from "../../repositories/ordersRepository/utils/testing";
import { makeComponentFixture } from "../../utils/testing/makeComponentFixture";
import { makeOrderEntities, resetOrderEntitiesFactories } from "../../utils/testing";
import { orderItemTestId } from "../../testIds";

vi.mock(import("../../repositories/ordersRepository/OrdersService"));

describe(`${OrderItem.displayName}`, () => {
  const gateway = makeOrdersServiceMock();

  beforeEach(() => {
    resetOrderEntitiesFactories();
  });

  it("presents the item and deletes it through the gateway", async () => {
    const [order] = makeOrderEntities(1, 2);
    const [item] = order.itemEntities;
    gateway.mock.getOrders.mockResolvedValue([order]);
    gateway.mock.deleteItem.mockResolvedValue();
    const { Fixture, user } = makeComponentFixture();

    render(<OrderItem orderId={order.id} itemId={item.id} />, { wrapper: Fixture });

    const button = await screen.findByRole("button", { name: "Delete Item" });
    expect(screen.getByTestId(orderItemTestId)).toHaveTextContent(item.productId);
    expect(screen.getByTestId(orderItemTestId)).toHaveTextContent(String(item.quantity));
    await user.click(button);

    expect(gateway.mock.deleteItem).toHaveBeenCalledWith(order.id, item.id);
    expect(gateway.mock.deleteOrder).not.toHaveBeenCalled();
  });

  it("deletes the order when its last item is deleted", async () => {
    const [order] = makeOrderEntities(1, 1);
    const [item] = order.itemEntities;
    gateway.mock.getOrders.mockResolvedValue([order]);
    gateway.mock.deleteOrder.mockResolvedValue();
    const { Fixture, user } = makeComponentFixture();

    render(<OrderItem orderId={order.id} itemId={item.id} />, { wrapper: Fixture });
    await user.click(await screen.findByRole("button", { name: "Delete Item" }));

    expect(gateway.mock.deleteOrder).toHaveBeenCalledWith(order.id);
    expect(gateway.mock.deleteItem).not.toHaveBeenCalled();
  });

  it("hides a pending deletion and restores the item after rejection", async () => {
    const [order] = makeOrderEntities(1, 2);
    const [item] = order.itemEntities;
    const deletion = new Deferred<void>();
    gateway.mock.getOrders.mockResolvedValue([order]);
    gateway.mock.deleteItem.mockReturnValue(deletion.promise);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { Fixture, user } = makeComponentFixture();

    render(<OrderItem orderId={order.id} itemId={item.id} />, { wrapper: Fixture });
    await user.click(await screen.findByRole("button", { name: "Delete Item" }));
    await waitFor(() => expect(screen.queryByTestId(orderItemTestId)).not.toBeInTheDocument());

    await act(async () => deletion.reject(new Error("Deletion failed")));

    expect(await screen.findByRole("button", { name: "Delete Item" })).toBeEnabled();
  });

  it("uses the current identity when component props change", async () => {
    const orders = makeOrderEntities(2, 2);
    const [first, second] = orders;
    gateway.mock.getOrders.mockResolvedValue(orders);
    gateway.mock.deleteItem.mockResolvedValue();
    const { Fixture, user } = makeComponentFixture();

    const { rerender } = render(
      <OrderItem orderId={first.id} itemId={first.itemEntities[0].id} />,
      { wrapper: Fixture },
    );
    await screen.findByRole("button", { name: "Delete Item" });

    rerender(<OrderItem orderId={second.id} itemId={second.itemEntities[1].id} />);
    await user.click(screen.getByRole("button", { name: "Delete Item" }));

    expect(gateway.mock.deleteItem).toHaveBeenCalledWith(second.id, second.itemEntities[1].id);
  });
});
