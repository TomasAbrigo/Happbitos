import { getCurrentUser } from "@/lib/auth/current-user";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">HAppbitos</h1>
      <p className="text-muted-foreground">Hola, {user?.username}.</p>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Salir
        </Button>
      </form>
    </div>
  );
}
