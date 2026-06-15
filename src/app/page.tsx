"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Play, Calendar, HardDrive, User, Search, Video, PlusCircle, 
  Sparkles, Eye, ThumbsUp, Image, Film 
} from "lucide-react";

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

export default function Home() {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All"); // "All" | "video" | "image"
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Music", "Gaming", "Tech", "Education", "Entertainment", "Others"];

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("/api/videos");
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        }
      } catch (err) {
        console.error("Failed to load videos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

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
      month: "short",
      day: "numeric",
    });
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const videoCategory = video.category || "Others";
    const matchesCategory = selectedCategory === "All" || videoCategory.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedType === "All" || (video.type || "video") === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/40 via-slate-900/10 to-transparent p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by Shelby & Aptos</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Next-Gen Video Streaming
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Host videos globally with sub-second retrieval times. Vidora harnesses Shelby hot storage network and Aptos settlement to deliver peer-to-peer streaming directly to your browser.
          </p>
          <div className="pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/25"
            >
              <PlusCircle className="h-4 w-4" />
              Publish Video
            </Link>
          </div>
        </div>

        {/* Hero Graphic/Badge */}
        <div className="relative flex items-center justify-center h-48 w-48 shrink-0 rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-30 rounded-2xl" />
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-xl shadow-indigo-500/20 animate-pulse">
            <Play className="h-10 w-10 fill-white ml-1" />
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Browse Stream Library</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Explore decentralized videos uploaded by the community</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Media Type Filter Bar */}
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
          <button
            onClick={() => setSelectedType("All")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
              selectedType === "All"
                ? "bg-slate-900 text-slate-100 border-slate-800"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setSelectedType("video")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
              selectedType === "video"
                ? "bg-slate-900 text-slate-100 border-slate-800"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            Videos
          </button>
          <button
            onClick={() => setSelectedType("image")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
              selectedType === "image"
                ? "bg-slate-900 text-slate-100 border-slate-800"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Image className="h-3.5 w-3.5" />
            Images
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                  : "bg-slate-900/60 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group rounded-2xl border border-slate-900 bg-slate-950/40 p-4 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-slate-900" />
                <div className="h-4 w-2/3 rounded bg-slate-900" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-3 w-1/4 rounded bg-slate-900" />
                  <div className="h-3 w-1/3 rounded bg-slate-900" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length > 0 ? (
          /* Video Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => (
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
                  <h3 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {video.title}
                  </h3>

                  {/* Metadata labels */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 pt-1 flex-1 align-bottom">
                    <span className="flex items-center gap-1" title="Upload Date">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(video.timestamp)}
                    </span>
                    <span className="flex items-center gap-1" title="File Size">
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

                  <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-500" />
                      Uploader: {truncateAddress(video.uploaderAddress)}
                    </span>
                    <span className="text-indigo-500/80 font-medium group-hover:translate-x-0.5 transition-transform duration-200">
                      Watch &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center rounded-2xl border border-slate-900 bg-slate-950/20 py-16 px-4 flex flex-col items-center">
            <Video className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-200">No Videos Found</h3>
            <p className="mt-2 text-slate-400 text-sm max-w-sm">
              {searchQuery
                ? "No videos match your search query. Try another keyword."
                : "The video store is empty. Connect your wallet and publish the first video to Shelby!"}
            </p>
            {!searchQuery && (
              <Link
                href="/upload"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                <PlusCircle className="h-4 w-4" />
                Upload a video
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
