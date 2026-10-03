import type { Locale } from "@/lib/page-schema";

/** UI strings rendered by blocks themselves (content strings come from the page document). */
const STRINGS = {
  en: {
    playVideo: "Play video",
    videoLoadsOnClick: "The player loads from {provider} when you click play.",
    days: "days",
    hours: "hours",
    minutes: "min",
    seconds: "sec",
    evergreenNote: "This timer runs for {hours} hours from your first visit to this page.",
    fixedNote: "Ends {date}.",
    sending: "Sending...",
    required: "required",
    optional: "optional",
    errorGeneric: "Something went wrong. Please try again.",
    errorRateLimit: "Too many attempts. Please wait a minute and try again.",
    consentRequired: "Please accept to continue.",
    previewFormDisabled: "Form submission is disabled in the editor preview.",
    mostPopular: "Recommended",
  },
  "pt-BR": {
    playVideo: "Assistir ao vídeo",
    videoLoadsOnClick: "O player do {provider} só carrega quando você clicar.",
    days: "dias",
    hours: "horas",
    minutes: "min",
    seconds: "seg",
    evergreenNote: "Este contador vale por {hours} horas a partir da sua primeira visita a esta página.",
    fixedNote: "Termina em {date}.",
    sending: "Enviando...",
    required: "obrigatório",
    optional: "opcional",
    errorGeneric: "Algo deu errado. Tente de novo.",
    errorRateLimit: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    consentRequired: "Marque a caixa para continuar.",
    previewFormDisabled: "O envio do formulário fica desativado na pré-visualização do editor.",
    mostPopular: "Recomendado",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiStrings = (typeof STRINGS)["en"];

export function t(locale: Locale, key: keyof UiStrings, vars: Record<string, string | number> = {}): string {
  const template: string = STRINGS[locale]?.[key] ?? STRINGS.en[key];
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
