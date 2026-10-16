import { handleCompany } from "@/features/companies/handler";

export async function GET(request: Request) { return handleCompany(request); }
export async function POST(request: Request) { return handleCompany(request); }
