import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been deprecated. Please use /api/users/create-teacher or /api/users/create-admin instead." },
    { status: 410 }
  );
}
