import { NextRequest, NextResponse } from "next/server";
import { readVideos, writeVideos } from "@/data/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, amount } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    const videos = await readVideos();

    const videoIndex = videos.findIndex((v) => v.id === id);
    if (videoIndex === -1) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const video = videos[videoIndex];

    // Ensure all engagement fields are initialized
    if (video.views === undefined) video.views = 0;
    if (video.likes === undefined) video.likes = 0;
    if (video.dislikes === undefined) video.dislikes = 0;
    if (video.totalTips === undefined) video.totalTips = 0;
    if (video.category === undefined) video.category = "Others";

    // Perform action
    if (action === "view") {
      video.views += 1;
    } else if (action === "like") {
      video.likes += 1;
    } else if (action === "unlike") {
      video.likes = Math.max(0, video.likes - 1);
    } else if (action === "tip") {
      const tipAmount = parseFloat(amount);
      if (!isNaN(tipAmount) && tipAmount > 0) {
        video.totalTips = parseFloat((video.totalTips + tipAmount).toFixed(6));
      } else {
        return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Save back to database
    videos[videoIndex] = video;
    await writeVideos(videos);

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error: any) {
    console.error("Error updating video actions:", error);
    return NextResponse.json({
      error: "Failed to update video: " + (error.message || "Unknown error"),
    }, { status: 500 });
  }
}
