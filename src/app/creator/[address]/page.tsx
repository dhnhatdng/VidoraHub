"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Play, Calendar, HardDrive, User, ArrowLeft, Video, 
  Eye, ThumbsUp, Coins, Sparkles, ExternalLink 
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

      {/* Creator Videos Gallery */}
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
    </div>
  );
}
