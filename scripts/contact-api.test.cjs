const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const defaults = {
  name: "Test Person",
  email: "person@example.com",
  message: "A test project brief",
  mode: "brief",
  website: "",
  needs: '["Interior design"]',
  documents: '["PDF Drawings"]',
  budget: "Under 2K",
};
const resendEnv = {
  RESEND_API_KEY: "test-key",
  CONTACT_FROM_EMAIL: "Studio <studio@example.com>",
};

function loadRoute(
  env = {},
  fetchMock = async () => {
    throw new Error("Unexpected network call");
  },
) {
  const cache = new Map();
  const load = (filename) => {
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const context = {
      exports,
      require: (specifier) =>
        specifier.startsWith(".")
          ? load(path.resolve(path.dirname(filename), `${specifier}.ts`))
          : specifier.startsWith("@/")
            ? load(path.join(root, "src", `${specifier.slice(2)}.ts`))
            : require(specifier),
      process: { env },
      Request,
      Response,
      FormData,
      File,
      Buffer,
      Uint8Array,
      AbortSignal,
      URL,
      Error,
      Set,
      JSON,
      fetch: fetchMock,
    };
    vm.runInNewContext(code, context, { filename });
    return exports;
  };
  return load(path.join(root, "src/app/api/contact/route.ts")).POST;
}

function request(fields = {}, files = [], headers = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...defaults, ...fields }))
    data.set(key, value);
  for (const file of files) data.append("attachments", file);
  return new Request("https://studio.example/api/contact", {
    method: "POST",
    body: data,
    headers: { Origin: "https://studio.example", ...headers },
  });
}

test("unconfigured delivery reports unavailable without any network call", async () => {
  const response = await loadRoute()(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).success, false);
});

test("required details and selections are validated before delivery", async () => {
  for (const fields of [
    { name: "x" },
    { email: "invalid" },
    { needs: '["unknown"]' },
    { documents: "bad JSON" },
    { budget: "1000000" },
    { mode: "unknown" },
    { message: "x".repeat(10001) },
  ]) {
    const response = await loadRoute(resendEnv)(request(fields));
    assert.equal(response.status, 422);
  }
});

test("cross-origin requests and populated honeypots are rejected", async () => {
  assert.equal(
    (await loadRoute()(request({}, [], { Origin: "https://other.example" })))
      .status,
    403,
  );
  assert.equal(
    (await loadRoute()(request({ website: "robot.example" }))).status,
    400,
  );
  assert.equal(
    (await loadRoute()(request({}, [], { Origin: "null" }))).status,
    403,
  );
  assert.equal(
    (
      await loadRoute()(
        request({}, [], {
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        }),
      )
    ).status,
    503,
  );
  assert.equal(
    (
      await loadRoute()(
        request({}, [], {
          Origin: "https://other.example",
          Host: "localhost:3000",
        }),
      )
    ).status,
    403,
  );
});

test("body format and upload bounds are enforced", async () => {
  const post = loadRoute(resendEnv);
  assert.equal(
    (
      await post(
        new Request("https://studio.example/api/contact", {
          method: "POST",
          body: "text",
        }),
      )
    ).status,
    415,
  );
  const oversized = new File(
    [new Uint8Array(3 * 1024 * 1024 + 1)],
    "large.bin",
  );
  assert.equal((await post(request({}, [oversized]))).status, 413);
  const overCount = Array.from(
    { length: 11 },
    (_, index) => new File(["x"], `${index}.txt`),
  );
  assert.equal((await post(request({}, overCount))).status, 413);
  const overBody = new File([new Uint8Array(4 * 1024 * 1024)], "too-large.bin");
  assert.equal((await post(request({}, [overBody]))).status, 400);
});

test("Resend payload preserves reply-to, attachments, budget and idempotency", async () => {
  const calls = [];
  const post = loadRoute(resendEnv, async (url, options) => {
    calls.push({ url, options });
    return Response.json({ id: "accepted-email-id" });
  });
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const response = await post(
    request({}, [new File(["drawing-data"], "drawing.pdf")], {
      "Idempotency-Key": id,
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].options.headers["Idempotency-Key"], id);
  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.reply_to, defaults.email);
  assert.deepEqual(payload.to, ["contact@artefactstudio.org"]);
  assert.equal(
    payload.attachments[0].content,
    Buffer.from("drawing-data").toString("base64"),
  );
  assert.match(payload.text, /Budget \(USD\): Under 2K/);
  assert.match(payload.text, /Language: en/);
});

test("Resend errors and unconfirmed acceptance never become success", async () => {
  for (const reply of [
    Response.json({ message: "error" }, { status: 500 }),
    Response.json({}),
    Response.json({ id: null }),
    Response.json({ id: "" }),
  ]) {
    const response = await loadRoute(resendEnv, async () => reply)(request());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).success, false);
  }
  assert.equal(
    (
      await loadRoute(resendEnv, async () => {
        throw new Error("offline");
      })(request())
    ).status,
    502,
  );
});

test("configured webhook uses its destination, token and payload contract", async () => {
  const calls = [];
  const env = {
    CONTACT_DELIVERY_URL: "https://delivery.example/request",
    CONTACT_DELIVERY_TOKEN: "test-token",
    CONTACT_TO_EMAIL: "owner@example.com",
  };
  const response = await loadRoute(env, async (url, options) => {
    calls.push({ url, options });
    return new Response(null, { status: 202 });
  })(request());
  assert.equal(response.status, 200);
  assert.equal(calls[0].url, env.CONTACT_DELIVERY_URL);
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(JSON.parse(calls[0].options.body).to, "owner@example.com");
  assert.equal(
    (
      await loadRoute({
        CONTACT_DELIVERY_URL: "http://delivery.example/request",
      })(request())
    ).status,
    503,
  );
});

test("locale selects errors and invalid locales default to English", async () => {
  const post = loadRoute(resendEnv);
  for (const [locale, error] of [
    ["fr", "Indiquez votre nom et une adresse email valide."],
    ["es", "Escribe tu nombre y un email válido."],
    ["ar", "أدخل اسمك وبريدًا إلكترونيًا صالحًا."],
    ["invalid", "Please fill your name and a valid email address."],
  ]) {
    const response = await post(request({ locale, name: "x" }));
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error, error);
  }
  const originError = await post(
    request({ locale: "fr" }, [], {
      Origin: "https://other.example",
      "X-Contact-Locale": "fr",
    }),
  );
  assert.equal(originError.status, 403);
  assert.equal(
    (await originError.json()).error,
    "Cette demande n’a pas pu être vérifiée. Rechargez la page et réessayez.",
  );
});

test("localized submissions preserve selection values and notify visitor language", async () => {
  let payload;
  const response = await loadRoute(
    { CONTACT_DELIVERY_URL: "https://delivery.example/request" },
    async (_, options) => {
      payload = JSON.parse(options.body);
      return new Response(null, { status: 202 });
    },
  )(request({ locale: "ar" }));
  assert.equal(response.status, 200);
  assert.equal(payload.locale, "ar");
  assert.deepEqual(payload.needs, ["Interior design"]);
});
