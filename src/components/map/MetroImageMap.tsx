import { Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import metroMapImage from "../../../assets/images/tehran-metro-map.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function MetroImageMap() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <Map className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle>{t("officialMetroMap")}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{t("officialMetroMapHint")}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto overscroll-contain">
          <img
            src={metroMapImage}
            alt={t("officialMetroMap")}
            className="block h-auto min-w-[720px] max-w-none sm:min-w-full sm:max-w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      </CardContent>
    </Card>
  );
}
