import type { FC } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setOrdersResource } from "../stores";
import { isOrdersResource } from "../utils";
import { ordersRepository } from "../repositories";

export const OrdersResourcePicker: FC = () => {
  const resource = useAppSelector((state) => state.ordersPresentation.ordersResource);
  const dispatch = useAppDispatch();

  // presenter
  const isLocalChecked = resource === "local";
  const isRemoteChecked = resource === "remote";

  // controller
  const radioInputChanged = (value: string) => {
    if (!isOrdersResource(value)) {
      return;
    }
    dispatch(setOrdersResource(value));
    dispatch(ordersRepository.util.resetApiState());
  };

  // user interface
  return (
    <div className="join">
      <input
        className="join-item btn btn-sm"
        type="radio"
        name="orders-resource"
        aria-label="Local"
        value="local"
        checked={isLocalChecked}
        onChange={(event) => radioInputChanged(event.target.value)}
      />
      <input
        className="join-item btn btn-sm"
        type="radio"
        name="orders-resource"
        aria-label="Remote"
        value="remote"
        checked={isRemoteChecked}
        onChange={(event) => radioInputChanged(event.target.value)}
      />
    </div>
  );
};
