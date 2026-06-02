/**
 * GET /api/debug/pinecone
 *
 * Shells out to the Python smoke script and returns its JSON output.
 * Blocked in production environments.
 */
import { execFile } from "child_process";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Debug routes are disabled in production" },
      { status: 403 }
    );
  }

  const python = path.join(process.cwd(), ".venv", "bin", "python");

  return new Promise<NextResponse>((resolve) => {
    execFile(
      python,
      ["-m", "scripts.pinecone.smoke"],
      { cwd: process.cwd() },
      (err, stdout, stderr) => {
        if (err) {
          return resolve(
            NextResponse.json(
              { ok: false, error: stderr || err.message },
              { status: 500 }
            )
          );
        }
        try {
          return resolve(NextResponse.json(JSON.parse(stdout)));
        } catch {
          return resolve(
            NextResponse.json({ ok: false, raw: stdout }, { status: 500 })
          );
        }
      }
    );
  });
}
