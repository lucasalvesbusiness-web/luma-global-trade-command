'use client';

import { Command } from 'cmdk';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

const VERIF_DOT: Record<string, string> = {
  DOC_VERIFIED: 'bg-amber-glow',
  EMAIL_VERIFIED: 'bg-ink-300',
  UNVERIFIED: 'bg-ink-600',
};

export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const search = trpc.search.global.useQuery(
    { q: query },
    {
      enabled: open && query.trim().length >= 1,
      staleTime: 5_000,
    },
  );

  function go(href: string) {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Buscar (⌘K)"
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-white/[0.04] hover:text-ink-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-spectre-carbon/70 px-4 pt-[15vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-lg border border-white/[0.08] bg-ink-900 shadow-2xl"
          >
            <Command shouldFilter={false} loop>
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-4 w-4 text-ink-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Buscar empresas, deals, categorias…"
                  autoFocus
                  className="flex-1 bg-transparent text-base text-ink-50 placeholder:text-ink-500 focus:outline-none"
                />
                <kbd className="hidden rounded-sm border border-white/10 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-400 md:inline-block">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-96 overflow-y-auto px-2 py-2">
                {query.trim().length === 0 ? (
                  <p className="px-3 py-8 text-center text-xs text-ink-500">
                    Digite para buscar empresas, seus deals e categorias.
                  </p>
                ) : search.isLoading ? (
                  <p className="px-3 py-6 text-center text-xs text-ink-500">Buscando…</p>
                ) : (
                  <>
                    {(search.data?.companies?.length ?? 0) === 0 &&
                    (search.data?.deals?.length ?? 0) === 0 &&
                    (search.data?.categories?.length ?? 0) === 0 ? (
                      <Command.Empty className="px-3 py-6 text-center text-xs text-ink-500">
                        Nada encontrado para &ldquo;{query}&rdquo;.
                      </Command.Empty>
                    ) : null}

                    {(search.data?.companies?.length ?? 0) > 0 && (
                      <Command.Group heading="Empresas">
                        <div className="px-3 py-1.5">
                          <TechLabel>Empresas</TechLabel>
                        </div>
                        {search.data!.companies.map((c) => (
                          <Command.Item
                            key={c.id}
                            value={`co-${c.id}`}
                            onSelect={() => go(`/c/${c.slug}`)}
                            className="cursor-pointer rounded-sm px-3 py-2 text-sm text-ink-200 aria-selected:bg-amber/10 aria-selected:text-amber-glow"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  VERIF_DOT[c.verificationStatus] ?? 'bg-ink-600',
                                )}
                              />
                              <span className="flex-1">
                                {c.tradeName ?? c.legalName}
                                {c.city && (
                                  <span className="ml-2 text-[10px] text-ink-500">
                                    · {c.city}
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-[9px] text-ink-500">
                                /c/{c.slug}
                              </span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {(search.data?.deals?.length ?? 0) > 0 && (
                      <Command.Group heading="Deals">
                        <div className="px-3 py-1.5 mt-2">
                          <TechLabel>Seus deals</TechLabel>
                        </div>
                        {search.data!.deals.map((d) => (
                          <Command.Item
                            key={d.id}
                            value={`d-${d.id}`}
                            onSelect={() => go(`/d/${d.id}`)}
                            className="cursor-pointer rounded-sm px-3 py-2 text-sm text-ink-200 aria-selected:bg-amber/10 aria-selected:text-amber-glow"
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />
                              <span className="flex-1 truncate">{d.title}</span>
                              <span className="rounded-sm border border-white/10 bg-ink-800 px-1.5 py-0.5 font-mono text-[9px] text-ink-400">
                                {d.status}
                              </span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {(search.data?.categories?.length ?? 0) > 0 && (
                      <Command.Group heading="Categorias">
                        <div className="px-3 py-1.5 mt-2">
                          <TechLabel>Categorias</TechLabel>
                        </div>
                        {search.data!.categories.map((cat) => (
                          <Command.Item
                            key={cat}
                            value={`cat-${cat}`}
                            onSelect={() =>
                              go(`/explore?category=${encodeURIComponent(cat)}`)
                            }
                            className="cursor-pointer rounded-sm px-3 py-2 text-sm text-ink-200 aria-selected:bg-amber/10 aria-selected:text-amber-glow"
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber/60" />
                              <span>{cat}</span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>

              <footer className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-ink-500">
                <span>↑↓ navegar</span>
                <span>↵ abrir</span>
                <Link href="/explore" onClick={() => setOpen(false)} className="hover:text-ink-200">
                  Explorar tudo →
                </Link>
              </footer>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
