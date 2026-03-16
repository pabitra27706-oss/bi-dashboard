"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Conversation } from "@/types";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Date grouping                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */
interface ConvGroup {
  label: string;
  items: Conversation[];
}

function groupByDate(conversations: Conversation[]): {
  pinned: Conversation[];
  groups: ConvGroup[];
  archived: Conversation[];
} {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86_400_000);
  const monthStart = new Date(todayStart.getTime() - 30 * 86_400_000);

  const pinned = conversations.filter((c) => c.isPinned && !c.isArchived);
  const archived = conversations.filter((c) => c.isArchived);
  const active = conversations
    .filter((c) => !c.isPinned && !c.isArchived)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const buckets: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    "Previous 30 days": [],
    Older: [],
  };

  active.forEach((c) => {
    const d = new Date(c.updatedAt);
    if (d >= todayStart) buckets["Today"].push(c);
    else if (d >= yesterdayStart) buckets["Yesterday"].push(c);
    else if (d >= weekStart) buckets["Previous 7 days"].push(c);
    else if (d >= monthStart) buckets["Previous 30 days"].push(c);
    else buckets["Older"].push(c);
  });

  const groups: ConvGroup[] = [];
  for (const [label, items] of Object.entries(buckets)) {
    if (items.length > 0) groups.push({ label, items });
  }

  return { pinned, groups, archived };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Context Menu                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */
function ConvMenu({
  conv,
  onPin,
  onArchive,
  onDelete,
  onClose,
}: {
  conv: Conversation;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    {
      label: conv.isPinned ? "Unpin" : "Pin to top",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
        </svg>
      ),
      action: () => onPin(conv.id),
    },
    {
      label: conv.isArchived ? "Unarchive" : "Archive",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
      action: () => onArchive(conv.id),
    },
    {
      label: "Delete",
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      ),
      action: () => {
        if (confirm("Delete this conversation?")) onDelete(conv.id);
      },
      danger: true,
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 animate-scaleIn origin-top-right"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
            item.danger
              ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Single conversation row — uses <div role="button"> to avoid          */
/*  nested <button> hydration error                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
function ConvItem({
  conv,
  isActive,
  onSelect,
  onPin,
  onArchive,
  onDelete,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const msgCount = conv.messages.filter((m) => m.role === "user").length;

  return (
    <div className="relative group">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer select-none ${
          isActive
            ? "bg-indigo-50 dark:bg-indigo-900/25 border border-indigo-200 dark:border-indigo-800/50"
            : "hover:bg-slate-100 dark:hover:bg-slate-700/40 border border-transparent"
        }`}
      >
        {/* Pin indicator */}
        {conv.isPinned && (
          <svg
            className="w-3 h-3 text-indigo-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-medium truncate ${
              isActive
                ? "text-indigo-700 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {conv.title}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {msgCount} message{msgCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Menu trigger — now safe since parent is <div> not <button> */}
        <div
          className={`flex-shrink-0 transition-opacity ${
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <ConvMenu
          conv={conv}
          onPin={onPin}
          onArchive={onArchive}
          onDelete={onDelete}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main sidebar                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */
interface Props {
  conversations: Conversation[];
  activeConvId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function QueryHistory({
  conversations,
  activeConvId,
  onSelect,
  onNewChat,
  onPin,
  onArchive,
  onDelete,
  onClose,
}: Props) {
  const [showArchived, setShowArchived] = useState(false);

  const { pinned, groups, archived } = useMemo(
    () => groupByDate(conversations),
    [conversations]
  );

  const renderSection = (label: string, items: Conversation[]) => (
    <div key={label} className="mb-2">
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((c) => (
          <ConvItem
            key={c.id}
            conv={c}
            isActive={c.id === activeConvId}
            onSelect={() => onSelect(c.id)}
            onPin={onPin}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* New Chat */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700/60">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 active:scale-[0.98]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <svg
              className="w-10 h-10 mx-auto mb-3 text-slate-200 dark:text-slate-700"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Start a conversation
            </p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && renderSection("Pinned", pinned)}

            {/* Date groups */}
            {groups.map((g) => renderSection(g.label, g.items))}

            {/* Archived */}
            {archived.length > 0 && (
              <div className="mt-3 border-t border-slate-200 dark:border-slate-700/60 pt-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${
                      showArchived ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                  Archived ({archived.length})
                </button>
                {showArchived && (
                  <div className="space-y-0.5 mt-1 animate-slideUp">
                    {archived.map((c) => (
                      <ConvItem
                        key={c.id}
                        conv={c}
                        isActive={c.id === activeConvId}
                        onSelect={() => onSelect(c.id)}
                        onPin={onPin}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Close button for mobile */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700/60 lg:hidden">
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
          Close sidebar
        </button>
      </div>
    </div>
  );
}