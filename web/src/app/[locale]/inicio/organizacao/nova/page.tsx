import { redirect } from "@/navigation";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function InicioNovaOrganizacaoRedirectPage({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/organizations/new", locale });
}
