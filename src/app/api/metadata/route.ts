import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const metadataPath = path.join(process.cwd(), "backend", "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json({ error: "Metadata file not found" }, { status: 404 });
    }
    const fileContent = fs.readFileSync(metadataPath, "utf-8");
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to read metadata" }, { status: 500 });
  }
}
