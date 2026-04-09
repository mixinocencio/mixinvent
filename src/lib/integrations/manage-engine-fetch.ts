/**
 * Fetch dedicado à integração ManageEngine (on-premise).
 * HTTPS com certificado autoassinado: desativa verificação TLS (`rejectUnauthorized: false`).
 * Use apenas para estas chamadas — não generalize para o restante da aplicação.
 *
 * Roda em Node (Server Actions / rotas Node); não usar em Edge.
 */
import * as http from "http";
import * as https from "https";

const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * OpenSSL costuma emitir isto quando se fala TLS com um socket que na verdade é HTTP puro
 * (ex.: `https://servidor:8020` mas o EC só escuta HTTP na 8020).
 */
function looksLikeHttpsUrlButServerSpeaksPlainHttp(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code ?? "")
      : "";
  if (
    /packet length too long|wrong version number|tls_get_more_records|0A0000C6|ssl\\record|routines:ssl/i.test(
      msg,
    )
  ) {
    return true;
  }
  if (code === "EPROTO" && /ssl|tls|openssl/i.test(msg)) return true;
  return false;
}

function tlsMismatchHint(url: URL, err: unknown): Error {
  const original = err instanceof Error ? err : new Error(String(err));
  if (url.protocol !== "https:" || !looksLikeHttpsUrlButServerSpeaksPlainHttp(err)) {
    return original;
  }
  return new Error(
    "SSL: o servidor parece estar em HTTP sem TLS nesta porta, mas a URL usa https://. " +
      "No ManageEngine on-premise isso é frequente (ex.: porta 8020). " +
      "Altere a URL em Admin → Integrações para http:// (mesmo host e porta). " +
      `Detalhe: ${original.message.slice(0, 280)}`,
  );
}

export type ManageEngineFetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function headersToRecord(h?: HeadersInit): http.OutgoingHttpHeaders {
  if (!h) return {};
  if (h instanceof Headers) {
    const o: http.OutgoingHttpHeaders = {};
    h.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }
  if (Array.isArray(h)) {
    const o: http.OutgoingHttpHeaders = {};
    for (const [k, v] of h) o[k] = v;
    return o;
  }
  return { ...h };
}

/**
 * GET/POST minimal via `http`/`https` para suportar TLS inseguro no HTTPS.
 */
export function manageEngineFetch(
  input: string | URL,
  init?: { method?: string; headers?: HeadersInit },
): Promise<ManageEngineFetchResponse> {
  const url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = headersToRecord(init?.headers);

  const isHttps = url.protocol === "https:";
  const lib = isHttps ? https : http;
  const defaultPort = isHttps ? 443 : 80;
  const port = url.port ? Number(url.port) : defaultPort;
  const pathQuery = `${url.pathname}${url.search}`;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        port,
        path: pathQuery,
        method,
        headers,
        agent: isHttps ? insecureHttpsAgent : undefined,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer | string) => {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text: async () => body,
          });
        });
      },
    );
    req.on("error", (err) => {
      reject(tlsMismatchHint(url, err));
    });
    req.end();
  });
}
