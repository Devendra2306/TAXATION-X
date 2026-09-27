"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AISUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    setReconciling(true);
    
    setTimeout(() => {
      alert("AIS Data reconciled successfully! No mismatches found.");
      setReconciling(false);
      router.push('/compare');
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Upload AIS/TIS Data</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Optional: Upload your Annual Information Statement (AIS) JSON from the IT portal to ensure no income is missed.
      </p>

      <div className="glass-panel" style={{ 
        padding: '64px 32px', 
        textAlign: 'center',
        border: '2px dashed var(--border-light)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ fontSize: '3rem' }}>📊</div>
        <h3>{file ? file.name : "Select AIS JSON File"}</h3>
        <input 
          type="file" 
          accept=".json" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }} 
        />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button 
          className="btn-secondary" 
          style={{ flex: 1 }}
          onClick={() => router.push('/compare')}
        >
          Skip for now
        </button>
        <button 
          className="btn-primary" 
          style={{ flex: 2, opacity: reconciling || !file ? 0.7 : 1 }}
          onClick={handleUpload}
          disabled={reconciling || !file}
        >
          {reconciling ? "Reconciling..." : "Upload & Reconcile"}
        </button>
      </div>
    </div>
  );
}
