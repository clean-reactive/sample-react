import type { FC } from "react";
import { totalItemQuantityTestId } from "../testIds";
import { useOrdersSelector } from "../hooks";

export const OrdersStatistics: FC = () => {
  const orders = useOrdersSelector();

  // presenter
  const uniqueUsersCount = new Set(orders.map((order) => order.userId)).size;
  const ordersCount = orders.length;
  const itemLinesCount = orders.reduce((count, order) => count + order.itemEntities.length, 0);
  const totalItemsQuantity = orders.reduce(
    (total, order) =>
      total + order.itemEntities.reduce((subtotal, item) => subtotal + item.quantity, 0),
    0,
  );

  // user interface
  return (
    <div className="flex gap-2">
      <div className="badge badge-ghost gap-1">
        <span>{uniqueUsersCount}</span>
        <span>users</span>
      </div>
      <div className="badge badge-ghost gap-1">
        <span>{ordersCount}</span>
        <span>orders</span>
      </div>
      <div className="badge badge-ghost gap-1">
        <span>{itemLinesCount}</span>
        <span>items</span>
      </div>
      <div className="badge badge-ghost gap-1">
        <span data-testid={totalItemQuantityTestId}>{totalItemsQuantity}</span>
        <span>qty</span>
      </div>
    </div>
  );
};

OrdersStatistics.displayName = "OrdersStatistics";
