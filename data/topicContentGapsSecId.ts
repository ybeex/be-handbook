// Gap content: Security — identity, authorization and secrets
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_SEC_ID: Record<string, TopicContent> = {
  // ─── IDENTITY & FEDERATION ──────────────────────────────────────────────

  "openid-connect": {
    slug: "openid-connect",
    title: "OpenID Connect (OIDC)",
    tagline: "An identity layer on top of OAuth 2.0 — proving who the user is",
    sections: [
      {
        type: "text",
        heading: "OAuth Authorizes, OIDC Authenticates",
        content:
          'OAuth 2.0 was designed for **delegated authorization**: it lets an app obtain an access token so it can call an API on the user\'s behalf. It deliberately says nothing about who the user is. A bare access token is a bearer string for an API — it is not a statement of identity.\n\n**OpenID Connect** bolts an identity layer onto OAuth. The client also asks for the `openid` scope, and in return the token endpoint issues an **ID token** alongside (or instead of) the access token. That ID token is a signed JWT that names the user, the issuer, and the client it was minted for. You use the access token to call APIs and the ID token to answer the question "who just logged in?" — they are different artifacts with different audiences and must never be substituted for each other.',
      },
      {
        type: "analogy",
        heading: "Passport vs Hotel Key Card",
        content:
          "Think of a hotel. You show your **passport** at reception and the clerk verifies it — that is authentication, and the passport is your ID token. The clerk then hands you a **key card** that opens your room and the gym but not the staff office — that is authorization, and the key card is your access token.\n\nThe key card proves nothing about who you are: anyone holding it can enter the room, which is exactly why you never leave it lying around. And the passport is useless at the room door — the lock wasn't built to read it. Confusing the two is the source of a whole class of OIDC bugs.",
      },
      {
        type: "text",
        heading: "Discovery and JWKS",
        content:
          "Every compliant provider publishes a **discovery document** at `/.well-known/openid-configuration`. It advertises the endpoints (authorization, token, userinfo), the supported scopes and flows, and — crucially — the `jwks_uri`.\n\nThe **JWKS** (JSON Web Key Set) at that URI is the set of public keys the issuer signs with. Each key has a `kid` (key id), and each ID token's header names the `kid` it used. A verifier matches the header's `kid` to the right public key and checks the signature. Keys rotate, so a correct client caches the JWKS and refetches when it meets an unknown `kid` — never pins a single key in code.",
      },
      {
        type: "code",
        heading: "Verifying an ID Token",
        language: "typescript",
        label: "verify-id-token.ts",
        code: `import { createRemoteJWKSet, jwtVerify } from "jose";

// The remote key set is cached and refetched lazily on an unknown "kid".
const JWKS = createRemoteJWKSet(
  new URL("https://accounts.example.com/.well-known/jwks.json"),
);

export async function verifyIdToken(idToken: string) {
  const { payload, protectedHeader } = await jwtVerify(idToken, JWKS, {
    issuer: "https://accounts.example.com",
    audience: "web-client-abc123",
  });

  // jwtVerify already enforced the signature, exp, nbf, iss and aud.
  return {
    subject: payload.sub,
    email: payload.email as string,
    keyId: protectedHeader.kid,
  };
}`,
      },
      {
        type: "code",
        heading: "Reading the Discovery Document",
        language: "bash",
        label: "discovery.sh",
        code: `# Everything a compliant client needs is advertised at one well-known URL
curl -s https://accounts.example.com/.well-known/openid-configuration \\
  | jq '{issuer, authorization_endpoint, token_endpoint, jwks_uri}'`,
      },
      {
        type: "text",
        heading: "PKCE for Public Clients",
        content:
          "Native apps and single-page apps cannot keep a client secret — anything shipped to a device can be extracted. This is why the **Authorization Code flow with PKCE** (RFC 7636) exists.\n\nThe client generates a random `code_verifier`, sends its SHA-256 hash as the `code_challenge` on the authorization request, and later presents the raw `code_verifier` when redeeming the code for tokens. An attacker who intercepts the authorization code cannot exchange it without the verifier. The older **Implicit flow** returned tokens directly in the URL fragment and is now deprecated for exactly that exposure.",
      },
      {
        type: "comparison",
        heading: "ID Token vs Access Token",
        headers: ["ID token", "Access token"],
        rows: [
          {
            aspect: "Purpose",
            "ID token": "Tells the client who the user is",
            "Access token": "Authorizes calls to an API",
          },
          {
            aspect: "Audience (aud)",
            "ID token": "The client application",
            "Access token": "The resource server / API",
          },
          {
            aspect: "Format",
            "ID token": "Always a JWT (JWS), optionally nested JWE",
            "Access token": "Opaque string or JWT — issuer's choice",
          },
          {
            aspect: "Who consumes it",
            "ID token": "Front-end client; never sent to APIs",
            "Access token": "Resource server that validates it",
          },
          {
            aspect: "Lifetime",
            "ID token": "Short; re-authenticate on expiry",
            "Access token": "Short; obtain a new one via refresh token",
          },
          {
            aspect: "Classic failure mode",
            "ID token": "Accepting an unsigned alg=none token",
            "Access token": "Confused deputy when aud is not checked",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Never Treat the Access Token as Identity",
        content:
          "An access token's audience is the API, not your app. If you log a user in by decoding an access token and trusting its `sub` or `email`, you have skipped the identity verification OIDC was designed to give you, and you may accept a token minted for a completely different client. Verify the **ID token** against the issuer, audience, and signature. Validate on the server or in a trusted backend — a browser that decodes a JWT is showing the user their own token, not proving anything.",
      },
      {
        type: "steps",
        heading: "Validating an ID Token, In Order",
        steps: [
          {
            title: "Resolve the signing key",
            detail:
              "Read the token header's kid, look it up in the cached JWKS, and refetch the key set if the kid is unknown.",
          },
          {
            title: "Verify the signature",
            detail:
              "Reject any token whose alg is not in your allow-list — pinned to RS256/ES256, never alg=none or a symmetric alg you did not expect.",
          },
          {
            title: "Check iss and aud",
            detail:
              "The issuer must equal your provider exactly, and the audience must contain your client_id.",
          },
          {
            title: "Check the time claims",
            detail:
              "Reject if now is before nbf or after exp, allowing only a small clock skew (60 seconds or less).",
          },
          {
            title: "Check the nonce",
            detail:
              "Bind the ID token to the login attempt by comparing the nonce you sent with the one returned.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "OAuth authorizes; OIDC authenticates — request the openid scope to get an ID token",
          "Verify signatures against the provider's JWKS, matched by kid and cached with a refresh path",
          "Always check iss, aud, exp, nbf, and the nonce; never trust a token you merely decoded",
          "Use Authorization Code with PKCE for public clients; Implicit is deprecated",
          "Keep the access token's audience at the API — never use it as proof of identity",
          "Pin the accepted algorithms; reject alg=none and unexpected symmetric alg values",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What does an OpenID Connect ID token add that a plain OAuth 2.0 access token does not?",
        options: [
          "Faster API responses",
          "A signed assertion of the authenticated user's identity for the client",
          "Automatic token refresh",
          "Encryption of the API response body",
        ],
        correctIndex: 1,
        explanation:
          "OAuth access tokens authorize API calls but carry no identity guarantee for the client. The ID token is a JWT whose audience is the client, and its signature plus iss/aud/exp claims assert who the user is.",
      },
      {
        question:
          "A client receives an ID token and the header references a kid it has not seen. What is correct behaviour?",
        options: [
          "Reject the token permanently",
          "Decode the payload and trust it anyway",
          "Refetch the JWKS from jwks_uri and retry the kid lookup",
          "Switch to the alg=none path",
        ],
        correctIndex: 2,
        explanation:
          "Issuers rotate signing keys, so an unknown kid is normal. A correct client refetches the JWKS, finds the new key, and continues. Pinning one key breaks on every rotation, and decoding without verifying defeats the whole purpose.",
      },
      {
        question:
          "Why is PKCE required for native and single-page applications?",
        options: [
          "It encrypts the authorization code in transit",
          "It lets the client avoid redirect URIs",
          "It proves the client redeeming the code is the one that started the flow, even without a client secret",
          "It replaces the need for an ID token",
        ],
        correctIndex: 2,
        explanation:
          "Public clients cannot hold a secret, so an attacker who steals the authorization code could exchange it. PKCE binds the redemption to a code_verifier the attacker does not have, closing that interception window.",
      },
      {
        question:
          "Which set of checks must a server perform on an incoming ID token?",
        options: [
          "Decode the payload and read the email claim",
          "Signature, issuer, audience, expiry, and nonce",
          "Only the expiry timestamp",
          "Base64-decode the payload and confirm it is valid JSON",
        ],
        correctIndex: 1,
        explanation:
          "A trustworthy verification covers the signature against the JWKS, the iss matching the expected provider, the aud containing your client_id, the exp/nbf time bounds, and the nonce binding the token to the login attempt.",
      },
    ],
  },

  // ─── ENTERPRISE SSO ─────────────────────────────────────────────────────

  "saml-sso": {
    slug: "saml-sso",
    title: "SAML & Enterprise SSO",
    tagline: "XML federation between enterprise identity providers and apps",
    sections: [
      {
        type: "text",
        heading: "What SAML Solves",
        content:
          "SAML 2.0 is the grandfather of federated identity and still the standard that large enterprises demand. A company runs an **Identity Provider (IdP)** — Okta, Microsoft Entra ID, ADFS, Ping — that holds the user directory and performs authentication. Your application is a **Service Provider (SP)**.\n\nInstead of storing passwords, you delegate login to the IdP. The user authenticates there once (often behind MFA), and the IdP hands your SP a signed XML document called an **assertion** that says who the user is and what attributes they carry. SAML gives you single sign-on across many apps, central deprovisioning, and attribute-based identity — at the cost of some of the gnarliest XML validation work in the industry.",
      },
      {
        type: "analogy",
        heading: "A Notarized Letter of Introduction",
        content:
          "Picture a company that will not hand over anything to a stranger. A trusted notary examines the stranger's ID and, if satisfied, writes a **letter of introduction** describing the person and signs and seals it. The company accepts the stranger purely on the strength of the notary's seal.\n\nThat is SAML. The IdP is the notary, the assertion is the signed letter, and the seal is the XML digital signature. The company never had to call the notary for every visit, but it *must* check the seal carefully — a forged letter that looks right is the entire attack surface, because anyone can write convincing prose.",
      },
      {
        type: "text",
        heading: "Trust Bootstrap via Metadata",
        content:
          "Before anything works, the IdP and SP must exchange **metadata** — XML documents that advertise each party's entity id, endpoints (SSO, ACS, SLO), and, critically, the X.509 certificate used for signing. The SP pins the IdP's certificate; the IdP pins the SP's ACS URL and entity id.\n\nCertificate expiry here is a notorious outage source: when the IdP rotates its signing certificate, every SP that hardcoded the old certificate stops accepting assertions. Good deployments use metadata with a refresh path and accept a small rolling window where both the old and new certificates are trusted.",
      },
      {
        type: "text",
        heading: "Anatomy of an Assertion",
        content:
          "A SAML response wraps one or more assertions. Each assertion carries a **Subject** (the NameID, often an email or opaque persistent id), **Conditions** (NotBefore, NotOnOrAfter, and an AudienceRestriction naming your SP), an **AuthnStatement** (how and when the user authenticated), and an **AttributeStatement** (the claims: groups, roles, department).\n\nThe whole document is base64-encoded and delivered to your **Assertion Consumer Service (ACS)** endpoint. There are two bindings: the HTTP-Redirect binding, where the response rides in a query parameter, and the HTTP-POST binding, where the browser posts `SAMLResponse` to the ACS. Modern IdPs favour HTTP-POST because URLs are length-limited and leak into logs.",
      },
      {
        type: "code",
        heading: "The Shape of a SAML Response",
        language: "plaintext",
        label: "saml-response.xml",
        code: `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                 xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion>
    <saml:Issuer>https://idp.example.com</saml:Issuer>
    <ds:Signature>...</ds:Signature>          <!-- must cover the assertion -->
    <saml:Subject>
      <saml:NameID Format="urn:...:emailAddress">ada@example.com</saml:NameID>
    </saml:Subject>
    <saml:Conditions NotBefore="2026-11-15T09:00:00Z"
                     NotOnOrAfter="2026-11-15T09:05:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://app.example.com</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement SessionIndex="_a1b2c3" AuthnInstant="2026-11-15T09:00:02Z">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>...:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="groups">
        <saml:AttributeValue>finance</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`,
      },
      {
        type: "code",
        heading: "The HTTP-POST Binding at the ACS",
        language: "http",
        label: "acs-post.http",
        code: `POST /sso/acs HTTP/1.1
Host: app.example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 4821

SAMLResponse=PHNhbWxwOlJlc3BvbnNlIHhtbG5z...&RelayState=c9f1a2b3`,
      },
      {
        type: "comparison",
        heading: "SAML 2.0 vs OpenID Connect",
        headers: ["SAML 2.0", "OpenID Connect"],
        rows: [
          {
            aspect: "Payload",
            "SAML 2.0": "XML assertion, base64-encoded",
            "OpenID Connect": "JSON / JWT (compact or nested)",
          },
          {
            aspect: "Signature",
            "SAML 2.0": "XML Digital Signature (exclusive c14n)",
            "OpenID Connect": "JWS over the compact ID token",
          },
          {
            aspect: "Transport",
            "SAML 2.0": "HTTP-Redirect and HTTP-POST through the browser",
            "OpenID Connect":
              "Front-channel redirect plus back-channel token call",
          },
          {
            aspect: "Trust bootstrap",
            "SAML 2.0": "Metadata exchange with pinned X.509 certs",
            "OpenID Connect": "Discovery document plus a JWKS URL",
          },
          {
            aspect: "Best fit",
            "SAML 2.0": "Legacy enterprise IdPs (ADFS, Okta, Ping)",
            "OpenID Connect": "Modern web, mobile, and API-first apps",
          },
          {
            aspect: "Failure mode",
            "SAML 2.0": "XML Signature Wrapping and comment injection",
            "OpenID Connect": "Unverified issuer / audience or alg confusion",
          },
        ],
      },
      {
        type: "text",
        heading: "XML Signature Wrapping (XSW)",
        content:
          "The signature covers *some* node in the XML tree, but the application might read a *different* node. An attacker who can insert or reorder elements can keep a valid signature intact while adding a forged assertion that the parser actually consumes.\n\nVariants exist in two families: **XSW**, where a forged assertion is injected and the signed one is relocated, and **comment injection**, where a NameID like `admin@evil.com<!---->.example.com` truncates differently in the signature check than in the SAML parser. Both exploit the gap between *what was signed* and *what was read*. The only robust defense is to use a hardened SAML library, validate the signature over the exact assertion node you extract values from, and never roll your own XML canonicalization.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "A Valid Signature Is Not Enough",
        content:
          "Never parse a SAML assertion by string search or a generic XML parser and then check the signature separately. Attackers weaponize the difference between the signed element and the element your code reads. Validate the signature against the specific assertion node you pull the NameID and attributes from, reject any assertion with multiple candidate Subject nodes, and reject unsigned assertions outright. Use a battle-tested library rather than hand-rolled XML handling.",
      },
      {
        type: "text",
        heading: "SCIM: Provisioning Beyond Login",
        content:
          "SSO authenticates users at login but does not create or remove them. That is the job of **SCIM 2.0** (System for Cross-domain Identity Management), a REST/JSON standard the IdP calls to keep your user records in sync.\n\nWhen an employee is hired, the IdP pushes a `POST /Users`; when they change teams, a `PATCH`; when they leave, a `DELETE` or `active:false` that should revoke access immediately. Implementing SCIM correctly — idempotent creates, group membership events, and honoring deactivation — is what turns SSO from a login convenience into real central lifecycle management.",
      },
      {
        type: "steps",
        heading: "Validating a SAML Response",
        steps: [
          {
            title: "Confirm the binding and decode",
            detail:
              "Read the SAMLResponse form field, base64-decode it, and parse with a hardened, signature-aware SAML library.",
          },
          {
            title: "Verify the signature over the right node",
            detail:
              "Check the signature references the exact assertion you will read from, guarding against XML Signature Wrapping.",
          },
          {
            title: "Check the issuer and destination",
            detail:
              "The assertion issuer must be the trusted IdP, and the response Destination must match your ACS URL.",
          },
          {
            title: "Check the conditions",
            detail:
              "Reject if now is outside NotBefore/NotOnOrAfter, or if the AudienceRestriction does not name your entity id.",
          },
          {
            title: "Consume the subject and replay guard",
            detail:
              "Read the NameID, then record the assertion id so the same response cannot be replayed.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "SAML federates an enterprise IdP with your SP using signed XML assertions",
          "Bootstrap trust with metadata and pinned X.509 certs; plan for certificate rotation",
          "Validate the signature over the exact assertion node you read, using a hardened library",
          "Guard against XML Signature Wrapping and comment injection — a valid signature alone is not sufficient",
          "Run HTTP-POST to the ACS and enforce NotBefore, NotOnOrAfter, and AudienceRestriction",
          "Add SCIM for provisioning and deprovisioning so SSO also handles the account lifecycle",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In SAML terminology, which party authenticates the user and issues the assertion?",
        options: [
          "The Service Provider (SP)",
          "The Identity Provider (IdP)",
          "The Assertion Consumer Service (ACS)",
          "The browser",
        ],
        correctIndex: 1,
        explanation:
          "The IdP holds the directory and authenticates the user, then signs an assertion. The SP consumes it at its ACS endpoint. The browser only relays the response.",
      },
      {
        question:
          "What is the essence of an XML Signature Wrapping (XSW) attack?",
        options: [
          "Brute-forcing the IdP's signing key",
          "Replaying a captured response without modification",
          "Injecting a forged element while relocating the signed element, so the signature verifies but the app reads the forged data",
          "Downgrading TLS between the browser and the IdP",
        ],
        correctIndex: 2,
        explanation:
          "XSW exploits the gap between what the signature covers and what the application parses. A valid signature remains attached to the original node while a forged assertion is injected where the parser reads values.",
      },
      {
        question:
          "Which protocol handles user provisioning and deprovisioning rather than login itself?",
        options: ["SAML 2.0", "SCIM 2.0", "OAuth 2.0", "SAML Single Logout"],
        correctIndex: 1,
        explanation:
          "SCIM 2.0 is a REST/JSON standard the IdP uses to create, update, and deactivate user records. SSO handles authentication; SCIM handles the account lifecycle.",
      },
      {
        question:
          "Why is the HTTP-POST binding generally preferred over HTTP-Redirect for SAML responses?",
        options: [
          "It encrypts the assertion end to end",
          "It avoids URL length limits and keeps the assertion out of browser history and logs",
          "It removes the need for a signature",
          "It works without an IdP certificate",
        ],
        correctIndex: 1,
        explanation:
          "The Redirect binding puts a base64 assertion in the URL, which is length-limited and leaks into logs and history. POST carries the response in the body instead, and modern IdPs default to it.",
      },
    ],
  },

  // ─── TRANSPORT IDENTITY ─────────────────────────────────────────────────

  mtls: {
    slug: "mtls",
    title: "Mutual TLS (mTLS)",
    tagline: "Both sides present certificates — the network carries identity",
    sections: [
      {
        type: "text",
        heading: "TLS Proves the Server; mTLS Proves Both",
        content:
          "Standard TLS authenticates only the **server**: the client checks the server's certificate against a trusted CA, then both sides derive session keys. The client stays anonymous at the transport layer and proves itself later with a password or token.\n\n**Mutual TLS** extends the handshake so the server also demands and verifies a **client certificate**. Now authentication is cryptographic, bidirectional, and happens before a single byte of application data flows. In a service mesh or a zero-trust network, mTLS is how one workload proves its identity to another without sharing a long-lived API key.",
      },
      {
        type: "analogy",
        heading: "Two-Way ID Check",
        content:
          "At a bank's public branch, only the teller shows ID — that is server-only TLS. Walk into a restricted vault, however, and the guard checks *your* badge against the access list as well; the door does not open until both parties are satisfied.\n\nMutual TLS is that vault door. The service you call shows its certificate, and you show yours, each verifying the other against the issuing authority. An intruder with no valid badge never gets past the doorway, regardless of how convincing their request looks inside.",
      },
      {
        type: "text",
        heading: "The Handshake, Extended",
        content:
          "During the TLS handshake the server ends its `Certificate` message with a **CertificateRequest**. The client responds with its own certificate chain and a `CertificateVerify` message — a signature over the handshake transcript proving it holds the private key matching the certificate's public key.\n\nThe server then validates that client certificate against its configured CA bundle, checks the validity window, and checks purpose. Only then does the handshake complete. Every field matters: a certificate can be genuinely issued yet expired, revoked, or intended for a different purpose, and each of those must be rejected.",
      },
      {
        type: "code",
        heading: "Requiring a Client Certificate in Node",
        language: "typescript",
        label: "mtls-server.ts",
        code: `import { createServer } from "node:tls";
import { readFileSync } from "node:fs";

const server = createServer({
  key: readFileSync("/etc/tls/server.key"),
  cert: readFileSync("/etc/tls/server.crt"),
  // Demand a client certificate and verify it against our internal CA
  requestCert: true,
  rejectUnauthorized: true,
  ca: readFileSync("/etc/tls/internal-ca.pem"),
});

server.on("secureConnection", (socket) => {
  const peer = socket.getPeerCertificate();
  // Identity comes from the certificate SAN, not from a shared secret
  console.log("client CN:", peer.subject.CN, "serial:", peer.serialNumber);
});`,
      },
      {
        type: "text",
        heading: "Certificates and the PKI Behind Them",
        content:
          "A client certificate is only as good as the **Public Key Infrastructure** that issues it. An internal CA signs short-lived certificates for each workload, and the verifying side trusts that CA — not individual certificates. The identity lives in the **Subject** and, more importantly, the **Subject Alternative Name (SAN)** extension, which modern verification reads in preference to the legacy common name.\n\nRealistically you must run certificate rotation as a first-class process: issuance, distribution to the workload, reload without restart, and renewal well before expiry. A CA whose signing key is compromised invalidates every certificate it ever issued, so the CA key is the highest-value secret in the system and belongs in an HSM or KMS.",
      },
      {
        type: "comparison",
        heading: "Server-Only TLS vs Mutual TLS",
        headers: ["Server-only TLS", "Mutual TLS (mTLS)"],
        rows: [
          {
            aspect: "Who presents a cert",
            "Server-only TLS": "Only the server",
            "Mutual TLS (mTLS)": "Both the server and the client",
          },
          {
            aspect: "Client identity",
            "Server-only TLS": "Anonymous; proven later by password or token",
            "Mutual TLS (mTLS)": "Cryptographic, derived from the cert SAN",
          },
          {
            aspect: "Trust direction",
            "Server-only TLS": "Client trusts the server CA",
            "Mutual TLS (mTLS)": "Each side trusts the other's CA",
          },
          {
            aspect: "Primary use",
            "Server-only TLS": "Public web and browser traffic",
            "Mutual TLS (mTLS)":
              "Service-to-service, zero-trust meshes, partner APIs",
          },
          {
            aspect: "Operational cost",
            "Server-only TLS": "One certificate fleet to renew",
            "Mutual TLS (mTLS)": "A lifecycle for every workload identity",
          },
          {
            aspect: "Failure mode",
            "Server-only TLS": "Expired server cert causes an outage",
            "Mutual TLS (mTLS)":
              "Expired client certs or unenforced revocation flood errors",
          },
        ],
      },
      {
        type: "code",
        heading: "Issuing a Short-Lived Client Certificate",
        language: "bash",
        label: "issue-client-cert.sh",
        code: `# 1. Generate a key and signing request for the workload
openssl req -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes \\
  -keyout svc.key -out svc.csr -subj "/CN=payments.internal"

# 2. Sign it with the internal CA, with a bounded lifetime
openssl x509 -req -in svc.csr -CA internal-ca.crt -CAkey internal-ca.key \\
  -CAcreateserial -days 7 -out svc.crt

# 3. Inspect subject, issuer and validity before shipping it
openssl x509 -in svc.crt -noout -subject -issuer -dates`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Long-Lived Certificates Are the Real Risk",
        content:
          "A certificate with a two-year lifetime is effectively never rotated, and revocation is slow and unreliable — a CRL may be stale and OCSP may be unavailable or fail-open. Keep workload certificates short-lived (hours to days) so expiry, not revocation, does the retiring, and automate renewal so a lapse never pages anyone. Treat the CA private key as the crown jewel: if it leaks, every certificate it signed is suspect and the trust root must be rebuilt.",
      },
      {
        type: "text",
        heading: "Service Identity with SPIFFE and SPIRE",
        content:
          "Managing certificates by hand does not scale to thousands of pods. **SPIFFE** (Secure Production Identity Framework for Everyone) defines a standard identity format, the **SPIFFE ID**, like `spiffe://cluster.example/ns/payments/sa/api`, carried in the SAN of a short-lived X.509 SVID certificate.\n\n**SPIRE** is the reference implementation: it attests a workload (by Kubernetes service account, cloud instance identity, or another proof), then automatically issues, rotates, and delivers short-lived certificates. The running process just watches a Unix socket for its current certificate. This pairs naturally with a service mesh — Istio and Linkerd both use SPIFFE-style identities to give every service a verifiable mTLS identity without a shared secret anywhere.",
      },
      {
        type: "steps",
        heading: "Rotating Client Certificates Without Downtime",
        steps: [
          {
            title: "Trust both old and new roots first",
            detail:
              "Distribute the new CA to every verifier before any leaf certificate changes, so both chains validate during the transition.",
          },
          {
            title: "Issue the new leaf certificates",
            detail:
              "Generate fresh keys and certificates with the new CA and a short lifetime for each workload.",
          },
          {
            title: "Reload without restarting",
            detail:
              "Have the server and client watch the certificate files or an agent socket and swap them on change.",
          },
          {
            title: "Drain the old chain",
            detail:
              "Once every peer presents the new certificate, remove the old CA from the trust bundle.",
          },
          {
            title: "Measure expiry, do not guess",
            detail:
              "Alert on certificate lifetime remaining so renewal happens long before the first expiry error appears in production.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "mTLS authenticates both ends of a connection cryptographically, before any application data flows",
          "Verify the client certificate against a specific CA, checking validity window and key usage",
          "Derive workload identity from the certificate SAN, not the legacy common name",
          "Keep workload certificates short-lived and automate rotation and reload",
          "Treat revocation as best-effort; short lifetimes, not CRLs, are the reliable defense",
          "Use SPIFFE/SPIRE and a service mesh to issue and rotate identities at scale",
        ],
      },
    ],
    quiz: [
      {
        question: "What does mutual TLS add over standard server-only TLS?",
        options: [
          "It encrypts the payload twice",
          "It requires the client to present and prove possession of a certificate the server verifies",
          "It replaces the need for certificates entirely",
          "It moves authentication to the application layer",
        ],
        correctIndex: 1,
        explanation:
          "In mTLS the server sends a CertificateRequest and verifies the client's certificate and its CertificateVerify signature. The client's identity is established at the transport layer before application data flows.",
      },
      {
        question:
          "Which part of a client certificate should be used to derive the workload identity?",
        options: [
          "The serial number only",
          "The Subject Alternative Name (SAN)",
          "The certificate expiry date",
          "The issuance timestamp",
        ],
        correctIndex: 1,
        explanation:
          "Modern verification reads identity from the SAN, which is where SPIFFE IDs and DNS names live. The legacy common name is deprecated for identity purposes and must not be the sole source.",
      },
      {
        question:
          "Why are short-lived workload certificates preferred over long-lived ones?",
        options: [
          "They are cheaper to sign",
          "They make certificate revocation reliable by letting expiry-does-the-retiring",
          "They remove the need for a CA",
          "They disable the need for private keys",
        ],
        correctIndex: 1,
        explanation:
          "Revocation via CRL or OCSP is slow and often fail-open. Short lifetimes mean a certificate naturally stops being valid quickly, so compromise has a bounded window without depending on revocation infrastructure.",
      },
      {
        question: "What role does SPIRE play in a SPIFFE-based deployment?",
        options: [
          "It proxies HTTP traffic between services",
          "It stores application secrets in a vault",
          "It attests workloads and issues, rotates, and delivers short-lived identity certificates",
          "It terminates TLS at the edge",
        ],
        correctIndex: 2,
        explanation:
          "SPIFFE defines the identity format; SPIRE is the reference implementation that attests a workload's identity and then issues and rotates short-lived X.509 SVIDs, removing manual certificate handling.",
      },
    ],
  },

  // ─── AUTHORIZATION ──────────────────────────────────────────────────────

  "authorization-models": {
    slug: "authorization-models",
    title: "Authorization Models (RBAC/ABAC)",
    tagline: "Who can do what, on which resource, under what conditions",
    sections: [
      {
        type: "text",
        heading: "Authentication Answers Who; Authorization Answers What",
        content:
          "Once you know *who* the caller is, you must decide *what* they may do. Authorization is the set of rules that turns an identity and a request into allow or deny. Getting it wrong is how one customer reads another customer's data — the most damaging class of backend bug.\n\nThe models form a spectrum. **RBAC** assigns permissions to roles. **ABAC** evaluates attributes and policies. **ReBAC** reasons over relationships in a graph. Most production systems blend them: RBAC for coarse access, ABAC for contextual conditions, ReBAC for per-object sharing.",
      },
      {
        type: "analogy",
        heading: "Airport Badges vs Contextual Screening",
        content:
          "At an airport, a staff badge gets you through the door marked for your clearance level — that is **RBAC**: your role decides which doors open. But some areas want more: you may only enter the hangar during your shift, with the right training, on an aircraft type you are certified for.\n\nThat contextual check is **ABAC** — the decision depends on attributes of the person, the resource, and the situation. And if a visitor must be escorted by a specific named host, the grant depends on a *relationship*, which is **ReBAC**. Real systems stack all three.",
      },
      {
        type: "text",
        heading: "RBAC: Roles and Permissions",
        content:
          'Role-Based Access Control centres on three tables: **users**, **roles**, and **permissions**, joined by user-to-role and role-to-permission mappings. A user is granted access because they hold a role, not because of who they individually are.\n\nRBAC is easy to reason about and audit. Its failure mode is **role explosion**: teams keep needing one more narrow role, and the table grows to hundreds of overlapping entries nobody can untangle. Role hierarchy (roles inheriting from roles) and role composition help, but RBAC alone cannot express "you may edit this document only if you are its owner."',
      },
      {
        type: "code",
        heading: "An RBAC Schema",
        language: "sql",
        label: "rbac.sql",
        code: `CREATE TABLE roles (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE permissions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action        TEXT NOT NULL,          -- e.g. 'invoice:read'
  resource_type TEXT NOT NULL,          -- e.g. 'invoice'
  UNIQUE (action, resource_type)
);

CREATE TABLE role_permissions (
  role_id       BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);`,
      },
      {
        type: "text",
        heading: "ABAC and ReBAC",
        content:
          "**Attribute-Based Access Control** writes policies over attributes: subject attributes (department, clearance), resource attributes (classification, owner), action, and environment (time, IP, MFA status). A policy engine evaluates them and returns a decision. This expresses nuance RBAC cannot, at the cost of needing an authoritative source for every attribute and watching evaluation latency.\n\n**Relationship-Based Access Control**, popularized by Google's **Zanzibar**, models access as a graph of relationship tuples like `document:readme#viewer@user:ada`. A check walks the graph — is ada a viewer of readme, directly or through a group or a parent folder? — and answers in milliseconds even across billions of tuples. It powers Google Drive-style sharing at global scale and is the model behind OpenFGA and SpiceDB.",
      },
      {
        type: "code",
        heading: "A Policy Decision Point",
        language: "typescript",
        label: "authorize.ts",
        code: `type Decision = "allow" | "deny";

// Central decision call: never scatter "if user.role === 'admin'" through handlers
async function authorize(input: {
  principal: { id: string; department: string; mfa: boolean };
  action: string;
  resource: { ownerId: string; department: string; classification: string };
}): Promise<Decision> {
  const res = await fetch("http://localhost:8181/v1/data/payments/allow", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const { result } = (await res.json()) as { result: boolean };
  return result ? "allow" : "deny";
}`,
      },
      {
        type: "comparison",
        heading: "RBAC vs ABAC vs ReBAC",
        headers: ["RBAC", "ABAC", "ReBAC"],
        rows: [
          {
            aspect: "Core unit",
            RBAC: "A role assigned to a subject",
            ABAC: "Attributes of subject, resource, context",
            ReBAC: "Relationships between subject and object",
          },
          {
            aspect: "Question answered",
            RBAC: "Is this user an admin?",
            ABAC: "Do the attributes satisfy the policy?",
            ReBAC: "Is this user a viewer of this document?",
          },
          {
            aspect: "Granularity",
            RBAC: "Coarse, role-level",
            ABAC: "Fine, condition-level",
            ReBAC: "Per-object relationships",
          },
          {
            aspect: "Scales to",
            RBAC: "Thousands of roles at most",
            ABAC: "Complex conditional policies",
            ReBAC: "Google-scale sharing graphs",
          },
          {
            aspect: "Typical tooling",
            RBAC: "Role and permission tables with joins",
            ABAC: "OPA, Cedar, AWS IAM policies",
            ReBAC: "Zanzibar, OpenFGA, SpiceDB",
          },
          {
            aspect: "Failure mode",
            RBAC: "Role explosion",
            ABAC: "Policy sprawl and evaluation latency",
            ReBAC: "Tuple consistency and deep-check fan-out",
          },
        ],
      },
      {
        type: "text",
        heading: "Policy Engines: OPA and Cedar",
        content:
          "Rather than hardcoding rules in each service, you can externalize them into a **policy engine**. **OPA (Open Policy Agent)** evaluates policies written in Rego and answers data queries; you run it as a sidecar or library and feed it a JSON `input`. **Cedar**, from AWS, is a purpose-built policy language with a formal model designed to be analysable and fast.\n\nA policy engine gives you one place to change, test, and version authorization, and it lets you run the same decision in the request path (enforcement) or offline (audit). The trade-off is another hop and another system to operate — introduce it when policy complexity has outgrown a handful of `if` statements, not before.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Decide Centrally, Enforce in the Path",
        content:
          "Whatever model you choose, separate the **policy decision point** (where the allow/deny is computed) from the **policy enforcement point** (where the request is actually allowed or blocked). The decision is made in one place; enforcement happens in every service that touches the resource. Central decision making prevents rules from drifting apart, while in-path enforcement ensures nothing bypasses the check. Default to deny and make every permit explicit.",
      },
      {
        type: "steps",
        heading: "Choosing and Adopting a Model",
        steps: [
          {
            title: "Map the questions",
            detail:
              "List the actual access questions the product asks — role checks, ownership, sharing, conditions — before picking a model.",
          },
          {
            title: "Start with RBAC for the coarse layer",
            detail:
              "Model stable job functions as roles and keep them few and auditable.",
          },
          {
            title: "Add ABAC for context",
            detail:
              "Express conditions like department, time, or MFA status as policies evaluated by a central engine.",
          },
          {
            title: "Introduce ReBAC for sharing",
            detail:
              "When per-object sharing appears, store relationship tuples and check the graph with a Zanzibar-style service.",
          },
          {
            title: "Enforce everywhere, default deny",
            detail:
              "Route every resource access through the decision point and fail closed when the decision cannot be made.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Authentication establishes identity; authorization decides what that identity may do",
          "RBAC is simple and auditable but suffers role explosion as requirements get finer",
          "ABAC adds contextual policy at the cost of needing authoritative attributes and a central engine",
          "ReBAC, as in Google Zanzibar, models per-object sharing as a relationship graph",
          "Externalize complex policy into OPA or Cedar rather than scattering rules across services",
          "Separate the decision point from the enforcement point, and always default to deny",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the classic scaling failure of a pure RBAC model?",
        options: [
          "It cannot authenticate users",
          "Role explosion — hundreds of narrow, overlapping roles that are impossible to audit",
          "It leaks the signing key",
          "It cannot be stored in a relational database",
        ],
        correctIndex: 1,
        explanation:
          "As access requirements grow finer, teams keep adding narrow roles until the table becomes an unmanageable, overlapping tangle. RBAC also cannot natively express rules like owner-only editing.",
      },
      {
        question:
          'Which access model is best suited to per-object sharing such as "this user may view this specific document"?',
        options: [
          "RBAC",
          "ABAC",
          "ReBAC (relationship-based), as in Google Zanzibar",
          "Static IP allow-listing",
        ],
        correctIndex: 2,
        explanation:
          "ReBAC stores relationship tuples between subjects and objects and answers checks by walking that graph, which is exactly how document-level sharing works at scale in Zanzibar-style systems.",
      },
      {
        question:
          "In an ABAC system, what does the policy engine evaluate to reach a decision?",
        options: [
          "Only the user's role name",
          "Attributes of the subject, resource, action, and environment",
          "The user's password hash",
          "The order of rows in the permissions table",
        ],
        correctIndex: 1,
        explanation:
          "ABAC policies are evaluated against attributes of the subject (department, clearance), the resource (owner, classification), the action, and the environment (time, MFA), letting context shape the decision.",
      },
      {
        question:
          "What is the benefit of separating the policy decision point from the policy enforcement point?",
        options: [
          "It removes the need for authentication",
          "Rules are computed in one place while enforcement happens wherever a resource is touched",
          "It makes policies run faster than any other design",
          "It eliminates the need to default to deny",
        ],
        correctIndex: 1,
        explanation:
          "A single decision point keeps rules consistent and versioned, while in-path enforcement ensures every service checks before granting access. The two combine to prevent both drift and bypass.",
      },
    ],
  },

  // ─── SECRETS & KEYS ─────────────────────────────────────────────────────

  "secrets-management": {
    slug: "secrets-management",
    title: "Secrets & Key Management",
    tagline:
      "Storing, brokering and rotating the credentials you cannot hardcode",
    sections: [
      {
        type: "text",
        heading: "A Secret Is a Lifecycle, Not a Config Value",
        content:
          "A database password, an API key, a private signing key — these are **secrets**, and mishandling them is one of the most common causes of breaches. Secrets get committed to git, pasted into tickets, printed in CI logs, and baked into container images, then left unchanged for years.\n\nTreating secrets as a lifecycle changes the design. You must decide where they are **stored**, who is **authorized** to retrieve them, how they are **rotated**, and what happens when one **leaks**. Centralized secret stores, envelope encryption, and short-lived credentials replace the string-in-an-env-var pattern.",
      },
      {
        type: "analogy",
        heading: "The Bank Vault and the Valet Key",
        content:
          "Money does not sit in a desk drawer; it sits in a bank vault that records every entry and exit. And when you hand your car to a valet, you give them a key that starts the engine but will not open the trunk or the glovebox.\n\nA secrets manager is the vault — access is authenticated, authorized, and audited. Envelope encryption is the valet key — the master key never leaves the vault, and the workload only ever holds a wrapped, scoped data key it can use but not abuse. The goal in both cases is to shrink what a single leaked credential can do.",
      },
      {
        type: "text",
        heading: "The Four Pillars",
        content:
          "Secret management has four distinct jobs, and mixing them up causes confusion.\n\n**Storage**: a secrets store (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager) holds values encrypted at rest, with access control and audit logging. **Key management**: a KMS holds and guards *encryption keys*, never exposing the root key material. **Brokering**: the store issues credentials on demand to authenticated workloads. **Transit**: a service performs encryption, decryption, or signing on your behalf so plaintext keys never reach the application. A mature platform uses all four.",
      },
      {
        type: "text",
        heading: "Envelope Encryption with a KMS",
        content:
          "You cannot encrypt every record directly with a KMS key — network round-trips and KMS size limits make that impractical. Instead you use **envelope encryption**: ask the KMS to generate a **data key** (a plaintext key plus its wrapped copy), encrypt your payload locally with the plaintext data key, discard it, and store only the ciphertext plus the *wrapped* key.\n\nTo decrypt, you send the wrapped key back to the KMS, which unwraps it, and decrypt locally. The master key never leaves the KMS, and the data key exists in plaintext only in memory. Rotating the master key re-wraps data keys without re-encrypting the payloads.",
      },
      {
        type: "code",
        heading: "Envelope Encryption with a KMS",
        language: "typescript",
        label: "envelope.ts",
        code: `import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from "@aws-sdk/client-kms";
import { createCipheriv, createDecipheriv } from "node:crypto";

const kms = new KMSClient({});

// Encrypt: get a data key, encrypt locally, store ciphertext + wrapped key
export async function seal(plaintext: Buffer) {
  const { Plaintext, CiphertextBlob } = await kms.send(
    new GenerateDataKeyCommand({ KeyId: "alias/app-data", KeySpec: "AES_256" }),
  );

  const iv = Buffer.alloc(12);
  const cipher = createCipheriv("aes-256-gcm", Plaintext!, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  // The payload never leaves the app; only the wrapped data key touches the KMS
  return {
    wrappedKey: CiphertextBlob!,
    iv,
    tag: cipher.getAuthTag(),
    ciphertext,
  };
}

// Decrypt: unwrap the data key via the KMS, then decrypt locally
export async function open(sealed: Awaited<ReturnType<typeof seal>>) {
  const { Plaintext } = await kms.send(
    new DecryptCommand({ CiphertextBlob: sealed.wrappedKey }),
  );
  const decipher = createDecipheriv("aes-256-gcm", Plaintext!, sealed.iv);
  decipher.setAuthTag(sealed.tag);
  return Buffer.concat([decipher.update(sealed.ciphertext), decipher.final()]);
}`,
      },
      {
        type: "comparison",
        heading: "Static vs Dynamic Secrets",
        headers: ["Static secrets", "Dynamic secrets"],
        rows: [
          {
            aspect: "Lifetime",
            "Static secrets": "Long-lived until someone rotates them",
            "Dynamic secrets": "Short-lived, generated on demand",
          },
          {
            aspect: "Blast radius",
            "Static secrets": "The whole credential if it leaks",
            "Dynamic secrets": "Scoped to one lease and role",
          },
          {
            aspect: "Revocation",
            "Static secrets": "Rotate and redeploy everything",
            "Dynamic secrets": "Revoke the lease immediately",
          },
          {
            aspect: "Audit",
            "Static secrets": "Coarse: who read the store",
            "Dynamic secrets": "Per issue: who, when, which role",
          },
          {
            aspect: "Operational load",
            "Static secrets": "Manual rotation calendars",
            "Dynamic secrets": "Automated, but requires lease management",
          },
          {
            aspect: "Failure mode",
            "Static secrets": "Secrets end up in repos and CI logs",
            "Dynamic secrets": "Broker outage blocks new credential issuance",
          },
        ],
      },
      {
        type: "text",
        heading: "Dynamic Secrets",
        content:
          "The strongest pattern is to stop storing credentials altogether and **mint them on demand**. Vault's database secrets engine, for example, can create a fresh, uniquely named database user for a workload, hand back its password with a short lease (say one hour), and drop the user when the lease expires.\n\nThe result: no shared password, every credential tied to a specific requester and role, and revocation that is immediate and exact because the credential is disposable. The same idea applies to cloud IAM credentials, tokens, and SSH access. The cost is that the broker becomes critical infrastructure — if it is down, no new credentials can be issued, so it must be highly available.",
      },
      {
        type: "code",
        heading: "Reading Short-Lived Credentials from Vault",
        language: "bash",
        label: "vault-creds.sh",
        code: `# Each request mints a fresh, short-lived database user
vault read database/creds/app-readonly

# Key                Value
# ---                -----
# lease_id           database/creds/app-readonly/3f9c2b7e
# lease_duration     1h
# username           v-app-readonly-x8K2nQ
# password           A1b2C3d4E5f6G7h8

# Revoke immediately when a workload is torn down
vault lease revoke database/creds/app-readonly/3f9c2b7e`,
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Long-Lived Static Credentials Are the Real Breach Vector",
        content:
          "Almost every high-profile credential leak traced back to a static secret: an access key in a public repo, a database password in a Docker image, an API key in a CI log. Even with a secret store, a credential that never rotates is a time bomb. Prefer the shortest practical lifetime, rotate automatically, scope each secret to one purpose, and adopt dynamic secrets where a broker can issue them. Never log a secret, never echo it in a shell history, and scan repositories for committed keys.",
      },
      {
        type: "steps",
        heading: "Rolling Out Secrets Management",
        steps: [
          {
            title: "Inventory and classify",
            detail:
              "Find every secret, where it lives, who reads it, and how badly its leak would hurt.",
          },
          {
            title: "Centralize storage",
            detail:
              "Move secrets into a dedicated store with encryption at rest, access control, and audit logging.",
          },
          {
            title: "Authenticate workloads, not files",
            detail:
              "Let workloads obtain secrets via an identity (IAM role, service account, SPIFFE) rather than a baked-in token.",
          },
          {
            title: "Adopt envelope encryption",
            detail:
              "Guard the master key in a KMS/HSM and encrypt payloads with wrapped data keys the KMS can re-wrap.",
          },
          {
            title: "Automate rotation",
            detail:
              "Rotate on a schedule and on demand, reloading consumers without a restart.",
          },
          {
            title: "Move toward dynamic secrets",
            detail:
              "Replace shared credentials with on-demand, lease-bound, per-workload issuance where possible.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Treat secrets as a lifecycle: store, authorize, rotate, and plan for leakage",
          "Keep the master key in a KMS or HSM and never expose root key material to applications",
          "Use envelope encryption so payloads are encrypted locally with wrapped data keys",
          "Prefer dynamic, lease-bound secrets over long-lived static credentials",
          "Rotate automatically and reload consumers without downtime",
          "Never log, echo, or commit a secret — scan repos and CI output for leaks",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In envelope encryption, what actually encrypts the application payload?",
        options: [
          "The KMS master key directly",
          "A data key generated by the KMS and used locally by the application",
          "The TLS session key",
          "The user's password",
        ],
        correctIndex: 1,
        explanation:
          "The KMS generates a data key, the application encrypts the payload with it locally, then stores the ciphertext with the KMS-wrapped copy of the data key. The master key never leaves the KMS.",
      },
      {
        question:
          "What is the primary advantage of dynamic secrets over static ones?",
        options: [
          "They are faster to read",
          "They are short-lived and issued per request, shrinking the blast radius and enabling exact revocation",
          "They do not need encryption",
          "They never expire",
        ],
        correctIndex: 1,
        explanation:
          "Dynamic secrets are generated on demand with a bounded lease, tied to a specific requester and role. Leakage exposes only a soon-to-expire, narrowly scoped credential, and revocation is immediate.",
      },
      {
        question:
          "Why is the KMS master key kept inside the KMS/HSM rather than given to the application?",
        options: [
          "Because applications cannot read binary keys",
          "So that if the application is compromised the attacker cannot extract the root key material",
          "Because the KMS encrypts faster than the CPU",
          "To reduce storage costs",
        ],
        correctIndex: 1,
        explanation:
          "The KMS only performs wrap/unwrap and encrypt/decrypt operations, never exporting the root key. A compromised application can request operations but cannot steal the key that protects all data.",
      },
      {
        question:
          "A workload needs database credentials. Which practice best limits the damage if the workload is compromised?",
        options: [
          "Store a shared admin password in an environment variable",
          "Bake the password into the container image",
          "Have the workload authenticate and receive a short-lived, per-workload credential from a broker",
          "Email the credential to the on-call engineer",
        ],
        correctIndex: 2,
        explanation:
          "Broker-issued credentials are unique per workload, short-lived, and revocable by lease. A shared or baked-in credential leaks to everyone and lives far too long, maximizing the blast radius.",
      },
    ],
  },
};

