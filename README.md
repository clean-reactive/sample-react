# Clean Reactive Architecture — React + RTK Query Sample

A sample application that demonstrates
[Clean Reactive Architecture](https://github.com/clean-reactive/documentation/blob/main/docs/architecture.md)
implemented with React and RTK Query.

The sample shows a concrete, working mapping of every architectural unit from
the diagram to idiomatic React + Redux Toolkit code. It covers entities, gateway
interfaces, repositories, use cases, selectors, presenters, controllers, and the
user interface — with unit and integration tests for each layer.

## Getting started

Install dependencies:

```sh
npm ci
```

Start the development server:

```sh
npm run dev
```

## Tech stack

- [React](https://react.dev/) 18
- [Redux Toolkit](https://redux-toolkit.js.org/) + [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [daisyUI](https://daisyui.com/)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- [MSW](https://mswjs.io/) for network-level HTTP interception in gateway tests
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) for dependency validation and graph visualization

## Architecture mapping

The table below shows how each unit from the Clean Reactive Architecture diagram
maps to this codebase.

| Architectural unit              | React / RTK equivalent             | Location                                                                                |
| ------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Application business entity     | Redux slice (`createSlice`)        | `stores/ordersPresentationSlice.ts`                                                     |
| Enterprise business entity      | TypeScript type                    | `repositories/ordersRepository.types.ts`                                                |
| Gateway interface               | TypeScript interface               | `OrdersGateway` in `ordersRepository.types.ts`                                          |
| Repository (gateway + entities) | RTK Query API (`createApi`)        | `repositories/ordersRepository/ordersRepository.ts`                                     |
| Gateway implementation          | Factory returning `OrdersGateway`  | `OrdersService/InMemoryOrdersService`, `OrdersService/RemoteOrdersService`              |
| Use case interactor             | React hook                         | `hooks/useDeleteOrderUseCase`                                                           |
| Selector                        | React hook                         | `hooks/useOrderIdsSelector`, `useOrderByIdSelector`, `useTotalItemsQuantitySelector`, … |
| Presenter                       | React hook returning a view model  | `components/Orders/hooks/usePresenter`, `components/Order/hooks/usePresenter`           |
| Controller                      | React hook returning callbacks     | `components/Orders/hooks/useController`, `components/OrderItem/hooks/useController`     |
| User interface                  | React component                    | `components/Orders`, `components/Order`, `components/OrderItem`                         |

## UML diagram representing application architecture

![clean-reactive-architecture-repository-with-gateway-interface](./clean-reactive-architecture-repository-with-gateway-interface.png)

## Key design decisions

**Application business entity as a Redux slice.** `OrdersPresentationEntity`
holds application-level state (`ordersResource: "local" | "remote"`) that
persists across use case calls and has its own rules. It is managed by a
dedicated Redux slice, not by RTK Query.

**Repository as RTK Query `createApi`.** The `ordersRepository` is a composite
of the gateway interface and the enterprise business entity. It exposes
`OrdersGateway` behaviour through its endpoints and owns the entity cache that
presenters and selectors read from.

**Gateway implementations resolved at runtime.** `makeOrdersService(resource)`
returns either `makeInMemoryOrdersService()` or `makeRemoteOrdersService()`
depending on the `ordersResource` value stored in the application business
entity. The repository calls this factory inside each `queryFn`, so the gateway
implementation can change without any structural change to the architecture.

**Hooks as architectural units.** React hooks are the natural host for use
cases, selectors, presenters, and controllers in a React application. Each hook
has a single, clearly scoped responsibility that matches exactly one
architectural unit.

**Dependency graph.** `dependency-cruiser` is configured to detect circular
dependencies, orphan modules, and unresolvable imports. The `deps:graph` script
generates a visual SVG of the module graph.

## Folder structure

```console
src/features
└── orders
    ├── api                         # external resource (HTTP client + API)
    │   ├── httpClient.ts
    │   ├── OrdersApi
    │   │   ├── OrdersApi.factory.ts
    │   │   ├── OrdersApi.ts
    │   │   └── OrdersApi.types.ts
    │   └── types.ts
    ├── components                  # user interface, presenters, controllers
    │   ├── Order
    │   │   ├── hooks
    │   │   │   ├── useController.ts
    │   │   │   └── usePresenter
    │   │   │       └── usePresenter.ts
    │   │   ├── Order.tsx
    │   │   └── Order.types.ts
    │   ├── OrderItem
    │   │   ├── hooks
    │   │   │   ├── useController
    │   │   │   │   └── useController.ts
    │   │   │   └── usePresenter.ts
    │   │   ├── OrderItem.tsx
    │   │   └── OrderItem.types.ts
    │   ├── OrdersResourcePicker.tsx
    │   └── OrdersStatistics.tsx
    ├── hooks                       # use cases, selectors
    │   ├── useDeleteOrderUseCase
    │   │   └── useDeleteOrderUseCase.ts
    │   ├── useIsDeleteOrderMutatingSelector.ts
    │   ├── useIsOrdersMutatingSelector.ts
    │   ├── useIsOrdersProcessingSelector
    │   │   └── useIsOrdersProcessingSelector.ts
    │   ├── useItemByIdSelector.ts
    │   ├── useOrderByIdSelector
    │   │   └── useOrderByIdSelector.ts
    │   ├── useOrderIdsSelector
    │   │   └── useOrderIdsSelector.ts
    │   ├── useOrdersResourceSelector.ts
    │   ├── useOrdersSelector.ts
    │   └── useTotalItemsQuantitySelector
    │       └── useTotalItemsQuantitySelector.ts
    ├── Orders                      # user interface, presenter, controller
    │   ├── hooks
    │   │   ├── useController.ts
    │   │   └── usePresenter.ts
    │   ├── Orders.tsx
    │   └── Orders.types.ts
    ├── repositories                # repository, gateway interface, gateway implementations
    │   └── ordersRepository
    │       ├── ordersRepository.ts
    │       ├── ordersRepository.types.ts
    │       ├── ordersRepository.utils.ts
    │       └── OrdersService
    │           ├── InMemoryOrdersService
    │           │   ├── InMemoryOrdersService.ts
    │           │   └── makeOrderEntitiesMock.ts
    │           ├── OrdersService.ts
    │           └── RemoteOrdersService
    │               ├── mappers.ts
    │               └── RemoteOrdersService.ts
    ├── stores                      # application business entity
    │   ├── OrdersPresentationEntity.types.ts
    │   └── ordersPresentationSlice.ts
    ├── testIds.ts
    └── utils
        └── isOrdersResource.ts
```

## Further reading

- [Clean Reactive Architecture](https://github.com/clean-reactive/documentation/blob/main/docs/architecture.md)
- [Development Methodology](https://github.com/clean-reactive/documentation/blob/main/docs/methodology.md)

## Dependency graph

![dependency-graph](./dependency-graph.svg)
