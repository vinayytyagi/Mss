"use client";

import { useEffect, useState } from "react";
import { uploadOracleImage } from "@/lib/api";

/** When OCI upload is unavailable (e.g. dev), allow a bounded data URL stored on the user record. */
const MAX_DATA_URL_CHARS = 480_000;

function compressToJpegDataUrl(dataUrl, maxWidth = 720, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w <= 0 || h <= 0) {
          reject(new Error("Invalid image"));
          return;
        }
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unsupported canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = dataUrl;
  });
}

export default function ImageUpload({ onUploadComplete, initialUrl = "", label = "Upload Image" }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(initialUrl || "");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setUrl(initialUrl || "");
  }, [initialUrl]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await handleUpload(selectedFile);
    }
  };

  const handleUpload = async (selectedFile) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const raw = typeof reader.result === "string" ? reader.result : "";
        let working = raw;
        if (raw.startsWith("data:image/")) {
          try {
            working = await compressToJpegDataUrl(raw);
          } catch {
            working = raw;
          }
        }

        try {
          const data = await uploadOracleImage({
            fileBase64: working,
            mimeType: "image/jpeg",
            originalName: selectedFile.name.replace(/\.[^.]+$/, "") + ".jpg",
          });

          setUrl(data.url);
          if (onUploadComplete) onUploadComplete(data.url);
        } catch (err) {
          if (working.startsWith("data:image/") && working.length <= MAX_DATA_URL_CHARS) {
            setUrl(working);
            if (onUploadComplete) onUploadComplete(working);
            setErrorMsg("");
          } else {
            setErrorMsg(
              err.message ||
                "Upload failed — try a smaller image (photos are resized; very large originals may still fail)."
            );
          }
        }
        setLoading(false);
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read file");
        setLoading(false);
      };

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      <div className="flex items-start gap-4">
        {url && (
          <div className="w-24 h-24 relative rounded overflow-hidden border">
            <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex-1">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {loading && <p className="text-xs text-blue-600 mt-2">Uploading...</p>}
          {errorMsg && <p className="text-xs text-red-600 mt-2">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
