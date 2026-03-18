import { NextResponse } from "next/server";
import { getAgentsResponse } from "@/lib/agents-handler";

export async function GET() {
  try {
    const data = getAgentsResponse();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}
