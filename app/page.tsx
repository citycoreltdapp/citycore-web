import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Image src="/assets/images/logo.png" alt="" width={34} height={40} className="size-10 object-contain" />
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">City Core</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in, create an account, or open a console.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard/signin"
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard/signup"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted"
        >
          Sign up
        </Link>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted"
        >
          Investor dashboard
        </Link>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
