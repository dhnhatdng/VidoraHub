"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Play, Calendar, HardDrive, User, ArrowLeft, Video, 
  Eye, ThumbsUp, Coins, Sparkles, ExternalLink,
  Database, Server, Globe, Clock, Copy, Check, CheckCircle2, Loader2
} from "lucide-react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

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
  totalTips?: number;
}

export default function CreatorDashboardPage() {
  const params = useParams();
  const address = params?.address as string;
  const router = useRouter();

  const { account } = useWallet();

  const [creatorVideos, setCreatorVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Shelby Indexer Explorer states
  const [activeTab, setActiveTab] = useState<"media" | "shelby">("media");
  const [shelbyBlobs, setShelbyBlobs] = useState<any[]>([]);
  const [processorStatus, setProcessorStatus] = useState<any[] | null>(null);
  const [loadingShelby, setLoadingShelby] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  // Aggregated Stats
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalTips: 0
  });

  useEffect(() => {
    async function loadCreatorData() {
      try {
        const res = await fetch("/api/videos");
        if (res.ok) {
          const data: VideoMetadata[] = await res.json();
          // Filter videos by this creator address
          const filtered = data.filter(
            (v) => v.uploaderAddress.toLowerCase() === address.toLowerCase()
          );
          setCreatorVideos(filtered);

          // Calculate stats
          const views = filtered.reduce((sum, v) => sum + (v.views || 0), 0);
          const likes = filtered.reduce((sum, v) => sum + (v.likes || 0), 0);
          const tips = filtered.reduce((sum, v) => sum + (v.totalTips || 0), 0);

          setStats({
            totalVideos: filtered.length,
            totalViews: views,
            totalLikes: likes,
            totalTips: parseFloat(tips.toFixed(6))
          });
        }
      } catch (err) {
        console.error("Failed to load creator data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      loadCreatorData();
    }
  }, [address]);

  const loadShelbyData = async () => {
    setLoadingShelby(true);
    try {
      const res = await fetch(`/api/shelby/blobs?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setShelbyBlobs(data.blobs);
        setProcessorStatus(data.processorStatus);
      }
    } catch (err) {
      console.error("Failed to load Shelby indexer blobs:", err);
    } finally {
      setLoadingShelby(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shelby" && address) {
      loadShelbyData();
    }
  }, [activeTab, address]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const getBlobLeaseRemaining = (expiresAtMicrosStr: string) => {
    try {
      const expiresAtMs = parseInt(expiresAtMicrosStr) / 1000;
      const diffMs = expiresAtMs - Date.now();
      if (diffMs <= 0) return "Expired";
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}d ${hours}h`;
      return `${hours}h`;
    } catch (e) {
      return "Unknown";
    }
  };

  const truncateAddress = (addr: string, chars = 6) => {
    if (!addr) return "";
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const isOwnDashboard = account && account.address.toString().toLowerCase() === address.toLowerCase();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">Loading creator profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-400 transition"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      </div>

      {/* Profile Header */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/40 via-slate-900/10 to-transparent p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
          {/* Avatar Icon */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center border border-indigo-500/35 shadow-lg shadow-indigo-500/10 shrink-0">
            <User className="h-10 w-10 text-white" />
          </div>
          
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {isOwnDashboard ? "Your Dashboard" : "Creator Profile"}
              </span>
            </div>
            
            <h2 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
              {truncateAddress(address, 8)}
            </h2>
            
            <a 
              href={`https://explorer.aptoslabs.com/account/${address}?network=shelbynet`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 transition font-medium"
            >
              View account on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Optional Action Button */}
        {isOwnDashboard && (
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition-all shadow-md active:scale-95"
          >
            <Video className="h-4 w-4 text-indigo-400" />
            Upload New Video
          </Link>
        )}
      </section>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Videos Count */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Uploads</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Video className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalVideos}</div>
        </div>

        {/* Total Views */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Views</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Eye className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalViews}</div>
        </div>

        {/* Total Likes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-sm p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Likes</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><ThumbsUp className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalLikes}</div>
        </div>

        {/* Total Tips Received */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-2 border-emerald-500/20 bg-gradient-to-br from-slate-900/10 via-transparent to-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-500">Tips Received</span>
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400"><Coins className="h-4 w-4" /></div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.totalTips} <span className="text-xs font-medium text-emerald-500/80">APT</span></div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-900 pb-px">
        <button
          onClick={() => setActiveTab("media")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "media"
              ? "border-indigo-500 text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Published Gallery ({creatorVideos.length})
        </button>
        <button
          onClick={() => setActiveTab("shelby")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === "shelby"
              ? "border-indigo-500 text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="h-4 w-4" />
          Shelby Storage Blobs
        </button>
      </div>

      {/* Media Gallery Tab Content */}
      {activeTab === "media" && (
        <div className="space-y-6 pt-4">
          <div className="border-b border-slate-900 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Uploaded Content</h3>
            <p className="text-xs text-slate-500">Browse media published by this creator address</p>
          </div>

          {creatorVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {creatorVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.id}`}
                  className="group rounded-2xl border border-slate-900 bg-slate-950/40 p-4 hover:border-slate-800 hover:bg-slate-900/20 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  {/* Thumbnail / Media Container */}
                  <div className="relative aspect-video w-full rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center bg-slate-950">
                    {video.type === "image" ? (
                      <img 
                        src={video.videoUrl} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center group-hover:from-indigo-950 group-hover:to-slate-900 transition-all duration-300">
                        <Video className="h-8 w-8 text-slate-600 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" />
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play className="h-5 w-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category Tag Pill */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/80 text-indigo-400 backdrop-blur-sm border border-slate-900/60 z-10">
                      {video.category || "Others"}
                    </span>

                    {/* Post Type Badge */}
                    <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-white z-10 shadow-md ${
                      video.type === "image" ? "bg-emerald-600" : "bg-indigo-600"
                    }`}>
                      {video.type === "image" ? "Image" : "Video"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="mt-4 flex flex-col flex-1 space-y-2">
                    <h4 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {video.title}
                    </h4>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1 flex-1 align-bottom">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(video.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" />
                        {formatBytes(video.fileSize)}
                      </span>
                      <span className="flex items-center gap-1" title="Views">
                        <Eye className="h-3.5 w-3.5 text-indigo-400/80" />
                        {video.views || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-400/80" />
                        {video.likes || 0}
                      </span>
                    </div>

                    <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        Blob: {truncateAddress(video.blobName.replace("videos/", ""), 4)}
                      </span>
                      {video.totalTips !== undefined && video.totalTips > 0 ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Coins className="h-3 w-3" /> {video.totalTips} APT
                        </span>
                      ) : (
                        <span className="text-indigo-500/80 font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                          Watch &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center rounded-2xl border border-slate-900 bg-slate-950/20 py-16 px-4 flex flex-col items-center">
              <Video className="h-12 w-12 text-slate-600 mb-4" />
              <h4 className="text-base font-semibold text-slate-200">No Content Uploaded</h4>
              <p className="mt-2 text-slate-400 text-sm max-w-sm">
                This account hasn't uploaded any media to Vidora.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Shelby Storage Tab Content */}
      {activeTab === "shelby" && (
        <div className="space-y-6">
          {/* Header / Diagnostics row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Indexer Sync Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Shelby Indexer Status</span>
                <Server className="h-4 w-4 text-indigo-400" />
              </div>
              {processorStatus && processorStatus[0] ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-200">Synced & Active</span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <div>Block Version: <span className="font-mono text-slate-300 font-bold">{processorStatus[0].last_success_version}</span></div>
                    <div>Last Updated: <span className="text-slate-300">{new Date(processorStatus[0].last_updated).toLocaleString()}</span></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <div className="h-2 w-2 rounded-full bg-slate-600 animate-pulse" />
                  <span className="text-xs text-slate-400 font-semibold">Status unavailable</span>
                </div>
              )}
            </div>

            {/* Total Footprint on Shelby */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Shelby Footprint</span>
                <HardDrive className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-100">
                  {formatBytes(shelbyBlobs.reduce((sum, b) => sum + parseInt(b.size), 0))}
                </div>
                <p className="text-[10px] text-slate-500">Across {shelbyBlobs.length} registered blobs</p>
              </div>
            </div>

            {/* Storage Lease Info Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Placement & Storage Group</span>
                <Globe className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-200">Clay Erasure Coding</div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Blobs are segmented and distributed across multiple decentralized storage nodes.
                </p>
              </div>
            </div>
          </div>

          {/* Blobs List */}
          {loadingShelby ? (
            <div className="py-16 text-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
              <p className="mt-2 text-xs text-slate-400">Fetching live blobs from Shelby Indexer...</p>
            </div>
          ) : shelbyBlobs.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Blob Name</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Commitment (Merkle Root)</th>
                    <th className="p-4">Storage Lease</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {shelbyBlobs.map((blob) => {
                    const matchedVideo = creatorVideos.find(v => v.blobName === blob.blob_name);
                    
                    return (
                      <tr key={blob.blob_commitment} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 font-mono font-semibold max-w-[200px] truncate" title={blob.blob_name}>
                          {blob.blob_name}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {formatBytes(parseInt(blob.size))}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] bg-slate-950 border border-slate-800 rounded px-2 py-1">
                            <span className="truncate">{blob.blob_commitment.slice(0, 16)}...</span>
                            <button
                              onClick={() => copyToClipboard(blob.blob_commitment, blob.blob_commitment)}
                              className="text-slate-500 hover:text-indigo-400 cursor-pointer"
                              title="Copy full commitment"
                            >
                              {copiedId === blob.blob_commitment ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            {getBlobLeaseRemaining(blob.expires_at)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row gap-1.5">
                            {blob.is_written === "1" || blob.is_written === "true" || parseInt(blob.is_written) === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Finalized
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-550/20 font-bold">
                                Pending
                              </span>
                            )}

                            {matchedVideo ? (
                              <Link
                                href={`/watch/${matchedVideo.id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-550/20 font-bold hover:underline cursor-pointer"
                              >
                                Watch Stream
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-semibold" title="Blob exists on Shelby but not registered in Vidora's media index">
                                Raw Blob
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center rounded-2xl border border-slate-900 bg-slate-950/20 py-16 px-4 flex flex-col items-center">
              <Database className="h-12 w-12 text-slate-600 mb-4" />
              <h4 className="text-base font-semibold text-slate-200">No Blobs Found On-Chain</h4>
              <p className="mt-2 text-slate-400 text-sm max-w-sm">
                We queried the Shelby Indexer but did not find any blobs registered to this account.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
