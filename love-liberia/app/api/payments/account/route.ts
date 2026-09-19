import { NextResponse } from "next/server";
import { getPayoutAccount } from "@/lib/payments/account";

export async function GET() {
  const account = getPayoutAccount();

  return NextResponse.json({
    accountName: account.accountName,
    accountEmail: account.accountEmail,
    accountId: account.accountId,
    currency: account.currency,
    settlementBank: account.settlementBank,
  });
}
