import { NextRequest, NextResponse } from "next/server";
import { Network, Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import fs from "fs/promises";
import path from "path";

// Helper to sanitize filenames to prevent URL encoding issues
const sanitizeFilename = (filename: string) => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_");
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const uploaderAddress = formData.get("uploaderAddress") as string | null;
    const category = formData.get("category") as string | null;
    const type = formData.get("type") as string | null;

    // 1. Validation checks
    if (!file) {
      return NextResponse.json({ error: "Missing video file" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Missing video title" }, { status: 400 });
    }

    // Enforce 100MB limit for testnet
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    // 2. Read server keys from environment
    const privateKeyStr = process.env.APTOS_PRIVATE_KEY;
    const apiKey = process.env.SHELBY_API_KEY;
    const networkEnv = process.env.SHELBY_NETWORK || "testnet";

    if (!privateKeyStr) {
      console.error("APTOS_PRIVATE_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "Server misconfiguration: missing Aptos private key" }, { status: 500 });
    }

    if (!apiKey || apiKey === "aptoslabs_placeholder") {
      console.error("SHELBY_API_KEY is not defined or is placeholder in environment variables.");
      return NextResponse.json({ error: "Server misconfiguration: missing or invalid Shelby API key" }, { status: 500 });
    }

    // 3. Initialize Aptos account from Private Key
    let account: Ed25519Account;
    try {
      const privateKey = new Ed25519PrivateKey(privateKeyStr);
      account = new Ed25519Account({ privateKey });
    } catch (err: any) {
      console.error("Failed to parse APTOS_PRIVATE_KEY:", err);
      return NextResponse.json({ error: "Server misconfiguration: invalid private key format" }, { status: 500 });
    }

    // 4. Initialize Shelby node client
    let network: any = Network.TESTNET;
    const lowerEnv = networkEnv.toLowerCase();
    if (lowerEnv === "mainnet") {
      network = Network.MAINNET;
    } else if (lowerEnv === "devnet") {
      network = Network.DEVNET;
    } else if (lowerEnv === "shelbynet") {
      network = "shelbynet" as any;
    } else {
      network = networkEnv as any;
    }

    const shelbyClient = new ShelbyNodeClient({
      network,
      apiKey,
      aptos: {
        clientConfig: {
          HEADERS: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      }
    });

    // 5. Convert file to buffer for Shelby upload
    const arrayBuffer = await file.arrayBuffer();
    const blobData = Buffer.from(arrayBuffer);

    // Make blob name unique to prevent collisions
    const sanitizedName = sanitizeFilename(file.name);
    const blobName = `videos/${Date.now()}_${sanitizedName}`;

    // Upload blob to Shelby (valid for 30 days)
    const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;
    
    console.log(`Uploading ${blobName} to Shelby Network...`);
    
    await shelbyClient.upload({
      signer: account,
      blobData,
      blobName,
      expirationMicros,
    });

    const serverAddress = account.accountAddress.toString();
    const rpcDomain = lowerEnv === "shelbynet" ? "api.shelbynet.shelby.xyz" : "api.testnet.shelby.xyz";
    const videoUrl = `https://${rpcDomain}/shelby/v1/blobs/${serverAddress}/${blobName}`;

    console.log(`Uploaded successfully! URL: ${videoUrl}`);

    // 6. Write metadata to local videos.json store
    const dbPath = path.join(process.cwd(), "src/data/videos.json");
    let videos: any[] = [];
    
    try {
      const dbContent = await fs.readFile(dbPath, "utf-8");
      videos = JSON.parse(dbContent);
    } catch (err) {
      // In case directory or file is missing (failsafe, though created earlier)
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
    }

    const newVideo = {
      id: Date.now().toString(),
      title,
      blobName,
      uploaderAddress: uploaderAddress || "Anonymous",
      serverAddress,
      videoUrl,
      timestamp: Date.now(),
      fileSize: file.size,
      category: category || "Others",
      type: type || "video",
      views: 0,
      likes: 0,
      dislikes: 0,
      totalTips: 0,
    };

    videos.push(newVideo);
    await fs.writeFile(dbPath, JSON.stringify(videos, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      video: newVideo,
    });

  } catch (error: any) {
    console.error("Error handling upload:", error);
    return NextResponse.json({ 
      error: "Upload failed: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}
