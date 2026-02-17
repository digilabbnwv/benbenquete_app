export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin");

        // --- CORS helpers ---
        function isAllowedOrigin(o) {
            if (!o) return false;
            return o.includes("localhost") || o.includes("127.0.0.1") || o.endsWith(".github.io");
        }

        const cors = {
            "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "https://digilabbnwv.github.io",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Client-Secret",
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin",
        };

        function json(data, status = 200) {
            return new Response(JSON.stringify(data), {
                status,
                headers: { ...cors, "Content-Type": "application/json" },
            });
        }

        // --- Preflight ---
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: cors });
        }

        // --- Route check ---
        if (request.method !== "POST" || !url.pathname.endsWith("/api/submit")) {
            return json({ ok: false, error: "Not found" }, 404);
        }

        // --- Origin check ---
        if (origin && !isAllowedOrigin(origin)) {
            return json({ ok: false, error: "Origin not allowed" }, 403);
        }

        // --- Content-Type check ---
        const ct = request.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
            return json({ ok: false, error: "Content-Type must be application/json" }, 400);
        }

        // --- Shared secret check ---
        if (request.headers.get("X-Client-Secret") !== env.CLIENT_SECRET) {
            return json({ ok: false, error: "Unauthorized" }, 401);
        }

        // --- Process body ---
        try {
            const body = await request.json();

            // Token check
            const allowlist = (env.TOKEN_ALLOWLIST || "beb-global-2026").split(",");
            if (!allowlist.includes(body.qrToken)) {
                return json({ ok: false, error: "Invalid QR token" }, 403);
            }

            // Honeypot check
            if (body.bot_check && body.bot_check.length > 0) {
                // Return 200 to not alert bots, but don't process
                return json({ ok: true });
            }

            // Basic payload validation
            if (!body.surveyId || !body.sessionId || !body.submittedAt) {
                return json({ ok: false, error: "Missing required fields" }, 400);
            }

            // Forward to Power Automate
            if (!env.PA_WEBHOOK_URL) {
                console.log("PA not configured. SessionId:", body.sessionId);
                return json({ ok: true });
            }

            const paRes = await fetch(env.PA_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!paRes.ok) {
                console.error("PA error:", paRes.status);
                return json({ ok: false, error: "Upstream error" }, 502);
            }

            return json({ ok: true });

        } catch (err) {
            console.error("Worker error:", err.message);
            return json({ ok: false, error: "Server error" }, 500);
        }
    }
};
