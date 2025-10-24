import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import axios from "axios";
import Head from "next/head";

const API_URL = "http://localhost:5000";

interface SummaryMetadata {
  text_length: number;
  max_tokens: number;
  temperature: number;
  summary_style: string;
  output_language: string;
}

interface ApiResponse {
  success: boolean;
  summary: string;
  metadata: SummaryMetadata;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);
  const [summaryStyle, setSummaryStyle] = useState("comprehensive");
  const [outputLanguage, setOutputLanguage] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [metadata, setMetadata] = useState<SummaryMetadata | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [backendStatus, setBackendStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Check backend connection status
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/health`, {
          timeout: 5000,
        });
        if (response.data.status === "ok") {
          setBackendStatus("online");
        } else {
          setBackendStatus("offline");
        }
      } catch (err) {
        setBackendStatus("offline");
      }
    };

    // Check immediately on mount
    checkBackendStatus();

    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial status
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSummary = localStorage.getItem("lastSummary");
      const savedMetadata = localStorage.getItem("lastMetadata");
      const savedPdfUrl = localStorage.getItem("lastPdfUrl");
      const savedFileName = localStorage.getItem("lastFileName");
      const savedUploadMethod = localStorage.getItem("lastUploadMethod");

      if (savedSummary) setSummary(savedSummary);
      if (savedMetadata) setMetadata(JSON.parse(savedMetadata));
      if (savedPdfUrl) setPdfUrl(savedPdfUrl);
      if (savedFileName) setFileName(savedFileName);
      if (savedUploadMethod)
        setUploadMethod(savedUploadMethod as "file" | "url");
    }
  }, []);

  // Save summary and metadata to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && summary) {
      localStorage.setItem("lastSummary", summary);
      if (metadata) {
        localStorage.setItem("lastMetadata", JSON.stringify(metadata));
      }
    }
  }, [summary, metadata]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("❌ Please select a valid PDF file");
        setFile(null);
        setFileName("");
        return;
      }

      // Validate file size (max 10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
        setError(`❌ File too large (${fileSizeMB}MB). Maximum size is 10MB`);
        setFile(null);
        setFileName("");
        return;
      }

      // Validate that it's a real PDF by checking magic bytes (file signature)
      try {
        const buffer = await selectedFile.slice(0, 5).arrayBuffer();
        const arr = new Uint8Array(buffer);
        const header = String.fromCharCode.apply(null, Array.from(arr));

        // PDF files start with "%PDF-" (magic bytes: 0x25 0x50 0x44 0x46 0x2D)
        if (!header.startsWith("%PDF-")) {
          setError(
            "❌ This file is not a valid PDF. It may be a renamed file."
          );
          setFile(null);
          setFileName("");
          return;
        }
      } catch (err) {
        setError("❌ Error validating file format");
        setFile(null);
        setFileName("");
        return;
      }

      // File is valid
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setPdfUrl("");
      setError("");

      // Show success notification
      setShowUploadSuccess(true);
      setIsClosing(false);

      // Start fade-out after 1.2 seconds
      setTimeout(() => {
        setIsClosing(true);
      }, 1200);

      // Completely hide after fade-out completes (1.2s + 0.3s animation)
      setTimeout(() => {
        setShowUploadSuccess(false);
        setIsClosing(false);
      }, 1500);

      // Save filename to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("lastFileName", selectedFile.name);
        localStorage.setItem("lastUploadMethod", "file");
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];

      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("❌ Please select a valid PDF file");
        setFile(null);
        setFileName("");
        return;
      }

      // Validate file size (max 10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
        setError(`❌ File too large (${fileSizeMB}MB). Maximum size is 10MB`);
        setFile(null);
        setFileName("");
        return;
      }

      // Validate that it's a real PDF by checking magic bytes (file signature)
      try {
        const buffer = await selectedFile.slice(0, 5).arrayBuffer();
        const arr = new Uint8Array(buffer);
        const header = String.fromCharCode.apply(null, Array.from(arr));

        // PDF files start with "%PDF-" (magic bytes: 0x25 0x50 0x44 0x46 0x2D)
        if (!header.startsWith("%PDF-")) {
          setError(
            "❌ This file is not a valid PDF. It may be a renamed file."
          );
          setFile(null);
          setFileName("");
          return;
        }
      } catch (err) {
        setError("❌ Error validating file format");
        setFile(null);
        setFileName("");
        return;
      }

      // File is valid
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setPdfUrl("");
      setError("");

      // Show success notification
      setShowUploadSuccess(true);
      setIsClosing(false);

      // Start fade-out after 1.2 seconds
      setTimeout(() => {
        setIsClosing(true);
      }, 1200);

      // Completely hide after fade-out completes (1.2s + 0.3s animation)
      setTimeout(() => {
        setShowUploadSuccess(false);
        setIsClosing(false);
      }, 1500);

      // Save filename to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("lastFileName", selectedFile.name);
        localStorage.setItem("lastUploadMethod", "file");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSummary("");
    setMetadata(null);

    // Check internet connection
    if (!isOnline) {
      setError(
        "❌ No internet connection. Please check your network and try again."
      );
      return;
    }

    // Check backend status
    if (backendStatus === "offline") {
      setError(
        "❌ Backend server is offline. Please start the backend server and try again."
      );
      return;
    }

    // Validation
    if (uploadMethod === "file" && !file) {
      setError("Please select a PDF file");
      return;
    }

    if (uploadMethod === "url" && !pdfUrl) {
      setError("Please enter a PDF URL");
      return;
    }

    setLoading(true);
    setProgress(0);

    // Simulate progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Stop at 90% until actual completion
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const formData = new FormData();

      if (uploadMethod === "file" && file) {
        formData.append("file", file);
      } else if (uploadMethod === "url") {
        formData.append("pdf_url", pdfUrl);
      }

      formData.append("max_tokens", maxTokens.toString());
      formData.append("temperature", temperature.toString());
      formData.append("summary_style", summaryStyle);
      formData.append("output_language", outputLanguage);

      const response = await axios.post<ApiResponse>(
        `${API_URL}/api/summarize`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 2 minutes timeout
        }
      );

      if (response.data.success) {
        setProgress(100); // Complete the progress bar
        setSummary(response.data.summary);
        setMetadata(response.data.metadata);

        // Save to localStorage
        if (typeof window !== "undefined") {
          if (uploadMethod === "url" && pdfUrl) {
            localStorage.setItem("lastPdfUrl", pdfUrl);
            localStorage.setItem("lastUploadMethod", "url");
          }
        }
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      const errorMessage =
        err.response?.data?.error || err.message || "An error occurred";
      setError(errorMessage);
      console.error("Error:", err);
    } finally {
      clearInterval(progressInterval);
      setProgress(100); // Ensure it completes
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500); // Small delay to show 100% before closing
    }
  };

  const resetForm = () => {
    setFile(null);
    setPdfUrl("");
    setSummary("");
    setError("");
    setMetadata(null);
    setFileName("");

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("lastSummary");
      localStorage.removeItem("lastMetadata");
      localStorage.removeItem("lastPdfUrl");
      localStorage.removeItem("lastFileName");
      localStorage.removeItem("lastUploadMethod");
    }
  };

  return (
    <>
      <Head>
        <title>ClaszyCat PDF Summarizer</title>
        <meta name="description" content="Summarize PDF documents using AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/logo claszycat.png"
        />
        <link rel="apple-touch-icon" href="/logo claszycat.png" />
      </Head>

      {/* File Upload Success Notification */}
      {showUploadSuccess && (
        <div
          className={`fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 ${
            isClosing ? "bg-opacity-0" : "bg-opacity-50"
          }`}
        >
          <div
            className={`bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 ${
              isClosing ? "animate-fade-out" : "animate-scale-in"
            }`}
          >
            <div className="text-center">
              {/* Checkmark Icon */}
              <div className="mb-4 flex justify-center">
                <div className="bg-green-500 rounded-full p-3">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                File Uploaded Successfully!
              </h3>
              <p className="text-gray-600 mb-1">
                Your PDF is ready to be processed
              </p>
              <p className="text-sm font-medium text-gray-900 bg-gray-100 px-4 py-2 rounded-lg inline-block">
                📄 {fileName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Processing Your PDF
              </h3>
              <p className="text-gray-600">
                Extracting text and generating AI summary...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-gray-700 via-gray-900 to-black h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end"
                style={{ width: `${progress}%` }}
              >
                <div className="w-2 h-full bg-white opacity-50 animate-pulse"></div>
              </div>
            </div>

            {/* Percentage Display */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {progress < 30 && "Reading PDF..."}
                {progress >= 30 && progress < 70 && "Extracting text..."}
                {progress >= 70 && progress < 100 && "Generating summary..."}
                {progress === 100 && "Complete!"}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Status Indicators */}
          <div className="flex justify-end gap-3 mb-4">
            {/* Browser Online/Offline Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isOnline
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              ></div>
              {isOnline ? "Internet Connected" : "No Internet"}
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              {/* Logo Image */}
              <img
                src="/logo claszycat.png"
                alt="ClaszyCat Logo"
                className="h-16 w-16 mr-4"
              />
              <h1 className="text-5xl font-bold text-gray-900">
                PDF Summarizer
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              AI-powered document summarization with <b>Gemini AI</b>
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* Restored Session Banner */}
            {summary && !loading && (
              <div className="mb-6 bg-gray-50 border-l-4 border-gray-700 p-4 rounded">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-700 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      📋 Last summary restored
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Your previous summary is displayed below. Upload a new PDF
                      to generate a new summary.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Method
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMethod("file");
                      setPdfUrl("");
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      uploadMethod === "file"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    📄 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMethod("url");
                      setFile(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      uploadMethod === "url"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    🔗 PDF URL
                  </button>
                </div>
              </div>

              {/* File Upload or URL Input */}
              {uploadMethod === "file" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select PDF File
                  </label>
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all ${
                      isDragging
                        ? "border-gray-900 bg-gray-100 scale-105"
                        : "border-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 hover:text-gray-700">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF files only (max 10MB)
                      </p>
                    </div>
                  </div>
                  {(file || fileName) && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected:{" "}
                      <span className="font-medium">
                        {file?.name || fileName}
                      </span>
                      {!file && fileName && (
                        <span className="ml-2 text-xs text-gray-500">
                          (from last session)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF URL
                  </label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Summary Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Style
                </label>
                <select
                  value={summaryStyle}
                  onChange={(e) => setSummaryStyle(e.target.value)}
                  className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="comprehensive">
                    📖 Comprehensive (Detailed)
                  </option>
                  <option value="concise">⚡ Concise (Brief)</option>
                  <option value="bullet">📝 Bullet Points</option>
                </select>
              </div>

              {/* Output Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Language
                </label>
                <select
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="auto">🌐 Auto (Same as input)</option>
                  <option value="english">🇬🇧 English</option>
                  <option value="indonesian">🇮🇩 Indonesian (Bahasa)</option>
                </select>
                <p className="text-sm text-gray-600 mt-2">
                  💡 Choose the language for the summary output
                </p>
              </div>

              {/* Advanced Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ⚙️ Advanced Settings
                </h3>

                {/* Max Tokens Slider */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Output Tokens:{" "}
                    <span className="text-gray-900 font-bold">{maxTokens}</span>
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>256 (Very Short)</span>
                    <span>4096 (Medium)</span>
                    <span>8192 (Long)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    💡 Lower values = shorter summaries, Higher values = more
                    detailed summaries
                  </p>
                </div>

                {/* Temperature Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature:{" "}
                    <span className="text-gray-900 font-bold">
                      {temperature.toFixed(1)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.0 (Focused)</span>
                    <span>0.5</span>
                    <span>1.0 (Creative)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    💡 Lower = more consistent, Higher = more creative
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating Summary...
                    </>
                  ) : (
                    "✨ Generate Summary"
                  )}
                </button>
                {(summary || error) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    🔄 Reset
                  </button>
                )}
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Display */}
          {summary && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📝 Summary</h2>
                {metadata && (
                  <div className="flex gap-2 text-sm text-gray-600 flex-wrap">
                    <span className="bg-gray-100 px-3 py-1 rounded">
                      📊 {metadata.text_length.toLocaleString()} chars
                    </span>
                    <span className="bg-gray-800 text-white px-3 py-1 rounded">
                      🎯 {metadata.max_tokens} tokens
                    </span>
                    <span className="bg-gray-700 text-white px-3 py-1 rounded">
                      {metadata.output_language === "auto" && "🌐 Auto"}
                      {metadata.output_language === "english" && "🇬🇧 English"}
                      {metadata.output_language === "indonesian" &&
                        "🇮🇩 Indonesian"}
                    </span>
                  </div>
                )}
              </div>
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {summary}
                </div>
              </div>

              {/* Copy Button */}
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(summary);
                    alert("Summary copied to clipboard!");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
