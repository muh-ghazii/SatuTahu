import { visit } from "unist-util-visit";
import type { Root } from "mdast";

const CALLOUTS = ["tip", "info", "warning", "latihan", "analogi", "contoh", "jebakan", "kasus", "solusi"];

/**
 * - ```viz / ```quiz  → elemen kustom <viz-block>
 * - :::tip[Judul] … ::: → <callout-box kind="tip" title="Judul">
 * - directive lain dikembalikan menjadi teks biasa (mis. "rasio 1:2" aman)
 */
export function remarkSatuTahu() {
  return (tree: Root) => {
    visit(tree, (node: any, index, parent: any) => {
      if (node.type === "code" && node.lang === "viz") {
        node.type = "vizBlock";
        node.data = { hName: "viz-block", hProperties: { spec: node.value } };
        node.children = [];
        return;
      }
      if (node.type === "containerDirective" && CALLOUTS.includes(node.name)) {
        let title = "";
        if (node.children?.[0]?.data?.directiveLabel) {
          const label = node.children.shift();
          title = (label.children ?? []).map((c: any) => c.value ?? "").join("");
        }
        node.data = { hName: "callout-box", hProperties: { kind: node.name, title } };
        return;
      }
      if ((node.type === "textDirective" || node.type === "leafDirective" || node.type === "containerDirective") && parent && typeof index === "number") {
        const text = { type: "text", value: `${node.type === "textDirective" ? ":" : "::"}${node.name}` };
        parent.children.splice(index, 1, text, ...(node.children ?? []));
        return index;
      }
    });
  };
}
