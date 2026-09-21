import { Deferred } from "@esfx/async-deferred";
import { render, screen } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import { Orders } from "./Orders";
import { ordersTestId } from "../testIds";
import type { OrderEntity, OrderEntityId } from "../repositories";
import { makeOrdersServiceMock } from "../repositories/ordersRepository/utils/testing";
import { makeComponentFixture } from "../utils/testing/makeComponentFixture";
import { makeOrderEntities, resetOrderEntitiesFactories } from "../utils/testing";

vi.mock(import("../repositories/ordersRepository/OrdersService"));
vi.mock("../components/Order/Order", () => ({
  Order: (props: { orderId: OrderEntityId }) => (
    <div data-testid={`order-${props.orderId}`}>Order {props.orderId}</div>
  ),
}));
vi.mock("../components/OrdersResourcePicker", () => ({
  OrdersResourcePicker: () => <div data-testid="orders-resource-picker" />,
}));
vi.mock("../components/OrdersStatistics", () => ({
  OrdersStatistics: () => <div data-testid="orders-statistics" />,
}));

describe(`${Orders.displayName}`, () => {
  const gateway = makeOrdersServiceMock();

  beforeEach(() => {
    resetOrderEntitiesFactories();
  });

  it("shows loading without orders while the request is pending", async () => {
    const request = new Deferred<OrderEntity[]>();
    gateway.mock.getOrders.mockReturnValue(request.promise);
    const { Fixture } = makeComponentFixture();

    render(<Orders />, { wrapper: Fixture });

    expect(screen.getByTestId(ordersTestId)).toBeInTheDocument();
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(screen.queryByTestId(/^order-/)).not.toBeInTheDocument();

    request.resolve([]);
    expect(await screen.findByText("idle")).toBeInTheDocument();
  });

  it("renders the IDs from the loaded orders", async () => {
    const orders = makeOrderEntities(3);
    gateway.mock.getOrders.mockResolvedValue(orders);
    const { Fixture } = makeComponentFixture();

    render(<Orders />, { wrapper: Fixture });

    expect(await screen.findByText("idle")).toBeInTheDocument();
    orders.forEach((order) => {
      expect(screen.getByTestId(`order-${order.id}`)).toBeInTheDocument();
    });
  });

  it("renders an empty result", async () => {
    gateway.mock.getOrders.mockResolvedValue([]);
    const { Fixture } = makeComponentFixture();

    render(<Orders />, { wrapper: Fixture });

    expect(await screen.findByText("idle")).toBeInTheDocument();
    expect(screen.queryByTestId(/^order-/)).not.toBeInTheDocument();
  });

  it("shows a failed error badge when loading orders fails", async () => {
    gateway.mock.getOrders.mockRejectedValue(new Error("Orders are unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { Fixture } = makeComponentFixture();

    render(<Orders />, { wrapper: Fixture });

    const failedBadge = await screen.findByText("failed");
    expect(failedBadge).toHaveClass("badge-error");
    expect(failedBadge.querySelector(".loading-spinner")).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
