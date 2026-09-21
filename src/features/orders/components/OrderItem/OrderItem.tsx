import { memo, type FC } from "react";
import { deleteItemButtonTestId, orderItemTestId } from "../../testIds";
import { useOrderByIdSelector } from "../../hooks";
import {
  type OrderEntityId,
  type ItemEntityId,
  useDeleteOrderMutation,
  useDeleteOrderItemMutation,
  makeDeleteOrderFixedCacheKey,
  makeDeleteOrderItemFixedCacheKey,
} from "../../repositories";

export const OrderItem: FC<{ orderId: OrderEntityId; itemId: ItemEntityId }> = memo(
  ({ orderId, itemId }) => {
    const order = useOrderByIdSelector(orderId);
    const [deleteOrder, { isLoading: isDeletingOrder }] = useDeleteOrderMutation({
      fixedCacheKey: makeDeleteOrderFixedCacheKey(orderId),
    });
    const [deleteItem, { isLoading: isDeletingItem }] = useDeleteOrderItemMutation({
      fixedCacheKey: makeDeleteOrderItemFixedCacheKey(orderId, itemId),
    });

    // presenter
    const item = order?.itemEntities.find((candidate) => candidate.id === itemId);
    const isDeleteItemButtonDisabled = isDeletingOrder || isDeletingItem;

    // controller with an inline use case; decisions read entities, not display values
    const deleteOrderItemButtonClicked = async () => {
      try {
        if (order?.itemEntities.length === 1) {
          await deleteOrder({ orderId }).unwrap();
        } else {
          await deleteItem({ orderId, itemId }).unwrap();
        }
      } catch (error: unknown) {
        console.error(error);
      }
    };

    // user interface
    if (!item) {
      return null;
    }

    return (
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-base-300"
        data-testid={orderItemTestId}
      >
        <div className="flex flex-1 gap-6 flex-wrap">
          <div>
            <div className="text-xs text-base-content/40 uppercase tracking-wider">id</div>
            <code className="text-sm">{item.id}</code>
          </div>
          <div>
            <div className="text-xs text-base-content/40 uppercase tracking-wider">product id</div>
            <code className="text-sm">{item.productId}</code>
          </div>
          <div>
            <div className="text-xs text-base-content/40 uppercase tracking-wider">quantity</div>
            <div className="badge badge-neutral badge-sm mt-1">{item.quantity}</div>
          </div>
        </div>
        <button
          className="btn btn-xs btn-error btn-outline"
          data-testid={deleteItemButtonTestId}
          disabled={isDeleteItemButtonDisabled}
          onClick={deleteOrderItemButtonClicked}
        >
          Delete Item
        </button>
      </div>
    );
  },
);

OrderItem.displayName = "OrderItem";
