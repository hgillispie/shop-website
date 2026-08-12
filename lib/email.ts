import { Resend } from "resend";
import { siteConfig } from "@/data/site-config";
import type {
  AppointmentRequestRow,
  JobRow,
  StoreOrderItemRow,
  StoreOrderRow,
} from "@/lib/db/schema";
import { formatCents } from "@/lib/store/money";

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

let cached: Resend | null = null;

// Lazy so importing this module (e.g. during build-time page-data collection)
// never throws — the Resend constructor requires a key immediately.
function getResendConfigured() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set — skipping email send.");
    return null;
  }
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export async function sendOwnerNewRequestEmail(request: AppointmentRequestRow) {
  const resend = getResendConfigured();
  if (!resend || !OWNER_EMAIL) {
    console.warn("[email] OWNER_EMAIL or RESEND_API_KEY missing — logging instead.");
    console.info("[email] new request:", request.id, request.name);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `New appointment request — ${request.name} (${request.bikeYearMakeModel})`,
    text: [
      `${request.name} submitted a new appointment request.`,
      "",
      `Phone: ${request.phone}`,
      `Email: ${request.email}`,
      `Bike: ${request.bikeYearMakeModel}`,
      request.serviceTypes.length > 0
        ? `Services: ${request.serviceTypes.join(", ")}`
        : null,
      request.preferredDropoffAt
        ? `Preferred drop-off: ${request.preferredDropoffAt.toLocaleDateString()}`
        : null,
      "",
      "Details:",
      request.details,
      "",
      `Review & respond: ${SITE_URL}/admin/requests/${request.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendCustomerApprovalEmail(
  request: AppointmentRequestRow,
  job: JobRow,
) {
  const resend = getResendConfigured();
  if (!resend) return;

  const dropoff = job.dropoffAt
    ? job.dropoffAt.toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "a time we'll confirm shortly";

  await resend.emails.send({
    from: FROM,
    to: request.email,
    subject: `Appointment confirmed — ${siteConfig.shopName}`,
    text: [
      `Hi ${request.name},`,
      "",
      `Your appointment is confirmed for ${dropoff}.`,
      "",
      `Drop off at: ${siteConfig.address}`,
      `Questions? Call or text ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ].join("\n"),
  });
}

export async function sendCustomerResponseEmail(
  request: AppointmentRequestRow,
  message: string,
) {
  const resend = getResendConfigured();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: request.email,
    subject: `Re: your appointment request — ${siteConfig.shopName}`,
    text: [`Hi ${request.name},`, "", message, "", `— ${siteConfig.shopName}`].join("\n"),
  });
}

function formatOrderItems(items: StoreOrderItemRow[]) {
  return items.map(
    (item) =>
      `${item.quantity}x ${item.title}${item.variantLabel ? ` (${item.variantLabel})` : ""} — ${formatCents(item.unitPriceCents * item.quantity)}`,
  );
}

// Sent once a store order moves to "paid" for an online order. Shipping
// timeline language is a placeholder first pass — happy to adjust wording
// once there's a real one to look at.
export async function sendOrderConfirmationEmail(
  order: StoreOrderRow & { items: StoreOrderItemRow[] },
) {
  const resend = getResendConfigured();
  if (!resend || !order.email) return;

  await resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `Order confirmed — ${siteConfig.shopName} (#${order.orderNumber})`,
    text: [
      `Thanks for your order!`,
      "",
      `Order #${order.orderNumber}`,
      ...formatOrderItems(order.items),
      "",
      `Subtotal: ${formatCents(order.subtotalCents)}`,
      order.shippingCents > 0 ? `Shipping: ${formatCents(order.shippingCents)}` : null,
      `Total: ${formatCents(order.totalCents)}`,
      "",
      "It usually takes a few business days to print and ship — we'll email you tracking once it's on the way.",
      "",
      `Questions? Reply to this email or call ${siteConfig.phone}.`,
      "",
      `— ${siteConfig.shopName}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

// Sent when the Printify shipment webhook reports tracking info.
export async function sendOrderShippedEmail(
  order: StoreOrderRow & { items: StoreOrderItemRow[] },
) {
  const resend = getResendConfigured();
  if (!resend || !order.email) return;

  await resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `Your order has shipped — ${siteConfig.shopName} (#${order.orderNumber})`,
    text: [
      `Your order is on its way!`,
      "",
      `Order #${order.orderNumber}`,
      order.trackingCarrier && order.trackingNumber
        ? `Tracking (${order.trackingCarrier}): ${order.trackingNumber}`
        : null,
      "",
      `— ${siteConfig.shopName}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

// No sendInPersonReceiptEmail here — in-person receipts go through
// Stripe's own receipt_email instead (set on the card-present PaymentIntent
// in lib/stripe.ts's createPaymentIntentForOrder), which is also what
// satisfies card network EMV-receipt rules for Terminal payments. See
// lib/validations/store.ts's inPersonSaleSchema for the full reasoning.

// Alerts the owner when payment succeeded but creating the Printify order
// failed — the only way anyone finds out about a paid, unfulfilled order
// without customer accounts. Mirrors sendOwnerNewRequestEmail's pattern.
export async function sendOwnerFulfillmentFailedEmail(
  order: StoreOrderRow & { items: StoreOrderItemRow[] },
  errorMessage: string,
) {
  const resend = getResendConfigured();
  if (!resend || !OWNER_EMAIL) {
    console.warn("[email] OWNER_EMAIL or RESEND_API_KEY missing — logging instead.");
    console.error("[email] fulfillment failed for order:", order.id, errorMessage);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    subject: `Action needed: order #${order.orderNumber} paid but not fulfilled`,
    text: [
      `Order #${order.orderNumber} was paid (${formatCents(order.totalCents)}) but the Printify order failed to create.`,
      "",
      `Error: ${errorMessage}`,
      "",
      ...formatOrderItems(order.items),
      "",
      `Review & retry: ${SITE_URL}/admin/orders/${order.id}`,
    ].join("\n"),
  });
}
