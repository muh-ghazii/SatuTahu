"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const Loading = () => <div className="my-8 h-64 animate-pulse rounded-2xl border-2 border-ink/20 bg-paper" />;
const g = (name: string) => dynamic(() => import("./generic").then((m) => (m as unknown as Record<string, ComponentType<any>>)[name]), { loading: Loading });
const cs = (name: string) => dynamic(() => import("./viz-cs").then((m) => (m as unknown as Record<string, ComponentType<any>>)[name]), { loading: Loading });
const web = (name: string) => dynamic(() => import("./viz-web").then((m) => (m as unknown as Record<string, ComponentType<any>>)[name]), { loading: Loading });
const data = (name: string) => dynamic(() => import("./viz-data").then((m) => (m as unknown as Record<string, ComponentType<any>>)[name]), { loading: Loading });
const ai = (name: string) => dynamic(() => import("./viz-ai").then((m) => (m as unknown as Record<string, ComponentType<any>>)[name]), { loading: Loading });
const infra = (name: string) => dynamic(() => import("./viz-infra").then((m) => (m as unknown as Record<string, ComponentType<any>>)[name]), { loading: Loading });

const registry: Record<string, ComponentType<any>> = {
  flow: g("FlowViz"), sequence: g("SequenceViz"), layers: g("LayersViz"), compare: g("CompareViz"), tree: g("TreeViz"), fsm: g("FsmViz"),
  binary: cs("BinaryViz"), "big-o": cs("BigOViz"), sorting: cs("SortingViz"), "binary-search": cs("BinarySearchViz"), "stack-queue": cs("StackQueueViz"),
  "hash-table": cs("HashTableViz"), bst: cs("BstViz"), recursion: cs("RecursionViz"), "graph-search": cs("GraphSearchViz"), scheduler: cs("SchedulerViz"), "linked-list": cs("LinkedListViz"),
  "box-model": web("BoxModelViz"), flexbox: web("FlexboxViz"), "event-loop": web("EventLoopViz"), responsive: web("ResponsiveViz"), contrast: web("ContrastViz"),
  "type-scale": web("TypeScaleViz"), "git-graph": web("GitGraphViz"), jwt: web("JwtViz"), "load-balancer": web("LoadBalancerViz"), cache: web("CacheViz"), "sql-join": web("SqlJoinViz"),
  distribution: data("DistributionViz"), regression: data("RegressionViz"), "gradient-descent": data("GradientDescentViz"), kmeans: data("KMeansViz"),
  confusion: data("ConfusionViz"), overfit: data("OverfitViz"), groupby: data("GroupByViz"), "ab-test": data("AbTestViz"),
  activation: ai("ActivationViz"), neuron: ai("NeuronViz"), convolution: ai("ConvolutionViz"), iou: ai("IouViz"), tokenizer: ai("TokenizerViz"),
  attention: ai("AttentionViz"), embedding: ai("EmbeddingViz"), temperature: ai("TemperatureViz"),
  subnet: infra("SubnetViz"), hash: infra("HashViz"), cipher: infra("CipherViz"), entropy: infra("EntropyViz"), sqli: infra("SqliViz"), xss: infra("XssViz"),
  boundary: infra("BoundaryViz"), pwm: infra("PwmViz"), ohm: infra("OhmViz"), "game-loop": infra("GameLoopViz"), aabb: infra("AabbViz"),
};

export function Viz({ spec }: { spec: string }) {
  let parsed: { type?: string } & Record<string, unknown>;
  try {
    parsed = JSON.parse(spec);
  } catch {
    return <p className="my-6 rounded-lg border-2 border-[#d9534f] p-3 text-sm">Visualisasi gagal dimuat (format tidak valid).</p>;
  }
  const C = parsed.type ? registry[parsed.type] : undefined;
  if (!C) return <p className="my-6 rounded-lg border-2 border-[#d9534f] p-3 text-sm">Visualisasi “{parsed.type}” tidak dikenal.</p>;
  const { type: _t, ...props } = parsed;
  void _t;
  return <C {...props} />;
}
