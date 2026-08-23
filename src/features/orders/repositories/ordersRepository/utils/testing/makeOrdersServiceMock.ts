import { vi, beforeEach, type Mocked } from "vitest";
import type { OrdersGateway } from "../../ordersRepository.types";
import { makeOrdersService } from "../../OrdersService";

export type MockedOrdersService = Mocked<OrdersGateway>;

function makeMockInstance(): MockedOrdersService {
  return {
    getOrders: vi.fn<OrdersGateway["getOrders"]>().mockResolvedValue([]),
    deleteOrder: vi.fn<OrdersGateway["deleteOrder"]>(),
    deleteItem: vi.fn<OrdersGateway["deleteItem"]>(),
  };
}

export function makeOrdersServiceMock() {
  let mockInstance: MockedOrdersService;

  beforeEach(() => {
    mockInstance = makeMockInstance();
    vi.mocked(makeOrdersService).mockReturnValue(mockInstance);
  });

  return {
    get mock() {
      return mockInstance;
    },
  };
}
