"use client";

import { useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

type SearchProps = {
  locale: string;
  country?: string;
  category?: string;
  initiallyOpen?: boolean;
};

export function VisualSearchLauncher({
  locale,
  country,
  category,
  enabled,
}: SearchProps & { enabled: boolean }) {
  const t = useTranslations("catalog");
  const [Search, setSearch] = useState<ComponentType<SearchProps> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  if (!enabled) return null;

  if (Search) {
    return <Search locale={locale} country={country} category={category} initiallyOpen />;
  }

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        type="button"
        className="mt-5 gap-2 px-4 font-bold"
        loading={loading}
        onClick={async () => {
          if (loading) return;
          setLoading(true);
          setLoadError(false);
          try {
            const module = await import("./VisualSearch");
            setSearch(() => module.VisualSearch);
          } catch {
            setLoadError(true);
          } finally {
            setLoading(false);
          }
        }}
      >
        {t("visualSearchOpen")}
      </Button>
      {loadError ? <p role="alert" className="mt-2 text-sm text-error">{t("visualSearchError")}</p> : null}
    </>
  );
}
