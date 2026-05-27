import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-[#00ff88] p-4 font-mono">
      <h1 className="text-2xl mb-4 font-bold tracking-widest shadow-[#00ff88]">PAYMENT RECEIVED.</h1>
      <p className="text-gray-400 max-w-md text-center mb-8">
        Your Osiris Audit has been initiated. We will email you within 24 hours to collect your repository details and begin the scan.
      </p>
      <Link href="/" className="border border-[#00ff88] px-4 py-2 hover:bg-[#00ff88] hover:text-black transition-colors">
        RETURN TO TERMINAL
      </Link>
    </div>
  );
}
