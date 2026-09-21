import type { FC } from "react";
import { memo } from "react";
import { QueryStatus } from "@reduxjs/toolkit/query/react";
import { useAppSelector } from "../../../hooks";
import { ordersTestId } from "../testIds";
import { Order, OrdersResourcePicker, OrdersStatistics } from "../components";
import {
  ordersRepository,
  useGetOrdersQuery,
  deleteOrderCacheKey,
  deleteOrderItemCacheKey,
} from "../repositories";

export const Orders: FC = memo(() => {
  const { data: orders = [], isLoading, isFetching } = useGetOrdersQuery();
  const isMutating = useAppSelector((state) =>
    Object.entries(state[ordersRepository.reducerPath].mutations).some(
      ([key, mutation]) =>
        (key.startsWith(`${deleteOrderCacheKey}:`) ||
          key.startsWith(`${deleteOrderItemCacheKey}:`)) &&
        mutation?.status === QueryStatus.pending,
    ),
  );

  // presenter
  let statusLabel = "idle";
  if (isLoading) {
    statusLabel = "loading";
  } else if (isFetching) {
    statusLabel = "fetching";
  } else if (isMutating) {
    statusLabel = "mutating";
  }
  const orderIds = orders.map((order) => order.id);
  const isProcessing = isLoading || isFetching || isMutating;

  // user interface
  return (
    <div className="w-140 max-w-full text-left" data-testid={ordersTestId}>
      <h2 className="text-lg font-bold tracking-widest uppercase mb-5">Orders</h2>
      <div className="mb-5">
        <div className="text-xs text-base-content/40 uppercase tracking-widest mb-2">Resource</div>
        <div className="flex items-center justify-between">
          <OrdersResourcePicker />
          <div className={`badge gap-1 ${isProcessing ? "badge-warning" : "badge-success"}`}>
            {isProcessing && <span className="loading loading-spinner loading-xs" />}
            {statusLabel}
          </div>
        </div>
      </div>
      <div className="mb-5">
        <div className="text-xs text-base-content/40 uppercase tracking-widest mb-2">
          Statistics
        </div>
        <OrdersStatistics />
      </div>
      <div className="flex flex-col gap-3">
        {orderIds.map((orderId) => (
          <Order key={orderId} orderId={orderId} />
        ))}
      </div>
    </div>
  );
});

Orders.displayName = "Orders";
