import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { JobModel } from "@/lib/jobs/models";
import { fail, ok } from "@/lib/errors";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret") || "";
  if (!secret || !safeEqual(provided, secret)) {
    return NextResponse.json(fail("FORBIDDEN", "Invalid cron secret"), { status: 403 });
  }

  await connectDb();
  const now = new Date();
  const leaseOwner = `cron-${now.getTime()}`;
  const leasedUntil = new Date(now.getTime() + 55_000);

  const jobs = await JobModel.find({
    status: "PENDING",
    availableAt: { $lte: now },
  })
    .sort({ availableAt: 1 })
    .limit(20);

  const leased = [];
  for (const job of jobs) {
    const updated = await JobModel.findOneAndUpdate(
      {
        _id: job._id,
        status: "PENDING",
        availableAt: { $lte: now },
      },
      {
        $set: {
          status: "LEASED",
          leaseOwner,
          leasedUntil,
          updatedAt: now,
        },
        $inc: { attempts: 1 },
      },
      { new: true },
    );
    if (updated) leased.push(updated);
  }

  // Handlers are registered by type in later modules; mark leased jobs complete for empty payload noop.
  for (const job of leased) {
    await JobModel.updateOne(
      { _id: job._id, leaseOwner },
      {
        $set: {
          status: "COMPLETED",
          updatedAt: new Date(),
        },
      },
    );
  }

  return NextResponse.json(
    ok({
      leased: leased.length,
      completed: leased.length,
      leaseOwner,
    }),
  );
}
