import { auth } from "@/lib/auth";
import { getAvatarPageData } from "@/lib/avatar-data";
import { TiendaWorkshop } from "@/components/avatar/tienda-workshop";
import { PageTitle, Body } from "@/components/ui/typography";

/**
 * Avatar workshop ("Atelier" direction, 2026-08-30 redesign - see
 * TiendaWorkshop for the character/tabs/shop interaction itself, this page
 * is just data-fetching). In primary nav ("Shop", src/lib/navigation.ts),
 * also reachable via a Dashboard teaser. The coin balance now lives inside
 * the workshop next to the category tabs (matches the picked mockup),
 * not duplicated here in the page header too.
 */
export default async function TiendaPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const data = await getAvatarPageData(userId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <PageTitle>Your Avatar</PageTitle>
        <Body className="text-text-secondary">
          Customize your character with HanCoins earned from real progress.
        </Body>
      </div>

      <TiendaWorkshop
        animal={data.animal}
        animalName={data.animalName}
        equipped={data.equipped}
        ownedAccessoryKeys={data.ownedAccessoryKeys}
        coinBalance={data.coinBalance}
      />
    </div>
  );
}
