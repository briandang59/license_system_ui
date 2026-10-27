import type { TransferResource } from "./schema";
export const transferUrl = (resource: TransferResource, action: "template" | "preview" | "commit" | "export") => `/api/data-transfer/${resource}/${action}`;
