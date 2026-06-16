"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileVideo, FileImage, AlertCircle, CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function UploadPage() {
  const { connected, account } = useWallet();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [category, setCategory] = useState("Others");
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Status states
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<"preparing" | "uploading" | "registering">("preparing");

  // Revoke preview object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg("");
    
    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.includes("video/mp4") || selectedFile.name.endsWith(".mp4");
    
    if (!isImage && !isVideo) {
      setErrorMsg("Only MP4 videos and images (PNG, JPG, JPEG, GIF, WebP) are supported.");
      return;
    }

    if (isImage) {
      const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > MAX_IMG_SIZE) {
        setErrorMsg("Image size exceeds 10MB. Please choose a smaller image.");
        return;
      }
    } else {
      const MAX_VID_SIZE = 100 * 1024 * 1024; // 100MB
      if (selectedFile.size > MAX_VID_SIZE) {
        setErrorMsg("Video size exceeds 100MB. Please choose a smaller video.");
        return;
      }
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Pre-fill title if empty
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt.replace(/[_-]/g, " "));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !account) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }
    if (!file) {
      setErrorMsg("Please select a video file.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Please enter a title for the video.");
      return;
    }

    setStatus("uploading");
    setUploadStage("preparing");
    setErrorMsg("");

    const uploadTimer = setTimeout(() => {
      setUploadStage("uploading");
    }, 600);

    const registerTimer = setTimeout(() => {
      setUploadStage("registering");
    }, 4500);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("uploaderAddress", account.address.toString());
    formData.append("category", category);
    
    const fileType = file.type.startsWith("image/") ? "image" : "video";
    formData.append("type", fileType);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(uploadTimer);
      clearTimeout(registerTimer);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload video");
      }

      setStatus("success");
      setUploadedVideoId(data.video.id);
    } catch (err: any) {
      clearTimeout(uploadTimer);
      clearTimeout(registerTimer);
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred during upload.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Heading */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-indigo-200 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Publish Decentralized Video
        </h1>
        <p className="mt-3 text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
          Upload your MP4 video to the Shelby decentralized hot storage network. Fast, global distribution powered by Aptos.
        </p>
      </div>

      {/* Main container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative gradient spot */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* If Wallet Not Connected */}
        {!connected && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Wallet Connection Required</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-xs">
              Please connect your Aptos Petra wallet via the header navigation to upload videos.
            </p>
          </div>
        )}

        {/* Status: Success Screen */}
        {status === "success" && (
          <div className="py-10 text-center flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Video Uploaded Successfully!</h2>
            <p className="mt-2 text-slate-400 text-sm max-w-md">
              Your video is now stored on Shelby network and indexed on the Aptos coordination layer.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setStatus("idle");
                  setTitle("");
                  setFile(null);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl("");
                  }
                  setCategory("Others");
                  setUploadedVideoId(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 text-sm font-medium hover:bg-slate-800 transition"
              >
                Upload Another
              </button>
              <button
                onClick={() => {
                  if (uploadedVideoId) {
                    router.push(`/watch/${uploadedVideoId}`);
                  } else {
                    router.push("/");
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                Watch Video
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Status: Loading Screen */}
        {status === "uploading" && (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-8">
            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Publishing Content</h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto">
                This process streams your media directly to the Shelby Protocol and secures ownership.
              </p>
            </div>

            {/* Stages Visual Progression */}
            <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-left space-y-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  uploadStage === "preparing"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 animate-pulse"
                    : "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                }`}>
                  {uploadStage !== "preparing" ? "✓" : "1"}
                </div>
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-semibold transition-colors ${
                    uploadStage === "preparing" ? "text-slate-200" : "text-slate-500"
                  }`}>
                    Preparing media file
                  </p>
                  <p className="text-[10px] text-slate-500">Checking parameters and formatting blocks</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  uploadStage === "preparing"
                    ? "border-slate-850 text-slate-700"
                    : uploadStage === "uploading"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 animate-pulse"
                    : "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                }`}>
                  {uploadStage === "registering" ? "✓" : "2"}
                </div>
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-semibold transition-colors ${
                    uploadStage === "uploading" ? "text-slate-200" : uploadStage === "registering" ? "text-slate-500" : "text-slate-700"
                  }`}>
                    Uploading blob to Shelby network
                  </p>
                  <p className="text-[10px] text-slate-500">Pushing segments to decentralized storage nodes</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  uploadStage === "registering"
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 animate-pulse"
                    : "border-slate-850 text-slate-700"
                }`}>
                  3
                </div>
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-semibold transition-colors ${
                    uploadStage === "registering" ? "text-slate-200" : "text-slate-750"
                  }`}>
                    Securing registry & indexing metadata
                  </p>
                  <p className="text-[10px] text-slate-500">Signing metadata ledger on Aptos chain</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form: Idle or Error Screen */}
        {(status === "idle" || status === "error") && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Feedback */}
            {status === "error" && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <span className="font-semibold">Upload failed:</span> {errorMsg}
                </div>
              </div>
            )}

            {/* Custom File Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                Media File
                <span className="text-xs text-indigo-400 font-normal">(MP4 up to 100MB, Image up to 10MB)</span>
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-indigo-400 bg-indigo-500/5"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".mp4,image/*"
                  className="hidden"
                />

                {file ? (
                  <div className="text-center space-y-3 w-full">
                    {file.type.startsWith("image/") ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-36 w-auto object-contain mx-auto rounded-xl shadow-lg border border-slate-800" 
                      />
                    ) : (
                      <div className="relative max-h-36 aspect-video max-w-[240px] mx-auto rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                        <video 
                          src={previewUrl} 
                          className="h-full w-full object-contain" 
                          muted 
                          playsInline 
                        />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                          <FileVideo className="h-8 w-8 text-indigo-400" />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-200 max-w-xs truncate mx-auto">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl("");
                        }
                      }}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-slate-500 mx-auto mb-3 group-hover:text-indigo-400 transition" />
                    <p className="text-sm font-semibold text-slate-200">
                      Drag and drop your file here, or <span className="text-indigo-400">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Supports MP4 videos or images (PNG, JPG, GIF, WebP)
                    </p>
                  </div>
                )}
              </div>
              {errorMsg && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {errorMsg}</p>
              )}
            </div>

            {/* Post Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-300">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title for your video"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Video Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-semibold text-slate-300">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:20px] bg-no-repeat"
              >
                <option value="Others" className="bg-slate-950 text-slate-200">Others</option>
                <option value="Music" className="bg-slate-950 text-slate-200">Music</option>
                <option value="Gaming" className="bg-slate-950 text-slate-200">Gaming</option>
                <option value="Tech" className="bg-slate-950 text-slate-200">Tech</option>
                <option value="Education" className="bg-slate-950 text-slate-200">Education</option>
                <option value="Entertainment" className="bg-slate-950 text-slate-200">Entertainment</option>
              </select>
            </div>

            {/* Storage details info box */}
            {file && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-1 text-slate-300 font-semibold mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Shelby Storage Lease details</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1">
                  <div>Lease duration:</div>
                  <div className="text-right text-slate-200">30 Days (Renewable)</div>
                  <div>Network:</div>
                  <div className="text-right text-slate-200">Aptos Testnet</div>
                  <div>Coordination address:</div>
                  <div className="text-right text-slate-200 truncate">{account?.address.toString()}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !title.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/20 active:scale-[0.99]"
            >
              <Upload className="h-4 w-4" />
              Publish Video
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
