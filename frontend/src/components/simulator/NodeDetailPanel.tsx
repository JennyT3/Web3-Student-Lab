import { AnimatePresence, motion } from "framer-motion";
import { Activity, ExternalLink, Shield, Wallet, X } from "lucide-react";
import React from "react";
import { NetworkNode } from "../../lib/visualization/ForceSimulation";

interface NodeDetailPanelProps {
  node: NetworkNode;
  onClose: () => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  onClose,
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="absolute inset-x-0 bottom-0 z-30 flex max-h-[72%] flex-col gap-5 overflow-y-auto border-t border-white/10 bg-black/90 p-5 backdrop-blur-xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-80 sm:border-l sm:border-t-0 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
            Account Details
          </h3>
          <button
            onClick={onClose}
            className="min-h-10 min-w-10 rounded p-2 hover:bg-white/10"
            aria-label="Close account details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Public Key
          </span>
          <div className="group flex items-center justify-between gap-3 break-all rounded border border-white/5 bg-zinc-900 p-3 font-mono text-[10px] text-gray-300">
            {node.id}
            <ExternalLink
              size={12}
              className="shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/5 bg-zinc-900 p-4">
            <Wallet size={16} className="text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-500">
                Balance
              </span>
              <span className="break-words text-sm font-black italic text-white">
                1,240.50{" "}
                <span className="text-[10px] text-gray-600 not-italic">
                  XLM
                </span>
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/5 bg-zinc-900 p-4">
            <Activity size={16} className="text-green-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-500">
                Operations
              </span>
              <span className="text-sm font-black italic text-white">42</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <Shield size={12} />
            Security Status
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="text-gray-400">Multi-sig</span>
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 font-bold text-green-500">
                ENABLED
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="text-gray-400">Account Flags</span>
              <span className="break-words text-right font-bold italic text-white">
                AUTH_REQUIRED
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button className="min-h-12 w-full rounded bg-red-600 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700">
            View on Explorer
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
