import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  OrderEntityId,
  ItemEntityId,
  OrderEntity,
  StateWithOrderPresentationEntity,
} from "./ordersRepository.types";
import { makeOrdersService } from "./OrdersService";
import { ordersTag, getOrdersEndpointName } from "./ordersRepository.utils";

export const ordersRepository = createApi({
  reducerPath: "ordersRepository",
  baseQuery: fakeBaseQuery(),
  tagTypes: [ordersTag],
  endpoints: (builder) => ({
    getOrders: builder.query<OrderEntity[], void>({
      queryFn: async (_, { getState }) => {
        try {
          const { ordersPresentation } = getState() as StateWithOrderPresentationEntity;
          const gateway = makeOrdersService(ordersPresentation.ordersResource);
          const data = await gateway.getOrders();
          // Deep-clone so Immer freezes the copy, not the gateway's internal
          // objects
          return { data: structuredClone(data) };
        } catch (error) {
          console.error("getOrders", error);
          return { error: String(error) };
        }
      },
      providesTags: [ordersTag],
      // Prevents Immer-frozen remnants from prior cache entries mixing into the
      // fresh clone
      structuralSharing: false,
    }),
    deleteOrder: builder.mutation<void, { orderId: OrderEntityId }>({
      invalidatesTags: [ordersTag],
      queryFn: async ({ orderId }, { getState }) => {
        try {
          const { ordersPresentation } = getState() as StateWithOrderPresentationEntity;
          const gateway = makeOrdersService(ordersPresentation.ordersResource);
          await gateway.deleteOrder(orderId);
          return { data: undefined };
        } catch (error) {
          console.error("deleteOrders", error);
          return { error: String(error) };
        }
      },
      async onQueryStarted({ orderId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ordersRepository.util.updateQueryData(getOrdersEndpointName, undefined, (draft) =>
            draft.filter((order) => order.id !== orderId),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteOrderItem: builder.mutation<void, { orderId: OrderEntityId; itemId: ItemEntityId }>({
      invalidatesTags: [ordersTag],
      queryFn: async ({ orderId, itemId }, { getState }) => {
        try {
          const { ordersPresentation } = getState() as StateWithOrderPresentationEntity;
          const gateway = makeOrdersService(ordersPresentation.ordersResource);
          await gateway.deleteItem(orderId, itemId);
          return { data: undefined };
        } catch (error) {
          console.error("deleteOrderItem", error);
          return { error: String(error) };
        }
      },
      async onQueryStarted({ orderId, itemId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ordersRepository.util.updateQueryData(getOrdersEndpointName, undefined, (draft) => {
            const order = draft.find((o) => o.id === orderId);
            if (order) {
              order.itemEntities = order.itemEntities.filter((item) => item.id !== itemId);
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const { useGetOrdersQuery, useDeleteOrderItemMutation, useDeleteOrderMutation } =
  ordersRepository;
