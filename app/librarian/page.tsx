"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function LibrarianPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("READY FOR INGESTION");
  const [logs, setLogs] = useState<string[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("UPLOADING...");
    setLogs((prev) => [...prev, `Initiating upload for: ${file.name}`]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/librarian/ingest', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("INDEXED");
        setLogs((prev) => [...prev, data.message]);
      } else {
        setStatus("ERROR");
        setLogs((prev) => [...prev, `Error: ${data.error}`]);
      }
    } catch (err) {
      console.error(err);
      console.error(err);
      setStatus("ERROR");
      setLogs((prev) => [...prev, "Network error occurred."]);
    }
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <header className="flex justify-between items-center border-b border-[#222] pb-4">
        <div className="flex items-center gap-4">
          <span className="text-[0.65rem] tracking-widest text-[#555] border border-[#333] px-2 py-1 rounded-sm">NODE 5</span>
          <h1 className="text-2xl font-bold tracking-widest text-white m-0">LIBRARIAN</h1>
          <span className="text-xs text-[#444] tracking-wider">INDEX & INGESTION</span>
        </div>
        <Link href="/" className="text-xs text-[#888] hover:text-[#00ff88] transition-colors border border-[#333] px-3 py-1 rounded-sm">
          [ TERMINAL ]
        </Link>
      </header>

      <section 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={handleDrop}
        className="border-2 border-dashed border-[#333] p-12 flex flex-col items-center justify-center gap-4 rounded-md bg-[#111] hover:border-[#00ff88] transition-colors"
      >
        <span className="text-[#666] tracking-widest text-sm">DROP FILES HERE</span>
        <span className="text-[#444] text-xs">or</span>
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-xs text-[#888] file:bg-[#1a1a1a] file:text-[#00ff88] file:border-none file:px-4 file:py-2 file:mr-4 file:cursor-pointer"
        />
        {file && (
          <div className="mt-4 p-4 border border-[#00ff88] bg-black text-[#00ff88] text-xs flex items-center justify-between w-full max-w-md">
            <span className="truncate">{file.name}</span>
            <button onClick={handleUpload} className="bg-[#00ff88] text-black px-4 py-1 font-bold ml-4 hover:bg-white transition-colors">
              INGEST
            </button>
          </div>
        )}
      </section>

      <section className="border border-[#1e1e1e] rounded-md overflow-hidden">
        <div className="flex justify-between items-center bg-[#111] px-4 py-2 border-b border-[#1e1e1e]">
          <span className="text-[0.65rem] tracking-widest text-[#555]">AGENT STATUS</span>
          <span className={`text-[0.6rem] ${status === 'INDEXED' ? 'text-[#00ff88]' : status === 'ERROR' ? 'text-red-500' : 'text-[#333]'}`}>{status}</span>
        </div>
        <div className="p-4 max-h-[200px] overflow-y-auto bg-[#0d0d0d] flex flex-col gap-1">
          {logs.length === 0 ? (
            <span className="text-xs text-[#333]">no ingestion logs yet</span>
          ) : (
            logs.map((log, i) => (
              <span key={i} className="text-[0.75rem] text-[#666]">&gt; {log}</span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
