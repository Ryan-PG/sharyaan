import { Map } from "lucide-react";
import type { StaticImageData } from "next/image";
import { useTranslation } from "react-i18next";
import metroMapImage from "../../../assets/images/tehran-metro-map.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const metroMapImageSrc =
  typeof metroMapImage === "string" ? metroMapImage : (metroMapImage as StaticImageData).src;

export function MetroImageMap() {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <Map className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle>{t("officialMetroMap")}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{t("officialMetroMapHint")}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-muted/30">
          <img
            src={metroMapImageSrc}
            alt={t("officialMetroMap")}
            className="block h-auto w-full max-w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      </CardContent>
    </Card>
  );
}
