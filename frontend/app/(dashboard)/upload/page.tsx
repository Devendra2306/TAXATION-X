'use client';

import React, { useState } from 'react';
import { UploadCloud, File, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadAndParseFile = async (uploadedFile: File) => {
    setStatus('uploading');
    setProgress(50); // Just a visual indicator

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error("You must be logged in to upload files");
      }

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/upload/form16`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setProgress(100);
      setStatus('success');
      
      // Save parsed data to local storage so the /review page can display it
      localStorage.setItem('parsedTaxData', JSON.stringify(data.parsed_data));

      setTimeout(() => {
        router.push('/review');
      }, 1000);

    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert(err instanceof Error ? err.message : "An error occurred during upload");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      uploadAndParseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      uploadAndParseFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Upload Documents"
        subtitle="Upload your Form 16, AIS, or ITR V for automatic data extraction and tax computation."
      />

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center transition-all duration-300 min-h-[400px] overflow-hidden card-elevated
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-xl shadow-primary/10' 
            : 'border-border hover:border-primary/40 bg-white'
          }`}
      >
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center space-y-6 z-10"
            >
              <div className="h-24 w-24 rounded-full bg-black/5 border border-white/10 flex items-center justify-center shadow-2xl relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <UploadCloud className="h-10 w-10 text-primary relative z-10" />
              </div>
              <div>
                <p className="text-xl font-medium text-foreground mb-2">Drag & drop your documents here</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Supports PDF files up to 10MB. Our AI engine will automatically parse your Form 16 and AIS.
                </p>
                <label className="cursor-pointer inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                  Browse Files
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileSelect} />
                </label>
              </div>
            </motion.div>
          )}

          {(status === 'uploading' || status === 'parsing') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center space-y-8 w-full max-w-md z-10"
            >
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <File className="h-8 w-8 text-foreground" />
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">
                    {status === 'uploading' ? 'Uploading...' : 'Parsing Data with AI...'}
                  </span>
                  <span className="text-primary font-medium">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_1s_infinite]" />
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {file?.name || 'document.pdf'}
                </p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-4 z-10"
            >
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Extraction Complete!</h3>
              <p className="text-muted-foreground">Redirecting to review...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      </div>
    </div>
  );
}
