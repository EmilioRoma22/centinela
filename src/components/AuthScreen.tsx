import type { SubmitEvent } from "react";

type AuthScreenProps = {
  isLoading: boolean;
  isCreateMode: boolean;
  masterKey: string;
  confirmMasterKey: string;
  onMasterKeyChange: (value: string) => void;
  onConfirmMasterKeyChange: (value: string) => void;
  onCreateSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onUnlockSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  onGenerateSecurePassword: () => void;
  onRequestResetVault: () => void;
};

export function AuthScreen({
  isLoading,
  isCreateMode,
  masterKey,
  confirmMasterKey,
  onMasterKeyChange,
  onConfirmMasterKeyChange,
  onCreateSubmit,
  onUnlockSubmit,
  onGenerateSecurePassword,
  onRequestResetVault,
}: AuthScreenProps) {
  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-y-auto overscroll-none bg-[#030712] font-['Space_Grotesk',ui-sans-serif,system-ui,sans-serif] text-slate-100">
      {isLoading && (
        <div
          className="absolute inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-[#030712]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-400"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-300">Cargando Centinela…</p>
        </div>
      )}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-40 -top-32 h-136 w-136 rounded-full bg-cyan-500/20 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 h-112 w-md rounded-full bg-violet-500/18 blur-[130px]" />
        <div className="absolute right-[14%] top-[38%] h-96 w-96 rounded-full bg-blue-500/14 blur-[120px]" />
        <div className="absolute right-[10%] bottom-[10%] h-104 w-104 rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute left-[42%] bottom-[18%] h-80 w-80 rounded-full bg-cyan-400/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[80px_80px] max-lg:mask-none mask-[radial-gradient(circle_at_center,black_40%,transparent_88%)]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1700px] flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4 xl:px-12 xl:py-5 2xl:px-16">
        <section className="grid w-full max-lg:flex-none grid-cols-1 gap-8 max-lg:gap-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10">
          <article className="relative flex flex-col gap-8 p-6 sm:p-10 xl:p-14 lg:min-h-0 lg:justify-between">
            <div>
              <span className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-[10px] font-semibold tracking-[0.18em] text-cyan-100 uppercase sm:text-xs">
                Password Manager de nueva generación
              </span>
              <h1 className="max-w-3xl text-balance font-['Sora',ui-sans-serif,system-ui,sans-serif] text-4xl leading-[0.92] font-extrabold tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl xl:text-[5.2rem] 2xl:text-[6.2rem]">
                ¡BIENVENIDO A
                <span className="bg-linear-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  {" "}
                  CENTINELA
                </span>
                !
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-slate-200/90 sm:text-lg xl:text-xl">
                {isCreateMode
                  ? "Estás a un paso de activar tu bóveda personal. Crea una llave maestra robusta para proteger cada contraseña desde el primer momento."
                  : "Ingresa tu llave para abrir tu bóveda segura. Todo permanece bajo tu control local, con una experiencia rápida y moderna."}
              </p>
            </div>

            <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 sm:max-lg:pt-2 xl:grid-cols-3 lg:mt-auto lg:pt-0">
              <article className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Crea contraseñas seguras</p>
                <p className="mt-1 text-xs text-slate-300">
                  Genera claves fuertes y evita combinaciones débiles.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Protege tus datos localmente</p>
                <p className="mt-1 text-xs text-slate-300">
                  Tu información vive en tu dispositivo, no en texto plano.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
                <p className="text-sm font-semibold text-white">Acceso rápido y seguro</p>
                <p className="mt-1 text-xs text-slate-300">
                  Desbloquea tu bóveda con tu llave maestra en segundos.
                </p>
              </article>
            </div>
          </article>

          <aside className="relative flex items-center p-6 sm:p-10 xl:p-12 lg:min-h-0">
            <div className="relative w-full">
              <div className="mb-8">
                <h2 className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {isCreateMode ? "Crea tu llave maestra" : "Desbloquea Centinela"}
                </h2>
                <p className="mt-1 text-sm text-slate-300 sm:text-base">
                  {isCreateMode
                    ? "Primera instalación detectada. Define una llave única y confírmala para activar tu bóveda."
                    : "Tu bóveda está lista para abrirse."}
                </p>
              </div>

              {!isLoading && isCreateMode ? (
                <form className="space-y-5" onSubmit={onCreateSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="master-key-create" className="text-sm font-medium text-slate-200">
                      Llave maestra
                    </label>
                    <input
                      id="master-key-create"
                      type="password"
                      autoComplete="off"
                      value={masterKey}
                      onChange={(event) => onMasterKeyChange(event.currentTarget.value)}
                      placeholder="Crea una llave robusta"
                      className="w-full rounded-2xl border border-slate-500/70 bg-slate-950/65 px-5 py-4 text-base text-slate-100 placeholder:text-slate-500 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                    />
                    <button
                      type="button"
                      onClick={onGenerateSecurePassword}
                      className="mt-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                    >
                      Generar contraseña segura
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="master-key-confirm" className="text-sm font-medium text-slate-200">
                      Confirmar llave
                    </label>
                    <input
                      id="master-key-confirm"
                      type="password"
                      autoComplete="off"
                      value={confirmMasterKey}
                      onChange={(event) => onConfirmMasterKeyChange(event.currentTarget.value)}
                      placeholder="Repite tu llave maestra"
                      className="w-full rounded-2xl border border-slate-500/70 bg-slate-950/65 px-5 py-4 text-base text-slate-100 placeholder:text-slate-500 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(59,130,246,0.45)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    Crear y continuar
                  </button>
                </form>
              ) : !isLoading ? (
                <form className="space-y-5" onSubmit={onUnlockSubmit}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="master-key-unlock"
                        className="text-sm font-medium text-slate-200"
                      >
                        Llave maestra
                      </label>
                      <button
                        type="button"
                        onClick={onRequestResetVault}
                        className="text-sm font-medium text-rose-400 underline-offset-2 hover:text-rose-300 hover:underline"
                      >
                        Olvidé mi llave
                      </button>
                    </div>
                    <input
                      id="master-key-unlock"
                      type="password"
                      autoComplete="off"
                      value={masterKey}
                      onChange={(event) => onMasterKeyChange(event.currentTarget.value)}
                      placeholder="Ingresa tu llave maestra"
                      className="w-full rounded-2xl border border-slate-500/70 bg-slate-950/65 px-5 py-4 text-base text-slate-100 placeholder:text-slate-500 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(59,130,246,0.45)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-200/60"
                  >
                    Desbloquear
                  </button>
                </form>
              ) : null}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
