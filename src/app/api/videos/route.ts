import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), "src/data/videos.json");
    let videos = [];
    
    try {
      const dbContent = await fs.readFile(dbPath, "utf-8");
      videos = JSON.parse(dbContent);
    } catch (err) {
      // If database file doesn't exist, start with empty list
      return NextResponse.json([]);
    }

    // Sort videos to return the newest uploads first
    videos.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return NextResponse.json(videos);
  } catch (error: any) {
    console.error("Error fetching video metadata:", error);
    return NextResponse.json({ 
      error: "Failed to load videos: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}
