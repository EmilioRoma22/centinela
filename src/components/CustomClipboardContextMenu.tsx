import { useCallback, useEffect, useRef, useState } from "react";
import { centinelaToast } from "../lib/centinelaToast";
import { writeClipboardText } from "../utils/clipboard";

const USER_EMAIL_SELECTOR = '[data-context-copy="user-email"]';

function getCopyTextFromInput(el: HTMLInputElement | HTMLTextAreaElement): string {
  const v = el.value;
  if (
    typeof el.selectionStart === "number" &&
    typeof el.selectionEnd === "number" &&
    el.selectionStart !== el.selectionEnd
  ) {
    return v.slice(el.selectionStart, el.selectionEnd);
  }
  return v;
}

function getCopyTextFromBlock(el: HTMLElement): string {
  const sel = window.getSelection()?.toString() ?? "";
  if (sel.length > 0) return sel;
  return el.textContent ?? "";
}

export function CustomClipboardContextMenu() {
  const [menu, setMenu] = useState<null | { x: number; y: number; text: string }>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const raw = event.target;
      const start: Element | null =
        raw instanceof Element ? raw : raw instanceof Node ? raw.parentElement : null;
      if (!start) {
        setMenu(null);
        return;
      }

      const input = start.closest("input, textarea");
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        const text = getCopyTextFromInput(input);
        setMenu({ x: event.clientX, y: event.clientY, text });
        return;
      }

      const block = start.closest(USER_EMAIL_SELECTOR);
      if (block instanceof HTMLElement) {
        const text = getCopyTextFromBlock(block);
        setMenu({ x: event.clientX, y: event.clientY, text });
        return;
      }

      setMenu(null);
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    return () => document.removeEventListener("contextmenu", onContextMenu, true);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, close]);

  const handleCopy = async () => {
    if (!menu) return;
    try {
      await writeClipboardText(menu.text);
      centinelaToast.success("Copiado al portapapeles.");
      close();
    } catch {
      centinelaToast.error("No se pudo copiar.");
    }
  };

  if (!menu) return null;

  const preview =
    menu.text.length > 96 ? `${menu.text.slice(0, 96)}…` : menu.text;

  const pad = 8;
  const mw = 220;
  const mh = 120;
  const left = Math.min(Math.max(pad, menu.x), window.innerWidth - mw - pad);
  const top = Math.min(Math.max(pad, menu.y), window.innerHeight - mh - pad);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-200 w-[min(100vw-16px,220px)] overflow-hidden rounded-xl border border-slate-600/90 bg-slate-950 py-1 shadow-2xl ring-1 ring-white/5"
      style={{ left, top }}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => void handleCopy()}
        className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm text-slate-100 transition hover:bg-slate-800/90"
      >
        <span className="font-semibold text-cyan-200">Copiar</span>
        <span className="break-all font-mono text-xs text-slate-400" title={menu.text}>
          {preview || "(vacío)"}
        </span>
      </button>
    </div>
  );
}
