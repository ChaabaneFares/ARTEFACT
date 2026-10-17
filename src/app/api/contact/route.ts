import { randomUUID } from "node:crypto";
import { isLocale } from "../../../i18n/routing";
import {
  budgets,
  desktopDocuments,
  desktopNeeds,
  mobileDocuments,
  mobileNeeds,
} from "../../[locale]/contact/_data/contact";
import {
  attachmentLimits,
  studioEmail,
} from "../../[locale]/contact/_data/contact-runtime";
import { getContactApiCopy } from "./contact-api.copy";

export const runtime = "nodejs";
const maxBodyBytes = 4 * 1024 * 1024;
const errorResponse = (error: string, status: number) =>
  Response.json({ success: false, error }, { status });

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBodyBytes) {
      await reader.cancel();
      throw new Error("large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, {
    headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
  }).formData();
}

const readField = (data: FormData, key: string, max: number) => {
  const value = data.get(key);
  return typeof value === "string" && value.length <= max ? value.trim() : null;
};
const readSelection = (
  data: FormData,
  key: string,
  allowed: readonly string[],
) => {
  const value = readField(data, key, 4000);
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.length <= allowed.length &&
      parsed.every((item) => typeof item === "string" && allowed.includes(item))
      ? ([...new Set(parsed)] as string[])
      : null;
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const requestedLocale = request.headers.get("X-Contact-Locale");
  let copy = getContactApiCopy(
    isLocale(requestedLocale) ? requestedLocale : "en",
  );
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      const browserOrigin = new URL(origin);
      const requestHost =
        request.headers.get("Host") || new URL(request.url).host;
      if (
        !["http:", "https:"].includes(browserOrigin.protocol) ||
        browserOrigin.host !== requestHost
      )
        throw new Error("origin");
    } catch {
      return errorResponse(copy.origin, 403);
    }
  }
  if (!request.headers.get("Content-Type")?.startsWith("multipart/form-data"))
    return errorResponse(copy.format, 415);
  let data: FormData;
  try {
    data = await readBody(request);
  } catch (error) {
    return errorResponse(
      error instanceof Error && error.message === "large"
        ? copy.large
        : copy.unreadable,
      400,
    );
  }
  const suppliedLocale = readField(data, "locale", 10);
  const locale = isLocale(suppliedLocale) ? suppliedLocale : "en";
  copy = getContactApiCopy(locale);
  if (readField(data, "website", 500)) return errorResponse(copy.honeypot, 400);
  const name = readField(data, "name", 120);
  const email = readField(data, "email", 254);
  const message = readField(data, "message", 10000);
  const mode = readField(data, "mode", 10);
  if (
    !name ||
    name.length < 2 ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
    message === null ||
    !["brief", "contact"].includes(mode ?? "")
  )
    return errorResponse(copy.details, 422);
  const needs = readSelection(data, "needs", [...desktopNeeds, ...mobileNeeds]);
  const documents = readSelection(data, "documents", [
    ...desktopDocuments,
    ...mobileDocuments,
  ]);
  const budget = readField(data, "budget", 100);
  if (
    !needs ||
    !documents ||
    budget === null ||
    (budget && !(budgets as readonly string[]).includes(budget))
  )
    return errorResponse(copy.selections, 422);
  const files = data
    .getAll("attachments")
    .filter((file): file is File => file instanceof File);
  if (
    files.length > attachmentLimits.count ||
    files.reduce((total, file) => total + file.size, 0) > attachmentLimits.bytes
  )
    return errorResponse(copy.attachments, 413);
  const webhook = process.env.CONTACT_DELIVERY_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!webhook && !(resendKey && from))
    return errorResponse(copy.unconfigured, 503);
  const recipient = process.env.CONTACT_TO_EMAIL || studioEmail;
  const attachments = await Promise.all(
    files.map(async (file) => ({
      filename: file.name.replace(/[\r\n]/g, "").slice(0, 200),
      content: Buffer.from(await file.arrayBuffer()).toString("base64"),
    })),
  );
  const subject = `${mode === "brief" ? "Project brief" : "Contact request"} from ${name.replace(/[\r\n]/g, " ")}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Language: ${locale}`,
    "",
    message,
    "",
    `I need: ${needs.join(", ") || "Not specified"}`,
    `Documents: ${documents.join(", ") || "Not specified"}`,
    `Budget (USD): ${budget || "Not specified"}`,
  ].join("\n");
  const suppliedId = request.headers.get("Idempotency-Key");
  const idempotencyKey =
    suppliedId && /^[\da-f-]{36}$/i.test(suppliedId)
      ? suppliedId
      : randomUUID();
  try {
    if (webhook && new URL(webhook).protocol !== "https:")
      return errorResponse(copy.unavailable, 503);
    const response = await fetch(webhook || "https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        ...(webhook
          ? process.env.CONTACT_DELIVERY_TOKEN
            ? { Authorization: `Bearer ${process.env.CONTACT_DELIVERY_TOKEN}` }
            : {}
          : { Authorization: `Bearer ${resendKey}` }),
      },
      body: JSON.stringify(
        webhook
          ? {
              name,
              email,
              message,
              mode,
              locale,
              needs,
              documents,
              budget,
              to: recipient,
              subject,
              attachments,
            }
          : {
              from,
              to: [recipient],
              reply_to: email,
              subject,
              text,
              attachments,
            },
      ),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return errorResponse(copy.failed, 502);
    if (!webhook) {
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("id" in result) ||
        typeof result.id !== "string" ||
        !result.id
      )
        return errorResponse(copy.unconfirmed, 502);
    }
    return Response.json({ success: true });
  } catch {
    return errorResponse(copy.failed, 502);
  }
}
