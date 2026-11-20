export type ResourceKind =
  | "kurikulum"
  | "buku"
  | "latihan"
  | "proyek"
  | "referensi"
  | "awesome"
  | "tool";

export type Resource = {
  /** owner/repo — harus ada di repos.json */
  repo: string;
  kind: ResourceKind;
  lang: "EN" | "ID";
  /** Catatan kurator: kenapa repo ini & cara memakainya */
  note: string;
  /** Repo adalah kode pendamping buku berbayar (kodenya tetap gratis) */
  paidBook?: boolean;
};

export type Stage = {
  id: string;
  title: string;
  duration: string;
  goal: string;
  topics: string[];
  resources: Resource[];
  milestone: string;
};

export type ConceptNode = { label: string; detail: string };

export type Category = "fondasi" | "software" | "data" | "infra";

export type Track = {
  slug: string;
  name: string;
  short: string;
  category: Category;
  icon: string;
  tagline: string;
  description: string;
  level: string;
  duration: string;
  roles: string[];
  tools: string[];
  concept: { title: string; caption: string; nodes: ConceptNode[] };
  stages: Stage[];
  projects: { title: string; detail: string }[];
  related: string[];
};
