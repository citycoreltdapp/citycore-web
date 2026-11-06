import { Button } from "@/components/ui/button";

import { USER_FIRST_NAME } from "./_data";

const COPPER = "#D0A07C";
const CREAM = "#F1D7BF";
const SAND = "#BFAF9F";
const CLAY = "#B87643";
const ROSE = "#C29575";
const TAUPE = "#9C7C66";
const UMBER = "#6C635A";

/** The geometric art in the banner's corner, redrawn from the Figma frame. */
function BannerArt() {
  return (
    <svg viewBox="0 0 185 155" aria-hidden className="absolute right-0 bottom-0 hidden h-full lg:block">
      <path d="M150 18a28 13 0 0 1 28-13v13z" fill={CLAY} />
      <path d="M138 38c0-10 4-18 12-20 2 10-3 18-12 20z" fill={TAUPE} />
      <path d="M150 45a28 26 0 0 1 28-26v26z" fill={COPPER} />
      <path d="M116 61a17 14 0 0 1 34 0v14h-17a17 14 0 0 1-17-14z" fill={COPPER} />
      <circle cx="141" cy="67" r="8" fill={CREAM} />
      <path d="M150 75a28 28 0 0 1 28-28v28z" fill={CLAY} />
      <path d="M165 75a13 15 0 0 1 13-15v15z" fill={SAND} />
      <path d="M116 75h34v37a34 37 0 0 1-34-37z" fill={SAND} />
      <path d="M150 75h28v30a28 30 0 0 1-28-30z" fill={ROSE} />
      <circle cx="115" cy="98" r="10.5" fill={COPPER} />
      <circle cx="115" cy="98" r="5" fill={CREAM} />
      <path d="M32 112h18a30 20 0 0 1 30 20H52a20 20 0 0 1-20-20z" fill={TAUPE} />
      <path d="M56 123h12a12 9 0 0 1 12 9H68a12 9 0 0 1-12-9z" fill={CLAY} />
      <path d="M80 118h12a23 13 0 0 1 23 13h-12a23 13 0 0 1-23-13z" fill={CLAY} />
      <path d="M115 152v-12a35 35 0 0 1 35-35v12a35 35 0 0 1-35 35z" fill={CLAY} />
      <path d="M133 136v-11a17 17 0 0 1 17-17v11a17 17 0 0 1-17 17z" fill={UMBER} />
      <circle cx="166" cy="120" r="14" fill={COPPER} />
      <circle cx="166" cy="120" r="8" fill={UMBER} />
      <path d="M5 152a20 22 0 0 1 20-22h20v22z" fill={CLAY} />
      <path d="M28 130h17v14a17 14 0 0 1-17-14z" fill={SAND} />
      <path d="M45 130h35a17 22 0 0 1-17 22H45z" fill={ROSE} />
      <path d="M82 152a16.5 16.5 0 0 1 33 0h-8a8.5 8.5 0 0 0-17 0z" fill={COPPER} />
      <path d="M90 152a8.5 8.5 0 0 1 17 0z" fill={UMBER} />
      <path d="M150 135h28v17h-28z" fill={COPPER} />
      <path d="M160 152a18 17 0 0 1 18-17v17z" fill={CREAM} />
    </svg>
  );
}

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-[#121212] p-6 text-white md:p-8">
      <div className="relative z-10 max-w-xl lg:mr-48">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Good morning, {USER_FIRST_NAME}. 👋</h2>
        <p className="mt-3 text-sm/6 text-white/70 md:text-base/7">
          We are here to provide you with reliable informations and Investments opportunity. don&apos;t miss out on this
          amazing offer while it lasts.
        </p>
        <Button className="mt-4 h-9 rounded-sm bg-accent px-3 text-accent-foreground hover:bg-accent/85">
          Join our affiliate program
        </Button>
      </div>
      <BannerArt />
    </section>
  );
}
