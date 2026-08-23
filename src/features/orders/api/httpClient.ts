import type { ApiHttpClient } from "./types";

export const fetchRequest: ApiHttpClient["request"] = (request) => fetch(request);

export const makeHttpClient = (): ApiHttpClient => ({ request: fetchRequest });
