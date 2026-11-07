import { HOME_COUNTRY, USERS_BY_COUNTRY } from "./_data";

// These match the projection public/assets/images/admin/world-map.svg was drawn with (Miller, lat 84 to -58).
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500.9;
const MILLER_TOP = 2.001618;
const miller = (latitude: number) => 1.25 * Math.log(Math.tan(Math.PI / 4 + (0.4 * latitude * Math.PI) / 180));
// Rounded because Math.tan and Math.log can differ in the last digit between the server and the browser.
const project = (latitude: number, longitude: number) => ({
  x: Number((((longitude + 180) / 360) * MAP_WIDTH).toFixed(1)),
  y: Number(((MILLER_TOP - miller(latitude)) * (MAP_WIDTH / (2 * Math.PI))).toFixed(1)),
});

const MAP_IMAGE = "url(/assets/images/admin/world-map.svg)";
const home = project(HOME_COUNTRY.latitude, HOME_COUNTRY.longitude);

function Pin({ country, users, latitude, longitude }: (typeof USERS_BY_COUNTRY)[number]) {
  const { x, y } = project(latitude, longitude);

  return (
    <g>
      <title>{`${country}: ${users.toLocaleString("en-NG")} users`}</title>
      <circle
        cx={x}
        cy={y}
        r={8}
        className="origin-center animate-ping fill-foreground/25 [animation-duration:2.4s] [transform-box:fill-box] motion-reduce:animate-none"
      />
      <circle cx={x} cy={y} r={8} className="fill-foreground stroke-card stroke-[3]" />
    </g>
  );
}

export function UsersMap() {
  return (
    <figure aria-label="Users by country" className="relative w-full" style={{ aspectRatio: MAP_WIDTH / MAP_HEIGHT }}>
      <div
        aria-hidden
        className="absolute inset-0 bg-muted-foreground/35"
        style={{ maskImage: MAP_IMAGE, WebkitMaskImage: MAP_IMAGE, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
      />
      <svg aria-hidden viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 size-full">
        {USERS_BY_COUNTRY.map(({ code, latitude, longitude }) => {
          const { x, y } = project(latitude, longitude);
          return (
            <line
              key={code}
              x1={home.x}
              y1={home.y}
              x2={x}
              y2={y}
              strokeDasharray="4 5"
              className="stroke-foreground/45 stroke-[1.25]"
            />
          );
        })}
        {USERS_BY_COUNTRY.map((country) => (
          <Pin key={country.code} {...country} />
        ))}
        <Pin {...HOME_COUNTRY} />
      </svg>
      <figcaption className="sr-only">
        <ul>
          {[HOME_COUNTRY, ...USERS_BY_COUNTRY].map(({ code, country, users }) => (
            <li key={code}>
              {country}: {users.toLocaleString("en-NG")} users
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
