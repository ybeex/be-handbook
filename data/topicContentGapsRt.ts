// Gap content: Real-Time & Network Protocols
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_RT: Record<string, TopicContent> = {
  "tls-ssl": {
    slug: "tls-ssl",
    title: "TLS/SSL Deep Dive",
    tagline: "Handshakes, certificate chains, and why TLS 1.3 is faster",
    sections: [
      {
        type: "text",
        heading: "Three Guarantees Between TCP and HTTP",
        content:
          "TLS is the layer that turns an open pipe into a private one, and it provides exactly three properties. Every design decision follows from naming them.\n\n**Confidentiality**: a passive eavesdropper on the wire sees ciphertext, not your cookies or passwords. **Integrity**: any modification in transit is detected and the connection is torn down, so an attacker cannot quietly flip a byte. **Authentication**: the server proves its identity with a certificate, so you know you reached example.com and not an impostor.\n\nTLS deliberately does **not** hide metadata. The server name (SNI), the timing, and the volume of traffic remain observable. 'SSL' is the obsolete predecessor (SSL 2.0/3.0); every modern deployment speaks TLS, and TLS 1.0 and 1.1 are deprecated and disabled by browsers.",
      },
      {
        type: "analogy",
        heading: "A Sealed Envelope With a Verified Passport",
        content:
          "Picture handing a letter to a courier. The letter goes inside a tamper-evident envelope only the recipient can open (encryption plus integrity), and before you trust the courier at all you check their passport against a government registry (the certificate authority).\n\nThe passport is only as good as the registry that signed it. If you accept any passport from anyone, a forger walks straight in. That is why browsers ship a fixed trust store of root authorities and refuse any chain that does not reach one of them.",
      },
      {
        type: "text",
        heading: "The TLS 1.2 Handshake",
        content:
          "Before a single application byte flows, client and server negotiate a shared secret and agree on ciphers. In TLS 1.2 that costs two round trips.\n\nThe client sends a **ClientHello** listing supported versions, cipher suites, a random nonce, the **SNI** hostname, and extensions. The server replies with a **ServerHello** that picks the version and cipher, its own random, its **certificate chain**, and a signed **ServerKeyExchange** carrying ephemeral Diffie-Hellman parameters. Both sides then derive session keys, exchange **ChangeCipherSpec** and an encrypted **Finished** message, and only then send application data.",
      },
      {
        type: "code",
        heading: "TLS 1.2 Handshake Transcript",
        language: "plaintext",
        label: "tls12-handshake.txt",
        code: `Client                                   Server
  |                                         |
  |---- ClientHello --------------------->  |  client_random, cipher suites, SNI, extensions
  |                                         |
  |  <------------------- ServerHello ----  |  server_random, chosen cipher suite
  |  <------------------- Certificate ----  |  leaf + intermediates (the chain)
  |  <--------------- ServerKeyExchange --  |  ephemeral ECDHE params, signed
  |  <---------------- ServerHelloDone ---  |
  |                                         |
  |---- ClientKeyExchange --------------->  |  client ephemeral public key
  |---- ChangeCipherSpec ----------------->  |
  |---- Finished (encrypted) ------------->  |  MAC over the handshake transcript
  |                                         |
  |  <----------------- ChangeCipherSpec --  |
  |  <----------------- Finished ----------  |
  |                                         |
  |<=========== Application Data =========>  |  AEAD-encrypted from here on`,
      },
      {
        type: "text",
        heading: "TLS 1.3: One Round Trip and Forward Secrecy by Default",
        content:
          "TLS 1.3 removes round trips and the legacy ciphers that kept getting broken. The client guesses the key-exchange group and sends its ephemeral share inside the ClientHello, so the server computes the shared secret immediately. Everything after the ServerHello — including the certificate — is encrypted, so a passive observer can no longer read the certificate or the negotiated parameters.\n\nTLS 1.3 dropped **RSA key exchange** (which gave no forward secrecy), **CBC-mode ciphers**, **compression**, and **renegotiation**. Cipher suites were split into separate key-exchange, AEAD, and hash choices. A full handshake is one round trip; a resumed handshake using a pre-shared key (PSK) can start sending data in **zero round trips**.",
      },
      {
        type: "code",
        heading: "Inspecting a Live Handshake With OpenSSL",
        language: "bash",
        label: "inspect-tls.sh",
        code: `# Negotiated version, cipher suite, and the full certificate chain
openssl s_client -connect example.com:443 -servername example.com -showcerts </dev/null

# Decode the leaf certificate: subject, issuer, validity, and SANs
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName

# Which certificate does the server return for a specific SNI name?
openssl s_client -connect 93.184.216.34:443 -servername shop.example.com </dev/null 2>/dev/null | openssl x509 -noout -subject`,
      },
      {
        type: "text",
        heading: "Certificates and the Chain of Trust",
        content:
          "A certificate binds a public key to a name. The **Subject Alternative Name (SAN)** extension lists the hostnames the certificate is valid for; the old Common Name field is ignored by modern browsers. **Validity dates** bound its life, and **Key Usage** and **Extended Key Usage** restrict what the key may do.\n\nThe server rarely presents a single certificate — it sends a **chain**: the leaf certificate for the site, one or more intermediate CA certificates, and a path up to a **root** that lives in the client's trust store. If the server forgets to send the intermediates, some clients fail with 'unable to get local issuer certificate'. This is a classic misconfiguration where the site works in a browser that cached the intermediate but fails for a fresh CLI tool.",
      },
      {
        type: "comparison",
        heading: "TLS 1.2 vs TLS 1.3",
        headers: ["TLS 1.2", "TLS 1.3"],
        rows: [
          {
            aspect: "Handshake round trips",
            "TLS 1.2": "Two for a full handshake",
            "TLS 1.3": "One, or zero when resuming with a PSK",
          },
          {
            aspect: "Forward secrecy",
            "TLS 1.2": "Optional, only with ECDHE suites",
            "TLS 1.3": "Mandatory for every key-exchange mode",
          },
          {
            aspect: "Certificate privacy",
            "TLS 1.2": "Sent in cleartext",
            "TLS 1.3": "Encrypted after the ServerHello",
          },
          {
            aspect: "RSA key exchange",
            "TLS 1.2": "Supported, but no forward secrecy",
            "TLS 1.3": "Removed entirely",
          },
          {
            aspect: "Renegotiation",
            "TLS 1.2": "Available and historically exploited",
            "TLS 1.3": "Removed; use post-handshake auth",
          },
          {
            aspect: "Cipher suite shape",
            "TLS 1.2": "One string joins kex, auth, AEAD, and MAC",
            "TLS 1.3": "Split into separate kex, AEAD, and hash",
          },
        ],
      },
      {
        type: "text",
        heading: "SNI: Many Names, One Address",
        content:
          "A single IP hosts thousands of sites, so the server must know which certificate to present before anything is encrypted. **Server Name Indication (SNI)** puts the requested hostname in the ClientHello so a frontend can select the right certificate. Without SNI you would need one IP per TLS site.\n\nThe cost is a metadata leak: SNI is sent in cleartext in TLS 1.2, so a network observer sees which sites you visit. **Encrypted Client Hello (ECH)** encrypts the real SNI and presents only an outer 'cover' name, closing that gap. SNI is also why old clients that do not send it can only be served a default certificate.",
      },
      {
        type: "text",
        heading: "Session Resumption: Tickets and PSK",
        content:
          "Re-running a full handshake for every connection wastes expensive asymmetric cryptography. Resumption lets a returning client skip it.\n\n**TLS 1.2 session IDs** store session state on the server and hand the client a lookup key, which does not scale across a fleet without shared storage. **Session tickets** (RFC 5077) encrypt the state and give it to the client, so any server holding the ticket key can resume. TLS 1.3 unifies both as **pre-shared keys**: the server issues single-use tickets and the client spends one to resume. Tickets must be rotated and their keys shared only inside a cluster.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "0-RTT Early Data Can Be Replayed",
        content:
          "TLS 1.3 0-RTT lets a resuming client send application data on the very first flight, saving a round trip — but that early data is **replayable**. An attacker who captures it can resend it to the server. Never put state-changing operations in 0-RTT: no payments, no counters, no non-idempotent writes. Restrict 0-RTT to safe reads and reject it at the edge for anything else. Many CDNs disable 0-RTT by default for exactly this reason.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "TLS gives confidentiality, integrity, and server authentication, but not metadata privacy",
          "TLS 1.3 needs one round trip (zero when resuming) and enforces forward secrecy",
          "The server must send the full chain; missing intermediates break fresh clients",
          "SNI selects the certificate for shared IPs and leaks the hostname unless ECH is used",
          "Session tickets and PSKs avoid full handshakes but must be rotated and scoped to a cluster",
          "Never allow state-changing requests in TLS 1.3 0-RTT early data — it is replayable",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which TLS 1.3 property stops an attacker who later steals the server's private key from decrypting past recorded traffic?",
        options: [
          "Certificate pinning",
          "Forward secrecy through ephemeral key exchange",
          "Session tickets",
          "Server Name Indication",
        ],
        correctIndex: 1,
        explanation:
          "Forward secrecy comes from ephemeral key exchange (such as ECDHE): the session keys are never derivable from the server's long-term private key, so a future key compromise cannot unlock previously captured sessions. TLS 1.3 makes this mandatory; TLS 1.2 only offered it with ECDHE suites.",
      },
      {
        question:
          "A site loads fine in a browser but a fresh CLI tool reports 'unable to get local issuer certificate'. What is the most likely cause?",
        options: [
          "The root CA expired in the browser's trust store",
          "The server is not sending the intermediate CA certificate(s)",
          "SNI is missing from the ClientHello",
          "TLS 1.3 is disabled on the server",
        ],
        correctIndex: 1,
        explanation:
          "Browsers cache intermediates from earlier visits, so a server that omits them can still work there while a fresh client cannot build a path to a trusted root. Sending the full chain (leaf plus intermediates) fixes it.",
      },
      {
        question: "Why is TLS 1.3 0-RTT early data considered dangerous?",
        options: [
          "It forces the use of weak CBC ciphers",
          "It can be captured and replayed by an attacker",
          "It disables forward secrecy for the whole session",
          "It requires an unencrypted certificate",
        ],
        correctIndex: 1,
        explanation:
          "0-RTT data has no protection against replay: anyone who observes the early-data flight can resend it. That is why 0-RTT must be limited to idempotent, side-effect-free requests and rejected for anything that changes state.",
      },
      {
        question: "What does Server Name Indication (SNI) allow?",
        options: [
          "It encrypts the certificate chain end to end",
          "It lets one IP present the correct certificate for the requested hostname",
          "It prevents an attacker from replaying handshakes",
          "It derives the session key from the hostname",
        ],
        correctIndex: 1,
        explanation:
          "SNI carries the requested hostname in the ClientHello so a server on a shared IP can choose the right certificate before the connection is encrypted. It leaks the hostname in cleartext unless Encrypted Client Hello is used.",
      },
    ],
  },

  "http3-quic": {
    slug: "http3-quic",
    title: "HTTP/3 & QUIC",
    tagline: "UDP transport that ends head-of-line blocking",
    sections: [
      {
        type: "text",
        heading: "The Transport Bottleneck Under HTTP/2",
        content:
          "HTTP/2 multiplexes many streams over a single TCP connection and removed application-level head-of-line blocking: a slow response no longer blocks a fast one at the HTTP layer. But it did not touch the layer below.\n\nTCP delivers a single, ordered byte stream. If one packet is lost, TCP stalls **every** stream until that packet is retransmitted, because the receiver cannot deliver later bytes to any stream until the gap is filled. On a lossy network all of HTTP/2's concurrency collapses to the slowest packet. On top of that, a new secure connection costs a TCP handshake plus a TLS handshake — up to three round trips before the first byte of a request.",
      },
      {
        type: "analogy",
        heading: "One Convoy on a Multi-Lane Road",
        content:
          "HTTP/1.1 was a parade of separate cars, each waiting for the one ahead. HTTP/2 packed everyone into a single bus — no waiting between passengers inside, but when the bus hits a roadblock, every passenger stops while the one flat tyre is fixed.\n\nQUIC breaks the bus back into independent lanes that share one road: a blockage in one lane halts only that lane. The road itself (UDP) never cares about order, so a lost packet only delays its own stream.",
      },
      {
        type: "text",
        heading: "QUIC: Streams, Encryption, and Congestion Control over UDP",
        content:
          "QUIC is a full transport protocol built on top of UDP, implemented in user space rather than the kernel. It folds in the pieces that TCP and TLS provided separately: reliable, ordered delivery **per stream**, its own congestion control, and a TLS 1.3 handshake baked into the connection setup.\n\nBecause QUIC understands streams natively, each stream has independent ordering and loss recovery, so one lost packet never blocks the others. Because it encrypts almost the entire packet (including most header fields, protected by header protection), middleboxes cannot see or mangle the stream structure. And because it lives in user space, it ships new features — like a different congestion controller — as a library upgrade instead of an operating-system kernel change that takes years to deploy.",
      },
      {
        type: "code",
        heading: "How HTTP/3 Is Advertised to Clients",
        language: "http",
        label: "alt-svc.http",
        code: `HTTP/2 200 OK
content-type: text/html
alt-svc: h3=":443"; ma=86400

# The server tells the client it also speaks HTTP/3 on UDP port 443.
# "ma" is the max-age in seconds; the client remembers and tries h3 next time.
# HTTP/3 can also be discovered from a DNS HTTPS/SVCB record, without a first
# HTTP/2 request. Clients always keep an HTTP/2 or HTTP/1.1 fallback path.`,
      },
      {
        type: "code",
        heading: "Serving HTTP/3 With Nginx",
        language: "nginx",
        label: "http3.conf",
        code: `server {
    # TCP for HTTP/1.1 and HTTP/2, UDP for HTTP/3 on the same port
    listen 443 ssl;
    listen 443 quic reuseport;
    http2 on;

    ssl_certificate     /etc/ssl/fullchain.pem;
    ssl_certificate_key /etc/ssl/privkey.pem;

    # Advertise HTTP/3 so browsers upgrade on the next connection
    add_header Alt-Svc 'h3=":443"; ma=86400' always;

    # Required so the browser trusts QUIC's origin for the h3 upgrade
    add_header QUIC-Status $http3 always;
}

# Firewall: HTTP/3 needs UDP 443 open, not just TCP 443.`,
      },
      {
        type: "text",
        heading: "Handshakes: 1-RTT and 0-RTT",
        content:
          "QUIC combines the transport and cryptographic handshake into one exchange. A first connection is **1-RTT**: the client sends its key share and supported parameters, the server answers with its parameters and certificate, and both sides can send data immediately after. That is faster than TCP-plus-TLS, which needs three round trips.\n\nA reconnecting client that holds a cached ticket can use **0-RTT**: it sends application data in the first flight using a pre-shared key. The tradeoff is identical to TLS 1.3 — 0-RTT data is replayable — so servers apply the same rule, allowing only safe, idempotent requests.",
      },
      {
        type: "comparison",
        heading: "HTTP/2 over TCP vs HTTP/3 over QUIC",
        headers: ["HTTP/2 over TCP", "HTTP/3 over QUIC"],
        rows: [
          {
            aspect: "Transport",
            "HTTP/2 over TCP": "TCP, one ordered byte stream",
            "HTTP/3 over QUIC": "UDP, many independent streams",
          },
          {
            aspect: "Head-of-line blocking",
            "HTTP/2 over TCP": "Solved in HTTP, remains in TCP",
            "HTTP/3 over QUIC": "Solved per stream at the transport",
          },
          {
            aspect: "Handshake cost",
            "HTTP/2 over TCP": "TCP + TLS, up to 3 round trips",
            "HTTP/3 over QUIC": "1 RTT, or 0 RTT when resuming",
          },
          {
            aspect: "Connection identity",
            "HTTP/2 over TCP": "The 4-tuple of IPs and ports",
            "HTTP/3 over QUIC": "A connection ID decoupled from the address",
          },
          {
            aspect: "Encryption scope",
            "HTTP/2 over TCP": "Payload plus TLS record; TCP headers clear",
            "HTTP/3 over QUIC": "Almost the whole packet, headers included",
          },
          {
            aspect: "Loss recovery",
            "HTTP/2 over TCP": "Global, stalls all streams",
            "HTTP/3 over QUIC": "Per stream, other streams keep flowing",
          },
          {
            aspect: "Middlebox behaviour",
            "HTTP/2 over TCP": "Well understood by firewalls and NATs",
            "HTTP/3 over QUIC": "UDP blocked on some corporate networks",
          },
        ],
      },
      {
        type: "text",
        heading: "Connection Migration and Connection IDs",
        content:
          "A TCP connection is identified by its four-tuple: source IP, source port, destination IP, destination port. Change any of them — a phone moving from Wi-Fi to cellular, or a NAT remapping a port — and the connection breaks, forcing a full reconnect.\n\nQUIC identifies a connection by an opaque **connection ID** carried in every packet. When your address changes, you keep using the same connection ID and the connection simply continues on the new path; QUIC validates the new path and resumes. For a mobile client this means downloads and calls survive a network switch instead of dying and restarting from zero.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "UDP Is Not Always Allowed",
        content:
          "HTTP/3 depends on UDP, and plenty of corporate firewalls and older middleboxes block or throttle UDP 443. A deployment that flips to HTTP/3 without a fallback loses those clients entirely. Always keep HTTP/2 or HTTP/1.1 served on TCP 443, advertise HTTP/3 through Alt-Svc or DNS so clients upgrade gracefully, and monitor what fraction of requests actually arrive over h3. If the number is suspiciously low, a firewall is likely dropping UDP.",
      },
      {
        type: "steps",
        heading: "Rolling Out HTTP/3",
        steps: [
          {
            title: "Enable UDP 443",
            detail:
              "Open UDP port 443 in every firewall, load balancer, and security group on the path, not just TCP.",
          },
          {
            title: "Serve QUIC at the edge",
            detail:
              "Turn on HTTP/3 in the CDN or in Nginx with listen 443 quic, reusing the existing certificate.",
          },
          {
            title: "Advertise, do not force",
            detail:
              "Publish Alt-Svc or a DNS HTTPS record so capable clients upgrade while everyone keeps a TCP fallback.",
          },
          {
            title: "Measure adoption",
            detail:
              "Track the h3 versus h2 request split; a low share usually means a middlebox is blocking UDP.",
          },
          {
            title: "Decide the 0-RTT policy",
            detail:
              "Allow 0-RTT only for idempotent reads; disable it for anything that changes server state.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "HTTP/2 fixed application head-of-line blocking, but TCP still blocks all streams on one lost packet",
          "QUIC runs on UDP and gives every stream its own ordering and loss recovery",
          "QUIC's handshake is 1-RTT, or 0-RTT when resuming with a cached ticket",
          "Connection IDs let a QUIC connection survive an IP or port change",
          "UDP is frequently blocked, so HTTP/3 must always ship with an HTTP/2 fallback",
          "0-RTT data is replayable — restrict it to idempotent requests",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What problem does QUIC solve that HTTP/2 left in place?",
        options: [
          "TLS certificate verification",
          "Transport-level head-of-line blocking caused by TCP's single ordered stream",
          "DNS resolution latency",
          "Compression of response headers",
        ],
        correctIndex: 1,
        explanation:
          "HTTP/2 removed blocking at the HTTP layer, but all streams still share one TCP byte stream, so a single lost packet stalls every stream. QUIC gives each stream independent ordering and loss recovery, eliminating transport-level head-of-line blocking.",
      },
      {
        question:
          "A phone switches from Wi-Fi to cellular mid-download. Why does a QUIC connection often survive while a TCP one would not?",
        options: [
          "QUIC retransmits every packet on the new path",
          "QUIC identifies the connection by a connection ID rather than the IP-and-port four-tuple",
          "QUIC uses a longer timeout than TCP",
          "QUIC ignores packet loss entirely",
        ],
        correctIndex: 1,
        explanation:
          "TCP ties a connection to its four-tuple, so an address change breaks it. QUIC carries a connection ID in every packet, decoupled from the address, so the connection migrates to the new path after validation.",
      },
      {
        question:
          "You deploy HTTP/3 but a chunk of users report broken pages. What is the most likely cause?",
        options: [
          "The certificate is not valid for HTTP/3",
          "A middlebox is blocking UDP 443 and no HTTP/2 fallback is being offered",
          "HTTP/3 cannot be served with TLS 1.3",
          "The connection IDs are expiring too quickly",
        ],
        correctIndex: 1,
        explanation:
          "Many corporate and legacy firewalls drop UDP. If the server encourages HTTP/3 without a working HTTP/2 or HTTP/1.1 path, those clients fail. Always serve a TCP fallback and advertise HTTP/3 so clients upgrade only when they can.",
      },
    ],
  },

  "long-polling": {
    slug: "long-polling",
    title: "Long Polling & SSE",
    tagline: "Server push without WebSockets, and when that is the right call",
    sections: [
      {
        type: "text",
        heading: "Pushing Before WebSockets",
        content:
          "Browsers were built to pull, not to be pushed. For years the only way to deliver a live update was for the client to keep asking. The family of tricks for faking server push is called **Comet**, and it rests on one idea: hold an HTTP response open for as long as possible instead of answering instantly.\n\nTwo shapes dominate. **Long polling** keeps a request open until an event arrives or a timeout fires, then the client immediately re-requests. **Server-Sent Events (SSE)** keep a single response open indefinitely and stream many small messages down one connection. Both reuse plain HTTP, so they sail through proxies, CDNs, and corporate firewalls that would choke on a WebSocket upgrade.",
      },
      {
        type: "analogy",
        heading: "Keeping the Line Open at the Front Desk",
        content:
          "Long polling is like phoning a hotel front desk to ask 'has my wake-up call been set up yet?'. Instead of hanging up and redialing every five seconds, you stay on the line and the clerk keeps the phone off the hook until there is news, then tells you and hangs up. You dial again and the cycle repeats.\n\nSSE is better still: it is a single phone call that stays connected, and the clerk reads you each update as it happens. The connection is one-way — they talk, you listen — which is exactly enough for notifications, feeds, and status tickers.",
      },
      {
        type: "text",
        heading: "How Long Polling Works",
        content:
          "The client sends a normal GET with a cursor or timestamp marking the last event it saw. The server does not answer immediately. It parks the request, and when a matching event is published it responds and closes. If nothing happens before a timeout (typically 20-30 seconds), the server returns an empty response so that intermediaries do not kill the idle connection.\n\nThe client treats any response — data or empty — as a signal to open a new request straight away, restoring the wait. Events between the response and the next request are never missed as long as the client sends its cursor, and the server replays everything newer than it.",
      },
      {
        type: "code",
        heading: "A Long-Polling Handler",
        language: "typescript",
        label: "long-poll.ts",
        code: `// Hold each request open until an event arrives or a timeout fires.
const waiters = new Set<{ send: (events: Event[]) => void; timer: NodeJS.Timeout }>();

app.get("/api/events", (req, res) => {
  const since = Number(req.query.since ?? 0);

  const respond = (events: Event[]) => {
    if (res.writableEnded) return;
    const cursor = events.length ? events[events.length - 1].id : since;
    res.json({ events, cursor });
  };

  // If events already exist after the cursor, answer immediately.
  const pending = store.eventsSince(since);
  if (pending.length) return respond(pending);

  // Otherwise park the response and let the publisher wake it.
  const waiter = { send: respond, timer: setTimeout(() => {}, 0) };
  waiter.timer = setTimeout(() => {
    waiters.delete(waiter);
    respond([]); // empty response tells the client to reconnect right away
  }, 25_000);
  waiters.add(waiter);

  req.on("close", () => {
    waiters.delete(waiter);
    clearTimeout(waiter.timer);
  });
});

function publish(event: Event) {
  for (const waiter of waiters) {
    clearTimeout(waiter.timer);
    waiters.delete(waiter);
    waiter.send([event]);
  }
}`,
      },
      {
        type: "comparison",
        heading: "Long Polling vs SSE vs WebSocket",
        headers: ["Long Polling", "SSE", "WebSocket"],
        rows: [
          {
            aspect: "Direction",
            "Long Polling": "Server to client only",
            SSE: "Server to client only",
            WebSocket: "Full duplex",
          },
          {
            aspect: "Transport",
            "Long Polling": "Repeated HTTP requests",
            SSE: "One held HTTP response",
            WebSocket: "Upgraded TCP connection",
          },
          {
            aspect: "Protocol",
            "Long Polling": "Plain HTTP",
            SSE: "HTTP with text/event-stream",
            WebSocket: "ws:// over TCP",
          },
          {
            aspect: "Auto-reconnect",
            "Long Polling": "Manual, driven by the client loop",
            SSE: "Built into EventSource",
            WebSocket: "Manual, you write the backoff",
          },
          {
            aspect: "Proxy friendliness",
            "Long Polling": "Excellent, looks like normal HTTP",
            SSE: "Very good, ordinary HTTP",
            WebSocket: "Requires upgrade support end to end",
          },
          {
            aspect: "Latency and overhead",
            "Long Polling": "A fresh request per event",
            SSE: "Low, one connection carries all events",
            WebSocket: "Lowest, but the most machinery",
          },
          {
            aspect: "Best for",
            "Long Polling": "Rare events, legacy environments",
            SSE: "Feeds, notifications, live dashboards",
            WebSocket: "Chat, games, collaborative editing",
          },
        ],
      },
      {
        type: "text",
        heading: "Server-Sent Events and EventSource",
        content:
          "SSE is a thin, well-specified protocol on top of HTTP. The server responds with Content-Type: text/event-stream and simply keeps writing, flushing each message as it goes. On the client, the built-in **EventSource** API parses the stream, dispatches named events, and handles reconnection automatically.\n\nSSE is one-directional by design, which is not a limitation for most push use cases and is a feature for simplicity. It rides on ordinary HTTP, so it works through proxies, honors authentication cookies and headers, and benefits from HTTP/2 multiplexing. The obvious constraint is the browser connection limit when used over HTTP/1.1.",
      },
      {
        type: "code",
        heading: "The SSE Wire Format",
        language: "plaintext",
        label: "event-stream.txt",
        code: `HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no

retry: 3000

id: 42
event: price
data: {"symbol":"AAPL","last":189.20}

: a line starting with a colon is a comment, used as a heartbeat

id: 43
data: first line
data: second line

# Field rules:
#   data:  lines are joined with a newline into the event payload
#   event: names the event type the client listens for (default is "message")
#   id:    sets the event ID, echoed back on reconnect as Last-Event-ID
#   retry: tells the browser how many ms to wait before reconnecting
# A blank line terminates each event.`,
      },
      {
        type: "code",
        heading: "Consuming a Stream With EventSource",
        language: "typescript",
        label: "eventsource.ts",
        code: `// EventSource reconnects on its own and resends Last-Event-ID for you.
const es = new EventSource("/api/stream");

es.addEventListener("price", (e) => {
  const tick = JSON.parse((e as MessageEvent).data);
  render(tick);
});

es.addEventListener("open", () => console.log("stream connected"));

es.onerror = () => {
  // "connecting" means the browser is retrying; CLOSED means it gave up.
  if (es.readyState === EventSource.CLOSED) {
    console.warn("stream closed by the server");
  }
};`,
      },
      {
        type: "text",
        heading: "Reconnection and Last-Event-ID",
        content:
          "Both techniques need the same thing on reconnect: a way to resume without gaps or duplicates. SSE defines it precisely. Every event may carry an `id:` field, and the browser remembers the last one. When the connection drops and EventSource reconnects, it automatically sends a **Last-Event-ID** request header holding that value.\n\nThe server reads the header and replays everything that happened after that ID. Combined with the `retry:` field, which sets the reconnection delay, this gives at-least-once delivery with seamless recovery and no custom client code. Long polling achieves the same effect manually, by passing the cursor as a query parameter on each fresh request.",
      },
      {
        type: "text",
        heading: "Heartbeats, Proxies, and the Idle Timeout Problem",
        content:
          "An idle connection is a connection someone will eventually kill. Load balancers, reverse proxies, and CDNs all impose idle timeouts — often 60 seconds — and will silently close a stream with no traffic. That is why both long polling and SSE need timeouts and heartbeats.\n\nFor SSE, send a comment line (`: ping`) every 15-30 seconds; it keeps the TCP connection warm without producing a client event. For long polling, cap the hold time below the shortest proxy timeout so you control the response rather than discovering a dead socket. Also disable proxy buffering — on Nginx that means `X-Accel-Buffering: no` — or events will sit in a buffer instead of arriving in real time.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "The Six-Connection Limit",
        content:
          "Over HTTP/1.1 a browser opens only about six connections per origin. Every open SSE stream eats one, so a few tabs plus a couple of streams can exhaust the budget and make ordinary fetches queue behind them. The fix is HTTP/2 or HTTP/3, which multiplex many streams over one connection with no per-origin cap of that kind. On HTTP/1.1, prefer one multiplexed stream that carries many event types over several separate EventSource objects.",
      },
      {
        type: "text",
        heading: "Scaling the Fan-Out",
        content:
          "Both patterns hold server resources for every connected client, so the cost is memory and file descriptors rather than CPU. Thousands of parked connections are fine on a modern event loop, but they do not survive a stateless round-robin deployment without help.\n\nThe usual architecture puts a message broker (Redis Pub/Sub, NATS, Kafka) behind the web tier. Each instance subscribes to the broker and only wakes the waiters it owns locally, so a publish reaches every node and thus every client regardless of which instance holds the connection. Need more capacity? Add instances; the broker handles the mesh.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Long polling holds a request until an event or timeout, then the client re-requests immediately",
          "SSE streams many events over one held HTTP response using text/event-stream and EventSource",
          "Last-Event-ID plus a cursor gives gap-free resume on reconnect with no custom client code",
          "Send heartbeats and cap idle time, or proxies will silently kill long-lived connections",
          "Prefer SSE over polling for feeds; reserve WebSockets for genuine full-duplex needs",
          "Scale fan-out with a broker so publishes reach clients on every web instance",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What makes long polling produce live updates on pull-only HTTP?",
        options: [
          "The server sends multiple responses to one request",
          "The server holds the request open until an event arrives or a timeout fires, then the client re-requests",
          "The client upgrades the connection to WebSocket",
          "The client opens a raw TCP socket",
        ],
        correctIndex: 1,
        explanation:
          "Long polling parks a normal GET on the server until there is something to report or a timeout elapses. The client treats every response as a trigger to immediately open the next request, which keeps a nearly continuous channel without changing HTTP.",
      },
      {
        question:
          "How does an SSE client avoid missing events when a stream drops and reconnects?",
        options: [
          "It re-fetches the entire event history from the start",
          "The browser resends the Last-Event-ID header so the server replays only newer events",
          "It falls back to WebSocket automatically",
          "Events are buffered forever by the server",
        ],
        correctIndex: 1,
        explanation:
          "EventSource remembers the last id: it received and automatically sends it as the Last-Event-ID request header on reconnect. The server replays events after that id, giving gap-free recovery with no custom client logic.",
      },
      {
        question:
          "An SSE stream connects but events appear in bursts minutes late. What is the most likely cause?",
        options: [
          "The retry interval is too small",
          "A proxy is buffering the response instead of flushing it",
          "The events are using the wrong data field",
          "The browser has exhausted its SSE limit",
        ],
        correctIndex: 1,
        explanation:
          "Reverse proxies and CDNs buffer responses by default. For a text/event-stream you must disable buffering (for example X-Accel-Buffering: no on Nginx) and flush each event so it reaches the client immediately.",
      },
      {
        question:
          "When is a WebSocket a better fit than SSE?",
        options: [
          "When you only need a read-only feed of notifications",
          "When messages must flow in both directions frequently, such as chat or games",
          "When you need maximum proxy compatibility",
          "When the server must push fewer than one message per minute",
        ],
        correctIndex: 1,
        explanation:
          "SSE is one-directional. When the client must also send a continuous stream of messages — chat, games, collaborative editing — a full-duplex WebSocket is the right tool, at the cost of handling upgrades, heartbeats, and reconnection yourself.",
      },
    ],
  },

  "webrtc": {
    slug: "webrtc",
    title: "WebRTC",
    tagline: "Peer-to-peer media and data, from SDP handshake to SFU",
    sections: [
      {
        type: "text",
        heading: "What WebRTC Actually Is",
        content:
          "WebRTC is a set of browser APIs and protocols for sending audio, video, and arbitrary data directly between peers. It ships built into every modern browser — no plugins — and it is deliberately peer-to-peer, so once the connection is established, media flows device-to-device rather than through your servers.\n\nThe stack handles the hard parts: capturing and encoding media, encrypting it, finding a network path through NATs and firewalls, and adapting to changing bandwidth. What it does **not** include is signaling — the way two peers exchange connection details before they can talk. That is left to you, usually over an existing WebSocket or HTTP channel.",
      },
      {
        type: "analogy",
        heading: "Two People Agreeing on a Private Meeting Spot",
        content:
          "Imagine two strangers who want to talk privately. They cannot just shout across the city, so a mutual friend passes notes between them: 'I'm at the corner of 5th and Main, tell me where you are.' Once both know each other's address they meet face to face and the friend steps away.\n\nSignaling is that mutual friend — it carries the initial notes. The meeting spot is the peer-to-peer media path. And when one person's street is behind a locked gate (a NAT), a professional courier service (a TURN server) relays the conversation instead.",
      },
      {
        type: "text",
        heading: "Signaling: The Half WebRTC Does Not Define",
        content:
          "Two browsers cannot connect until they exchange **session descriptions** (what media and codecs each supports) and **ICE candidates** (the network addresses each can be reached at). WebRTC never says how to move those messages; that is signaling, and it is your job.\n\nIn practice you send them over a WebSocket, an HTTP endpoint, or any existing channel, typically through your own server. Building signaling from scratch couples you to the protocol, so most teams lean on a library, but the requirement is fundamental: without a signaling path, WebRTC has no way to begin.",
      },
      {
        type: "text",
        heading: "SDP and the Offer/Answer Model",
        content:
          "Session Description Protocol (SDP) is a plain-text description of a media session: media lines for audio and video, the codecs to use, ICE credentials, and a DTLS fingerprint. Negotiation follows the **offer/answer** model: the caller creates an offer, the callee sets it as remote and returns an answer, and both sides converge on a common configuration.\n\nThe SDP also pins the identity of the encrypted media: the fingerprint is a hash of the peer's DTLS certificate, so the DTLS handshake verifies the same peer described in the session. Candidates can be trickled as they are discovered rather than waiting for all of them, which accelerates connection setup.",
      },
      {
        type: "code",
        heading: "Building an Offer and Adding Candidates",
        language: "typescript",
        label: "peer.ts",
        code: `const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.example.com:3478" },
    {
      urls: "turns:turn.example.com:5349",
      username: "user",
      credential: "secret",
    },
  ],
});

// Trickle ICE: send each candidate as soon as it is found.
pc.onicecandidate = (e) => {
  if (e.candidate) signaling.send({ type: "candidate", candidate: e.candidate });
};

// Remote media arrives here, one stream per track.
pc.ontrack = (e) => {
  videoElement.srcObject = e.streams[0];
};

// Sending our own media.
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
for (const track of stream.getTracks()) pc.addTrack(track, stream);

// Create the offer, then send it over signaling.
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
signaling.send({ type: "offer", sdp: offer.sdp });`,
      },
      {
        type: "text",
        heading: "ICE: Finding a Path Through NATs",
        content:
          "Most devices are behind NAT, so neither peer knows its own reachable address. **ICE (Interactive Connectivity Establishment)** solves this by gathering candidates and testing them. Each candidate is a possible path.\n\nA **host** candidate is a local interface address. A **server-reflexive (srflx)** candidate is discovered with **STUN** — the peer asks a public server 'what address do you see me coming from?'. A **relay** candidate comes from **TURN**, a server that forwards media when no direct path exists. ICE pairs candidates from both sides, sends connectivity checks over each, and picks the best working pair, preferring direct paths over relays.",
      },
      {
        type: "comparison",
        heading: "Mesh vs SFU vs MCU",
        headers: ["Mesh", "SFU", "MCU"],
        rows: [
          {
            aspect: "Topology",
            Mesh: "Every peer connects to every other",
            SFU: "Each peer connects only to the server",
            MCU: "Each peer connects to the server, which mixes",
          },
          {
            aspect: "Uplink per client",
            Mesh: "One stream per other peer (grows fast)",
            SFU: "One stream to the server",
            MCU: "One stream to the server",
          },
          {
            aspect: "Server media processing",
            Mesh: "None",
            SFU: "Forwarding only, no decode or re-encode",
            MCU: "Decode, mix, and re-encode",
          },
          {
            aspect: "Server CPU cost",
            Mesh: "None",
            SFU: "Low, mostly bandwidth",
            MCU: "High, scales with resolution and mix count",
          },
          {
            aspect: "Practical scale",
            Mesh: "Two to four participants",
            SFU: "Dozens of participants",
            MCU: "Very large or mixed-audio conferences",
          },
          {
            aspect: "Added latency",
            Mesh: "Lowest, direct paths",
            SFU: "Low, one hop through the server",
            MCU: "Highest, mixing and re-encoding add delay",
          },
          {
            aspect: "Typical use",
            Mesh: "One-to-one calls, tiny groups",
            SFU: "Group video (most modern services)",
            MCU: "Telephony bridges, broadcast webinars",
          },
        ],
      },
      {
        type: "text",
        heading: "Encryption: DTLS-SRTP and Data Channels",
        content:
          "Media is not sent in the clear. WebRTC runs a **DTLS** handshake over the same connection and derives keys for **SRTP**, which encrypts each RTP media packet. Because the DTLS certificate's fingerprint is pinned in the SDP, a peer knows it is encrypting to the right party. Media encryption is mandatory in WebRTC — there is no unencrypted mode.\n\n**Data channels** reuse the same secure transport for arbitrary payloads. They run over **SCTP over DTLS**, which gives you configurable guarantees per channel: ordered or unordered, reliable or unreliable. That flexibility makes data channels fit everything from a reliable file transfer to a lossy low-latency game state update, all without a separate connection.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "TURN Is Not Free",
        content:
          "Symmetric NATs and strict corporate firewalls defeat direct and STUN-discovered paths, so ICE falls back to TURN, which relays all media through your infrastructure. That is not a rare edge case — for some networks it is the only path, and it means real bandwidth cost: every participant's up and down traffic flows through your relay. Budget for it, deploy TURN close to users, monitor relay usage, and never treat TURN as an afterthought. A call that works on Wi-Fi but fails on mobile data is almost always a missing or broken TURN server.",
      },
      {
        type: "steps",
        heading: "Establishing a Peer Connection",
        steps: [
          {
            title: "Exchange the offer and answer",
            detail:
              "The caller creates an SDP offer, the callee sets it and returns an answer; both set each other's description.",
          },
          {
            title: "Gather ICE candidates",
            detail:
              "Each side collects host, server-reflexive, and relay candidates and trickles them over signaling as found.",
          },
          {
            title: "Run connectivity checks",
            detail:
              "ICE pairs candidates from both sides and tests each one, selecting the highest-priority working path.",
          },
          {
            title: "Complete the DTLS handshake",
            detail:
              "Peers verify each other against the SDP fingerprints and derive SRTP and data-channel keys.",
          },
          {
            title: "Stream media or data",
            detail:
              "SRTP carries audio and video, SCTP carries data channels, and the connection falls back to TURN if direct paths never connect.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "WebRTC is peer-to-peer media, but signaling is not part of the spec — you must provide it",
          "SDP offer/answer negotiates codecs, ICE credentials, and the DTLS fingerprint",
          "ICE finds a path using host, STUN-derived, and TURN-relayed candidates",
          "Media is always encrypted: DTLS negotiates keys for SRTP, and data channels ride on SCTP",
          "Mesh suits tiny calls; an SFU scales to dozens; an MCU mixes at high CPU cost",
          "TURN relays cost real bandwidth and are essential on restrictive networks — plan and monitor them",
        ],
      },
    ],
    quiz: [
      {
        question: "What does WebRTC deliberately leave out of scope?",
        options: [
          "Media encryption",
          "Signaling to exchange SDP and ICE candidates",
          "NAT traversal",
          "Codec negotiation",
        ],
        correctIndex: 1,
        explanation:
          "WebRTC defines media, encryption, and connectivity, but never specifies how peers exchange session descriptions and candidates. Signaling is left to the application, typically implemented over WebSockets or HTTP.",
      },
      {
        question:
          "A direct peer-to-peer path cannot be established because both peers are behind symmetric NATs. What unblocks the call?",
        options: [
          "STUN, which discovers the public address",
          "TURN, which relays the media through a server",
          "A longer ICE timeout",
          "Re-encoding the media in a lower bitrate",
        ],
        correctIndex: 1,
        explanation:
          "STUN only tells a peer its reflexive address; when no direct path survives, ICE falls back to a TURN relay candidate that forwards the media. TURN costs bandwidth and should be deployed and monitored deliberately.",
      },
      {
        question: "How is WebRTC media protected on the wire?",
        options: [
          "It is sent unencrypted and relies on the network",
          "DTLS negotiates keys, and SRTP encrypts each media packet; the certificate is pinned by the SDP fingerprint",
          "It uses the same TLS session as the web page",
          "Only data channels are encrypted, not audio or video",
        ],
        correctIndex: 1,
        explanation:
          "WebRTC always encrypts media. A DTLS handshake runs over the connection, its certificate fingerprint is carried in the SDP, and the derived keys protect RTP packets via SRTP. Data channels share this secure transport over SCTP.",
      },
      {
        question: "When is an SFU preferable to a full mesh for a group call?",
        options: [
          "For one-to-one calls with no server available",
          "For group calls where each client sends one stream to the server, which forwards it to others",
          "When the server must decode and mix all streams into one",
          "When you want to eliminate all server bandwidth cost",
        ],
        correctIndex: 1,
        explanation:
          "A mesh requires every peer to upload to every other, which collapses beyond a few participants. An SFU has each client send a single stream to the server, which forwards it without decoding, scaling to dozens of participants at low CPU cost.",
      },
    ],
  },

  "mqtt-iot": {
    slug: "mqtt-iot",
    title: "MQTT & IoT Messaging",
    tagline: "Lightweight pub/sub for constrained devices",
    sections: [
      {
        type: "text",
        heading: "Publish/Subscribe for the Edge",
        content:
          "MQTT is a publish/subscribe messaging protocol built for devices with tiny CPUs, little memory, and unreliable links: sensors, meters, vehicles, and industrial controllers. Clients never talk to one another directly. They connect to a **broker**, publish messages to **topics**, and subscribe to topic filters, and the broker routes each published message to every matching subscriber.\n\nThat indirection is the whole point. Producers and consumers are decoupled in space and time: a sensor does not know or care who listens, and a consumer can join long after the data started flowing. The overhead is minimal — the fixed header is as small as two bytes — which is what makes MQTT viable on a battery-powered device over a metered cellular link.",
      },
      {
        type: "analogy",
        heading: "A Post Office With Topic Pigeonholes",
        content:
          "Think of the broker as a post office organized by subject. A publisher drops a letter into the pigeonhole labeled 'home/kitchen/temperature' and walks away. Anyone who has asked the post office to forward everything under 'home/kitchen/#' gets a copy; so does anyone watching 'home/+/temperature'.\n\nNo publisher ever needs a subscriber's address, and no subscriber needs to know who is publishing. Add a new dashboard tomorrow and it simply starts receiving mail that was already being sent — as long as someone keeps the pigeonholes open, the system keeps working.",
      },
      {
        type: "text",
        heading: "The Broker-Centric Model",
        content:
          "Every client opens one TCP (or TLS) connection to the broker and keeps it alive with periodic PINGREQ/PINGRESP heartbeats. Over that single connection it can subscribe to many filters and publish to many topics, so the protocol overhead is paid once.\n\n**MQTT 3.1.1** is the ubiquitous, battle-tested version. **MQTT 5.0** adds features operators eventually need: reason codes on every acknowledgment, user properties, shared subscriptions for load balancing, topic aliases to shrink repeated topic names, and message expiry. Brokers such as Mosquitto, EMQX, HiveMQ, and AWS IoT Core speak both. A **persistent session** keeps a client's subscriptions and queued messages on the broker even when the device is offline.",
      },
      {
        type: "text",
        heading: "Topics and Wildcards",
        content:
          "Topics are UTF-8 strings with a `/` separator forming a hierarchy, such as `home/floor1/kitchen/temperature`. They are created on demand — there is no registration step, and no schema enforcing them. That flexibility is also a hazard: sloppy topic design becomes impossible to reason about at scale.\n\nSubscriptions use two wildcards. `+` matches exactly one level; `#` matches the remaining levels and, being greedy, may only appear as the final character. Wildcards are for subscribers only — you can never publish to a filter containing them.",
      },
      {
        type: "code",
        heading: "Topic Filters and Wildcards",
        language: "plaintext",
        label: "mqtt-topics.txt",
        code: `# Subscribe examples
home/+/temperature          # one level of wildcard: any single room
home/floor1/#               # multi-level wildcard: everything under floor1

# Publish examples
home/kitchen/temperature    # matches home/+/temperature
home/floor1/room2/humidity  # matches home/floor1/#

# Rules
#   + matches exactly one level:
#       home/+/temp  matches home/kitchen/temp
#       home/+/temp  does NOT match home/a/b/temp
#   # matches the rest and must be the final level:
#       home/#       valid
#       home/#/x     invalid
#   A leading wildcard is allowed: +/status and # are valid subscriptions.
#   Wildcards are for subscribers; publishing must use a concrete topic.`,
      },
      {
        type: "text",
        heading: "Quality of Service Levels",
        content:
          "MQTT offers three delivery guarantees, chosen per message. **QoS 0** is fire and forget: the broker forwards the message once and forgets it — fastest, and acceptable for high-frequency sensor readings where the next sample supersedes the last. **QoS 1** is at least once: the sender retransmits until acknowledged, so a message always arrives but duplicates are possible. **QoS 2** is exactly once, using a four-step handshake that guarantees no duplicates at the cost of extra round trips and broker state.\n\nThe guarantee is between each hop, not end to end: a publisher-to-broker QoS 1 message and a broker-to-subscriber QoS 1 delivery are independent. Choosing the level is a real tradeoff between bandwidth, latency, and duplication — pick the lowest that your application can tolerate.",
      },
      {
        type: "comparison",
        heading: "QoS 0 vs QoS 1 vs QoS 2",
        headers: ["QoS 0", "QoS 1", "QoS 2"],
        rows: [
          {
            aspect: "Guarantee",
            "QoS 0": "At most once",
            "QoS 1": "At least once",
            "QoS 2": "Exactly once",
          },
          {
            aspect: "Handshake",
            "QoS 0": "None",
            "QoS 1": "PUBLISH, PUBACK",
            "QoS 2": "PUBLISH, PUBREC, PUBREL, PUBCOMP",
          },
          {
            aspect: "Duplicates possible",
            "QoS 0": "Delivery may be lost",
            "QoS 1": "Yes, on retransmission",
            "QoS 2": "No",
          },
          {
            aspect: "Messages per delivery",
            "QoS 0": "One packet",
            "QoS 1": "Two packets",
            "QoS 2": "Four packets",
          },
          {
            aspect: "Broker state",
            "QoS 0": "None kept",
            "QoS 1": "Tracks in-flight until PUBACK",
            "QoS 2": "Tracks message IDs through the full handshake",
          },
          {
            aspect: "Latency and overhead",
            "QoS 0": "Lowest",
            "QoS 1": "Moderate",
            "QoS 2": "Highest",
          },
          {
            aspect: "Good for",
            "QoS 0": "High-frequency telemetry, lossy telemetry is fine",
            "QoS 1": "Commands and events that may be retried",
            "QoS 2": "Billing or metering where duplicates are unacceptable",
          },
        ],
      },
      {
        type: "text",
        heading: "Retained Messages and Last Will",
        content:
          "Two broker features make device state manageable. A **retained message** is stored by the broker as the latest value for a topic, so any new subscriber receives it instantly rather than waiting for the next update. That is how a dashboard shows the current temperature the moment it connects instead of showing nothing until the sensor next reports. There is exactly one retained message per topic, and publishing an empty payload clears it.\n\nThe **Last Will and Testament** is a message the broker holds for a client and publishes if that client disconnects abnormally — without sending a clean DISCONNECT. It turns connection health into an event: a gateway subscribes to `devices/+/status` and learns a device went offline because the broker published its will to `devices/42/status` with payload `offline`.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "QoS 2 Is Not Always Worth It",
        content:
          "QoS 2 sounds like the safe default, but it costs four packets per delivery per hop and forces the broker to hold session state, which hurts badly on constrained devices and flaky links. Because the guarantee is per hop, a QoS 2 publish still does not give you exactly-once end to end once the broker-to-subscriber leg is involved. Reach for QoS 1 plus an idempotency key in the payload, or make the operation naturally idempotent, and reserve QoS 2 for the rare meters where a duplicate genuinely corrupts results. Also remember: a client that wants queued messages while offline must connect with a persistent session, otherwise the broker drops them.",
      },
      {
        type: "text",
        heading: "CoAP: MQTT's Request/Response Cousin",
        content:
          "MQTT is a broker-based pub/sub built on TCP; **CoAP** is a different fit for constrained networks. CoAP (RFC 7252) is a REST-like request/response protocol over **UDP**, modeled on HTTP with methods, URIs, and response codes, plus a reliable-ish layer for retransmission. It is designed for the same tiny devices and lossy links MQTT targets, but without a broker in the middle.\n\nIts **Observe** option adds a push mode: a client registers interest in a resource and the server notifies it on change, which is CoAP's answer to MQTT subscriptions. Many IoT deployments run CoAP at the edge to a gateway, and the gateway bridges to MQTT for the backend. Use CoAP when devices talk directly and the model is request/response; use MQTT when you want decoupled fan-out through a broker.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "MQTT is broker-based pub/sub: clients publish to topics and subscribe to filters, fully decoupled",
          "Topics are hierarchical and created on demand; + matches one level and # matches the rest (final only)",
          "QoS 0 is at most once, QoS 1 at least once, QoS 2 exactly once — and the guarantee is per hop",
          "Choose the lowest QoS your application tolerates; QoS 2 costs four packets per hop",
          "Retained messages give new subscribers the current value instantly; the last will advertises abnormal disconnects",
          "CoAP is the UDP request/response alternative with Observe; often bridged to MQTT at a gateway",
        ],
      },
    ],
    quiz: [
      {
        question: "In MQTT, what matches the subscription filter `home/+/temperature`?",
        options: [
          "home/kitchen/temperature only",
          "Any single level between home and temperature, such as home/kitchen/temperature but not home/a/b/temperature",
          "Every topic that starts with home",
          "home/temperature and home/kitchen/temperature",
        ],
        correctIndex: 1,
        explanation:
          "The single-level wildcard + matches exactly one topic level. So home/+/temperature matches home/kitchen/temperature but not home/a/b/temperature (too many levels) and not home/temperature (too few). The multi-level wildcard # is what matches an arbitrary depth.",
      },
      {
        question: "Which QoS level guarantees exactly-once delivery, and at what cost?",
        options: [
          "QoS 0, using a single packet",
          "QoS 1, using PUBLISH and PUBACK",
          "QoS 2, using a four-step handshake and extra broker state",
          "None of them guarantee exactly once",
        ],
        correctIndex: 2,
        explanation:
          "QoS 2 guarantees exactly once via PUBLISH, PUBREC, PUBREL, and PUBCOMP, which costs four packets per hop and requires the broker to track message IDs through the handshake. QoS 1 is at least once and can duplicate; QoS 0 can lose messages.",
      },
      {
        question: "A dashboard connects and immediately shows the latest sensor reading without waiting for the next publish. Which feature makes that possible?",
        options: [
          "A persistent session",
          "A retained message on the topic",
          "QoS 2",
          "The last will and testament",
        ],
        correctIndex: 1,
        explanation:
          "The broker stores one retained message per topic — the latest value — and delivers it immediately to any new subscriber. A persistent session queues messages for a known offline client, and the last will advertises an abnormal disconnect; neither fetches the current value on connect.",
      },
      {
        question: "Why must a client use a persistent session to receive messages published while it was offline?",
        options: [
          "QoS 2 requires it",
          "Otherwise the broker discards queued messages and subscriptions on disconnect",
          "Retained messages only work with persistent sessions",
          "Without it the client cannot use wildcards",
        ],
        correctIndex: 1,
        explanation:
          "With a non-persistent (clean) session, the broker drops the client's subscriptions and any queued messages the moment it disconnects. A persistent session keeps them, so messages sent during the outage are delivered when the client reconnects.",
      },
    ],
  },

  "ssh-sftp": {
    slug: "ssh-sftp",
    title: "SSH, SFTP & Secure Transfer",
    tagline: "Keys, tunnels, and moving files without losing the plot",
    sections: [
      {
        type: "text",
        heading: "SSH Is a Suite, Not a Command",
        content:
          "When people say 'ssh' they usually mean the OpenSSH command, but SSH is a family of protocols and tools sharing one secure transport: remote shells, file transfer via **SFTP** and the older **SCP**, **ssh-agent** for key management, port forwarding, and the sftp subsystem. The transport is built from layers.\n\nThe **transport layer** authenticates the server and negotiates encryption and integrity. The **user authentication layer** then proves who you are — by key, password, or certificate. The **connection layer** multiplexes independent channels over the one secure pipe: shell sessions, forwarded ports, and file transfers all coexist on a single connection.",
      },
      {
        type: "analogy",
        heading: "A Secure Courier With Mutual ID Checks",
        content:
          "SSH is a courier who arrives at a guarded building. Before handing over anything, the courier verifies the building is the genuine site and not a replica (host key verification). The guard then checks the courier's credentials (user authentication). Only once both sides trust each other does the courier walk the corridors and deliver.\n\nIf the courier has visited before, they remember the building's exact signature. A different signature on the second visit is a loud alarm — someone may have swapped the building — which is exactly what the host key change warning means.",
      },
      {
        type: "text",
        heading: "Key Exchange and Host Keys",
        content:
          "The handshake begins with a **key exchange** (KEX) that derives a shared session key without ever sending it over the wire — modern defaults use elliptic-curve Diffie-Hellman such as curve25519. Crucially, the server signs the exchange with its **host key**, proving it holds the private half of the identity the client expects.\n\nOn first connection a client has no stored host key, so it uses **trust on first use**: it records the key in `~/.ssh/known_hosts`. Every later connection compares against that record. A mismatch triggers the infamous WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED, which may mean a legitimate reinstall — or a man-in-the-middle. Verify the fingerprint out of band before clearing the entry.",
      },
      {
        type: "code",
        heading: "Inspecting and Managing Keys",
        language: "bash",
        label: "ssh-keys.sh",
        code: `# Watch the KEX, host-key verification, and auth as they happen
ssh -vvv user@host

# Print a server's host key fingerprint; compare it out of band, not by trusting the prompt
ssh-keyscan -t ed25519 host 2>/dev/null | ssh-keygen -lf -

# Generate a modern ed25519 key with a strong passphrase
ssh-keygen -t ed25519 -a 100 -C "ada@laptop" -f ~/.ssh/id_ed25519

# Install the public key on the server (never copy the private key)
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host`,
      },
      {
        type: "text",
        heading: "Authentication: Public Keys, Agents, and Certificates",
        content:
          "With **public key authentication** the client proves possession of a private key without transmitting it: the server challenges, the client signs, the server checks the signature against the matching public key in `authorized_keys`. The private key never leaves the client.\n\nA passphrase-protected key would be tedious to unlock constantly, so **ssh-agent** holds decrypted keys in memory and signs on your behalf. For fleets, **certificates** beat copy-pasting keys: a certificate authority signs user and host keys, servers trust the CA instead of individual `authorized_keys` files, and access is granted or revoked by issuing or expiring certificates. This is the model behind modern just-in-time access tools.",
      },
      {
        type: "comparison",
        heading: "scp vs sftp vs rsync",
        headers: ["scp", "sftp", "rsync"],
        rows: [
          {
            aspect: "Protocol",
            scp: "Legacy SCP over SSH (or SFTP in OpenSSH 9+)",
            sftp: "SFTP subsystem over SSH",
            rsync: "rsync algorithm over SSH by default",
          },
          {
            aspect: "Resumable transfers",
            scp: "No",
            sftp: "Yes, with reprocessing tools",
            rsync: "Yes, via partial and in-place options",
          },
          {
            aspect: "Delta sync",
            scp: "No, copies whole files",
            sftp: "No, copies whole files",
            rsync: "Yes, sends only changed blocks",
          },
          {
            aspect: "Remote globbing",
            scp: "Limited",
            sftp: "Interactive commands and globbing",
            rsync: "Rich include and exclude rules",
          },
          {
            aspect: "Speed on large trees",
            scp: "Slow, naive per-file copy",
            sftp: "Moderate",
            rsync: "Fastest when much is unchanged",
          },
          {
            aspect: "Best for",
            scp: "Quick one-off copies",
            sftp: "Interactive browsing and small uploads",
            rsync: "Backups and repeated syncs of large trees",
          },
        ],
      },
      {
        type: "text",
        heading: "Tunnels: Local, Remote, Dynamic",
        content:
          "SSH can forward TCP traffic inside its encrypted channel, turning it into a lightweight VPN for specific ports. There are three directions.\n\nA **local forward** (`-L`) opens a port on your machine that routes through the SSH server to a target reachable from it — the classic way to reach a private database without exposing it. A **remote forward** (`-R`) opens a port on the remote host that routes back to a target on your side, useful for exposing a local dev server. A **dynamic forward** (`-D`) turns SSH into a **SOCKS5 proxy**, letting applications route arbitrary connections through the server. All three encrypt traffic that would otherwise cross the network in the clear.",
      },
      {
        type: "code",
        heading: "Port Forwarding Patterns",
        language: "bash",
        label: "tunnels.sh",
        code: `# Local forward: reach a private database through a bastion
#   localhost:5432 -> (via bastion) -> db.internal:5432
ssh -N -L 5432:db.internal:5432 user@bastion.example.com

# Remote forward: expose your local dev server on the remote host
#   remotehost:9000 -> (back through SSH) -> localhost:3000
ssh -N -R 9000:localhost:3000 user@public.example.com

# Dynamic forward: a SOCKS5 proxy to point a browser or CLI at
ssh -N -D 1080 user@bastion.example.com

# Jump host: land a shell on an internal host without a manual tunnel
ssh -J user@bastion.example.com user@db.internal`,
      },
      {
        type: "text",
        heading: "Bastion Hosts and Jump Hosts",
        content:
          "Production systems should not be reachable directly from the internet. A **bastion host** (also called a jump host) is the single, hardened, audited entry point: users SSH to the bastion, then hop to internal machines that only accept connections from it. The attack surface shrinks to one well-monitored box.\n\nYou do not need a shell on the bastion to pass through it. `ssh -J user@bastion host.internal` uses the **ProxyJump** feature to chain connections transparently, and `~/.ssh/config` can bake it in with a `ProxyJump` directive per host. This keeps the bastion's job purely forwarding, avoids leaving your credentials on it, and records a clean audit trail of who connected where.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Agent Forwarding Is a Key-Leak Waiting to Happen",
        content:
          "Agent forwarding (`ssh -A`) exposes your local ssh-agent to the remote host so it can authenticate onward on your behalf. The danger is that anyone with root on that host — or anyone who compromises it — can use your agent to reach every other host your keys unlock, without ever touching your private key. On a shared or less-trusted box, never forward the agent. Prefer ProxyJump for hopping, and never copy private keys onto servers; only public keys belong there.",
      },
      {
        type: "steps",
        heading: "Hardening an SSH Server",
        steps: [
          {
            title: "Disable password authentication",
            detail:
              "Set PasswordAuthentication no so credentials cannot be brute-forced; rely on keys or certificates.",
          },
          {
            title: "Forbid direct root login",
            detail:
              "Set PermitRootLogin no and require an unprivileged account with privilege escalation when needed.",
          },
          {
            title: "Restrict who can connect",
            detail:
              "Use AllowUsers or AllowGroups, and limit which users may forward ports or open tunnels.",
          },
          {
            title: "Add rate limiting",
            detail:
              "Run fail2ban or an equivalent so repeated failed attempts are blocked at the firewall quickly.",
          },
          {
            title: "Protect the host keys",
            detail:
              "Keep private host keys readable only by the daemon and monitor for unexpected host key changes.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "SSH layers transport, user authentication, and multiplexed channels over one encrypted connection",
          "Host keys prevent man-in-the-middle attacks; verify a changed fingerprint out of band before trusting it",
          "Public key auth never transmits the private key; use certificates to manage access at fleet scale",
          "scp is a quick copy, sftp is interactive, rsync wins for repeated syncs via delta transfer",
          "Local, remote, and dynamic forwards give you targeted VPNs and a SOCKS proxy",
          "Route access through a bastion with ProxyJump, and never enable agent forwarding on untrusted hosts",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the purpose of the server's host key during the SSH handshake?",
        options: [
          "It encrypts the user's password",
          "It lets the client verify it is connecting to the genuine server, preventing man-in-the-middle attacks",
          "It signs the user's private key",
          "It compresses the file transfer",
        ],
        correctIndex: 1,
        explanation:
          "The host key proves the server's identity. The client records it on first connect and compares on every later connect, so a swapped or forged server triggers the host key changed warning — a possible man-in-the-middle.",
      },
      {
        question:
          "You repeatedly sync a large directory tree to a server and only a few files change each time. Which tool is the best fit?",
        options: [
          "scp, because it is the simplest",
          "sftp, because it runs over the SSH subsystem",
          "rsync, because it sends only changed blocks",
          "ssh -D, because it opens a proxy",
        ],
        correctIndex: 2,
        explanation:
          "rsync's delta algorithm compares source and destination and transfers only the changed blocks, making it far faster than scp or sftp for repeated syncs of large trees where little has changed.",
      },
      {
        question:
          "Why is `ssh -A` (agent forwarding) risky on an untrusted host?",
        options: [
          "It disables host key verification",
          "Anyone with root on that host can use your forwarded agent to authenticate to other hosts as you",
          "It writes your private key to the remote disk",
          "It forces password authentication",
        ],
        correctIndex: 1,
        explanation:
          "Agent forwarding exposes your local ssh-agent to the remote host. Root there can request signatures from it and reach any host your keys unlock — without ever copying your private key. Prefer ProxyJump, and never forward the agent to machines you do not fully trust.",
      },
      {
        question:
          "Which forward opens a local port that tunnels through the SSH server to a target reachable from that server?",
        options: [
          "-R, the remote forward",
          "-L, the local forward",
          "-D, the dynamic forward",
          "-J, the jump host",
        ],
        correctIndex: 1,
        explanation:
          "-L is the local forward: it listens on your machine and routes traffic through the SSH server to a target it can reach, ideal for reaching a private database. -R opens a port on the remote side, -D creates a SOCKS proxy, and -J chains a jump host.",
      },
    ],
  },

  "grpc-web": {
    slug: "grpc-web",
    title: "gRPC-Web & Connect",
    tagline: "Reaching gRPC from the browser without giving up streams",
    sections: [
      {
        type: "text",
        heading: "Why Browsers Cannot Speak Raw gRPC",
        content:
          "gRPC was designed for service-to-service calls over HTTP/2, and it leans on two features browsers do not expose to JavaScript. First, gRPC carries its status in HTTP/2 **trailers** — a header block sent after the response body — and the browser fetch and XHR APIs hide trailers entirely. Second, gRPC wants full control of the HTTP/2 frame stream, which browsers keep private.\n\nSo a browser cannot talk raw gRPC, no matter how capable the server is. The gap is not performance; it is access. That is why a translation layer exists between the browser and a gRPC server.",
      },
      {
        type: "analogy",
        heading: "A Translator for a Language the Browser Cannot Pronounce",
        content:
          "You and a colleague share a private shorthand that works perfectly in person, but the office phone system cannot carry it — wrong format, wrong equipment. So you speak the shorthand to a translator next to you, who relays it over the phone in a form the system understands, and translates the replies back.\n\nThat translator is the proxy. Behind it, the server keeps speaking pure gRPC to other services; in front of it, the browser sends something it can actually produce. The client and the backend still agree on the same protobuf contracts, so only the wire format changes, not the meaning.",
      },
      {
        type: "text",
        heading: "How gRPC-Web Bridges the Gap",
        content:
          "**gRPC-Web** defines a browser-friendly framing of gRPC. Messages are still length-prefixed protobuf, but a proxy translates between the browser's HTTP/1.1 or HTTP/2 request and a real gRPC call to the backend. Trailers, which the browser cannot see, are encoded into the response body as a special **trailer frame** that the client-side library parses.\n\nThere are two content modes: a binary mode that streams raw bytes, and a **grpc-web-text** mode that base64-encodes each frame so it survives transport layers that mangle binary. The generated JavaScript client and the protobuf definitions are identical in spirit to the server's, so there is one contract, not two.",
      },
      {
        type: "code",
        heading: "The Shared Protobuf Contract",
        language: "protobuf",
        label: "catalog.proto",
        code: `syntax = "proto3";

package catalog.v1;

service CatalogService {
  // Unary: one request, one response.
  rpc GetProduct (GetProductRequest) returns (Product);

  // Server streaming: one request, a stream of responses (supported in gRPC-Web).
  rpc ListProducts (ListProductsRequest) returns (stream Product);

  // Client streaming and bidi streaming are NOT supported over gRPC-Web.
}

message GetProductRequest { string id = 1; }
message ListProductsRequest { string category = 1; }

message Product {
  string id = 1;
  string name = 2;
  int64 price_cents = 3;
}`,
      },
      {
        type: "code",
        heading: "A Browser gRPC-Web Client",
        language: "typescript",
        label: "client.ts",
        code: `import { CatalogServiceClient } from "./gen/catalog_grpc_web_pb";
import { GetProductRequest, ListProductsRequest } from "./gen/catalog_pb";

// The proxy origin, not the raw gRPC server.
const client = new CatalogServiceClient("https://api.example.com", null, null);

// Unary call: request, metadata, callback.
const req = new GetProductRequest();
req.setId("sku-42");

client.getProduct(req, {}, (err, res) => {
  if (err) return console.error(err.code, err.message);
  console.log(res.getName(), res.getPriceCents());
});

// Server streaming: the call returns a stream you read with events.
const listReq = new ListProductsRequest();
listReq.setCategory("books");

const stream = client.listProducts(listReq, {});
stream.on("data", (product) => console.log(product.getName()));
stream.on("status", (status) => console.log("trailing status", status.code));
stream.on("end", () => console.log("stream complete"));`,
      },
      {
        type: "text",
        heading: "The Envoy Proxy Path",
        content:
          "The most common deployment puts **Envoy** in front of the gRPC backend. Envoy's gRPC-Web filter understands both the browser framing and native gRPC, translates between them, and terminates the browser's HTTP/1.1 or HTTP/2 connection while opening a fresh HTTP/2 gRPC connection upstream.\n\nAlternatives exist — the grpc-web Go proxy, nginx with its gRPC module — but Envoy is the reference implementation and pairs naturally with service meshes, where the same proxy already handles routing, TLS termination, retries, timeouts, and observability. That means the translation layer is one config change rather than another service to operate.",
      },
      {
        type: "comparison",
        heading: "gRPC-Web vs Connect vs REST/JSON",
        headers: ["gRPC-Web", "Connect", "REST/JSON"],
        rows: [
          {
            aspect: "Browser transport",
            "gRPC-Web": "HTTP/1.1 or HTTP/2 with a proxy",
            Connect: "HTTP/1.1 or HTTP/2, no proxy needed",
            "REST/JSON": "HTTP/1.1 or HTTP/2 natively",
          },
          {
            aspect: "Proxy required",
            "gRPC-Web": "Yes, for example Envoy or the Go proxy",
            Connect: "No, servers speak it directly",
            "REST/JSON": "No",
          },
          {
            aspect: "Browser streaming",
            "gRPC-Web": "Unary and server streaming only",
            Connect: "Unary, server streaming, and bidi over HTTP/2",
            "REST/JSON": "Manual, via SSE or chunked responses",
          },
          {
            aspect: "Payload",
            "gRPC-Web": "Length-prefixed protobuf (binary or base64)",
            Connect: "Protobuf (binary) or JSON, your choice",
            "REST/JSON": "JSON",
          },
          {
            aspect: "Status handling",
            "gRPC-Web": "Trailers encoded as a trailer frame in the body",
            Connect: "Status carried in headers and trailers",
            "REST/JSON": "HTTP status codes",
          },
          {
            aspect: "Schema",
            "gRPC-Web": "Protobuf, shared with the server",
            Connect: "Protobuf, shared with the server",
            "REST/JSON": "Often informal or OpenAPI",
          },
          {
            aspect: "Best for",
            "gRPC-Web": "Existing gRPC backends needing a browser client",
            Connect: "New projects wanting browser streaming without a proxy",
            "REST/JSON": "Public APIs and simple integrations",
          },
        ],
      },
      {
        type: "text",
        heading: "Streaming Constraints: Unary and Server Streaming Only",
        content:
          "gRPC-Web supports **unary** calls and **server streaming**. What it cannot do is **client streaming** or **bidirectional streaming**, because the browser API it relies on cannot half-close a request stream: once the browser sends its body, the request is done, and there is no reliable way to keep pushing more messages up the same call.\n\nThat restriction is the single biggest reason teams consider **Connect**, the protocol set from the same authors behind the Buf tooling. Connect servers speak three protocols at once — Connect, gRPC, and gRPC-Web — from one handler, so a browser can call them directly over ordinary HTTP with **no proxy**, and bidirectional streaming works over HTTP/2 using streaming fetch. You keep protobuf contracts and add browser reach without operating a translation tier.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "One Handler, Three Protocols",
        content:
          "Connect's appeal is that it is not a new API style to learn so much as a resolution of the browser-versus-gRPC friction. You write a normal gRPC-style handler against a protobuf service, and the server exposes it over the Connect protocol, native gRPC, and gRPC-Web simultaneously. gRPC clients keep using gRPC, browsers use Connect or gRPC-Web, and you avoid deploying and tuning a separate proxy. The Connect protocol itself is deliberately plain: an HTTP POST with a protobuf or JSON body, status in headers, and streaming where the transport allows it.",
      },
      {
        type: "steps",
        heading: "Wiring a Browser gRPC Client",
        steps: [
          {
            title: "Share the protobuf contract",
            detail:
              "Keep one .proto as the source of truth and generate both server stubs and browser client code from it.",
          },
          {
            title: "Pick the bridge",
            detail:
              "Use gRPC-Web with a proxy, or a Connect server that speaks gRPC, gRPC-Web, and Connect without one.",
          },
          {
            title: "Expose the right transport",
            detail:
              "Terminate TLS, allow the needed HTTP/2 settings, and for gRPC-Web route browser traffic through the proxy.",
          },
          {
            title: "Handle the browser call",
            detail:
              "Instantiate the generated client against the proxy origin, then use callbacks for unary and stream events for server streaming.",
          },
          {
            title: "Verify streaming scope",
            detail:
              "Confirm you only rely on unary and server streaming; move to bidi-aware transport if client or bidirectional streams are required.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Browsers cannot speak raw gRPC because they hide HTTP/2 trailers and frame control",
          "gRPC-Web uses a proxy to translate and encodes trailers into a trailer frame in the body",
          "gRPC-Web supports unary and server streaming, but never client or bidirectional streaming",
          "Envoy's gRPC-Web filter is the reference translation layer and slots into a service mesh",
          "Connect serves gRPC, gRPC-Web, and Connect from one handler with no proxy, and allows bidi over HTTP/2",
          "Keep a single protobuf contract and generate both server stubs and browser clients from it",
        ],
      },
    ],
    quiz: [
      {
        question: "Why can't a browser call a raw gRPC service directly?",
        options: [
          "gRPC requires a special port the browser blocks",
          "The browser APIs (fetch and XHR) do not expose HTTP/2 trailers, which gRPC needs for its status",
          "gRPC only works over UDP",
          "Browsers cannot use protobuf",
        ],
        correctIndex: 1,
        explanation:
          "gRPC sends its final status in HTTP/2 trailers, and the browser fetch and XHR APIs hide trailers from JavaScript and do not expose raw HTTP/2 frames. A proxy translates gRPC into a form the browser can send and parse.",
      },
      {
        question: "Which streaming patterns does gRPC-Web support in the browser?",
        options: [
          "All four: unary, server, client, and bidirectional streaming",
          "Unary and server streaming only",
          "Client and bidirectional streaming only",
          "No streaming at all",
        ],
        correctIndex: 1,
        explanation:
          "gRPC-Web supports unary calls and server streaming. It cannot do client streaming or bidirectional streaming because the browser cannot reliably half-close and keep streaming the request body on the same call.",
      },
      {
        question:
          "What advantage does Connect offer over gRPC-Web for a browser client?",
        options: [
          "It removes the need for protobuf",
          "A single server handler speaks gRPC, gRPC-Web, and Connect, so no separate proxy is needed and bidi works over HTTP/2",
          "It replaces HTTP with a custom transport",
          "It only works with JSON payloads",
        ],
        correctIndex: 1,
        explanation:
          "A Connect server exposes one protobuf handler over three protocols at once. Browsers can call it directly over ordinary HTTP without a dedicated proxy, and bidirectional streaming works over HTTP/2, resolving the two main limits of gRPC-Web.",
      },
      {
        question: "Where does gRPC-Web put the trailer information the browser cannot natively read?",
        options: [
          "It discards it and relies on HTTP status codes",
          "It encodes it as a trailer frame in the response body, which the client library parses",
          "It sends it through a second connection",
          "It stores it in a cookie",
        ],
        correctIndex: 1,
        explanation:
          "Because the browser cannot see HTTP/2 trailers, the proxy emits the gRPC status as a length-prefixed trailer frame at the end of the response body. The gRPC-Web client library reads that frame to surface the final status.",
      },
    ],
  },
};
