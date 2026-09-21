import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdersResourcePicker } from "./OrdersResourcePicker";
import { OrdersStatistics } from "./OrdersStatistics";
import { makeOrdersServiceMock } from "../repositories/ordersRepository/utils/testing";
import { makeOrdersService } from "../repositories/ordersRepository/OrdersService";
import { makeComponentFixture } from "../utils/testing/makeComponentFixture";

vi.mock(import("../repositories/ordersRepository/OrdersService"));

describe(OrdersResourcePicker.name, () => {
  const gateway = makeOrdersServiceMock();

  it("selects the resource and reloads its data through the gateway", async () => {
    const local = { ...gateway.mock, getOrders: vi.fn().mockResolvedValue([]) };
    const remote = { ...gateway.mock, getOrders: vi.fn().mockResolvedValue([]) };
    vi.mocked(makeOrdersService).mockImplementation((resource) =>
      resource === "local" ? local : remote,
    );
    const { Fixture, user } = makeComponentFixture();

    render(
      <>
        <OrdersResourcePicker />
        <OrdersStatistics />
      </>,
      { wrapper: Fixture },
    );

    expect(screen.getByRole("radio", { name: "Local" })).toBeChecked();
    expect(local.getOrders).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("radio", { name: "Remote" }));
    expect(screen.getByRole("radio", { name: "Remote" })).toBeChecked();
    expect(remote.getOrders).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("radio", { name: "Local" }));
    expect(screen.getByRole("radio", { name: "Local" })).toBeChecked();
    expect(local.getOrders).toHaveBeenCalledTimes(2);
  });
});
