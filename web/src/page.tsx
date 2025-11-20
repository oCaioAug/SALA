// src/app/page.tsx
import { redirect } from "next/navigation";

// Esta página só roda se o Middleware falhar em redirecionar
export default function RootPage() {
  redirect("/pt");
}
