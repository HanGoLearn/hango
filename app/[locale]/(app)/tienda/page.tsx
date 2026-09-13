import { auth } from "@/lib/auth";
import { getAvatarPageData } from "@/lib/avatar-data";
import { TiendaWorkshop } from "@/components/avatar/tienda-workshop";
import { PageTitle, Body } from "@/components/ui/typography";
import { isAppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Avatar workshop ("Atelier" direction, 2026-08-30 redesign - see
 * TiendaWorkshop for the character/tabs/shop interaction itself, this page
 * is just data-fetching). In primary nav ("Shop", src/lib/navigation.ts),
 * also reachable via a Dashboard teaser. The coin balance now lives inside
 * the workshop next to the category tabs (matches the picked mockup),
 * not duplicated here in the page header too.
 */
export default async function TiendaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isAppLocale(localeParam)) return null;
  const dictionary = await getDictionary(localeParam);
  const session = await auth();
  const userId = session!.user!.id!;
  const data = await getAvatarPageData(userId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <PageTitle>{dictionary.shop.title}</PageTitle>
        <Body className="text-text-secondary">
          {dictionary.shop.description}
        </Body>
      </div>

      <TiendaWorkshop
        animal={data.animal}
        animalName={data.animalName}
        equipped={data.equipped}
        ownedAccessoryKeys={data.ownedAccessoryKeys}
        coinBalance={data.coinBalance}
        locale={localeParam}
        messages={dictionary.shop}
        coinMessages={dictionary.shell.hanCoins}
      />
    </div>
  );
}
