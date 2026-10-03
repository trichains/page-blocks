import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-semibold text-app-accent">404</p>
      <h1 className="text-2xl font-semibold">This page does not exist</h1>
      <p className="text-app-muted">
        Pages are built from the JSON files in content/pages. Check the slug or pick one from the list.
      </p>
      <Link href="/" className="rounded-md border border-app-border px-4 py-2 text-sm hover:border-app-muted">
        See all pages
      </Link>
    </main>
  );
}
