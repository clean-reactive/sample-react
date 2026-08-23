import type { ApiHttpClient } from "../types";
import { makeHttpClient } from "../httpClient";
import type { ApiOrderDto } from "./ApiOrders.types";

const baseUrl = import.meta.env.BASE_URL;
export const apiOrdersResource = `${baseUrl}api/orders`;

export const getOrders = async (httpClient: ApiHttpClient): Promise<ApiOrderDto[]> => {
  const request = new Request(apiOrdersResource, { method: "GET" });
  const response = await httpClient.request(request);
  return response.json();
};

export const getOrder = async (httpClient: ApiHttpClient, id: string): Promise<ApiOrderDto> => {
  const request = new Request(`${apiOrdersResource}/${id}`, { method: "GET" });
  const response = await httpClient.request(request);
  return response.json();
};

export const updateOrder = async (
  httpClient: ApiHttpClient,
  id: string,
  order: ApiOrderDto,
): Promise<void> => {
  const request = new Request(`${apiOrdersResource}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  await httpClient.request(request);
};

export const deleteOrder = async (httpClient: ApiHttpClient, id: string): Promise<void> => {
  const request = new Request(`${apiOrdersResource}/${id}`, { method: "DELETE" });
  await httpClient.request(request);
};

export const makeApiOrders = (httpClient: ApiHttpClient = makeHttpClient()) => ({
  getOrders: () => getOrders(httpClient),
  getOrder: (id: string) => getOrder(httpClient, id),
  updateOrder: (id: string, order: ApiOrderDto) => updateOrder(httpClient, id, order),
  deleteOrder: (id: string) => deleteOrder(httpClient, id),
});

export type ApiOrders = ReturnType<typeof makeApiOrders>;
