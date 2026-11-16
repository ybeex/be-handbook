// Gap content: Security — application security and compliance
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_SEC_APP: Record<string, TopicContent> = {
  // ─── APPLICATION SECURITY ───────────────────────────────────────────────

  "web-vulnerabilities": {
    slug: "web-vulnerabilities",
    title: "Web Vulnerability Deep Dive",
    tagline: "The OWASP Top 10 as one root cause: data treated as code",
    sections: [
      {
        type: "text",
        heading: "One Root Cause Under Most Web Bugs",
        content:
          "The OWASP Top 10 changes order every few years — A01 Broken Access Control and A03 Injection currently lead — but a surprising share of web vulnerabilities share one root cause: **untrusted input crossing a trust boundary into an interpreter that cannot tell data from instructions**.\n\nThe interpreter varies — the SQL engine, the browser DOM, the OS shell, the XML parser, a template engine, the filesystem — but the bug is the same. The attacker arranges for their data to be parsed as code. Every defense in this topic is a way of separating data from code, or of removing the interpreter entirely.",
      },
      {
        type: "analogy",
        heading: "Words Versus Commands",
        content:
          "Say \"delete all orders\" to a colleague and it is just a sentence — data. Type the same words into a database prompt and it is an instruction that drops your table. Nothing about the characters changed; only the interpreter did.\n\nInjection is what happens when a program hands user text to a component that reads some of it as instructions. The fix is always the same idea: mark unambiguously where the data starts and stops. Parameterized queries, output encoding, and argument arrays are all ways of drawing that line so the interpreter treats input as inert content.",
      },
      {
        type: "text",
        heading: "SQL Injection (and Command Injection)",
        content:
          "The classic bug concatenates input into a query string: `SELECT * FROM users WHERE email = '$email'`. An attacker supplies `' OR '1'='1`, which returns every row, or `'; DROP TABLE users;--` to destroy data. Login handlers are the juiciest target: `' OR 1=1--` authenticates as the first user without a password.\n\n**Command injection** is the same shape at the OS boundary — `exec(\"ping \" + host)` where `host` is `; rm -rf /`. The fixes are identical: never build a command or query by string concatenation. Use **parameterized queries** so the driver ships query and data separately, pass arrays to process spawn APIs (never a shell string), and run everything as a least-privilege principal so a breach cannot `DROP` or read the whole disk.",
      },
      {
        type: "code",
        heading: "Parameterized Queries Kill SQL Injection",
        language: "typescript",
        label: "parameterized.ts",
        code: `// WRONG: user input becomes part of the SQL grammar.
// ' OR '1'='1' turns this into a query that returns everyone.
const bad = await db.query(
  "SELECT id, role FROM users WHERE email = '" + email + "'",
);

// RIGHT: the driver sends the query text and the value separately.
// The value can never be parsed as SQL, whatever it contains.
const { rows } = await db.query(
  "SELECT id, role FROM users WHERE email = $1",
  [email],
);

// Same principle for shells: pass an argument array, never a string.
import { execFile } from "node:child_process";
execFile("ping", ["-c", "1", "--", host]); // host is an argument, not shell syntax`,
      },
      {
        type: "text",
        heading: "Cross-Site Scripting (XSS)",
        content:
          "XSS is injection where the interpreter is the **victim's browser**: the page is a program, and attacker-controlled markup runs inside your origin with the victim's session. There are three flavours. **Stored XSS** persists in your database (a comment, a display name) and fires for everyone who views it — the highest impact. **Reflected XSS** echoes input from the request straight into the response. **DOM XSS** never touches the server: client code writes untrusted data into `innerHTML` or `eval`.\n\nThe consequence is session theft (exfiltrating cookies or tokens), keylogging, and full account takeover in the victim's context. The fix is **context-aware output encoding at the sink** — encode for HTML body, attribute, JavaScript, and URL contexts differently — plus a Content Security Policy with nonces, `HttpOnly` cookies, and frameworks that escape by default. React escapes interpolation for you; the danger is the escape hatches (`dangerouslySetInnerHTML`, `v-html`).",
      },
      {
        type: "comparison",
        heading: "SQL Injection vs XSS",
        headers: ["SQL Injection", "XSS"],
        rows: [
          {
            aspect: "Interpreter reached",
            "SQL Injection": "The database's SQL engine",
            XSS: "The victim's browser (HTML/JS engine)",
          },
          {
            aspect: "Trust boundary crossed",
            "SQL Injection": "Application to database",
            XSS: "Application to the victim's browser origin",
          },
          {
            aspect: "What the attacker runs",
            "SQL Injection": "Arbitrary SQL statements",
            XSS: "Arbitrary JavaScript in the victim's session",
          },
          {
            aspect: "Primary impact",
            "SQL Injection": "Data theft, tampering, authentication bypass",
            XSS: "Session theft, credential phishing, defacement",
          },
          {
            aspect: "Who is harmed",
            "SQL Injection": "The application's data and all users",
            XSS: "Each victim who loads the affected page",
          },
          {
            aspect: "Primary defense",
            "SQL Injection": "Parameterized queries",
            XSS: "Context-aware output encoding plus a nonce CSP",
          },
        ],
      },
      {
        type: "text",
        heading: "SSRF: Abusing the Server's Network Position",
        content:
          "**Server-Side Request Forgery** makes your server fetch a URL the attacker chose. Because the request originates from inside your network, it can reach things the attacker cannot: internal admin panels, Redis, Elasticsearch, and — most damaging — the **cloud metadata endpoint** at `169.254.169.254`, which can hand back IAM credentials.\n\nThe 2019 **Capital One** breach (100M+ records) chained a misconfigured WAF with SSRF to read metadata and assume a role. Mitigations: an **egress allow-list** of hostnames and schemes, resolving DNS and rejecting link-local and private ranges, requiring **IMDSv2** (token-based, hop-limited) instead of IMDSv1, and never following redirects blindly — a redirect can hop from an allowed host to an internal one.",
      },
      {
        type: "code",
        heading: "An SSRF Guard with an Allow-List",
        language: "typescript",
        label: "ssrf-guard.ts",
        code: `import dns from "node:dns";
import { isIP } from "node:net";

const ALLOWED_HOSTS = new Set(["api.stripe.com", "hooks.slack.com"]);

function isPrivate(addr: string): boolean {
  // 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 (metadata), fc00::/7
  return /^(10\\.|127\\.|169\\.254\\.|192\\.168\\.|172\\.(1[6-9]|2\\d|3[01])\\.)/.test(addr);
}

export async function safeFetch(rawUrl: string): Promise<Response> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("https only");
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error("host not allowed");

  // Resolve AFTER validating the name, then pin the IP to defeat DNS rebinding.
  const { address } = await dns.promises.lookup(url.hostname);
  if (isIP(address) && isPrivate(address)) throw new Error("private address");

  // redirect: "manual" - never let a 302 walk the request to an internal host.
  return fetch(url, { redirect: "manual" });
}`,
      },
      {
        type: "text",
        heading: "IDOR / BOLA: Missing Object-Level Checks",
        content:
          "**Insecure Direct Object Reference** — called **Broken Object Level Authorization (BOLA)** in the OWASP API Top 10, where it is the number-one issue — is not an injection at all. The handler checks *is the user logged in?* but never *does this user own object 1042?*. So `GET /api/invoices/1042` returns someone else's invoice to any authenticated user.\n\nSequential integer ids make enumeration trivial: change one digit and you have a stranger's data. The control is to **authorize every access against the calling principal** in a single policy layer (not ad hoc per handler), and use unguessable ids (UUIDv4, ULID) only as defense in depth — never as the control itself.",
      },
      {
        type: "text",
        heading: "Deserialization, XXE, SSTI, and Path Traversal",
        content:
          "Four more interpreters, four more ways data becomes code.\n\n**Insecure deserialization**: native formats — Java `ObjectInputStream`, Python `pickle`, PHP `unserialize`, Ruby `Marshal` — can instantiate arbitrary classes on load, so an attacker assembles a **gadget chain** offline (the `ysoserial` toolkit automates it) and the server executes it. **XXE (XML External Entity)**: an XML parser that resolves external entities can read local files or perform SSRF via `<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>`, and the \"billion laughs\" expansion is a denial-of-service. **SSTI (Server-Side Template Injection)**: rendering user input *as a template* lets `{{7*7}}` evaluate to 49 in Jinja2 and escalates to RCE. **Path traversal**: `../../../etc/passwd` (often encoded as `%2e%2e%2f`) escapes an intended directory.\n\nThe fixes are structural: disable native deserialization and use JSON with a strict schema; disable DTDs and external entities in every XML parser; never render user input through a template engine; and for paths, **canonicalize to an absolute path and confirm it stays inside the intended root** rather than stripping `..`.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Untrusted Data in These Interpreters Is Remote Code Execution",
        content:
          "Native deserialization and SSTI are not data-leak bugs — they hand the attacker code execution on your server. Java's `ObjectInputStream`, Python's `pickle`, PHP's `unserialize`, and Ruby's `Marshal` will happily run gadget chains an attacker assembled offline, and a template engine will evaluate attacker-supplied expressions. Treat any endpoint that feeds untrusted input to these as equivalent to RCE. Input validation does not save you; the fix is to remove the interpreter from the path — use JSON with an explicit schema, and never render user input as a template.",
      },
      {
        type: "steps",
        heading: "A Defense-in-Depth Pass",
        steps: [
          {
            title: "Parameterize every query",
            detail:
              "No string-built SQL anywhere, including throwaway reporting scripts and admin tools.",
          },
          {
            title: "Encode at the output sink",
            detail:
              "Context-aware encoding for HTML, attribute, JS, and URL, backed by a strict nonce-based CSP.",
          },
          {
            title: "Authorize every object",
            detail:
              "Check ownership in one policy layer so a handler cannot forget it; ids are not access control.",
          },
          {
            title: "Constrain egress",
            detail:
              "Allow-list outbound destinations, block link-local and private ranges, require IMDSv2.",
          },
          {
            title: "Remove dangerous interpreters",
            detail:
              "No native deserialization, no external XML entities, no user input as a template.",
          },
          {
            title: "Canonicalize file paths",
            detail:
              "Resolve to an absolute path and confirm it stays inside the intended root directory.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Most web bugs are one class: untrusted data reaching an interpreter as code",
          "Parameterized queries make SQL injection structurally impossible; concatenation makes it inevitable",
          "Encode at the output sink for the correct context, and add a nonce-based CSP",
          "SSRF exploits the server's network position — allow-list egress, block 169.254.169.254, use IMDSv2",
          "IDOR/BOLA is a missing authorization check, not an id-format problem — authorize every object access",
          "Native deserialization, XXE, and SSTI are effectively RCE — disable the interpreter, do not filter input",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which change makes SQL injection structurally impossible rather than merely harder?",
        options: [
          "Escaping single quotes in every input string",
          "Wrapping all queries in a transaction",
          "Parameterized queries that send the query text and the data separately",
          "Running the database on a private subnet",
        ],
        correctIndex: 2,
        explanation:
          "Parameterized queries transmit the statement and the values over separate channels, so a value can never be parsed as SQL regardless of its content. Escaping is error-prone and context-dependent, transactions do not change parsing, and network placement does not stop injection.",
      },
      {
        question:
          "An attacker makes your server issue a request to 169.254.169.254 to harvest IAM credentials. Which vulnerability class is this?",
        options: [
          "Server-Side Request Forgery (SSRF)",
          "Stored Cross-Site Scripting",
          "Cross-Site Request Forgery",
          "Insecure Direct Object Reference",
        ],
        correctIndex: 0,
        explanation:
          "SSRF abuses the server's network position to reach destinations the attacker cannot. The cloud metadata endpoint is the canonical target because it can return instance credentials. The fix combines an egress allow-list, blocking link-local ranges, and requiring IMDSv2.",
      },
      {
        question:
          "A handler returns invoice 1042 to any authenticated user, even one who does not own it. What is this?",
        options: [
          "SQL injection",
          "Broken object-level authorization (IDOR/BOLA)",
          "XML external entity injection",
          "Server-side template injection",
        ],
        correctIndex: 1,
        explanation:
          "The handler authenticates the caller but never authorizes access to the specific object, so any logged-in user can read others' records by changing the id. The control is an explicit ownership check in a central policy layer, not merely making ids unguessable.",
      },
      {
        question:
          "What is the correct structural fix for an endpoint that deserializes untrusted native objects?",
        options: [
          "Reject payloads containing script tags",
          "Attach a checksum to the serialized blob",
          "Stop deserializing untrusted data natively; use JSON with a strict schema",
          "Run the deserializer as a low-privilege user",
        ],
        correctIndex: 2,
        explanation:
          "Native deserialization can instantiate classes and execute gadget chains on load, so filtering or checksums do not help and low privilege still permits code execution. Removing the dangerous interpreter and parsing untrusted input as schema-validated JSON eliminates the primitive.",
      },
    ],
  },

  "supply-chain-security": {
    slug: "supply-chain-security",
    title: "Software Supply Chain Security",
    tagline: "You do not write the code you ship — verify it instead",
    sections: [
      {
        type: "text",
        heading: "You Ship Code You Never Wrote",
        content:
          "A modern application is mostly other people's code. A typical Node service pulls in hundreds of direct and transitive packages, and a container image layers hundreds of OS packages on top. The 2020 **SolarWinds** compromise injected the SUNBURST backdoor through the Orion build pipeline itself, and the 2024 **xz-utils** backdoor (CVE-2024-3094) was slipped into a compression library by a patient maintainer.\n\nThe lesson is uncomfortable: the cheapest path into your environment is often a **dependency**, not your own source. Supply-chain security is the discipline of knowing what you ship, where it came from, and whether it is exactly what it claims to be.",
      },
      {
        type: "analogy",
        heading: "The Restaurant Kitchen",
        content:
          "You are the chef, but you buy flour, oil, and spices from dozens of suppliers you have never met. One contaminated batch ends up in every dish on the menu. Without an ingredient list you cannot even tell which dishes are affected when a recall is announced.\n\nSupply-chain security is the kitchen's answer: an **ingredient list** (SBOM), **supplier provenance** (which farm, which process), and a **verified seal** (a signature) checked at the door before anything reaches the pass.",
      },
      {
        type: "text",
        heading: "SBOM: The Ingredient List",
        content:
          "A **Software Bill of Materials** is a machine-readable inventory of every component and version in an artifact. The two dominant formats are **SPDX** (Linux Foundation) and **CycloneDX** (OWASP, security-oriented). You generate them at build time with tools such as `syft` or `cdxgen` and store the SBOM alongside the artifact.\n\nThe value is speed under pressure. When Log4Shell broke, the question every team had to answer was \"do we ship log4j, and which version?\" An SBOM turns that week-long audit into a single query. US Executive Order 14028 pushed SBOMs toward being a baseline expectation for federal software.",
      },
      {
        type: "code",
        heading: "A CycloneDX SBOM Snippet",
        language: "json",
        label: "sbom.cdx.json",
        code: `{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "metadata": {
    "component": { "type": "application", "name": "acme-api", "version": "3.4.1" }
  },
  "components": [
    {
      "type": "library",
      "name": "log4j-core",
      "version": "2.14.1",
      "purl": "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
      "hashes": [
        { "alg": "SHA-256", "content": "8b6c1e2f0a4d9c3b7e5a1f0d2c4b6a8e0f1d3c5b7a9e1f3d5c7b9a1e3f5d7c9b" }
      ],
      "licenses": [{ "license": { "id": "Apache-2.0" } }]
    }
  ]
}`,
      },
      {
        type: "text",
        heading: "Dependency Confusion",
        content:
          "In 2021 security researcher **Alex Birsan** compromised over 35 companies — including Apple, Microsoft, and PayPal — without touching their source. The trick was **dependency confusion**: many organizations run internal packages with names that are not reserved on public registries, and build tools that merge a private and a public registry resolve the **highest version** across both.\n\nBirsan published public packages matching internal names with a high version number, so CI quietly installed the public (attacker) version instead of the internal one, running his code inside the build. The fixes are straightforward: **scope every internal package** (`@acme/billing`), pin the registry per scope so a public registry can never shadow an internal name, and reserve your internal names publicly as a defensive measure.",
      },
      {
        type: "text",
        heading: "Typosquatting and Maintainer Hijacks",
        content:
          "Two low-effort attacks dominate malicious-package incidents. **Typosquatting** registers names one keystroke from a popular package — `crossenv` versus `cross-env`, `lodahs` versus `lodash` — betting developers will mistype or copy the wrong name. **Maintainer hijacking** takes over a real package: in 2018 the `event-stream` maintainer handed publishing rights to a new contributor, who added `flatmap-stream`, a payload aimed at the Copay cryptocurrency wallet.\n\nThere is also plain **sabotage**: in 2022 the author of `colors` and `faker` shipped versions that printed garbage and looped infinitely as a protest, breaking thousands of downstream builds. The takeaway: popularity is not a safety signal. Review the diff before a version bump, prefer fewer dependencies, and let scanners flag known-malicious packages.",
      },
      {
        type: "comparison",
        heading: "Dependency Confusion vs Typosquatting",
        headers: ["Dependency Confusion", "Typosquatting"],
        rows: [
          {
            aspect: "Attacker's lever",
            "Dependency Confusion": "Name collision between private and public registries",
            Typosquatting: "Name similarity to a trusted, popular package",
          },
          {
            aspect: "Who is targeted",
            "Dependency Confusion": "Organizations relying on internal packages",
            Typosquatting: "Developers in general, at broad scale",
          },
          {
            aspect: "Delivery vector",
            "Dependency Confusion": "Build resolves the higher public version over the internal one",
            Typosquatting: "A human types or pastes the wrong package name",
          },
          {
            aspect: "Detection",
            "Dependency Confusion": "Registry allow-listing, scoped package names",
            Typosquatting: "Exact-name review, similarity scanning of manifests",
          },
          {
            aspect: "Notable example",
            "Dependency Confusion": "Birsan 2021 (Apple, Microsoft, PayPal)",
            Typosquatting: "crossenv 2017, event-stream 2018",
          },
          {
            aspect: "Primary fix",
            "Dependency Confusion": "Pin a registry per scope; reserve internal names",
            Typosquatting: "Verify exact names; lockfile and manifest review",
          },
        ],
      },
      {
        type: "text",
        heading: "SLSA: A Maturity Ladder for Builds",
        content:
          "**SLSA** (Supply-chain Levels for Software Artifacts, \"salsa\") defines build levels that increase confidence that an artifact was produced from the reviewed source, without tampering. At the lower levels the build is documented and generates **provenance** — a signed statement of who built what, from which source, with which steps. Higher levels require a **hosted, isolated build service** and, at the top, a hardened, non-falsifiable platform that signs the provenance itself, plus hermetic and reproducible builds.\n\nThe conceptual shift is important: SLSA moves trust from *the developer's laptop* to *a verifiable platform*. Instead of \"trust me, I built it\", you get a signed attestation a verifier can check automatically.",
      },
      {
        type: "text",
        heading: "Sigstore and cosign: Keyless Signing",
        content:
          "**Sigstore** is an open signing infrastructure with three parts: **Fulcio**, a certificate authority issuing short-lived certificates bound to an OIDC identity; **Rekor**, an append-only transparency log; and **cosign**, the signing and verification client. The \"keyless\" flow means you never manage long-lived private keys — your CI job's OIDC token proves who you are, and Fulcio mints a certificate valid for minutes.\n\nYou sign container images, SBOMs, and attestations, and at verification you **pin the identity and the issuer**, not merely \"a signature is present\". Anything signed is recorded in Rekor, so signatures are auditable and cannot be quietly forged.",
      },
      {
        type: "code",
        heading: "Sign and Verify with cosign",
        language: "bash",
        label: "cosign.sh",
        code: `# Sign the image keylessly, bound to the CI job's OIDC identity.
cosign sign --yes ghcr.io/acme/api@sha256:9f2a1c41

# Verify pins the exact workflow identity and issuer, not just "some key".
cosign verify ghcr.io/acme/api@sha256:9f2a1c41 \\
  --certificate-identity \\
    "https://github.com/acme/api/.github/workflows/release.yml@refs/heads/main" \\
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"

# Verify a signed SBOM attestation attached to the same digest.
cosign verify-attestation --type cyclonedx \\
  --certificate-identity-regexp "https://github.com/acme/api/.*" \\
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \\
  ghcr.io/acme/api@sha256:9f2a1c41`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "A Lockfile Proves Consistency, Not Trust",
        content:
          "A lockfile pins exact versions and integrity hashes so every install resolves to the same bytes — it guarantees reproducibility and protects against version drift. It says nothing about whether those bytes are safe. If the pinned version is malicious, you faithfully reinstall the malware on every build, forever, with the same hash. Lockfiles belong in the toolkit, but they must be paired with provenance verification, signature checks, and human review of version bumps.",
      },
      {
        type: "steps",
        heading: "Hardening the Supply Chain",
        steps: [
          {
            title: "Inventory",
            detail:
              "Generate an SBOM for every build and store it with the artifact so impact queries are instant.",
          },
          {
            title: "Pin",
            detail:
              "Commit lockfiles, use exact versions, and configure a registry allow-list per package scope.",
          },
          {
            title: "Isolate the build",
            detail:
              "Build in an ephemeral, hosted, least-privilege runner with no long-lived cloud credentials.",
          },
          {
            title: "Sign and verify",
            detail:
              "Sign artifacts with cosign and enforce verification at deploy time via admission control.",
          },
          {
            title: "Attest provenance",
            detail:
              "Reach SLSA L2/L3 so the build platform, not the developer, signs the provenance.",
          },
          {
            title: "Monitor continuously",
            detail:
              "Subscribe to advisories and scan on every build with Dependabot, Renovate, or Grype.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Most of your attack surface is transitive dependencies you never reviewed",
          "An SBOM turns \"are we affected?\" from a week-long audit into a single query",
          "Dependency confusion exploits name collisions — scope internal names and pin registries per scope",
          "Typosquatting and maintainer hijacks mean popularity is not safety; review the diff",
          "SLSA replaces trust in a person with verifiable trust in a build platform's provenance",
          "Sigstore/cosign gives keyless signing; verify the identity and issuer, not merely that a signature exists",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What does an attacker exploit in a dependency-confusion attack?",
        options: [
          "A package name that collides between a private and a public registry, where the higher public version is chosen",
          "A flaw in the package's cryptographic hash",
          "A tampered TLS certificate on the registry",
          "A stale lockfile that omits integrity hashes",
        ],
        correctIndex: 0,
        explanation:
          "Dependency confusion relies on build tools that consult both a private and a public registry and pick the highest version: the attacker publishes a public package matching an internal name with an inflated version so CI installs it. Scoping internal names and pinning registries per scope removes the collision.",
      },
      {
        question:
          "Which format is a security-focused SBOM standard?",
        options: ["SLSA", "CycloneDX", "SARIF", "SPIFFE"],
        correctIndex: 1,
        explanation:
          "CycloneDX (from OWASP) and SPDX are the two dominant SBOM formats, with CycloneDX oriented toward security use cases. SLSA is a build-provenance maturity framework, SARIF is a static-analysis results format, and SPIFFE is a workload-identity standard.",
      },
      {
        question:
          "What does a lockfile with integrity hashes guarantee?",
        options: [
          "That the pinned packages are free of malware",
          "That the packages were built by a trusted platform",
          "That every install resolves to identical bytes, not that those bytes are safe",
          "That no transitive dependencies are included",
        ],
        correctIndex: 2,
        explanation:
          "A lockfile pins versions and hashes for reproducibility, so all environments install the same bytes. It makes no claim about the trustworthiness of those bytes; if the pinned version is malicious you reinstall it deterministically on every build.",
      },
      {
        question:
          "In cosign keyless signing, where does the signer's identity come from?",
        options: [
          "A long-lived private key stored in the repository",
          "An OIDC identity that Fulcio binds to a short-lived certificate",
          "A shared secret distributed to the build agents",
          "The container image's digest alone",
        ],
        correctIndex: 1,
        explanation:
          "The keyless flow uses the workload's OIDC identity: Fulcio issues a short-lived certificate bound to that identity, and the signature is logged in Rekor. Verification then pins the expected identity and issuer, eliminating long-lived signing keys.",
      },
    ],
  },

  // ─── EDGE & NETWORK DEFENSE ─────────────────────────────────────────────

  "waf-ddos": {
    slug: "waf-ddos",
    title: "WAF, DDoS & Bot Mitigation",
    tagline: "Know the layer under attack before choosing the control",
    sections: [
      {
        type: "text",
        heading: "Attack Layers: L3, L4, and L7",
        content:
          "Denial-of-service attacks are usually described by the OSI layer they target. **Layer 3** is the network (IP): floods of packets that saturate links. **Layer 4** is the transport (TCP/UDP): floods that exhaust connection state. **Layer 7** is the application (HTTP): requests that look legitimate but consume CPU, memory, or database connections.\n\nThe first question in any incident is **which layer is saturated**, because the controls do not overlap. Bandwidth exhaustion is solved with capacity and scrubbing; application exhaustion is solved with rate limiting, caching, and bot scoring. Applying the wrong control wastes the incident window.",
      },
      {
        type: "analogy",
        heading: "The Road to the Restaurant",
        content:
          "An L3/L4 attack floods the highway so nobody can reach the restaurant at all — the fix is more roads and traffic control, not better cooking. An L7 attack instead sends thousands of people who each order a seven-course tasting menu, exhausting the kitchen while every request looks like a normal customer.\n\nHighway flooding is answered with capacity (more lanes, scrubbing centers); kitchen exhaustion needs a host who notices a table ordering absurdly (rate limiting) and a doorman who spots known troublemakers (bot scoring).",
      },
      {
        type: "text",
        heading: "Volumetric, Protocol, and Application Attacks",
        content:
          "Three families recur. **Volumetric** attacks flood bandwidth using UDP floods and reflection/amplification — spoofed requests to DNS, NTP, or memcached servers that reply with far larger responses (memcached amplification reached roughly 51,000x). The 2016 **Mirai** botnet of IoT devices hit Dyn and disrupted much of the internet at around 1.2 Tbps.\n\n**Protocol** attacks (SYN floods, malformed packets) exhaust connection tables and state rather than raw bandwidth. **Application** attacks send valid-looking HTTP — a flood of expensive searches, `slowloris` holding connections open, or credential stuffing — to exhaust the origin. Each family maps to a different mitigation.",
      },
      {
        type: "comparison",
        heading: "Volumetric (L3/L4) vs Application (L7)",
        headers: ["Volumetric (L3/L4)", "Application (L7)"],
        rows: [
          {
            aspect: "Goal",
            "Volumetric (L3/L4)": "Exhaust bandwidth or packet-processing capacity",
            "Application (L7)": "Exhaust CPU, memory, or database connections",
          },
          {
            aspect: "Traffic appearance",
            "Volumetric (L3/L4)": "Obvious floods and malformed packets",
            "Application (L7)": "Well-formed HTTP that mimics real users",
          },
          {
            aspect: "Measurement",
            "Volumetric (L3/L4)": "Bits per second and packets per second",
            "Application (L7)": "Requests per second and concurrent connections",
          },
          {
            aspect: "Primary defense",
            "Volumetric (L3/L4)": "Anycast absorption, scrubbing centers, CDN capacity",
            "Application (L7)": "WAF rules, rate limiting, bot scoring, caching",
          },
          {
            aspect: "Notable example",
            "Volumetric (L3/L4)": "Mirai/Dyn 2016 at roughly 1.2 Tbps",
            "Application (L7)": "HTTP floods, slowloris, credential stuffing",
          },
          {
            aspect: "Key capacity metric",
            "Volumetric (L3/L4)": "Bandwidth headroom at the edge",
            "Application (L7)": "Origin CPU and per-request latency",
          },
        ],
      },
      {
        type: "text",
        heading: "What a WAF Actually Does",
        content:
          "A **Web Application Firewall** inspects Layer 7 requests and blocks or challenges them using one or more models: **signature rules** (the OWASP Core Rule Set on ModSecurity), **anomaly scoring**, a **positive security model** (allow-list the shapes you expect), and **behavioral/ML models** for bots. Managed WAFs — Cloudflare, AWS WAF, Akamai — combine these with a large threat-intelligence feed.\n\nTwo caveats matter operationally. First, a WAF is **mitigation, not a fix**: it cannot replace secure code, and encoding tricks bypass naive rules, so SQLi still must be fixed in the code. Second, an untuned WAF produces false positives that block real customers, so rules need staged rollout and monitoring before enforcement.",
      },
      {
        type: "code",
        heading: "Rate Limiting at the Reverse Proxy",
        language: "nginx",
        label: "nginx-ratelimit.conf",
        code: `# Shared-memory zone keyed by client IP; ~10 requests/second, bursts absorbed.
limit_req_zone  $binary_remote_addr zone=api_rl:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_rl:10m;

server {
  listen 443 ssl http2;

  location /api/ {
    # Allow short bursts of 20; reject (429) beyond that without queueing.
    limit_req  zone=api_rl burst=20 nodelay;
    limit_conn conn_rl 20;         # cap concurrent connections per IP
    limit_req_status 429;
    limit_conn_status 429;

    proxy_pass http://app_upstream;
  }
}`,
      },
      {
        type: "text",
        heading: "Rate Limiting and Quotas",
        content:
          "Algorithms: **token bucket** (steady refill, allows bursts), **leaky bucket** (smooths to a constant rate), and **fixed/sliding window** counters. The choice matters less than *what you key on*. IP is a weak key — mobile users share addresses behind carrier NAT while attackers rotate across thousands of them.\n\nLayer the keys: per-IP to stop dumb floods, **per-API-key and per-account** to stop authenticated abuse, and **per-endpoint** so expensive routes (search, report export, login) get tighter limits than cheap static reads. Return `429` with `Retry-After`. Critically, do not implement limits in per-instance memory across a fleet — each instance keeps its own counter and the effective limit multiplies. Use a shared store (Redis) or enforce at a centralized edge.",
      },
      {
        type: "text",
        heading: "Bot Mitigation and CAPTCHA",
        content:
          "Not all bots are bad — search crawlers and monitoring agents should pass; scrapers, credential stuffers, and scalpers should not. Signal sources include the **TLS fingerprint** (JA3/JA4 hashes derived from the ClientHello), the HTTP/2 fingerprint, header order, request timing, behavioral scoring, and IP/ASN reputation.\n\nUse a **challenge ladder** rather than a binary block: passive scoring for everyone, then a lightweight JavaScript challenge, then a managed challenge, then a visible CAPTCHA, then block. Cloudflare **Turnstile** and reCAPTCHA can run invisibly for most users. Put CAPTCHA last: it is the most hostile to accessibility and conversion, and it is easy for attackers to farm out to humans if it is your only defense.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Absorb, Then Mitigate — Capacity Is Itself a Defense",
        content:
          "Anycast spreads a volumetric attack across hundreds of edge locations, so no single point of presence carries the whole flood, and scrubbing centers drop the junk before it reaches your origin. The first line of DDoS defense is simply having more absorbable capacity than the attacker can generate. Keep your origin unreachable directly — front it with CDN/scrubbing capacity, firewall it to accept traffic only from the provider's ranges, and maintain an out-of-band path to reach it during an incident.",
      },
      {
        type: "steps",
        heading: "A Layered DDoS Response",
        steps: [
          {
            title: "Absorb at the edge",
            detail:
              "Front everything with Anycast CDN capacity so floods are dispersed far from the origin.",
          },
          {
            title: "Filter L3/L4",
            detail:
              "Enable SYN cookies, drop malformed packets, and use provider scrubbing for volumetric floods.",
          },
          {
            title: "Rate limit L7",
            detail:
              "Apply per-IP, per-key, and per-endpoint limits at the edge, tightest on expensive routes.",
          },
          {
            title: "Score the bots",
            detail:
              "Combine TLS fingerprint, behavior, and reputation, and challenge rather than always block.",
          },
          {
            title: "Cache aggressively",
            detail:
              "Serve static and cacheable responses from the edge so floods never reach the application.",
          },
          {
            title: "Protect the origin",
            detail:
              "Allow only provider ranges, obscure the real IP, and keep an emergency bypass path.",
          },
        ],
      },
      {
        type: "text",
        heading: "Cloudflare, AWS Shield, and Friends",
        content:
          "**Cloudflare** runs a large Anycast network with WAF, bot management, and DDoS protection on all plans, plus Magic Transit for L3/L4 protection of entire networks. **AWS Shield Standard** is free and covers L3/L4 for CloudFront, ALB, and Route 53; **Shield Advanced** adds a 24/7 response team, cost protection, and included WAF for a monthly fee. Google offers Cloud Armor with similar L7 capabilities.\n\nThe practical distinction is not whether a provider stops volumetric floods — that is table stakes — but the quality of its **L7 rules, bot signals, and incident response** when a real attack lands at 3 a.m.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Identify the layer under attack first — L3/L4 floods are bandwidth problems, L7 floods are resource problems",
          "Volumetric attacks (Mirai/Dyn at ~1.2 Tbps) are absorbed with Anycast capacity, not application changes",
          "A WAF is mitigation, not a fix — it never replaces secure code and needs tuning to avoid false positives",
          "Rate limit at the edge and key on identity, layering per-IP, per-key, and per-endpoint limits with shared state",
          "Mitigate bots by scoring (TLS fingerprint, behavior, reputation) and a challenge ladder, not CAPTCHA-first",
          "Never expose the origin — front it with scrubbing/CDN capacity and firewall it to provider ranges only",
        ],
      },
    ],
    quiz: [
      {
        question:
          "The 2016 Mirai botnet attack on Dyn peaked near 1.2 Tbps. Which layer does that describe?",
        options: [
          "Layer 7 application flood",
          "Volumetric Layer 3/4 attack",
          "Application-layer credential stuffing",
          "Layer 2 MAC flooding",
        ],
        correctIndex: 1,
        explanation:
          "Mirai was a volumetric L3/L4 attack: a large botnet of IoT devices sent spoofed UDP (largely DNS reflection) traffic measured in terabits per second. Such attacks are absorbed with edge capacity and scrubbing, not by changing application code.",
      },
      {
        question:
          "An attacker sends well-formed HTTP requests that look like real browsers but exhaust your database. What is the most effective first control?",
        options: [
          "Block all traffic from the attacking IP range permanently",
          "Add another application server and hope",
          "Apply edge rate limiting and bot scoring to separate the flood from real users",
          "Enable SYN cookies on the origin",
        ],
        correctIndex: 2,
        explanation:
          "An L7 flood is distinguished by behavior, not by malformed packets, so rate limiting (layered per-IP, per-key, and per-endpoint) plus bot scoring at the edge is the right tool. SYN cookies address L4 protocol floods, and simply adding capacity is a losing race.",
      },
      {
        question:
          "Why is an in-memory rate limiter unsafe across a multi-instance fleet?",
        options: [
          "It cannot count requests quickly enough",
          "Each instance keeps its own counter, so the effective limit multiplies by the number of instances",
          "It stores counters in plaintext on disk",
          "It only works for HTTP/2 traffic",
        ],
        correctIndex: 1,
        explanation:
          "Per-instance memory means every replica enforces the limit independently, so ten replicas each allowing 10 req/s permit roughly 100 req/s overall. Use a shared store such as Redis or enforce the limit at a centralized edge.",
      },
      {
        question:
          "What is the correct placement of CAPTCHA in a bot-mitigation challenge ladder?",
        options: [
          "First, shown to every visitor before any request",
          "Last, after passive scoring and invisible challenges, because it harms accessibility and conversion",
          "Only on internal admin routes",
          "It should be removed entirely in favor of IP blocking",
        ],
        correctIndex: 1,
        explanation:
          "Good bot mitigation starts with passive scoring and benign challenges (for example Cloudflare Turnstile) and escalates only suspicious traffic, reserving visible CAPTCHAs for the last rung because they degrade user experience and can be farmed to humans.",
      },
    ],
  },

  "threat-modeling": {
    slug: "threat-modeling",
    title: "Threat Modeling & Zero Trust",
    tagline: "Find the flaws on the whiteboard, before code exists",
    sections: [
      {
        type: "text",
        heading: "Security Decided at Design Time",
        content:
          "**Threat modeling** is structured reasoning about what can go wrong, done while the design is still a whiteboard sketch. It is by far the cheapest place to fix a security flaw: changing a diagram costs minutes; changing a shipped, deployed architecture costs a quarter and a migration. A model is not a one-off audit but a lightweight, repeatable conversation.\n\nThe framework collapses to four questions: **What are we building? What can go wrong? What are we going to do about it? Did we do a good job?** The rest of this topic is tools for answering each, chiefly STRIDE, data-flow diagrams, and attack trees.",
      },
      {
        type: "analogy",
        heading: "Casing the Joint",
        content:
          "A burglar does not attack a house blind. They walk the perimeter, note the entry points — doors, windows, the garage, the dog flap — the valuables inside, and the alarm. Threat modeling is deliberately *casing your own system*: enumerate the entry points, the assets worth stealing, and the trust boundaries between them, then close the cheap gaps before someone else notices them.\n\nThe best time to do this is while you are still drawing the floor plan, not after the family has moved in.",
      },
      {
        type: "text",
        heading: "STRIDE",
        content:
          "**STRIDE** is a checklist of six threat categories, each tied to a security property it violates. **Spoofing** — pretending to be someone else — violates authentication. **Tampering** — modifying data or code — violates integrity. **Repudiation** — denying an action — violates non-repudiation and calls for audit logging. **Information disclosure** — exposing data to the wrong party — violates confidentiality. **Denial of service** — making a resource unavailable — violates availability. **Elevation of privilege** — gaining rights you should not have — violates authorization.\n\nYou apply STRIDE **per element** of the system: processes, data stores, data flows, and external entities each attract different letters. It gives broad, first-pass coverage quickly.",
      },
      {
        type: "text",
        heading: "Trust Boundaries and Data-Flow Diagrams",
        content:
          "A **data-flow diagram (DFD)** maps the system as **processes**, **data stores**, **external entities**, and the **flows** between them. A **trust boundary** is any place where data crosses from one level of trust to another — the browser to your server, your server to the database, a service to a third-party API, a container to the host, one team's service to another's.\n\nThis is where the value concentrates: **most vulnerabilities sit exactly on a trust boundary** where a check was assumed but never implemented. Every boundary crossing is a place that must validate input, authenticate the caller, and authorize the action. If your DFD has no trust boundaries drawn, you have not yet started the model.",
      },
      {
        type: "comparison",
        heading: "STRIDE vs Attack Trees",
        headers: ["STRIDE", "Attack trees"],
        rows: [
          {
            aspect: "Form",
            "STRIDE": "Per-element checklist of six threat categories",
            "Attack trees": "A goal decomposed into attacker sub-goals",
          },
          {
            aspect: "Question answered",
            "STRIDE": "What kinds of threat apply to this element?",
            "Attack trees": "How, step by step, could an attacker reach this goal?",
          },
          {
            aspect: "Output",
            "STRIDE": "A list of threats mapped to mitigations",
            "Attack trees": "A tree of paths, each with cost and feasibility",
          },
          {
            aspect: "Best for",
            "STRIDE": "Broad first-pass coverage of a whole system",
            "Attack trees": "Deep-diving one high-value target",
          },
          {
            aspect: "Weakness",
            "STRIDE": "Can miss multi-step, chained attacks",
            "Attack trees": "Effort-intensive and needs a specific goal",
          },
          {
            aspect: "How they combine",
            "STRIDE": "Finds candidate threats",
            "Attack trees": "Prioritises the real ones",
          },
        ],
      },
      {
        type: "text",
        heading: "Defense in Depth and Least Privilege",
        content:
          "**Defense in depth** means layering *independent* controls so that no single failure is fatal: a WAF, then input validation, then parameterized queries, then a least-privilege database role, then anomaly monitoring. Each layer assumes the one in front of it will eventually fail.\n\n**Least privilege** limits the blast radius when a layer does fail: the application's database role cannot `DROP TABLE` or read other schemas; a service account can read exactly one bucket; a job can deploy to staging but not production. The mindset is *assume compromise*: size the damage so that any single breach is contained rather than catastrophic.",
      },
      {
        type: "text",
        heading: "Zero Trust: Never Trust the Network",
        content:
          "The traditional **perimeter model** assumes that anything inside the VPN or corporate network is trustworthy — a single breach of that perimeter grants broad access. **Zero trust**, popularized by Google's **BeyondCorp**, removes implicit trust based on network location entirely.\n\nThe principles are: **verify explicitly** (authenticate and authorize every request, every time), **use least privilege** (just-in-time, just-enough access, short-lived credentials), and **assume breach** (microsegment the network, monitor continuously, encrypt everywhere). The network perimeter becomes irrelevant; identity, device posture, and per-request policy are the new perimeter.",
      },
      {
        type: "code",
        heading: "Least Privilege as Code",
        language: "yaml",
        label: "netpol.yaml",
        code: `# Default-deny egress, then allow only the exact flows the service needs.
# Anything not listed here is dropped - that is the whole point of the policy.
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payments-egress
  namespace: payments
spec:
  podSelector: {}
  policyTypes: ["Egress"]
  egress:
    - to:
        - namespaceSelector:
            matchLabels: { name: ledger }
      ports:
        - { protocol: TCP, port: 5432 }   # only the ledger DB, only Postgres
    - to:
        - namespaceSelector:
            matchLabels: { name: kube-system }
      ports:
        - { protocol: UDP, port: 53 }     # DNS resolution only`,
      },
      {
        type: "text",
        heading: "Attack Trees in Practice",
        content:
          "An **attack tree** starts from an attacker's **root goal** — say, \"take over a user account\" — and decomposes it into the sub-goals and steps that could achieve it. Branches cover stealing credentials, hijacking a session, abusing password reset, and social engineering; leaves are atomic actions. Each node is annotated with feasibility, cost, and detectability.\n\nThe payoff is **prioritization**. Rather than a flat list of worries, the tree surfaces the cheapest-to-block, highest-impact leaves: adding rate limiting to the reset endpoint, requiring MFA on login, or pinning the JWT algorithm. It converts vague unease into a ranked to-do list with owners.",
      },
      {
        type: "code",
        heading: "Attack Tree: Account Takeover",
        language: "plaintext",
        label: "attack-tree.txt",
        code: `Goal: Take over a user account
├── Steal credentials
│   ├── Credential stuffing  (reused passwords)  -> MFA + breach monitoring
│   ├── Phishing             (fake login page)   -> passkeys / FIDO2
│   └── Password reset abuse (weak token, IDOR)  -> rate limit + strong token
├── Hijack a session
│   ├── XSS steals the cookie                    -> HttpOnly + strict CSP
│   └── Session fixation                         -> rotate session id on login
└── Bypass authentication
    ├── JWT alg=none or weak secret              -> pin alg, strong keys
    └── OAuth redirect_uri manipulation          -> exact-match redirect_uri`,
      },
      {
        type: "callout",
        calloutType: "success",
        heading: "Verify Explicitly — Identity Is the New Perimeter",
        content:
          "In a zero-trust architecture there is no \"trusted\" network. Every request is authenticated and authorized on its own merits, from any network, using short-lived credentials bound to a strong identity — mTLS, workload identity, SPIFFE/SPIRE. A laptop on the corporate Wi-Fi gets no more implicit trust than one in a coffee shop. This is a design commitment, not a product you buy: it means every service call carries an identity and every service checks it.",
      },
      {
        type: "steps",
        heading: "Running a Threat-Modeling Session",
        steps: [
          {
            title: "Scope it tightly",
            detail:
              "Pick one feature or data flow and one small team; bound the session to about 90 minutes.",
          },
          {
            title: "Draw the diagram",
            detail:
              "Capture processes, data stores, external entities, and every trust boundary between them.",
          },
          {
            title: "Enumerate threats",
            detail:
              "Walk each element and boundary against STRIDE; for high-value goals, build an attack tree.",
          },
          {
            title: "Rank by risk",
            detail:
              "Score threats by impact times likelihood; not everything is a P0.",
          },
          {
            title: "Assign mitigations",
            detail:
              "Give each accepted threat an owner and a concrete control, and log explicit risk acceptances.",
          },
          {
            title: "Revisit on change",
            detail:
              "Re-run the model when the architecture changes, not once a year in a dusty document.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Threat modeling is design-time reasoning — find flaws on the whiteboard, not in production",
          "STRIDE gives broad per-element coverage; attack trees deep-dive one high-value goal",
          "Vulnerabilities cluster on trust boundaries — every crossing must validate, authenticate, and authorize",
          "Defense in depth assumes each layer will fail; least privilege sizes the blast radius",
          "Zero trust replaces network location with verified identity on every request",
          "Re-run models on change and log risk acceptances so they are deliberate",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In STRIDE, which category corresponds to an authorization failure, where a user gains rights they should not have?",
        options: [
          "Spoofing",
          "Repudiation",
          "Elevation of privilege",
          "Information disclosure",
        ],
        correctIndex: 2,
        explanation:
          "Elevation of privilege is the STRIDE category for gaining more access than intended, and it maps to the authorization property. Spoofing targets authentication, Repudiation targets non-repudiation, and Information disclosure targets confidentiality.",
      },
      {
        question:
          "Which statement best defines a trust boundary in a data-flow diagram?",
        options: [
          "Any firewall rule in the network",
          "A place where data crosses from one level of trust to another and must be validated",
          "The public IP address of the load balancer",
          "A database table that stores secrets",
        ],
        correctIndex: 1,
        explanation:
          "A trust boundary marks where data moves between different trust levels — browser to server, server to database, service to third party. Such crossings are where most vulnerabilities live, because validation, authentication, and authorization are commonly assumed but not implemented there.",
      },
      {
        question:
          "What is the defining principle of a zero-trust architecture?",
        options: [
          "Traffic inside the VPN is implicitly trusted",
          "Trust is granted based on network location",
          "No implicit trust is granted based on network location; every request is verified",
          "Only external traffic needs authentication",
        ],
        correctIndex: 2,
        explanation:
          "Zero trust removes implicit trust based on network location. Every request is authenticated and authorized explicitly, credentials are short-lived and bound to a strong identity, and the system assumes breach with microsegmentation and continuous monitoring.",
      },
      {
        question:
          "When is an attack tree a better tool than STRIDE?",
        options: [
          "When you need broad first-pass coverage of an entire system",
          "When you want to deep-dive one high-value goal and rank attacker paths by cost and feasibility",
          "When you have not yet produced a data-flow diagram",
          "When you need to satisfy a compliance checklist quickly",
        ],
        correctIndex: 1,
        explanation:
          "Attack trees decompose a specific attacker goal into ranked paths and are ideal for deep analysis of a single valuable target. STRIDE is the broader, faster checklist for covering many elements, so the two are complementary: STRIDE finds candidates, attack trees prioritise them.",
      },
    ],
  },

  // ─── COMPLIANCE ─────────────────────────────────────────────────────────

  "compliance": {
    slug: "compliance",
    title: "Compliance: GDPR, PCI-DSS & SOC 2",
    tagline: "Compliance is provable process — build evidence by default",
    sections: [
      {
        type: "text",
        heading: "Compliance Is Evidence, Not Vibes",
        content:
          "Regulations state obligations; auditors ask for **evidence that your controls actually operate**. \"We encrypt the disk\" is a claim; a timestamped configuration record, an access log, and a key-rotation history are evidence. Engineering's job in compliance is to make that evidence a **byproduct of normal work** rather than a quarterly scramble.\n\nThe three frameworks in this topic cover different ground. **GDPR** governs personal data and data-subject rights. **PCI-DSS** governs cardholder data. **SOC 2** reports on a company's controls to its customers. Overlap is large — access control, encryption, logging, change management recur — so build the control once and map it to all three.",
      },
      {
        type: "analogy",
        heading: "The Restaurant Health Inspection",
        content:
          "No inspector tastes your food to certify it. They inspect your *process*: fridge temperatures logged on a clipboard, hand-washing rules posted and followed, stock rotated by date, cleaning schedules signed off. The passing grade is a **paper trail proving the process ran**.\n\nCompliance frameworks are health inspections for data. The auditor does not read your code line by line; they examine your access reviews, your change tickets, your deletion proofs, and your incident records — the trail that shows the process operated over time.",
      },
      {
        type: "text",
        heading: "GDPR: Lawful Basis and Data-Subject Rights",
        content:
          "Any processing of personal data needs a **lawful basis**: consent, performance of a contract, a legal obligation, vital interests, public task, or legitimate interests. Pick and document one; \"it was convenient\" is not on the list.\n\nThe regulation grants **data-subject rights**: access (a DSAR, typically answered within one month), rectification, **erasure** (Article 17, the \"right to be forgotten\"), portability, and restriction. Operationally you also owe **records of processing** (Article 30), data protection by design, a **breach notification within 72 hours** of awareness, and a Data Protection Officer for large-scale processing. Fines reach €20 million or 4% of global annual turnover, whichever is higher.",
      },
      {
        type: "text",
        heading: "Data Residency and Cross-Border Transfers",
        content:
          "Where personal data physically lives is a legal question. The **Schrems II** ruling invalidated the EU-US Privacy Shield in 2020, so transfers to the US now rely on **Standard Contractual Clauses** plus a documented Transfer Impact Assessment, or on the **EU-US Data Privacy Framework** adopted in 2023.\n\nA subtle trap: **residency is not sovereignty**. A US-headquartered provider with an EU region can still be compelled to disclose data under US law. Practical controls include pinning data location per tenant, keeping encryption keys in-region (**BYOK/HYOK**), and documenting the transfer mechanism for every cross-border flow in your data map.",
      },
      {
        type: "comparison",
        heading: "GDPR vs PCI-DSS",
        headers: ["GDPR", "PCI-DSS"],
        rows: [
          {
            aspect: "Scope",
            "GDPR": "All personal data of EU data subjects",
            "PCI-DSS": "Cardholder data: PAN and sensitive authentication data",
          },
          {
            aspect: "Enforced by",
            "GDPR": "Data protection authorities (regulators)",
            "PCI-DSS": "Card brands, through acquirers and QSAs",
          },
          {
            aspect: "Core obligation",
            "GDPR": "Lawful basis, data-subject rights, breach notice in 72 hours",
            "PCI-DSS": "Protect the CDE across twelve requirement groups",
          },
          {
            aspect: "Penalty",
            "GDPR": "Up to €20M or 4% of global turnover",
            "PCI-DSS": "Fines plus loss of card-processing privileges",
          },
          {
            aspect: "Key artifact",
            "GDPR": "Records of processing, DSAR log, DPIAs",
            "PCI-DSS": "SAQ or ROC, segmentation proof, pen-test reports",
          },
          {
            aspect: "Scope-reduction lever",
            "GDPR": "Minimize and securely delete personal data",
            "PCI-DSS": "Tokenize and segment to shrink the CDE",
          },
        ],
      },
      {
        type: "text",
        heading: "SOC 2: Trust Services Criteria",
        content:
          "**SOC 2** is an attestation report a CPA firm issues about your controls, evaluated against five **Trust Services Criteria**: **Security** (the common, always-included criterion), **Availability**, **Processing Integrity**, **Confidentiality**, and **Privacy**. You choose which criteria are in scope.\n\nThe report type matters. **Type I** attests that controls are suitably *designed* at a point in time. **Type II** attests that controls *operated effectively* over a period, usually six to twelve months, with sampled evidence. Type II is what enterprise customers ask for. Evidence looks like quarterly access reviews, change-management tickets, incident postmortems, monitoring dashboards, and vendor security assessments.",
      },
      {
        type: "text",
        heading: "PII Handling and Tokenization",
        content:
          "Good PII handling follows a small set of rules: **minimize** what you collect, **classify** what you store, **encrypt** in transit and at rest, and restrict access on a **need-to-know** basis. The less sensitive data you hold, the smaller every compliance obligation becomes.\n\n**Tokenization** is the strongest scope-reduction tool. You replace the sensitive value — a card number, a national id — with a surrogate **token**, and store the real value in a hardened vault or with a payment provider. The token is safe to log, cache, and join on; only the vault can map it back. **Format-preserving encryption** keeps the original shape (say, sixteen digits) so legacy systems that expect a certain format keep working.",
      },
      {
        type: "code",
        heading: "Tokenized Card Storage",
        language: "sql",
        label: "tokenize.sql",
        code: `-- The application database only ever sees an opaque token, never the PAN.
CREATE TABLE payment_methods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers (id),
  token        TEXT NOT NULL,        -- e.g. tok_9f2a... from the vault
  brand        TEXT NOT NULL,        -- visa, mastercard (not sensitive)
  last4        CHAR(4) NOT NULL,     -- display only, never the full PAN
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliberately NOT stored here: full PAN, CVV/CVC, full magnetic stripe.
-- PCI-DSS forbids storing CVV after authorization at all, even encrypted.`,
      },
      {
        type: "text",
        heading: "Right to Erasure vs Immutable Ledgers",
        content:
          "Deletion is where compliance meets architecture. A naive `DELETE` on the primary table leaves copies in caches, the warehouse, search indexes, analytics events, and backups — and GDPR's right to erasure covers personal data **everywhere** it lives.\n\nThe elegant answer for append-only and immutable stores is **crypto-shredding**: encrypt each subject's data with a **per-subject data-encryption key**. \"Erasing\" the subject means destroying the key, which renders all of that ciphertext permanently unreadable without rewriting a single immutable record. Keep a minimal, non-personal audit entry (a hashed reference) so you can still *prove* the erasure happened, and make sure your backups are covered — typically by re-applying deletions on restore.",
      },
      {
        type: "code",
        heading: "Erasure via Crypto-Shredding",
        language: "typescript",
        label: "erase-subject.ts",
        code: `import crypto from "node:crypto";

// Each subject has a data-encryption key in the KMS.
// Erasure destroys the key; it does not rewrite immutable rows.
export async function eraseSubject(subjectId: string): Promise<void> {
  const keyId = await kms.keyIdForSubject(subjectId); // alias/subject/u_42

  // 1. Destroy the key: all ciphertext for this subject becomes unreadable.
  await kms.scheduleKeyDestruction(keyId, { windowDays: 7 });

  // 2. Record the erasure without keeping personal data (one-way ref only).
  const ref = crypto.createHash("sha256").update(subjectId).digest("hex");
  await audit.write({ event: "subject.erased", subjectRef: ref, at: new Date().toISOString() });

  // 3. Derived stores are purged on the same event.
  await Promise.all([
    analytics.purgeSubject(ref),
    search.purgeSubject(ref),
  ]);
}`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Your Logs and Backups Are PII Too",
        content:
          "The right to erasure covers personal data *everywhere* it lives — application logs, error trackers, analytics events, warehouse copies, and backup snapshots. A user who requests deletion is not satisfied because your primary table dropped the row while your error tracker still holds their email in an exception payload. Classify and redact PII at the log boundary (hash or drop emails, tokens, and card numbers), set explicit retention windows, and include logs, warehouses, and backups in the erasure runbook. You cannot satisfy a 72-hour breach notice for data you cannot even see.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Compliance is provable process — build controls so evidence is produced by default",
          "GDPR grants data-subject rights (access, erasure) and requires a lawful basis plus 72-hour breach notice",
          "Cross-border transfers need a documented mechanism (SCCs + TIA, or the EU-US DPF); residency is not sovereignty",
          "PCI-DSS scopes to cardholder data — tokenize and segment to shrink the CDE, and never store the CVV",
          "SOC 2 Type II reports controls operating over a period; evidence is access reviews, change tickets, and monitoring",
          "Deletion reaches logs, warehouses, and backups; crypto-shredding and log-boundary redaction make erasure real",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Under GDPR, how long do you have to notify the supervisory authority of a personal-data breach?",
        options: ["24 hours", "72 hours", "30 days", "One calendar month"],
        correctIndex: 1,
        explanation:
          "GDPR requires notification of a personal-data breach to the supervisory authority without undue delay and, where feasible, within 72 hours of becoming aware of it. The one-month figure applies to responding to data-subject access requests, not breach notification.",
      },
      {
        question:
          "What does crypto-shredding achieve for a right-to-erasure request?",
        options: [
          "It overwrites the rows in every replica",
          "It destroys the per-subject encryption key so the ciphertext becomes unrecoverable",
          "It anonymizes the data by replacing names with random values",
          "It moves the data to a jurisdiction outside GDPR",
        ],
        correctIndex: 1,
        explanation:
          "Crypto-shredding stores each subject's data encrypted under a per-subject key; deleting that key makes the ciphertext permanently unreadable, which satisfies erasure without rewriting immutable or backup records. It differs from anonymization, which alters the data itself.",
      },
      {
        question:
          "Which piece of cardholder data may never be stored after authorization, even if encrypted?",
        options: [
          "The cardholder name",
          "The primary account number (PAN)",
          "The CVV/CVC security code",
          "The card brand",
        ],
        correctIndex: 2,
        explanation:
          "PCI-DSS forbids storing the sensitive authentication data — the CVV/CVC, full magnetic-stripe data, and PIN blocks — after authorization, even in encrypted form. The PAN may be stored if protected (encryption or tokenization), and names and brand are not sensitive authentication data.",
      },
      {
        question:
          "What is the key difference between a SOC 2 Type I and Type II report?",
        options: [
          "Type I covers only security; Type II covers all five criteria",
          "Type I attests controls are designed at a point in time; Type II attests they operated over a period",
          "Type I is issued by the company; Type II is issued by a regulator",
          "Type I is for cloud providers; Type II is for fintechs",
        ],
        correctIndex: 1,
        explanation:
          "A Type I report attests that controls are suitably designed as of a point in time. A Type II report attests that the controls operated effectively over a review period, usually six to twelve months, supported by sampled evidence — which is why enterprise customers typically request Type II.",
      },
    ],
  },
};
