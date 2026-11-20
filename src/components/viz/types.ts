/** Daftar tipe visualisasi yang valid di blok ```viz (dipakai juga oleh validator) */
export const GENERIC_VIZ = ["flow", "sequence", "layers", "compare", "tree", "fsm"] as const;
export const SPECIAL_VIZ = [
  "binary", "big-o", "sorting", "binary-search", "stack-queue", "hash-table", "bst", "recursion", "graph-search", "scheduler", "linked-list",
  "box-model", "flexbox", "event-loop", "responsive", "contrast", "type-scale", "git-graph", "jwt", "load-balancer", "cache", "sql-join",
  "distribution", "regression", "gradient-descent", "kmeans", "confusion", "overfit", "groupby", "ab-test",
  "activation", "neuron", "convolution", "iou", "tokenizer", "attention", "embedding", "temperature",
  "subnet", "hash", "cipher", "entropy", "sqli", "xss", "boundary", "pwm", "ohm", "game-loop", "aabb",
] as const;
export const ALL_VIZ: readonly string[] = [...GENERIC_VIZ, ...SPECIAL_VIZ];
