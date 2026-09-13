import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.execute(sql`SELECT 1`);

    return NextResponse.json(
      { message: "Database pinged successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Keep alive failed:", error);
    return NextResponse.json(
      { error: "Failed to ping database" },
      { status: 500 }
    );
  }
}
