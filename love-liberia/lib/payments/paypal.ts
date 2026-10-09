type PayPalLink = { rel?: string; href?: string };

export type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
  links?: PayPalLink[];
};

function apiBase() {
  return process.env.PAYMENT_PAYPAL_MODE?.trim().toLowerCase() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function accessToken() {
  const clientId = process.env.PAYMENT_PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYMENT_PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Set PAYMENT_PAYPAL_CLIENT_ID and PAYMENT_PAYPAL_CLIENT_SECRET.");
  }

  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || `PayPal authentication failed (${response.status}).`);
  }
  return data.access_token;
}

async function paypalRequest<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const token = await accessToken();
  const response = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = (await response.json()) as T & { message?: string; details?: Array<{ description?: string }> };
  if (!response.ok) {
    throw new Error(data.details?.[0]?.description || data.message || `PayPal request failed (${response.status}).`);
  }
  return data;
}

export async function createPayPalOrder(params: {
  amountCents: number;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const appOrigin = new URL(params.returnUrl).origin;
  const callbackUrl = new URL("/api/payments/paypal/capture", appOrigin);
  callbackUrl.searchParams.set("destination", new URL(params.returnUrl).pathname === "/wallet" ? "wallet" : "membership");

  const order = await paypalRequest<PayPalOrder>("/v2/checkout/orders", "POST", {
    intent: "CAPTURE",
    purchase_units: [{
      custom_id: params.customId,
      amount: {
        currency_code: "USD",
        value: (params.amountCents / 100).toFixed(2),
      },
    }],
    application_context: {
      brand_name: "Love Liberia",
      user_action: "PAY_NOW",
      return_url: callbackUrl.toString(),
      cancel_url: params.cancelUrl,
    },
  });

  const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;
  if (!order.id || !approvalUrl) {
    throw new Error("PayPal did not return an order ID and approval link.");
  }
  return { id: order.id, url: approvalUrl };
}

export function getPayPalOrder(orderId: string) {
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, "GET");
}

export function capturePayPalOrder(orderId: string) {
  return paypalRequest<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    "POST",
    {},
  );
}
