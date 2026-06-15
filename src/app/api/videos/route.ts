import { NextResponse } from "next/server";
import { readVideos } from "@/data/db";

export async function GET() {
  try {
    const videos = await readVideos();

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
