import { NextRequest, NextResponse } from "next/server";
import { Network } from "@aptos-labs/ts-sdk";
import { getShelbyIndexerClient } from "@shelby-protocol/sdk/node";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawAddress = searchParams.get("address");

    if (!rawAddress) {
      return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
    }

    // Normalize address to lowercase for indexing queries
    const address = rawAddress.toLowerCase();

    const apiKey = process.env.SHELBY_API_KEY;
    const networkEnv = process.env.SHELBY_NETWORK || "testnet";

    if (!apiKey || apiKey === "aptoslabs_placeholder") {
      console.error("SHELBY_API_KEY is not defined or is placeholder in environment variables.");
      return NextResponse.json({ error: "Server misconfiguration: missing Shelby API key" }, { status: 500 });
    }

    // Resolve network format
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

    // Initialize Shelby Indexer Client
    const indexerClient = getShelbyIndexerClient({
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

    console.log(`Querying blobs for owner: ${address} on network ${networkEnv}...`);

    // 1. Fetch blobs from Indexer
    const blobsRes = await indexerClient.getBlobs({
      where: {
        owner: {
          _eq: address
        }
      },
      orderBy: {
        created_at: "desc" as any
      }
    });

    // 2. Fetch indexer processor status
    let processorStatus = null;
    try {
      const processorRes = await indexerClient.getProcessorStatus();
      if (processorRes && processorRes.processor_status) {
        processorStatus = processorRes.processor_status;
      }
    } catch (err) {
      console.error("Failed to fetch processor status:", err);
    }

    return NextResponse.json({
      success: true,
      blobs: blobsRes.blobs || [],
      processorStatus
    });

  } catch (error: any) {
    console.error("Error in Shelby Indexer query route:", error);
    return NextResponse.json({
      error: "Failed to query Shelby Indexer: " + (error.message || "Unknown error")
    }, { status: 500 });
  }
}
