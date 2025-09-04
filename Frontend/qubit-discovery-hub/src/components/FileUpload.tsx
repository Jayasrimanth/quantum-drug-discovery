import React, { useState, useCallback } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext"; // 👈 ADDED
import { supabase } from "@/supabaseClient";     // 👈 ADDED

// 👈 ADDED: Point costs definition
const POINTS_COST = {
  classical: 20,
  quantum: 35,
  hybrid: 50,
};

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
  acceptedTypes?: string;
  maxSizeMB?: number;
  operationType: 'classical' | 'quantum' | 'hybrid'; // 👈 ADDED
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isLoading = false,
  acceptedTypes = ".mol2",
  maxSizeMB = 10,
  operationType, // 👈 ADDED
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { profile, updatePoints } = useAuth(); // 👈 ADDED

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    []
  );

  const handleFile = useCallback(
    (file: File) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        toast.error(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      const fileExtension = file.name.toLowerCase().split(".").pop();
      const acceptedExtensions = acceptedTypes
        .split(",")
        .map((type) => type.replace(".", "").trim());

      if (!acceptedExtensions.includes(fileExtension || "")) {
        toast.error(`Please upload a valid file type: ${acceptedTypes}`);
        return;
      }

      setSelectedFile(file);
      toast.success("File selected successfully");
    },
    [acceptedTypes, maxSizeMB]
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const uploadFile = useCallback(async () => {
    if (!selectedFile) return;

    try {
      onFileUpload(selectedFile);

    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while processing your request.';
      toast.error(errorMessage);
    }
  }, [selectedFile, onFileUpload]);

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-card border-border/50">
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="text-center">
            {/* 👈 ADDED: Display user's current points */}
            {profile && (
              <div className="mb-4 text-lg font-semibold">
                Your Points: <span className="text-molecular-green">{profile.token_points}</span>
              </div>
            )}
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Upload Molecular Data
            </h3>
            <p className="text-muted-foreground">
              Upload your molecular structure files for {operationType} analysis
            </p>
          </div>

          {/* Upload Area (No changes needed here) */}
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300",
              dragActive
                ? "border-primary bg-primary/5 scale-105"
                : "border-primary/30 hover:border-primary/50",
              selectedFile && "border-molecular-green bg-molecular-green/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />

            {selectedFile ? (
              <div className="flex items-center justify-center space-x-3">
                <File className="w-8 h-8 text-molecular-green" />
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} className="ml-2 hover:bg-destructive/10 hover:text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-quantum flex items-center justify-center animate-quantum-pulse">
                  <Upload className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Drop your files here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports: {acceptedTypes.replace(/\./g, "").toUpperCase()}{" "}
                    files up to {maxSizeMB}MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button (No changes needed here) */}
          {selectedFile && (
            <div className="flex justify-center">
              <Button onClick={uploadFile} disabled={isLoading} variant="quantum" size="lg" className="min-w-[200px]">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Continue to Analysis</>
                )}
              </Button>
            </div>
          )}

          {/* Supported Formats Info (No changes needed here) */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Supported molecular format: MOL2
            </p>
            <p className="text-xs text-muted-foreground">
              Upload MOL2 files for advanced drug discovery analysis
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};