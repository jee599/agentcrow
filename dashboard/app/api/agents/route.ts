import { NextRequest, NextResponse } from "next/server";
import { getAgentsResponse, matchAgent } from "@/lib/agents-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const action = searchParams.get("action");

    if (role && action) {
      const result = await matchAgent(role, action);
      return NextResponse.json(result);
    }

    const data = getAgentsResponse();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}
