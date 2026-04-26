import { Maximize, Search, ZoomIn, ZoomOut } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { GraphTransaction, useNetworkGraph } from "../../hooks/useNetworkGraph";
import { NetworkNode as NodeData } from "../../lib/visualization/ForceSimulation";
import { GraphEdge } from "./GraphEdge";
import { GraphNode } from "./GraphNode";
import { NodeDetailPanel } from "./NodeDetailPanel";

interface NetworkGraphProps {
  transactions: GraphTransaction[];
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ transactions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { graph, addTransaction } = useNetworkGraph(
    dimensions.width,
    dimensions.height,
  );

  // Sync new transactions to graph
  useEffect(() => {
    if (transactions.length > 0) {
      addTransaction(transactions[0]);
    }
  }, [transactions, addTransaction]);

  const filteredNodes = graph.nodes.filter((n) =>
    n.id.toLowerCase().includes(search.toLowerCase()),
  );
  const isCompact = dimensions.width > 0 && dimensions.width < 720;

  return (
    <div
      ref={containerRef}
      className="group relative min-h-[28rem] w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950 sm:min-h-[32rem] lg:h-full"
    >
      {/* Controls */}
      <div className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 sm:left-4 sm:top-4">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/50 p-1 backdrop-blur-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
            className="min-h-10 min-w-10 rounded p-2 transition-colors hover:bg-white/10"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
            className="min-h-10 min-w-10 rounded p-2 transition-colors hover:bg-white/10"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="min-h-10 min-w-10 rounded p-2 transition-colors hover:bg-white/10"
            aria-label="Reset zoom"
          >
            <Maximize size={16} />
          </button>
        </div>

        <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 backdrop-blur-md">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search Account..."
            className="w-28 border-none bg-transparent font-mono text-xs outline-none sm:w-36"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2}) scale(${zoom}) translate(${-dimensions.width / 2}, ${-dimensions.height / 2})`}
        >
          {graph.edges.map((edge) => (
            <GraphEdge key={edge.id} edge={edge} />
          ))}
          {filteredNodes.map((node) => (
            <GraphNode key={node.id} node={node} onClick={setSelectedNode} />
          ))}
        </g>
      </svg>

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] sm:bottom-4 sm:left-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          {isCompact ? "Graph Engine" : "Graph Visualization Engine"}
        </h4>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <span className="text-[9px] uppercase text-gray-400">Accounts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span className="text-[9px] uppercase text-gray-400">Assets</span>
          </div>
        </div>
      </div>
    </div>
  );
};
