// Shared syntax highlighting — configured once, reused across the app.
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import http from "highlight.js/lib/languages/http";
import graphql from "highlight.js/lib/languages/graphql";
import protobuf from "highlight.js/lib/languages/protobuf";
import nginx from "highlight.js/lib/languages/nginx";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import bash from "highlight.js/lib/languages/bash";
import plaintext from "highlight.js/lib/languages/plaintext";

const LANGUAGES: Record<string, Parameters<typeof hljs.registerLanguage>[1]> = {
  typescript,
  javascript,
  json,
  sql,
  yaml,
  http,
  graphql,
  protobuf,
  nginx,
  dockerfile,
  bash,
  plaintext,
};

Object.entries(LANGUAGES).forEach(([name, def]) =>
  hljs.registerLanguage(name, def),
);

// Constrain auto-detection to the languages we ship
hljs.configure({ languages: Object.keys(LANGUAGES) });

const ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  docker: "dockerfile",
  proto: "protobuf",
  mysql: "sql",
  postgres: "sql",
  postgresql: "sql",
};

export function resolveLanguage(lang?: string): string {
  const key = (lang || "typescript").toLowerCase();
  const resolved = ALIASES[key] ?? key;
  return hljs.getLanguage(resolved) ? resolved : "plaintext";
}

function escapeHtml(code: string): string {
  return code.replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string,
  );
}

/** Highlight a code string and return safe HTML. */
export function highlightCode(code: string, language?: string): string {
  try {
    return hljs.highlight(code, {
      language: resolveLanguage(language),
      ignoreIllegals: true,
    }).value;
  } catch {
    return escapeHtml(code);
  }
}

/** Highlight every <pre><code> block inside a container. Browser only. */
export function highlightCodeBlocks(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>("pre code").forEach((el) => {
    if (el.dataset.highlighted === "yes") return;
    hljs.highlightElement(el);
  });
}

export default hljs;
