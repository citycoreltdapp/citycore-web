import type * as React from "react";

import { Google } from "@/components/icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";

import { AuthSuccessIcon } from "./_success-icon";

const BANNER_STYLES =
  "mx-4 mt-4 flex items-center gap-4 rounded-3xl bg-[linear-gradient(90deg,#8C8DE3_0%,#989AD9_100%)] px-5 py-5 text-white lg:mx-6 lg:mt-6.5 lg:rounded-[24px] lg:px-7.5";

const INVESTOR_AVATARS = ["investor-avatar-01", "investor-avatar-02", "investor-avatar-03"];

export function AuthInvestorsBanner() {
  return (
    <aside className={BANNER_STYLES}>
      <div className="flex shrink-0">
        {INVESTOR_AVATARS.map((name) => (
          <Image
            key={name}
            src={`/assets/images/investors/${name}.jpg`}
            alt=""
            width={48}
            height={48}
            className="-ml-3.5 size-12 rounded-full border-2 border-white/70 object-cover first:ml-0"
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-lg/6 font-semibold lg:text-xl/7">Join with 99K+ Investors</p>
        <p className="text-sm/5 lg:text-base/6">Let&apos;s make a good impact with your creations</p>
      </div>
    </aside>
  );
}

export function AuthQuoteBanner() {
  return (
    <aside className={BANNER_STYLES}>
      <p className="min-w-0 flex-1 text-sm/6 lg:text-base/6">
        &ldquo;Choosing a hard to guess, but easy to remember password is important&rdquo; - Kevin Mitnick
      </p>
      <span aria-hidden className="h-8 shrink-0 text-7xl/none text-white/40">
        &rdquo;
      </span>
    </aside>
  );
}

interface AuthShellProps {
  imageSide?: "left" | "right";
  banner?: React.ReactNode;
  /** Shows a back arrow above the form. */
  backHref?: string;
  children: React.ReactNode;
}

/** The page around every auth form. Light only, because that's how these screens are designed. */
export function AuthShell({ imageSide = "left", banner, backHref, children }: AuthShellProps) {
  const isImageRight = imageSide === "right";

  return (
    <div
      className={cn(
        "light grid min-h-dvh flex-1 grid-cols-1 bg-card text-foreground scheme-light",
        isImageRight ? "lg:grid-cols-[minmax(0,51fr)_minmax(0,49fr)]" : "lg:grid-cols-[minmax(0,49fr)_minmax(0,51fr)]"
      )}
    >
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh overflow-hidden bg-[#0E0C09] lg:block",
          isImageRight ? "order-last rounded-l-[26px]" : "rounded-r-[26px]"
        )}
      >
        <Image
          src="/assets/images/auth-bg.png"
          alt=""
          width={656}
          height={896}
          priority
          sizes="62vw"
          className="absolute top-0 left-[-24.5%] w-[125%] max-w-none -translate-y-[10.85%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,12,9,0.05)_0%,rgba(14,12,9,0.4)_45%,#0E0C09_68%)]" />

        <Image
          src="/assets/images/logo-grey.png"
          alt="CityCore"
          width={63}
          height={73}
          className="absolute top-16 left-[8%]"
        />

        <div className="absolute inset-x-[8%] bottom-[11%]">
          <h2 className="bg-[linear-gradient(180deg,#FFFFFF_0%,rgba(255,255,255,0.48)_100%)] bg-clip-text text-5xl leading-[1.2] font-bold text-transparent xl:text-7xl">
            Secured
            <br />
            Investment
          </h2>
          <p className="mt-6 text-xl text-white">Income generation and portfolio stability.</p>
        </div>
      </aside>

      <main className="flex flex-col">
        {banner}
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="mx-6 mt-8 w-fit text-primary/70 transition-colors hover:text-primary lg:mx-13.5"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-7" />
          </Link>
        )}
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function AuthMobileLogo() {
  return <Image src="/assets/images/logo.png" alt="CityCore" width={41} height={48} className="mb-8 lg:hidden" />;
}

interface AuthFormProps {
  title: string;
  subtitle: string;
  /** Shown in a tinted circle above the title. */
  icon?: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  /** Adds the "or" divider and the Google button. */
  onGoogle?: () => void;
  /** Adds a close button that clears the errors. Pass it only while there are errors. */
  onDismissErrors?: () => void;
  submitLabel: string;
  isPending: boolean;
  /** Greys out the submit button, for a form that isn't valid yet. */
  isSubmitDisabled?: boolean;
  /** The line under the form, such as the link to the other auth page. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const FIELD_STYLES =
  "**:data-[slot=input-group]:h-13.5 **:data-[slot=input-group]:rounded-[10px] **:data-[slot=input-group]:bg-card **:data-[slot=input-group]:has-[input:focus-visible]:ring-0 **:data-[slot=input-group]:has-[[aria-invalid=true]]:ring-0 **:data-[slot=input-group-addon]:px-4 **:data-[slot=input-group-control]:text-base **:data-[slot=label]:font-normal";

export function AuthForm({
  title,
  subtitle,
  icon,
  onSubmit,
  onGoogle,
  onDismissErrors,
  submitLabel,
  isPending,
  isSubmitDisabled,
  footer,
  children,
}: AuthFormProps) {
  return (
    <div className="relative w-full max-w-[535px]">
      <AuthMobileLogo />

      {onDismissErrors && (
        <button
          type="button"
          aria-label="Dismiss errors"
          onClick={onDismissErrors}
          className="absolute -top-10 right-0 text-primary/60 transition-colors hover:text-primary"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
        </button>
      )}

      {icon && (
        <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary text-primary [&_svg]:size-7">
          {icon}
        </span>
      )}

      <header className="mb-11">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-base text-primary/80">{subtitle}</p>
      </header>

      {/* POST, so a submit before hydration can't put a password in the URL. */}
      <form method="post" noValidate onSubmit={onSubmit} className={cn("flex flex-col gap-4", FIELD_STYLES)}>
        {children}

        <Button
          type="submit"
          isLoading={isPending}
          disabled={isSubmitDisabled}
          className="mt-3 h-13.5 rounded-[10px] text-base"
        >
          {submitLabel}
        </Button>
      </form>

      {onGoogle && (
        <>
          <div className="my-5 flex items-center gap-3 text-base text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onGoogle}
            className="h-12 w-full gap-2.5 rounded-lg bg-card text-base shadow-xs"
          >
            <Google className="size-5" />
            Continue with Google
          </Button>
        </>
      )}

      {footer && <p className="mt-10 text-center text-base text-primary/80">{footer}</p>}
    </div>
  );
}

interface AuthSuccessProps {
  title: string;
  subtitle: string;
  actionHref: string;
  actionLabel: string;
}

export function AuthSuccess({ title, subtitle, actionHref, actionLabel }: AuthSuccessProps) {
  return (
    <div className="w-full max-w-[535px]">
      <AuthMobileLogo />

      <AuthSuccessIcon />

      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-base text-primary/80">{subtitle}</p>

      <Link href={actionHref} className={cn(buttonVariants(), "mt-9 h-13.5 w-full rounded-[10px] text-base")}>
        {actionLabel}
      </Link>
    </div>
  );
}
