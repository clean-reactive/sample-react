import type { OrdersResource } from "../../../stores";
import type { OrdersGateway } from "../ordersRepository.types";
import { makeInMemoryOrdersService } from "./InMemoryOrdersService";
import { makeRemoteOrdersService } from "./RemoteOrdersService";

export const makeOrdersService = (resource: OrdersResource): OrdersGateway =>
  resource === "local" ? makeInMemoryOrdersService() : makeRemoteOrdersService();
