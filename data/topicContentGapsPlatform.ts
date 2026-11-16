// Gap content: Platform Engineering
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_PLATFORM: Record<string, TopicContent> = {
  // ─── CONFIGURATION ──────────────────────────────────────────────────────

  "config-management": {
    slug: "config-management",
    title: "Configuration Management",
    tagline: "Env vars, config as code, flags, and secrets",
    sections: [
      { type: "text", heading: "Config Is Anything That Varies", content: "The twelve-factor app draws a hard line: **config is everything that varies between deploys** — database URLs, API endpoints, log levels, feature switches, credentials. Code is everything that does not. The same artifact must run in dev, staging, and production without a rebuild; only its configuration changes.\n\nBaking configuration into the image or, worse, into source means each environment needs its own build, and you no longer test the artifact that ships. That is how a staging-tested build fails in production on a single hard-coded hostname." },
      { type: "analogy", heading: "The Mixing Desk", content: "A live sound engineer does not rebuild the mixing console for every venue. The instruments and the signal chain are fixed; the engineer adjusts faders and gains at soundcheck. The same performance plays in a small club or a stadium by moving sliders.\n\nConfiguration is the faders. The code — the signal chain — stays identical, and operators tune behaviour per environment with values that live outside the artifact, not with a soldering iron inside it." },
      { type: "text", heading: "Environment Variables vs Config Files", content: "**Environment variables** are the twelve-factor default. They are language-agnostic, visible to every process, easy to inject from a platform (Kubernetes Secrets, ECS task definitions, systemd), and keep secrets out of the repo. Their weakness is that they are flat strings: no nesting, no types, and they leak into crash dumps and subprocesses.\n\n**Config files** (YAML, JSON, TOML) handle structure — lists, nested maps, defaults — and are reviewable as a unit. The common production pattern: a checked-in config file holds non-secret defaults, and environment variables override or supply secrets at deploy time. Never read config at build time; read it once at startup into a typed object." },
      { type: "code", heading: "A Typed, Fail-Fast Config Loader", language: "typescript", label: "config.ts", code: `import { z } from 'zod';

// Validate the whole environment once at startup.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PAYMENTS_TIMEOUT_MS: z.coerce.number().int().default(2000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Crash immediately and loudly rather than failing deep in a request.
  console.error('Invalid configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = Object.freeze(parsed.data);
export type Config = typeof config;` },
      { type: "comparison", heading: "Where Configuration Lives", headers: ["Env Vars", "Config Files", "Remote Config"], rows: [
        { aspect: "Shape", "Env Vars": "Flat strings only", "Config Files": "Nested and typed (YAML or JSON)", "Remote Config": "Arbitrary structured document" },
        { aspect: "Change requires redeploy", "Env Vars": "Yes — restart to reload", "Config Files": "Yes — mounted at startup", "Remote Config": "No — polled at runtime" },
        { aspect: "Secret-safe", "Env Vars": "Yes, injected by the platform", "Config Files": "No, unless encrypted or mounted from a secret store", "Remote Config": "Depends on the store and its ACLs" },
        { aspect: "Reviewable in Git", "Env Vars": "Only non-secret values", "Config Files": "Yes, except secrets", "Remote Config": "Change history lives in the config service" },
        { aspect: "Best for", "Env Vars": "Secrets and per-environment endpoints", "Config Files": "Defaults and structured settings", "Remote Config": "Feature flags and live tuning" },
      ]},
      { type: "callout", calloutType: "warning", heading: "Secrets Are Not Configuration", content: "Treating a database password as just another config value is how credentials end up in a Git history that lives forever. Secrets need different handling: store them in a secret manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault), inject them at runtime, scope them with least privilege, and rotate them on a schedule. Keep them out of images, out of logs, and out of error reports. If a secret reaches a repository, rotate it — deleting the commit does not delete the copies." },
      { type: "text", heading: "Feature Flags: Config That Changes Behaviour", content: "A feature flag is configuration that decides whether a **code path runs**, not which value it uses. Flags decouple deploy from release: code ships dark behind a flag set to off, then is enabled for 1% of users, then ramped to 100%. Flags also drive kill switches (disable a fragile dependency instantly), entitlements (per-plan features), and experiments (A/B tests).\n\nThe risk is flag debt. A flag that stays in the codebase for years is a branch that never merges, and every flag multiplies the combinations you must reason about. Own every flag: give it an expiry date, a default, and a deletion ticket on the day it flips permanently on." },
      { type: "steps", heading: "Rolling Out a Dynamic Config Change Safely", steps: [
        { title: "Type and validate", detail: "Every config value has a schema with a default; invalid values fail at startup, not mid-request." },
        { title: "Separate secrets from config", detail: "Secrets come from a secret manager; everything else from env vars or a mounted file." },
        { title: "Version the change", detail: "Config changes go through the same review and Git history as code, or through an audited config service." },
        { title: "Canary the change", detail: "Apply the new value to one instance or one cohort first and watch error and latency metrics." },
        { title: "Make reloads atomic", detail: "Swap the whole config object at once; never mutate fields piecemeal under live traffic." },
        { title: "Expire and remove", detail: "Delete flags once fully rolled out, and prune config keys that nothing reads anymore." },
      ]},
      { type: "callout", calloutType: "gold", heading: "Config as Code in Practice", content: "Kubernetes ConfigMaps hold non-secret config and Secrets hold sensitive values, both injected as env vars or mounted as volumes. AWS AppConfig and LaunchDarkly push dynamic values and flags to running instances with validation and gradual rollout. The teams that stay healthy share three habits: a single typed config module every service imports, a strict rule that nothing reads process.env outside it, and a documented owner and expiry for every flag." },
      { type: "checklist", heading: "Key Takeaways", items: [
        "Config is everything that varies by environment; code is everything that does not",
        "The same artifact must run in every environment — config is injected, never baked in",
        "Environment variables suit secrets and flat values; config files carry structured defaults",
        "Validate all configuration once at startup and fail fast on invalid values",
        "Secrets belong in a secret manager with rotation — never in the image, repo, or logs",
        "Feature flags separate deploy from release, but every flag needs an owner and an expiry",
      ]},
    ],
    quiz: [
      { question: "According to the twelve-factor app, what counts as config?", options: ["Anything a developer edits locally", "Everything that varies between deploys, kept out of the code", "Only database credentials", "The build pipeline definition"], correctIndex: 1, explanation: "Twelve-factor defines config as everything that varies between deploys — endpoints, credentials, log levels, flags. Keeping it outside the artifact means one build runs unchanged in every environment." },
      { question: "Why should a service validate its entire configuration at startup?", options: ["To make startup faster", "So invalid or missing values crash immediately instead of failing mid-request", "To encrypt the config", "Because environment variables are always wrong"], correctIndex: 1, explanation: "Validating once at startup turns a missing or malformed value into an immediate, obvious crash. The alternative is a null-pointer or connection error deep inside a live request hours later with no clear cause." },
      { question: "What is the difference between deploy and release that feature flags enable?", options: ["Deploy pushes code to servers; release turns the feature on for users", "Release is automatic while deploy is manual", "They are the same thing", "Deploy is for databases and release is for APIs"], correctIndex: 0, explanation: "Deploying ships new code to production; a flag then controls whether users actually see the behaviour. Code can ship dark and be released later by flipping the flag, decoupling the risky act of shipping from the act of exposing it." },
      { question: "Why is storing a database password as a plain config value specifically a problem?", options: ["It slows the app down", "It ends up in Git history, images, and logs, where it persists and must be rotated", "It cannot be changed at runtime", "It breaks type checking"], correctIndex: 1, explanation: "Plain config values are copied into repositories, container images, and log lines, so a leaked secret persists in many places. Secrets belong in a secret manager, injected at runtime and rotated; once leaked, the only safe response is rotation." },
    ]
  },

  // ─── SUPPLY CHAIN ───────────────────────────────────────────────────────

  "container-registry": {
    slug: "container-registry",
    title: "Container Registries & Image Supply Chain",
    tagline: "Layers, digests, signing, scanning, and retention",
    sections: [
      { type: "text", heading: "A Registry Is a Content-Addressed Store", content: "A container registry stores and distributes images over the OCI Distribution spec. It is not a database of files: it is a **content-addressed blob store** keyed by SHA-256 digests, fronted by a manifest that names those blobs. Docker Hub, GitHub Container Registry (GHCR), Amazon ECR, Google Artifact Registry, and Azure Container Registry all speak the same protocol, so the same client commands work everywhere.\n\nEach repository holds tags that point at manifests, and each manifest points at layer blobs plus a config blob. Because blobs are addressed by the hash of their contents, identical layers are stored and pulled exactly once no matter how many images share them. That deduplication is why a base image update can add a few hundred megabytes while ten of your services each add only tens." },
      { type: "analogy", heading: "The Shipping Terminal", content: "A port terminal stores standardized containers in stacks and moves them by crane. It does not care what is inside; it cares about the container ID and where it goes. The same crate loads onto any ship, truck, or train that speaks the standard.\n\nA registry is that terminal for images. The layers are the standardized containers, the manifest is the shipping document listing them, and the digest is the tamper-evident seal. Pulling an image is lifting that exact, sealed set of containers onto another machine." },
      { type: "text", heading: "Layers, Manifests, and Digests", content: "An image is a stack of **layers**, each an immutable filesystem diff produced by a Dockerfile instruction. A **manifest** lists the config blob and the ordered layers with their media types. A **tag** is a human-readable pointer such as `payments-api:1.4.2` or `payments-api:latest`, and it is mutable — the same tag can point at a different manifest tomorrow.\n\nA **digest** is the SHA-256 hash of the manifest, written as `sha256:abc...`. It is immutable: a given digest always resolves to exactly the same image, byte for byte. Tags are for humans; digests are for machines that need to know they are deploying the same artifact every time." },
      { type: "code", heading: "Build, Push by Tag, then Deploy by Digest", language: "bash", label: "registry.sh", code: `# Build multi-arch and push both a readable tag and an immutable digest.
docker buildx build --platform linux/amd64,linux/arm64 \\
  -t ghcr.io/acme/payments-api:1.4.2 --push .

# Read back the digest the tag now points to.
docker buildx imagetools inspect ghcr.io/acme/payments-api:1.4.2

# Deploy by digest so the running artifact can never silently change.
kubectl set image deployment/payments-api \\
  payments-api=ghcr.io/acme/payments-api@sha256:2f8a1c9d...` },
      { type: "comparison", heading: "Tag vs Digest", headers: ["Tag", "Digest"], rows: [
        { aspect: "Mutability", Tag: "Mutable — can be repointed anytime", Digest: "Immutable — content is fixed forever" },
        { aspect: "Readability", Tag: "Human-friendly, such as 1.4.2", Digest: "Opaque SHA-256 hash" },
        { aspect: "Guarantee", Tag: "Value may drift between pulls", Digest: "Byte-for-byte identical every pull" },
        { aspect: "Rollback", Tag: "Re-tag or redeploy an older tag", Digest: "Redeploy the exact digest" },
        { aspect: "Best practice", Tag: "Use for human reference and CI output", Digest: "Use for what actually runs in production" },
      ]},
      { type: "text", heading: "The Image Supply Chain", content: "Your production image is assembled from a base image you did not build, OS packages you did not audit, and open-source libraries you did not write. The supply chain is the path from those upstreams to the running container — and every link is an attack surface.\n\nHardening it means four things: **scan** images for known CVEs (Trivy, Grype, or the registry built-in scanner) and fail the pipeline above a severity threshold; generate a **SBOM** (SPDX or CycloneDX) so you have an inventory when the next Log4Shell lands; **sign** images with Sigstore cosign so only artifacts your pipeline produced can be deployed; and enforce it with an **admission controller** such as Kyverno or OPA Gatekeeper that rejects unsigned or unscanned images." },
      { type: "code", heading: "Sign, Attest, and Verify with cosign", language: "bash", label: "supply-chain.sh", code: `# Generate an SBOM and attach it to the image in the registry.
syft ghcr.io/acme/payments-api@sha256:2f8a1c9d... -o spdx-json > sbom.spdx.json
cosign attest --predicate sbom.spdx.json --type spdxjson \\
  ghcr.io/acme/payments-api@sha256:2f8a1c9d...

# Sign the image keylessly, using the CI runner OIDC identity.
cosign sign ghcr.io/acme/payments-api@sha256:2f8a1c9d...

# In the cluster, verify the signature before admitting the pod.
cosign verify ghcr.io/acme/payments-api@sha256:2f8a1c9d... \\
  --certificate-identity-regexp '^https://github.com/acme/' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com` },
      { type: "callout", calloutType: "danger", heading: "Mutable Tags Break Reproducibility", content: "Deploying a mutable tag such as `latest` means you cannot answer the simplest incident question: what code is actually running? The tag could have been repointed since the last pull, and two pods of the same deployment may even hold different images if a node cached an older pull. Pull-by-digest is the fix — the scheduler gets exactly the bits you signed. This is also why immutable repositories (ECR image tag mutability set to IMMUTABLE) are worth enabling: they make an accidental overwrite impossible." },
      { type: "steps", heading: "Promoting an Image from Build to Production", steps: [
        { title: "Build once", detail: "Produce a single image with your CI pipeline; never rebuild it per environment." },
        { title: "Push to a dev-only repository", detail: "Tag with the commit SHA, push, and record the resulting digest." },
        { title: "Scan and gate", detail: "Run the CVE scan and fail the build if it exceeds the severity threshold." },
        { title: "Sign and attach the SBOM", detail: "cosign-sign with the CI identity and attach the SBOM as an attestation." },
        { title: "Promote by retag or copy", detail: "Move the same digest to staging then prod repositories — promote the digest, not a fresh build." },
        { title: "Deploy by digest", detail: "Reference the digest in the manifest so the running artifact is exactly what was signed." },
      ]},
      { type: "callout", calloutType: "gold", heading: "Retention and Cost Control", content: "Registries bill for storage and egress, and untagged layers accumulate forever if you never prune. Set lifecycle policies: keep the last N tagged releases per repository, delete untagged manifests after 14 days, and never garbage-collect a digest a running deployment still references. Amazon ECR lifecycle policies and Artifact Registry cleanup policies automate this. Remember that pull traffic is also egress — nodes in another region or outside the cloud pay per gigabyte, so run an in-region pull-through cache for base images." },
      { type: "checklist", heading: "Key Takeaways", items: [
        "A registry is a content-addressed blob store, so layers dedupe by digest",
        "Tags are mutable human pointers; digests are immutable and prove what runs",
        "Deploy by digest so the running artifact can never silently change",
        "Scan images for CVEs and generate an SBOM on every build",
        "Sign images with cosign and verify signatures with an admission controller",
        "Set retention policies and watch egress: keep recent tags, expire untagged images",
      ]},
    ],
    quiz: [
      { question: "Which identifier guarantees you deploy the exact same image bytes every time?", options: ["A semantic tag such as 1.4.2", "The latest tag", "The manifest digest (sha256:...)", "The repository name"], correctIndex: 2, explanation: "A digest is the SHA-256 hash of the manifest, so it is immutable and always resolves to the same content. Tags are mutable pointers that can be repointed to a different manifest between pulls." },
      { question: "Why is deploying the mutable latest tag dangerous?", options: ["It uses more storage", "The tag can be repointed, so you cannot tell what code is running", "It disables layer caching", "Kubernetes cannot pull it"], correctIndex: 1, explanation: "Because a mutable tag can change at any time, the running image may not match what you tested or audited. Deploying by digest pins the exact bytes and makes the running artifact provable." },
      { question: "What is an SBOM used for?", options: ["Compressing image layers", "An inventory of components so you can respond when a dependency is found vulnerable", "Encrypting the image at rest", "Choosing which nodes run the pod"], correctIndex: 1, explanation: "A Software Bill of Materials lists every component and version baked into an image. When a new CVE is disclosed, you can query SBOMs to find which images are affected instead of rebuilding everything to guess." },
      { question: "Why does the registry store ten services sharing a base image so efficiently?", options: ["It compresses every image into one file", "Layers are content-addressed, so identical layers are stored and pulled once", "It keeps only the newest image", "It stores only the diffs between images"], correctIndex: 1, explanation: "Blobs are addressed by the hash of their content, so the shared base layers exist once in storage and are pulled once on the node. Each service only adds its own thin layers on top." },
    ]
  },

  // ─── COST ───────────────────────────────────────────────────────────────

  "finops": {
    slug: "finops",
    title: "Cloud Cost & FinOps",
    tagline: "Cost visibility, allocation, right-sizing, and unit economics",
    sections: [
      { type: "text", heading: "FinOps Is an Operating Model", content: "FinOps is the practice of bringing financial accountability to variable cloud spend: engineers, finance, and product share ownership of the bill. In a data centre the cost is fixed and paid up front; in the cloud every autoscale, every forgotten volume, and every cross-region copy is a line item that can grow while no one is watching.\n\nThe goal is not to spend the least — it is to spend **deliberately**, trading cost against speed and reliability with data. The FinOps Foundation frames it as a loop: inform (visibility), optimize (act on the data), operate (make it continuous)." },
      { type: "analogy", heading: "The Electricity Meter", content: "A household cannot cut its power bill without a meter and a breakdown. Knowing the total is not enough — you need to see that heating is half the bill, that a hot tub runs all night, and that the old fridge is inefficient.\n\nCloud cost works the same way: an untagged account shows one large number with no attribution. Tagging is the meter per room, cost allocation is the itemized bill, and right-sizing is turning off the appliances you are heating an empty house with." },
      { type: "text", heading: "Visibility Requires Tagging and Allocation", content: "You cannot optimize what you cannot attribute. Every resource should carry tags for **owner (team), environment, service, and cost centre**. Those tags flow into the billing export, letting you answer 'which service drove the 30% increase last month?' instead of arguing over a single account total.\n\nThe two hardest problems are untagged resources and shared costs. Enforce tagging with policy (AWS Config rules, Service Control Policies, Terraform modules that add a default tag set) and reject resources without them. For shared infrastructure — a NAT gateway, a load balancer, a shared database — allocate by usage or split proportionally, and document the rule so chargeback is trusted." },
      { type: "code", heading: "Cost by Team and Service from an AWS CUR", language: "sql", label: "cost-by-team.sql", code: `-- AWS Cost and Usage Report, queried in Athena.
SELECT
  resource_tags_user_team        AS team,
  line_item_product_code         AS service,
  ROUND(SUM(line_item_unblended_cost), 2) AS month_cost
FROM cur_db.cur_table
WHERE line_item_usage_start_date >= date_trunc('month', current_date - interval '1' month)
GROUP BY 1, 2
HAVING SUM(line_item_unblended_cost) > 1000
ORDER BY month_cost DESC;

-- Untagged spend is the leak to hunt first.
SELECT ROUND(SUM(line_item_unblended_cost), 2) AS untagged_cost
FROM cur_db.cur_table
WHERE resource_tags_user_team IS NULL;` },
      { type: "comparison", heading: "Compute Purchasing Options", headers: ["On-Demand", "Reserved / Savings Plans", "Spot"], rows: [
        { aspect: "Discount vs on-demand", "On-Demand": "Baseline", "Reserved / Savings Plans": "Up to about 72%", Spot: "Up to about 90%" },
        { aspect: "Commitment", "On-Demand": "None", "Reserved / Savings Plans": "1 or 3 years (savings plans can be 1 year)", Spot: "None — interruptible" },
        { aspect: "Interruption risk", "On-Demand": "None", "Reserved / Savings Plans": "None", Spot: "High — reclaimed with a two-minute notice" },
        { aspect: "Best for", "On-Demand": "Spiky or unknown workloads", "Reserved / Savings Plans": "Steady-state baseline", Spot: "Batch, CI, stateless and fault-tolerant jobs" },
        { aspect: "Billing model", "On-Demand": "Per second or hour, pay as you go", "Reserved / Savings Plans": "Hourly commitment regardless of use", Spot: "Per second at the current spot price" },
      ]},
      { type: "text", heading: "Right-Sizing Beats Buying", content: "The cheapest instance is the one you do not need. Right-sizing is matching provisioned resources to actual demand: an instance running at 8% CPU is a candidate for a smaller one, and over-provisioned memory requests in Kubernetes hold node capacity you pay for but never use. Tools like AWS Compute Optimizer, GCP Recommender, and Kubernetes VPA recommendations surface the gap, but someone must act on them.\n\nIdle waste is the same problem in disguise: unattached EBS volumes, idle load balancers, old snapshots, orphaned elastic IPs, and non-production environments left running overnight. A scheduled shutdown of dev and staging outside working hours commonly removes a third of non-prod spend with a single policy." },
      { type: "callout", calloutType: "warning", heading: "The Hidden Costs That Surprise Teams", content: "Compute is visible; data movement is not. **Egress** to the internet is billed per gigabyte and can dwarf compute for a media or API product. **NAT gateways** charge per gigabyte processed, so a chatty private subnet can rack up a surprisingly large bill. **Cross-AZ** and **cross-region** traffic is billed on both ends. **Serverless** bills per invocation and per GB-second, which is cheap at low volume and expensive at steady high volume. Model these before you commit, and put a budget alert on any account that can move large volumes of data." },
      { type: "steps", heading: "The FinOps Lifecycle", steps: [
        { title: "Inform", detail: "Get full visibility: tag every resource, export billing data, and build cost dashboards per team and service." },
        { title: "Allocate", detail: "Attribute shared costs by usage and establish chargeback so each team sees the cost of its own choices." },
        { title: "Set targets", detail: "Agree budgets, anomaly alerts, and a unit cost metric the business cares about." },
        { title: "Optimize", detail: "Right-size instances, delete idle resources, buy reserved capacity for the baseline, and move batch work to spot." },
        { title: "Operate", detail: "Automate: policies that enforce tags, scheduled shutdowns, and budget alerts that page the owner." },
        { title: "Review", detail: "Revisit monthly; commit cover against a shrinking baseline leaves you paying for capacity you no longer run." },
      ]},
      { type: "callout", calloutType: "gold", heading: "Unit Economics Is the Real Metric", content: "A total bill tells you nothing about health: spending can double while the business grows faster and the cost per order falls. Track cost per business unit — cost per active user, per thousand API calls, per order, per GB stored. Amazon Web Services, Etsy, and many SaaS firms report 'cost per' metrics to engineering because they expose regressions that totals hide. When the unit cost rises, investigate; when it falls, the architecture is getting more efficient. Reserve the total bill for the CFO and the unit cost for the engineers who can change it." },
      { type: "checklist", heading: "Key Takeaways", items: [
        "FinOps shares cost accountability across engineering, finance, and product",
        "You cannot optimize untagged spend — enforce owner, environment, and service tags",
        "Right-sizing and deleting idle resources usually beats buying at a discount",
        "Reserve capacity for the steady baseline and use spot for fault-tolerant batch work",
        "Egress, NAT, and cross-AZ traffic are the hidden costs that surprise teams",
        "Track cost per business unit — unit economics reveals health that totals hide",
      ]},
    ],
    quiz: [
      { question: "What is the primary purpose of tagging cloud resources?", options: ["To encrypt them", "To allocate cost to the team, environment, or product that owns them", "To make them faster", "To satisfy a compliance certificate automatically"], correctIndex: 1, explanation: "Tags flow into the billing export and let you attribute spend to an owner. Without them, an account shows one number with no way to tell which service or team caused an increase." },
      { question: "Which purchasing option trades a commitment for the largest discount on a steady-state workload?", options: ["On-demand", "Spot instances", "Reserved instances or savings plans", "Dedicated hosts"], correctIndex: 2, explanation: "Reserved capacity and savings plans commit to 1 or 3 years in exchange for up to roughly 72% off, which suits a predictable baseline. Spot is cheaper but interruptible, and on-demand carries no commitment and no discount." },
      { question: "Why can egress and NAT gateway costs surprise a team?", options: ["They are only billed annually", "They scale with data volume and are often left out of per-server estimates", "They are free below a threshold", "They apply only to storage"], correctIndex: 1, explanation: "Data transfer out and per-gigabyte NAT processing scale with traffic, not with instance count, so a modest fleet can generate large transfer bills. They are easy to overlook when sizing by server cost alone." },
      { question: "What does unit economics measure in FinOps?", options: ["The cost per server per month", "Cost per business unit, such as per order or per active user", "The total monthly bill", "The discount rate on reserved capacity"], correctIndex: 1, explanation: "Unit economics divides spend by a business measure — cost per order, per user, per thousand requests. It exposes inefficiency that a growing total bill can hide and gives engineers a metric they can actually influence." },
    ]
  },

  // ─── PLATFORM ENGINEERING ───────────────────────────────────────────────

  "platform-engineering": {
    slug: "platform-engineering",
    title: "Platform Engineering & IDPs",
    tagline: "Golden paths, self-service, and internal developer platforms",
    sections: [
      { type: "text", heading: "A Product for Your Own Developers", content: "Platform engineering builds an **internal developer platform (IDP)**: a curated set of tools, services, and automation that lets application teams ship without becoming experts in Kubernetes, CI, networking, and observability all at once. The platform team treats developers as customers and the platform as a product, with adoption and satisfaction as success measures.\n\nIt exists because the DevOps ideal — every team owns its full stack — collided with reality. Asking twenty product teams to each master cluster operations, image supply chains, and autoscaling produced inconsistent, fragile systems and burned enormous time on undifferentiated work. The platform absorbs that complexity so product teams can focus on the business." },
      { type: "analogy", heading: "The Road Network", content: "Nobody builds their own road, power line, and water main to reach a new house. A city provides shared infrastructure — paved roads, utilities, traffic rules — so residents can get where they are going without becoming civil engineers.\n\nA platform is that civic infrastructure for software. The **golden path** is the paved road: a route that is already built, safe, and lit, so the default way to ship a service is also the easy way. Teams can still go off-road, but they take on the maintenance themselves." },
      { type: "text", heading: "Golden Paths and Paved Roads", content: "A **golden path** is an opinionated, supported, end-to-end way to accomplish a common task: create a service, add a database, deploy to production, expose metrics. It comes with a template that generates working code, CI that builds and scans an image, a deployment pipeline, sensible dashboards, and alerts — wired together and proven in production.\n\nTwo rules separate a real golden path from a mandate. First, it must be the **easiest** option, not merely the approved one; if the paved road is slower than the shortcut, teams take the shortcut. Second, escape hatches must exist: teams with unusual needs can leave the path, they just lose the platform team's support for that piece. A golden path that cannot be deviated from becomes a bottleneck." },
      { type: "comparison", heading: "Ticket-Driven Ops vs Self-Service Platform", headers: ["Ticket-Driven Ops", "Self-Service Platform"], rows: [
        { aspect: "How developers provision", "Ticket-Driven Ops": "File a ticket and wait for the ops team", "Self-Service Platform": "Use a template or portal themselves" },
        { aspect: "Lead time", "Ticket-Driven Ops": "Days to weeks, queued behind others", "Self-Service Platform": "Minutes, no queue" },
        { aspect: "Ownership", "Ticket-Driven Ops": "Central ops team owns the result", "Self-Service Platform": "Product team owns its service on a supported platform" },
        { aspect: "Consistency", "Ticket-Driven Ops": "Varies with whoever handled the ticket", "Self-Service Platform": "Every service follows the same template and guardrails" },
        { aspect: "Toil and scaling", "Ticket-Driven Ops": "Ops team is the bottleneck as teams grow", "Self-Service Platform": "Scales without adding platform headcount per service" },
        { aspect: "Feedback loop", "Ticket-Driven Ops": "Slow; problems surface late", "Self-Service Platform": "Fast; the platform is a product with a real user base" },
      ]},
      { type: "steps", heading: "Building a Golden Path", steps: [
        { title: "Find the repeated pain", detail: "Survey developers and measure the tasks every team does, like scaffolding a service or wiring CI." },
        { title: "Codify the best practice", detail: "Capture the pattern senior teams already use into a template that produces running code." },
        { title: "Wire the pipeline", detail: "Generate CI that builds, tests, scans, and signs the image, then deploys via GitOps." },
        { title: "Bake in guardrails", detail: "Default resource requests, probes, dashboards, alerts, and security policies so the safe path is the easy path." },
        { title: "Ship it self-service", detail: "Expose the path through a portal or CLI; a developer creates a service without a ticket." },
        { title: "Measure and iterate", detail: "Track adoption, time-to-first-deploy, and satisfaction, and improve the path from real feedback." },
      ]},
      { type: "code", heading: "Registering a Service in a Backstage Catalog", language: "yaml", label: "catalog-info.yaml", code: `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payments-api
  description: Handles card charges and refunds
  annotations:
    github.com/project-slug: acme/payments-api
    backstage.io/techdocs-ref: dir:.
  tags:
    - node
    - grpc
  links:
    - url: https://grafana.acme.io/d/payments
      title: Grafana dashboard
      icon: dashboard
spec:
  type: service
  lifecycle: production
  owner: team-payments
  system: checkout
  providesApis:
    - payments-api` },
      { type: "callout", calloutType: "info", heading: "Backstage Is the Common Front Door", content: "Spotify open-sourced Backstage, and it became the de-facto developer portal: a software catalog of every service, owner, and API, plus Software Templates that scaffold new services from a golden path and run the pipeline to create the repository, CI, and deployment. Portals like Port, Cortex, and OpsLevel cover similar ground commercially. The catalog is the quiet superpower — it answers who owns this, what depends on it, and what is its health — which is exactly the context that disappears when a company passes a few hundred services." },
      { type: "text", heading: "Measuring the Platform", content: "A platform is a product, so it is measured like one. Borrow the DORA metrics — **deployment frequency, lead time for changes, change failure rate, and time to restore** — as the outcome the platform exists to improve. Then add platform-specific signals: adoption (share of services on golden paths), time-to-first-deploy for a new service, and developer satisfaction via a regular survey.\n\nBeware vanity metrics. Number of pipelines or clusters built says nothing about value. If lead time and change failure rate are flat while the platform team is busy, the platform is not solving the developers' actual bottleneck." },
      { type: "callout", calloutType: "danger", heading: "Platforms Fail Two Ways", content: "First, **shelfware**: a platform built on what leadership imagined developers wanted, not what they asked for. Teams route around it, adoption collapses, and the investment is wasted. Second, the **platform as gatekeeper**: golden paths harden into the only allowed route, so any request outside them goes to a queue and the platform becomes the very bottleneck it was meant to remove. The antidote to both is the same — treat developers as customers, ship a genuinely easier path, keep escape hatches open, and measure adoption honestly." },
      { type: "checklist", heading: "Key Takeaways", items: [
        "Platform engineering builds an internal developer platform as a product for developer customers",
        "Golden paths are opinionated, supported defaults that make the safe way the easy way",
        "Self-service replaces ticket queues, scaling without adding platform headcount per service",
        "A software catalog such as Backstage answers who owns what and how it links together",
        "Measure the platform with DORA metrics, adoption, and developer satisfaction — not vanity counts",
        "Treat developers as customers and keep escape hatches, or the platform becomes shelfware",
      ]},
    ],
    quiz: [
      { question: "What is the core goal of platform engineering?", options: ["Replacing developers with automation", "Providing self-service golden paths that reduce cognitive load and toil", "Eliminating Kubernetes", "Centrally owning all production deployments"], correctIndex: 1, explanation: "The platform absorbs infrastructure complexity so product teams can focus on business logic. It offers self-service golden paths rather than taking ownership away from the teams that build the services." },
      { question: "What is a golden path?", options: ["The lowest-latency route through the network", "A supported, opinionated default for building and shipping a service", "A mandatory framework every team must use", "The main Git branch"], correctIndex: 1, explanation: "A golden path is an end-to-end, proven way to accomplish a common task — scaffolding a service, wiring CI, deploying — with guardrails baked in. It is the easiest supported route, not a mandate." },
      { question: "What does Backstage primarily provide?", options: ["A container runtime", "A software catalog and scaffolding portal for an internal developer platform", "A monitoring database", "A public cloud provider"], correctIndex: 1, explanation: "Backstage is a developer portal: its software catalog tracks services, owners, and APIs, and its templates scaffold new services from golden paths. It provides context and self-service, not compute or storage." },
      { question: "Why can a platform become shelfware?", options: ["It costs money to run", "It is built without developer input, so teams route around it and adoption collapses", "It uses too much CPU", "It supports only one language"], correctIndex: 1, explanation: "A platform built on assumptions rather than developer needs gives teams no reason to use it, so they keep their own shortcuts. Treating developers as customers and shipping genuinely easier paths is what prevents that outcome." },
    ]
  },

  // ─── VERSION CONTROL ────────────────────────────────────────────────────

  "git-workflows": {
    slug: "git-workflows",
    title: "Git Workflows & Branching",
    tagline: "Trunk-based vs git-flow, rebase vs merge, release trains",
    sections: [
      { type: "text", heading: "The Branching Strategy Is an Architecture Decision", content: "How a team branches decides how often it integrates, how large its merges are, and how quickly it can ship. A strategy that batches work into long-lived branches guarantees painful merges and delayed feedback; a strategy that integrates continuously keeps the main branch releasable and the feedback loop short.\n\nThe goal is not a single correct workflow but one matched to release cadence and risk: a continuous-deployment SaaS wants trunk-based development, while a shipped desktop product on quarterly releases may want release branches. The mistake is copying a heavyweight model into a team that ships daily." },
      { type: "analogy", heading: "Highway On-Ramps", content: "A well-designed highway lets cars merge smoothly because on-ramps are short and traffic is steady. If every ramp backed up for miles before merging, the whole road would gridlock.\n\nShort-lived branches are short on-ramps: a little work merges cleanly and quickly. A long-lived branch is a car circling for weeks before it tries to merge, arriving to find the highway completely reshaped. The longer a branch lives, the worse the eventual merge and the later the feedback." },
      { type: "comparison", heading: "Trunk-Based vs GitHub Flow vs Git Flow", headers: ["Trunk-Based", "GitHub Flow", "Git Flow"], rows: [
        { aspect: "Branch lifetime", "Trunk-Based": "Hours — merge to main same day", "GitHub Flow": "Days — one short branch per change", "Git Flow": "Weeks — feature, develop, release, hotfix branches" },
        { aspect: "Main branch state", "Trunk-Based": "Always releasable", "GitHub Flow": "Always releasable", "Git Flow": "develop integrates; main holds releases" },
        { aspect: "Release cadence", "Trunk-Based": "Continuous, many times a day", "GitHub Flow": "Continuous to frequent", "Git Flow": "Scheduled releases" },
        { aspect: "Complexity", "Trunk-Based": "Low, but needs strong CI and feature flags", "GitHub Flow": "Low", "Git Flow": "High, many branch types and merges" },
        { aspect: "Best for", "Trunk-Based": "Web and SaaS with continuous delivery", "GitHub Flow": "Most small and mid-size teams", "Git Flow": "Versioned products on fixed release cycles" },
      ]},
      { type: "text", heading: "Rebase vs Merge", content: "Both bring changes from one branch into another; they differ in what history they leave behind. **Merge** creates a merge commit and preserves the exact branching history — an accurate but often tangled graph. **Rebase** replays your commits on top of the target, producing a clean, linear history, at the cost of rewriting commit hashes.\n\nThe safe rule is about sharing. Rebase your own **unpushed** commits to tidy them before review — a linear history makes bisecting easy. Never rebase a branch others have pulled, because rewriting shared commits forces everyone to reconcile divergent histories. Many teams squash-merge pull requests instead: one clean commit per change on main, full detail preserved in the PR." },
      { type: "code", heading: "Everyday Git", language: "bash", label: "git.sh", code: `# Update a feature branch onto the latest main without a merge commit.
git fetch origin
git rebase origin/main

# Before opening a PR, clean up your own local work.
git rebase -i HEAD~3          # squash, reword, or reorder the last 3 commits

# Squash-merge a PR into a single commit on main.
git checkout main
git merge --squash feature/payments-retry
git commit -m "feat(payments): retry transient charge failures"

# Find the commit that broke production with a binary search.
git bisect start
git bisect bad  HEAD
git bisect good v1.4.1` },
      { type: "callout", calloutType: "warning", heading: "Long-Lived Branches Are Merge Debt", content: "The cost of a branch grows faster than linearly with its age. A one-day branch may conflict in a single file; a three-week branch conflicts in dozens, and the conflict now encodes two incompatible designs that no tool can resolve for you. Worse, feedback arrives late: a design flaw discovered after three weeks of work is far more expensive than one found the same day. If a branch lives more than a day or two, split the work so it can merge in pieces behind a feature flag." },
      { type: "text", heading: "Conventional Commits and Release Trains", content: "**Conventional Commits** give commit messages a machine-readable structure: `feat:`, `fix:`, `docs:`, `refactor:`, optional scope, and a `!` or `BREAKING CHANGE:` footer for breaking changes. That structure lets a release tool (semantic-release, release-please, Changesets) compute the next semantic version and generate a changelog automatically from the commit history — no manual version bumping.\n\nA **release train** is a fixed schedule — say, every Tuesday — on which whatever is ready on main ships. Trains decouple shipping from any single feature, so a late feature simply catches the next train instead of delaying the release. For products that cannot deploy continuously, release branches cut from main give a stable line to harden and patch while main moves on." },
      { type: "steps", heading: "A Pull Request People Can Appreciate", steps: [
        { title: "Start from fresh main", detail: "Branch from the latest main so your work builds on current reality." },
        { title: "Keep it small", detail: "One logical change, ideally under 400 lines; large PRs get skimmed and bugs slip through." },
        { title: "Write a clear description", detail: "Explain the why, the risk, and how it was tested, linking the issue and the design notes." },
        { title: "Pass CI before review", detail: "Green tests, lint, and type checks — never ask reviewers to catch what a pipeline can." },
        { title: "Rebase and address feedback", detail: "Rebase onto main to resolve conflicts and keep history linear before merging." },
        { title: "Merge and delete", detail: "Squash or merge per team policy, delete the branch, and confirm the deploy succeeded." },
      ]},
      { type: "callout", calloutType: "gold", heading: "Habits of Fast Shipping Teams", content: "High-performing teams share the same habits regardless of tooling. They keep main always green so it always ships; protect main with required reviews and status checks that block red merges; keep branches to a day or two; deploy from main by CI rather than from laptops; and gate risky changes with feature flags so deploy and release are independent. DORA research has pointed the same way for a decade: small batches and frequent integration beat large infrequent merges every time." },
      { type: "checklist", heading: "Key Takeaways", items: [
        "Short-lived branches integrate often, which keeps merges small and feedback fast",
        "Trunk-based development suits continuous delivery; git-flow suits scheduled releases",
        "Rebase your own unpushed commits for linear history; never rebase shared branches",
        "Long-lived branches accumulate merge debt that grows faster than linearly",
        "Conventional Commits drive automated changelogs and semantic versioning",
        "Keep main always releasable and gate risky changes with feature flags",
      ]},
    ],
    quiz: [
      { question: "What is the defining property of trunk-based development?", options: ["Developers merge short-lived branches into main within a day", "There is one long-running branch per feature", "Pull requests are never used", "Every release gets its own permanent branch"], correctIndex: 0, explanation: "Trunk-based development keeps work in tiny branches merged to main quickly — often the same day — so integration is continuous and main stays releasable. Feature flags let incomplete work ship safely in the meantime." },
      { question: "When is rebase preferable to merge?", options: ["When you want to preserve every branch commit in the history", "When you want a linear history on your own unpushed commits before merging", "When multiple people share the branch", "Never"], correctIndex: 1, explanation: "Rebase replays your commits on a new base, giving a clean linear history — ideal for tidying your own not-yet-shared work. Rebasing commits others have pulled rewrites shared history and forces everyone to reconcile, so avoid it there." },
      { question: "Why are long-lived branches risky?", options: ["They consume more disk space", "They diverge from main, causing large painful merges and delayed feedback", "Git cannot store them reliably", "They disable continuous integration"], correctIndex: 1, explanation: "The longer a branch lives, the more main moves away underneath it, so conflicts grow and the eventual merge can encode two incompatible designs. Feedback also arrives late, making any design flaw far more expensive to fix." },
      { question: "What is the practical value of Conventional Commits?", options: ["They make commit messages more colorful", "They let tools derive changelogs and semantic version numbers from commit history", "They compress the repository", "They enforce code style automatically"], correctIndex: 1, explanation: "A machine-readable format such as feat:, fix:, and BREAKING CHANGE: lets release tooling compute the next version and generate a changelog automatically, removing manual version bumping from the release process." },
    ]
  },

  // ─── CLOUD ──────────────────────────────────────────────────────────────

  "cloud-providers": {
    slug: "cloud-providers",
    title: "Cloud Providers Compared",
    tagline: "AWS, GCP, and Azure primitives, lock-in, and multi-cloud",
    sections: [
      { type: "text", heading: "The Same Primitives, Different Names", content: "AWS, Google Cloud, and Azure all sell the same building blocks — virtual machines, object storage, managed relational databases, message queues, serverless functions, managed Kubernetes, and a global CDN — behind different names and with different operational models. Learning one deeply transfers about 80% to the others: the concepts are stable, the APIs and IAM models are where they diverge.\n\nThe choice rarely hinges on raw capability, which is broadly comparable. It hinges on your team's existing skills, the managed services you lean on, pricing for your specific workload, and how much you value portability over convenience." },
      { type: "analogy", heading: "The Power Grid", content: "Electricity is electricity: a lamp runs the same whether the power comes from a coal plant or a wind farm. What differs is the socket, the voltage, and the billing plan — and once your whole building is wired to one standard, changing it is expensive.\n\nCloud compute is the same. The fundamental output — CPU, storage, network — is standard, but the sockets (APIs), wiring (IAM), and metering (pricing and discounts) differ per provider. Building on the standard parts keeps you portable; wiring deeply into proprietary sockets makes switching hard." },
      { type: "comparison", heading: "Equivalent Managed Services", headers: ["AWS", "GCP", "Azure"], rows: [
        { aspect: "Object storage", AWS: "S3", GCP: "Cloud Storage", Azure: "Blob Storage" },
        { aspect: "Virtual machine", AWS: "EC2", GCP: "Compute Engine", Azure: "Virtual Machines" },
        { aspect: "Managed Kubernetes", AWS: "EKS", GCP: "GKE", Azure: "AKS" },
        { aspect: "Serverless functions", AWS: "Lambda", GCP: "Cloud Functions / Cloud Run", Azure: "Azure Functions" },
        { aspect: "Managed relational DB", AWS: "RDS / Aurora", GCP: "Cloud SQL / AlloyDB", Azure: "Azure SQL / Database for PostgreSQL" },
        { aspect: "Message queue", AWS: "SQS / SNS", GCP: "Pub/Sub", Azure: "Service Bus / Event Grid" },
        { aspect: "Edge and CDN", AWS: "CloudFront", GCP: "Cloud CDN", Azure: "Front Door" },
        { aspect: "Identity", AWS: "IAM", GCP: "Cloud IAM", Azure: "Entra ID + RBAC" },
      ]},
      { type: "text", heading: "Managed Services: Convenience Versus Lock-In", content: "The cloud's biggest value is managed services: a database you do not patch, a queue you do not operate, a search index someone else scales. Using them well lets a small team run systems that once needed an operations department.\n\nThe cost is **lock-in**. A workload built on DynamoDB streams, Step Functions, and Cognito is not portable; moving it means reimplementing state machines, auth, and change-data-capture on another provider. Lock-in is not automatically bad — it is a deliberate trade of portability for speed. The discipline is to know which dependencies are load-bearing and to keep the interchangeable parts (containers, object storage, Postgres) portable so a future migration is bounded." },
      { type: "code", heading: "The Same Task Across Three CLIs", language: "bash", label: "cloud-cli.sh", code: `# Create a private object-storage bucket on each provider.
aws s3api create-bucket --bucket acme-assets-prod \\
  --region eu-west-1 --create-bucket-configuration LocationConstraint=eu-west-1
gcloud storage buckets create gs://acme-assets-prod --location=europe-west1 \\
  --uniform-bucket-level-access
az storage container create --name acme-assets-prod \\
  --account-name acmeassets --auth-mode login

# Deploy a container image to a serverless platform on each.
aws lambda update-function-code --function-name payments --image-uri \\
  ghcr.io/acme/payments-api@sha256:2f8a1c9d...
gcloud run deploy payments --image ghcr.io/acme/payments-api@sha256:2f8a1c9d... \\
  --region europe-west1
az containerapp update --name payments --resource-group acme-rg \\
  --image ghcr.io/acme/payments-api@sha256:2f8a1c9d...` },
      { type: "callout", calloutType: "warning", heading: "Lock-In Is Gradual and Quiet", content: "Lock-in rarely arrives as a decision. It accumulates one convenience at a time: a proprietary queue with no equivalent elsewhere, an IAM policy language, a managed database whose backups only restore into itself, a serverless runtime tied to a trigger model. By the time migration is contemplated, the cost is measured in engineer-years. Audit dependencies as you adopt them: mark each as standard (containers, S3-compatible storage, Postgres, Kafka) or proprietary, and keep the proprietary ones behind an interface in your own code so a future adapter is possible." },
      { type: "text", heading: "The Multi-Cloud Reality", content: "Multi-cloud is often sold as insurance against lock-in and outages, but the honest version is that running the **same** workload on two providers at once is expensive and rare. You pay twice for operational expertise, duplicate the networking and security surface, and either use only the lowest common denominator or maintain two divergent stacks.\n\nWhat teams actually do is more pragmatic. Many run a **primary** cloud for most workloads and a **secondary** for a specific need — best-of-breed ML on one, an enterprise agreement on another — or use multi-cloud only for a truly independent tier such as a CDN, a backup target, or a SaaS product that already abstracts the provider. Genuine active-active multi-cloud is reserved for a small number of businesses where an outage is catastrophic and the cost is justified." },
      { type: "steps", heading: "Choosing a Provider Without Regret", steps: [
        { title: "Start from the workload", detail: "List the services you need — databases, queues, ML, compliance regions — and check each provider covers them." },
        { title: "Price your actual pattern", detail: "Model compute, storage, and especially egress for your real traffic, not the headline instance price." },
        { title: "Weigh the team skills", detail: "Existing expertise is worth more than a marginal feature; retraining is slow and expensive." },
        { title: "Score portability", detail: "Prefer standard, self-hostable components for load-bearing pieces and isolate proprietary ones." },
        { title: "Check the ecosystem fit", detail: "Marketplace, support tiers, region coverage, and the managed services you truly lean on." },
        { title: "Write the exit plan", detail: "Define what a migration would cost and keep the interfaces that make it possible." },
      ]},
      { type: "callout", calloutType: "gold", heading: "Portability Is a Spectrum, Not a Religion", content: "The pragmatic target is not zero lock-in — that would mean forgoing the managed services that make the cloud worth using. It is knowing your dependencies and keeping the ones that are cheap to make portable actually portable. Run containers, keep object storage S3-compatible, prefer standard Postgres and Kafka, and hide proprietary services behind interfaces in your own code. Then portability becomes a dial you can turn deliberately for the few components where it matters, instead of a surprise discovered during an outage or a renegotiation." },
      { type: "checklist", heading: "Key Takeaways", items: [
        "AWS, GCP, and Azure offer the same primitives under different names and pricing",
        "The provider choice usually turns on team skills, region coverage, and cost for your pattern",
        "Managed services buy speed at the price of lock-in — a deliberate trade, not a mistake",
        "Lock-in accumulates quietly; track each dependency as standard or proprietary",
        "Multi-cloud rarely means the same workload everywhere — usually a primary plus a specialized secondary",
        "Aim for a portable core and keep a written exit plan for the load-bearing dependencies",
      ]},
    ],
    quiz: [
      { question: "Which statement about multi-cloud is most accurate?", options: ["It is nearly free and requires no extra work", "Running the same workload on several providers reduces lock-in but multiplies operational complexity", "Every service works unchanged on all clouds", "It eliminates lock-in entirely"], correctIndex: 1, explanation: "Multi-cloud can reduce dependence on one vendor, but operating the same system on two providers duplicates expertise, networking, and security work — which is why most teams use a primary cloud plus a specialized secondary rather than true active-active multi-cloud." },
      { question: "What is vendor lock-in?", options: ["A contract that forbids switching clouds", "Dependence on proprietary managed services that are costly and slow to replace", "A billing error on the invoice", "Using a content delivery network"], correctIndex: 1, explanation: "Lock-in is the difficulty of leaving because so much of the system depends on provider-specific services — proprietary queues, IAM, or data stores. It is often a deliberate trade for speed, valuable when understood and risky when it accumulates unnoticed." },
      { question: "Which component is generally the most portable across cloud providers?", options: ["A proprietary serverless function with provider-specific triggers", "A container running on Kubernetes", "A cloud-specific managed data warehouse", "Provider IAM policy definitions"], correctIndex: 1, explanation: "Containers and Kubernetes run the same across providers, and standard protocols like S3 and Postgres keep storage and data portable. Proprietary serverless runtimes, warehouses, and IAM languages are the pieces that bind you to one vendor." },
      { question: "Why is data egress a key factor when choosing a provider?", options: ["It is always free", "Moving data between providers or to the internet is billed and can dominate cost", "It can only be paid annually", "It affects only databases"], correctIndex: 1, explanation: "Cloud providers charge little or nothing to ingest data but bill to move it out — across regions, to the internet, or to another provider. For data-heavy products egress can exceed compute cost, so it belongs in the choice and in any migration plan." },
    ]
  },
};
