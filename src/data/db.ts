import fs from "fs/promises";
import path from "path";
import os from "os";

// Detect if running on Vercel (or AWS Lambda serverless task runner)
const isVercel = 
  process.env.VERCEL === "1" || 
  process.env.VERCEL === "true" || 
  process.env.NOW_BUILDER !== undefined ||
  process.env.LAMBDA_TASK_ROOT !== undefined ||
  (typeof process.cwd === "function" && process.cwd().startsWith("/var/task"));

export const getDbPath = async (): Promise<string> => {
  const localPath = path.join(process.cwd(), "src/data/videos.json");
  if (!isVercel) {
    return localPath;
  }

  // On Vercel, use temporary directory
  const tempPath = path.join(os.tmpdir(), "videos.json");
  try {
    await fs.access(tempPath);
  } catch {
    // If temp file doesn't exist, seed it from the read-only local path
    try {
      const data = await fs.readFile(localPath, "utf-8");
      await fs.writeFile(tempPath, data, "utf-8");
    } catch (err) {
      // Failsafe if local file is missing
      await fs.writeFile(tempPath, "[]", "utf-8");
    }
  }
  return tempPath;
};

export async function readVideos(): Promise<any[]> {
  try {
    const dbPath = await getDbPath();
    const content = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

export async function writeVideos(videos: any[]): Promise<void> {
  try {
    const dbPath = await getDbPath();
    // Ensure directory exists
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(videos, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database:", err);
    throw err;
  }
}
