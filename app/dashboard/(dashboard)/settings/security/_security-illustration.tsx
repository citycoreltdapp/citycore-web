import Image from "next/image";

export function SecurityIllustration() {
  return (
    <div aria-hidden className="relative mx-auto aspect-[10/3] w-full max-w-100">
      <div className="absolute top-[11%] left-[20%] h-[35%] w-[60%] rounded-lg border bg-card p-2 shadow-sm">
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-2 rounded bg-muted" />
      </div>
      <div className="absolute top-[30%] left-[18%] h-[37%] w-[64%] rounded-lg border bg-card p-2 shadow-sm">
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-2 rounded bg-muted" />
      </div>
      <div className="absolute top-[50%] left-[14%] h-[38%] w-[72%] rounded-lg border bg-card p-2 shadow-sm">
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="mt-2 h-2 rounded bg-muted" />
      </div>
      <span className="absolute" style={{ inset: "12.26% 38.59% 0.01% 49.56%" }}>
        <Image src="/assets/images/security/shield-1.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "10.43% 38.59% 87.23% 59.35%" }}>
        <Image src="/assets/images/security/shield-2.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "0 39.08% 89.06% 49.16%" }}>
        <Image src="/assets/images/security/shield-3.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "10.14% 57.81% 89.06% 39.03%" }}>
        <Image src="/assets/images/security/shield-4.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "0.51% 40.16% 0 38.59%" }}>
        <Image src="/assets/images/security/shield-5.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "41.47% 49.78% 44.83% 48.34%" }}>
        <Image src="/assets/images/security/shield-6.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "6.81% 41.21% 5.09% 40%" }}>
        <Image src="/assets/images/security/shield-7.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "5.48% 41.21% 4.97% 39.67%" }}>
        <Image src="/assets/images/security/shield-8.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "38.06% 45.87% 38.59% 44.95%" }}>
        <Image src="/assets/images/security/shield-9.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "23.14% 47.79% 63.29% 51.24%" }}>
        <Image src="/assets/images/security/shield-10.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "36.71% 46.03% 39.17% 44.5%" }}>
        <Image src="/assets/images/security/shield-11.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "19.86% 47.96% 63.79% 46.31%" }}>
        <Image src="/assets/images/security/shield-12.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "40.89% 49.99% 52.59% 48.19%" }}>
        <Image src="/assets/images/security/shield-13.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "24.49% 48.81% 63.29% 47.33%" }}>
        <Image src="/assets/images/security/shield-14.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "35.63% 47.95% 63.29% 51.18%" }}>
        <Image src="/assets/images/security/shield-15.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "23.9% 49.36% 63.29% 47.17%" }}>
        <Image src="/assets/images/security/shield-16.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "35.63% 52.82% 63.29% 46.33%" }}>
        <Image src="/assets/images/security/shield-17.svg" alt="" fill className="object-contain" />
      </span>
      <span className="absolute" style={{ inset: "48.18% 50.94% 45% 48.83%" }}>
        <Image src="/assets/images/security/shield-18.svg" alt="" fill className="object-contain" />
      </span>
    </div>
  );
}
