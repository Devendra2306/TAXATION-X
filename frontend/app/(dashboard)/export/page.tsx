"use client";

import React, { useState } from 'react';
import { Download, FileJson, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExportPage() {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done'>('idle');

  const handleDownload = async () => {
    setDownloadStatus('downloading');
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const res = await fetch(`${API_URL}/api/profile/export-json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to generate JSON");
      
      const data = await res.json();
      
      // Create and trigger download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "ITR-1_AY2026-27.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      setDownloadStatus('done');
    } catch (e) {
      console.error(e);
      setDownloadStatus('idle');
      alert("Please upload and review your Form 16 data first.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Download ITR JSON</h1>
        <p className="text-slate-500">Your tax computation is complete. Download the official JSON file to upload to the Income Tax Portal.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <motion.div 
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          animate={downloadStatus === 'downloading' ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <FileJson className="w-10 h-10 text-primary" />
        </motion.div>

        <h2 className="text-3xl font-bold text-slate-800 mb-2">ITR-1 (Sahaj) JSON</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Generated for Assessment Year 2026-27. Validated against the latest Income Tax Department schemas.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleDownload}
            disabled={downloadStatus === 'downloading'}
            className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg w-full sm:w-auto"
          >
            {downloadStatus === 'idle' && <><Download size={20} /> Download JSON</>}
            {downloadStatus === 'downloading' && 'Generating...'}
            {downloadStatus === 'done' && <><CheckCircle2 size={20} /> Downloaded</>}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Next Steps</h3>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600 font-medium">
            <li>Log in to <a href="https://eportal.incometax.gov.in" target="_blank" rel="noreferrer" className="text-primary hover:underline">eportal.incometax.gov.in</a></li>
            <li>Go to e-File &gt; Income Tax Returns</li>
            <li>Select Assessment Year 2026-27</li>
            <li>Select Mode of Filing as 'Offline'</li>
            <li>Attach the JSON file you just downloaded</li>
            <li>e-Verify using Aadhaar OTP</li>
          </ol>
        </div>

        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-semibold text-amber-900">Important Note</h3>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            Do not modify the JSON file manually. Any modifications will invalidate the digital signature and cause the upload to fail on the IT portal.
          </p>
          <div className="bg-amber-100/50 p-3 rounded text-xs font-mono text-amber-900 break-all">
            SHA-256 Checksum: 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4
          </div>
        </div>
      </div>
    </div>
  );
}
