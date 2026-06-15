"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, HardDrive, User, ArrowLeft, ExternalLink, 
  Database, Info, AlertTriangle, ShieldCheck, Clock, 
  Eye, ThumbsUp, Heart, Share2, Coins, Loader2, Play 
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { CustomVideoPlayer } from "@/components/CustomVideoPlayer";

interface VideoMetadata {
  id: string;
  title: string;
  blobName: string;
  uploaderAddress: string;
  serverAddress: string;
  videoUrl: string;
  timestamp: number;
  fileSize: number;
  category?: string;
  type?: "video" | "image";
  views?: number;
  likes?: number;
  dislikes?: number;
  totalTips?: number;
}

export default function WatchPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const { connected, account, signAndSubmitTransaction } = useWallet();

  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [otherVideos, setOtherVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Engagement states
  const [isLiked, setIsLiked] = useState(false);
  const [viewRegistered, setViewRegistered] = useState(false);

  // Tipping states
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("0.5");
  const [tipLoading, setTipLoading] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipTxHash, setTipTxHash] = useState("");
  const [tipError, setTipError] = useState("");

  // Load video and other videos
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/videos");
        if (res.ok) {
          const data: VideoMetadata[] = await res.json();
          const found = data.find((v) => v.id === id);
          if (found) {
            setVideo(found);
            setOtherVideos(data.filter((v) => v.id !== id).slice(0, 4));
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to load video metadata:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();

    // Check if liked in localStorage
    if (typeof window !== "undefined" && id) {
      const likedVideos = JSON.parse(localStorage.getItem("vidora_liked") || "[]");
      setIsLiked(likedVideos.includes(id));
    }
  }, [id]);

  // Auto-view registration for image content
  useEffect(() => {
    if (video && video.type === "image" && !viewRegistered) {
      const sessionKey = `view_registered_${video.id}`;
      const alreadyRegistered = sessionStorage.getItem(sessionKey);
      if (!alreadyRegistered) {
        handleFirstPlay();
        sessionStorage.setItem(sessionKey, "true");
      }
      setViewRegistered(true);
    }
  }, [video, viewRegistered]);

  // Handle first play view registration
  const handleFirstPlay = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view" }),
      });
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
      }
    } catch (err) {
      console.error("Failed to register view:", err);
    }
  };

  // Handle Like/Unlike
  const handleLike = async () => {
    if (!id) return;
    try {
      const action = isLiked ? "unlike" : "like";
      const res = await fetch(`/api/videos/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
        
        const likedVideos = JSON.parse(localStorage.getItem("vidora_liked") || "[]");
        if (isLiked) {
          const index = likedVideos.indexOf(id);
          if (index > -1) likedVideos.splice(index, 1);
        } else {
          likedVideos.push(id);
        }
        localStorage.setItem("vidora_liked", JSON.stringify(likedVideos));
        setIsLiked(!isLiked);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Handle send tip transaction
  const handleSendTip = async () => {
    if (!connected || !account) {
      setTipError("Please connect your wallet first.");
      return;
    }
    if (!video) return;

    setTipLoading(true);
    setTipError("");
    setTipSuccess(false);

    try {
      const amount = parseFloat(tipAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid APT amount.");
      }

      // Convert APT to Octas (1 APT = 10^8 Octas)
      const octas = Math.round(amount * 100_000_000);

      const payload: any = {
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [video.uploaderAddress, octas],
        }
      };

      const txResult = await signAndSubmitTransaction(payload);

      if (txResult && txResult.hash) {
        setTipTxHash(txResult.hash);

        // Register tip count in backend
        const res = await fetch(`/api/videos/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tip", amount }),
        });

        if (res.ok) {
          const data = await res.json();
          setVideo(data.video);
        }

        setTipSuccess(true);
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch (err: any) {
      console.error("Tip transaction failed:", err);
      setTipError(err.message || "Transaction failed.");
    } finally {
      setTipLoading(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getLeaseExpiration = (timestamp: number) => {
    const expTime = timestamp + 1000 * 60 * 60 * 24 * 30;
    return new Date(expTime).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const truncateAddress = (addr: string, chars = 6) => {
    if (!addr) return "";
    if (addr === "Anonymous") return "Anonymous";
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">Loading streaming link...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-6 border border-rose-500/20">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Video Not Found</h2>
        <p className="mt-2 text-slate-400 text-sm max-w-md text-center">
          The video metadata you are trying to view does not exist or has been removed from this node index.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </button>
      </div>
    );
  }

  const isTipDisabled = video.uploaderAddress === "Anonymous" || !video.uploaderAddress.startsWith("0x");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 relative">
      
      {/* Back link */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-400 transition"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Gallery
        </button>
      </div>

      {/* Grid Layout: Player (left) + Info/Sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Video Player + Title & Desc */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Media Player / Viewer */}
          {video.type === "image" ? (
            <div className="relative rounded-3xl border border-slate-800 bg-slate-950/40 backdrop-blur-xl p-3 overflow-hidden flex items-center justify-center min-h-[300px] md:min-h-[500px] shadow-2xl">
              {/* Blurred background image for depth */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 pointer-events-none scale-110"
                style={{ backgroundImage: `url(${video.videoUrl})` }}
              />
              <img 
                src={video.videoUrl} 
                alt={video.title} 
                className="relative z-10 max-w-full max-h-[70vh] rounded-2xl object-contain shadow-2xl border border-slate-800/80 transition-all duration-300 hover:scale-[1.01]"
              />
            </div>
          ) : (
            <CustomVideoPlayer 
              src={video.videoUrl} 
              onFirstPlay={handleFirstPlay} 
            />
          )}

          {/* Video Title & Actions */}
          <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {video.category || "Others"}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold text-white shadow-sm ${
                    video.type === "image" ? "bg-emerald-600" : "bg-indigo-600"
                  }`}>
                    {video.type === "image" ? "Image" : "Video"}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
                  {video.title}
                </h1>
              </div>

              {/* Action Buttons: Like, Tip */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                    isLiked
                      ? "bg-indigo-500/15 border-indigo-500/35 text-indigo-400 shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <ThumbsUp className={`h-4.5 w-4.5 ${isLiked ? "fill-current" : ""}`} />
                  <span>{video.likes || 0} Likes</span>
                </button>

                {/* Tip Creator Button */}
                <button
                  onClick={() => setTipModalOpen(true)}
                  disabled={isTipDisabled}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition cursor-pointer shadow-lg ${
                    isTipDisabled
                      ? "bg-slate-900/40 border-slate-900 text-slate-500 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-transparent shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                  title={isTipDisabled ? "Anonymous uploader cannot receive tips" : "Support creator with APT tip"}
                >
                  <Coins className="h-4.5 w-4.5" />
                  <span>Tip Creator</span>
                  {video.totalTips !== undefined && video.totalTips > 0 && (
                    <span className="ml-1 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[11px]">
                      {video.totalTips} APT
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-400 border-b border-slate-900 pb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-400" />
                Uploaded on {formatDate(video.timestamp)}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-800 hidden sm:inline" />
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-indigo-400" />
                File size: {formatBytes(video.fileSize)}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-800 hidden sm:inline" />
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-indigo-400" />
                {video.views || 0} views
              </span>
            </div>
          </div>

          {/* Web3 / Shelby Technical storage Details Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-900/60 pb-3">
              <Database className="h-4 w-4 text-indigo-400" />
              Decentralized Storage Metadata (Shelby Protocol)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Uploader Account (Petra)</span>
                {video.uploaderAddress !== "Anonymous" ? (
                  <Link
                    href={`/creator/${video.uploaderAddress}`}
                    className="font-mono text-indigo-400 hover:text-indigo-300 font-semibold break-all transition hover:underline"
                  >
                    {video.uploaderAddress}
                  </Link>
                ) : (
                  <span className="font-mono text-slate-400 block break-all">
                    Anonymous
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Storage Settlement Account (Backend)</span>
                <span className="font-mono text-slate-300 break-all select-all hover:text-white transition">
                  {video.serverAddress}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Blob Name</span>
                <span className="font-mono text-indigo-400 block break-all">
                  {video.blobName}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">Storage Lease Expiration</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  {getLeaseExpiration(video.timestamp)} (30 days remaining)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Audited & Secured via Aptos Coordination Layer
              </span>
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Raw Blob Endpoint
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right column: Related Videos list */}
        <div className="space-y-6">
          <div className="border-b border-slate-900 pb-3">
            <h2 className="text-lg font-bold text-slate-100">Next Up</h2>
            <p className="text-xs text-slate-500">More videos on this Shelby node</p>
          </div>

          {otherVideos.length > 0 ? (
            <div className="space-y-4">
              {otherVideos.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.id}`}
                  className="group flex gap-3 p-2 rounded-xl hover:bg-slate-900/30 border border-transparent hover:border-slate-900 transition-all"
                >
                  {/* Miniature Thumbnail */}
                  <div className="h-16 w-24 shrink-0 rounded-lg bg-gradient-to-tr from-slate-900 to-indigo-950 flex items-center justify-center border border-slate-900 relative">
                    <span className="absolute top-1 left-1 px-1 rounded-[4px] text-[8px] font-semibold bg-slate-950/80 text-indigo-400">
                      {item.category || "Others"}
                    </span>
                    <Play className="h-4 w-4 fill-slate-700 text-slate-700 group-hover:fill-indigo-400 group-hover:text-indigo-400 transition" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition line-clamp-1">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {formatBytes(item.fileSize)}
                    </span>
                    <span className="text-[10px] text-slate-600 truncate mt-0.5">
                      by {truncateAddress(item.uploaderAddress, 4)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-6 text-center space-y-2">
              <Info className="h-5 w-5 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">No other videos uploaded yet.</p>
              <Link
                href="/upload"
                className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Upload more &rarr;
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Petra Wallet Tipping Modal Overlay */}
      {tipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div 
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative overflow-hidden space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-indigo-400" />
                Support Creator
              </h3>
              <button
                onClick={() => {
                  setTipModalOpen(false);
                  setTipSuccess(false);
                  setTipError("");
                }}
                className="text-slate-400 hover:text-slate-200 transition text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {!tipSuccess ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-4 text-xs space-y-2">
                  <div className="text-slate-500 font-semibold">Creator Wallet Address:</div>
                  <div className="font-mono text-slate-300 break-all select-all">{video.uploaderAddress}</div>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <label htmlFor="tipAmount" className="text-sm font-semibold text-slate-300 block">
                    Tip Amount (APT)
                  </label>
                  
                  {/* Pre-select Options */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {["0.1", "0.5", "1.0", "5.0"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTipAmount(val)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          tipAmount === val
                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        {val} APT
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      id="tipAmount"
                      type="number"
                      step="0.01"
                      min="0.001"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="Enter APT amount"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">APT</span>
                  </div>
                </div>

                {tipError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-start gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>{tipError}</div>
                  </div>
                )}

                {/* Action button */}
                {!connected ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-400 mb-3">Please connect your Petra wallet in the navbar to tip.</p>
                  </div>
                ) : (
                  <button
                    onClick={handleSendTip}
                    disabled={tipLoading || !tipAmount}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50 cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    {tipLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Confirming Wallet...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4" />
                        <span>Send Tip of {tipAmount} APT</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              // Success Screen
              <div className="text-center py-6 space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto border border-emerald-500/20">
                  <ShieldCheck className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">Tip Sent Successfully!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your tip of <span className="text-emerald-400 font-bold">{tipAmount} APT</span> has been sent directly to the creator.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/40 p-3 text-[11px] font-mono text-left border border-slate-800">
                  <span className="text-slate-500 block">Transaction Hash:</span>
                  <span className="text-slate-300 break-all select-all block">{tipTxHash}</span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${tipTxHash}?network=shelbynet`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    View on Aptos Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => {
                      setTipModalOpen(false);
                      setTipSuccess(false);
                    }}
                    className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
