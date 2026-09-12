/**
 * Per-project artwork for the generated covers.
 *
 * The covers started as hash-seeded abstract patterns. They were pretty and
 * interchangeable — a dot grid says nothing about a seed-sowing robot. Each
 * scene here draws what the project actually does instead: the soil rows the
 * robot sows, the node graph the pipeline runs, the pixel grid the CNN reads.
 *
 * Rules every scene follows:
 * - **Inline SVG, no JS.** These are server-rendered. Zero image requests and
 *   nothing to 404.
 * - **`currentColor` and CSS vars only.** The caller sets colour once, so a
 *   scene re-themes with the site rather than carrying baked-in hex.
 * - **Motion is CSS, on the parent's hover**, and only `transform`/`opacity`.
 *   Every animation is inside a `prefers-reduced-motion: no-preference` block
 *   in globals.css, so a reduced-motion visitor gets the scene at rest.
 * - **1440×900**, matching the poster aspect so a mixed grid never jumps.
 *
 * `aria-hidden` throughout: the cover's wrapper carries the label.
 */

import type { JSX } from "react";

export type ArtKey =
  | "agrobot"
  | "creatorjoy"
  | "digits"
  | "wireless"
  | "pipeline"
  | "site"
  | "overlay";

/** Seed-sowing robot: soil rows, a dispensing chassis, a sonar ping ahead. */
function Agrobot() {
  return (
    <g className="art art--agrobot">
      {/* Soil rows, receding. */}
      <g stroke="currentColor" strokeWidth={2.5} opacity={0.3}>
        {[560, 640, 720, 800].map((y, i) => (
          <line key={y} x1={60} y1={y} x2={1380} y2={y} opacity={0.4 + i * 0.16} />
        ))}
      </g>
      {/* Seeds already in the ground, and ones still falling. */}
      <g fill="currentColor">
        {[180, 330, 480, 630].map((x) => (
          <circle key={x} cx={x} cy={632} r={7} opacity={0.55} />
        ))}
        {[780, 900, 1020].map((x, i) => (
          <circle
            key={x}
            className="art-seed"
            style={{ animationDelay: `${i * 0.22}s` }}
            cx={x}
            cy={470}
            r={7}
            opacity={0}
          />
        ))}
      </g>
      {/* Chassis. */}
      <g transform="translate(660 300)">
        <rect x={0} y={0} width={330} height={150} rx={16} fill="currentColor" opacity={0.18} />
        <rect
          x={0} y={0} width={330} height={150} rx={16}
          fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.8}
        />
        {/* Hopper + dispensing tube. */}
        <path d="M120 0 L210 0 L182 66 L148 66 Z" fill="currentColor" opacity={0.5} />
        <rect x={155} y={66} width={20} height={104} fill="currentColor" opacity={0.6} />
        {/* Wheels. */}
        <g className="art-wheel" fill="none" stroke="currentColor" strokeWidth={4}>
          <circle cx={68} cy={168} r={44} opacity={0.85} />
          <circle cx={262} cy={168} r={44} opacity={0.85} />
          <path d="M68 130 L68 206 M30 168 L106 168" opacity={0.45} />
          <path d="M262 130 L262 206 M224 168 L300 168" opacity={0.45} />
        </g>
      </g>
      {/* Ultrasonic ping, looking for the obstacle ahead. */}
      <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            className="art-ping"
            style={{ animationDelay: `${i * 0.3}s` }}
            d={`M1010 ${375 - 34 - i * 30} A ${60 + i * 42} ${60 + i * 42} 0 0 1 1010 ${375 + 34 + i * 30}`}
            opacity={0.5 - i * 0.12}
          />
        ))}
      </g>
    </g>
  );
}

/** CreatorJoy: thumbnail → script → cloned voice → rendered video. */
function CreatorJoy() {
  const stages = [
    { x: 90, label: "thumb" },
    { x: 450, label: "script" },
    { x: 810, label: "voice" },
    { x: 1170, label: "video" },
  ];
  return (
    <g className="art art--creatorjoy">
      {/* The chain between stages. */}
      <g stroke="currentColor" strokeWidth={3} opacity={0.32}>
        {[370, 730, 1090].map((x) => (
          <line key={x} x1={x} y1={450} x2={x + 70} y2={450} />
        ))}
      </g>
      <g className="art-flow" fill="currentColor">
        {[370, 730, 1090].map((x, i) => (
          <circle key={x} cx={x} cy={450} r={8} style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </g>
      {stages.map((s, i) => (
        <g key={s.label} className="art-stage" style={{ animationDelay: `${i * 0.18}s` }}>
          <rect
            x={s.x} y={340} width={280} height={220} rx={14}
            fill="currentColor" opacity={0.14}
          />
          <rect
            x={s.x} y={340} width={280} height={220} rx={14}
            fill="none" stroke="currentColor" strokeWidth={3} opacity={0.75}
          />
        </g>
      ))}
      {/* 1 — a play triangle, for the source video. */}
      <path d="M205 415 L265 450 L205 485 Z" fill="currentColor" opacity={0.8} />
      {/* 2 — lines of generated script. */}
      <g stroke="currentColor" strokeWidth={7} strokeLinecap="round" opacity={0.62}>
        <line x1={510} y1={410} x2={670} y2={410} />
        <line x1={510} y1={450} x2={700} y2={450} />
        <line x1={510} y1={490} x2={620} y2={490} />
      </g>
      {/* 3 — a voice waveform. */}
      <g className="art-wave" stroke="currentColor" strokeWidth={7} strokeLinecap="round" opacity={0.75}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const h = [26, 52, 84, 104, 78, 46, 22][i];
          return (
            <line
              key={i}
              style={{ animationDelay: `${i * 0.09}s` }}
              x1={880 + i * 24} y1={450 - h / 2}
              x2={880 + i * 24} y2={450 + h / 2}
            />
          );
        })}
      </g>
      {/* 4 — a rendered face. */}
      <g fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.8}>
        <circle cx={1310} cy={424} r={44} />
        <path d="M1250 540 a60 60 0 0 1 120 0" />
      </g>
    </g>
  );
}

/** MNIST: a hand-drawn 7 on a pixel grid, with class scores beside it. */
function Digits() {
  // A coarse 8×8 bitmap of a 7 — drawn as cells so it reads as pixels, which
  // is the thing the network actually sees.
  const on = new Set([
    9, 10, 11, 12, 13, 14,
    22, 30, 37, 45, 44, 52, 51, 59,
  ]);
  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const i = r * 8 + c;
      cells.push(
        <rect
          key={i}
          x={120 + c * 70} y={190 + r * 70} width={64} height={64} rx={5}
          fill="currentColor"
          opacity={on.has(i) ? 0.82 : 0.07}
        />,
      );
    }
  }
  return (
    <g className="art art--digits">
      <g>{cells}</g>
      {/* Ten class scores; the winner is the tall one. */}
      <g className="art-bars" fill="currentColor">
        {[18, 26, 14, 30, 20, 16, 24, 132, 22, 28].map((h, i) => (
          <rect
            key={i}
            className={i === 7 ? "art-bar art-bar--win" : "art-bar"}
            style={{ animationDelay: `${i * 0.05}s` }}
            x={840} y={200 + i * 52}
            width={h * 3.4} height={34} rx={6}
            opacity={i === 7 ? 0.9 : 0.26}
          />
        ))}
      </g>
    </g>
  );
}

/** Satellite, reflecting surface and ground user, with links between them. */
function Wireless() {
  return (
    <g className="art art--wireless">
      {/* Satellite. */}
      <g transform="translate(250 140)">
        <rect x={44} y={0} width={86} height={62} rx={9} fill="currentColor" opacity={0.7} />
        <g fill="currentColor" opacity={0.42}>
          <rect x={-62} y={10} width={98} height={42} rx={5} />
          <rect x={138} y={10} width={98} height={42} rx={5} />
        </g>
      </g>
      {/* IRS panel — a reconfigurable reflecting grid. */}
      <g transform="translate(980 170) rotate(-18)" className="art-irs">
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 6 }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              className="art-irs-cell"
              style={{ animationDelay: `${(r + c) * 0.08}s` }}
              x={c * 46} y={r * 46} width={38} height={38} rx={4}
              fill="currentColor" opacity={0.3}
            />
          )),
        )}
      </g>
      {/* Ground plane and the user on it. */}
      <line x1={90} y1={760} x2={1350} y2={760} stroke="currentColor" strokeWidth={3} opacity={0.35} />
      <g transform="translate(560 640)" fill="none" stroke="currentColor" strokeWidth={4} opacity={0.8}>
        <rect x={0} y={0} width={72} height={118} rx={12} />
        <line x1={18} y1={100} x2={54} y2={100} />
      </g>
      {/* The three links: satellite direct, via the IRS, and the reflected leg. */}
      <g fill="none" strokeWidth={3.5} strokeLinecap="round" stroke="currentColor">
        <path className="art-link" style={{ animationDelay: "0s" }}
          d="M360 250 L590 640" strokeDasharray="14 16" opacity={0.55} />
        <path className="art-link" style={{ animationDelay: "0.5s" }}
          d="M430 210 L1010 250" strokeDasharray="14 16" opacity={0.45} />
        <path className="art-link" style={{ animationDelay: "1s" }}
          d="M1030 350 L640 645" strokeDasharray="14 16" opacity={0.55} />
      </g>
    </g>
  );
}

/** n8n: a topic intake fanning out through generation, storage and delivery. */
function Pipeline() {
  const node = (x: number, y: number, delay: number, key: string) => (
    <g key={key} className="art-node" style={{ animationDelay: `${delay}s` }}>
      <rect x={x} y={y} width={190} height={100} rx={14} fill="currentColor" opacity={0.16} />
      <rect x={x} y={y} width={190} height={100} rx={14}
        fill="none" stroke="currentColor" strokeWidth={3} opacity={0.8} />
      <circle cx={x} cy={y + 50} r={8} fill="currentColor" opacity={0.9} />
      <circle cx={x + 190} cy={y + 50} r={8} fill="currentColor" opacity={0.9} />
    </g>
  );
  return (
    <g className="art art--pipeline">
      {/* Wires, including the fan-out to the two delivery channels. */}
      <g fill="none" stroke="currentColor" strokeWidth={3} opacity={0.4}>
        <path d="M320 450 C 380 450, 380 450, 440 450" />
        <path d="M630 450 C 690 450, 690 450, 750 450" />
        <path d="M940 450 C 1000 450, 1000 300, 1060 300" />
        <path d="M940 450 C 1000 450, 1000 600, 1060 600" />
      </g>
      {/* Data moving along the wires. Plain circles translated by CSS — SMIL
          animateMotion would do this in one attribute, but it ignores
          prefers-reduced-motion, and every other scene here is CSS. */}
      <g fill="currentColor">
        {[
          { x: 320, y: 450, delay: 0 },
          { x: 630, y: 450, delay: 0.35 },
          { x: 940, y: 450, delay: 0.7 },
        ].map((p, i) => (
          <circle
            key={i}
            className="art-pulse"
            style={{ animationDelay: `${p.delay}s` }}
            cx={p.x} cy={p.y} r={8} opacity={0}
          />
        ))}
      </g>
      {node(130, 400, 0, "intake")}
      {node(440, 400, 0.18, "groq")}
      {node(750, 400, 0.36, "supabase")}
      {node(1060, 250, 0.54, "alerts")}
      {node(1060, 550, 0.54, "drafts")}
      {/* A form field in the intake node. */}
      <g stroke="currentColor" strokeWidth={6} strokeLinecap="round" opacity={0.6}>
        <line x1={165} y1={435} x2={285} y2={435} />
        <line x1={165} y1={465} x2={240} y2={465} />
      </g>
      {/* Stacked discs for the database. */}
      <g fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.75}>
        <ellipse cx={845} cy={425} rx={46} ry={15} />
        <path d="M799 425 v34 a46 15 0 0 0 92 0 v-34" />
      </g>
    </g>
  );
}

/** This site: a browser window over the dot field, with the assistant open. */
function Site() {
  return (
    <g className="art art--site">
      {/* The dot field, as it appears behind everything here. */}
      <g fill="currentColor" opacity={0.2}>
        {Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 15 }, (_, c) => (
            <circle key={`${r}-${c}`} cx={90 + c * 90} cy={80 + r * 90} r={4} />
          )),
        )}
      </g>
      {/* Browser window. */}
      <g transform="translate(160 210)">
        <rect x={0} y={0} width={860} height={520} rx={18} fill="currentColor" opacity={0.13} />
        <rect x={0} y={0} width={860} height={520} rx={18}
          fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.8} />
        <line x1={0} y1={68} x2={860} y2={68} stroke="currentColor" strokeWidth={3} opacity={0.5} />
        <g fill="currentColor" opacity={0.55}>
          <circle cx={36} cy={34} r={9} />
          <circle cx={68} cy={34} r={9} />
          <circle cx={100} cy={34} r={9} />
        </g>
        {/* A headline and copy, standing in for the page. */}
        <rect x={54} y={130} width={420} height={38} rx={8} fill="currentColor" opacity={0.62} />
        <g stroke="currentColor" strokeWidth={9} strokeLinecap="round" opacity={0.3}>
          <line x1={58} y1={214} x2={600} y2={214} />
          <line x1={58} y1={254} x2={520} y2={254} />
        </g>
        <rect x={54} y={320} width={360} height={150} rx={12}
          fill="none" stroke="currentColor" strokeWidth={3} opacity={0.45} />
      </g>
      {/* The assistant, docked where it actually sits. */}
      <g className="art-chat" transform="translate(900 480)">
        <rect x={0} y={0} width={380} height={220} rx={18} fill="currentColor" opacity={0.2} />
        <rect x={0} y={0} width={380} height={220} rx={18}
          fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.85} />
        <g stroke="currentColor" strokeWidth={8} strokeLinecap="round" opacity={0.55}>
          <line x1={34} y1={62} x2={250} y2={62} />
          <line x1={34} y1={104} x2={300} y2={104} />
          <line x1={34} y1={146} x2={196} y2={146} />
        </g>
        <circle className="art-caret" cx={224} cy={146} r={7} fill="currentColor" opacity={0.9} />
      </g>
    </g>
  );
}

/** RTSP: a video frame with draggable overlay boxes on top of it. */
function Overlay() {
  return (
    <g className="art art--overlay">
      {/* The player. */}
      <rect x={150} y={160} width={1140} height={580} rx={18} fill="currentColor" opacity={0.12} />
      <rect x={150} y={160} width={1140} height={580} rx={18}
        fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.8} />
      {/* Scrubber. */}
      <g opacity={0.5}>
        <rect x={190} y={690} width={1060} height={8} rx={4} fill="currentColor" opacity={0.4} />
        <rect className="art-scrub" x={190} y={690} width={420} height={8} rx={4} fill="currentColor" />
      </g>
      <path d="M690 400 L770 445 L690 490 Z" fill="currentColor" opacity={0.55} />
      {/* Two overlays, with resize handles — the thing the app is for. */}
      <g className="art-ov art-ov--a">
        <rect x={250} y={250} width={300} height={110} rx={10}
          fill="currentColor" opacity={0.24} />
        <rect x={250} y={250} width={300} height={110} rx={10}
          fill="none" stroke="currentColor" strokeWidth={3.5} strokeDasharray="10 8" opacity={0.95} />
        <g stroke="currentColor" strokeWidth={7} strokeLinecap="round" opacity={0.7}>
          <line x1={284} y1={288} x2={470} y2={288} />
          <line x1={284} y1={322} x2={410} y2={322} />
        </g>
        <g fill="currentColor" opacity={0.95}>
          {[[250, 250], [550, 250], [250, 360], [550, 360]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x - 7} y={y - 7} width={14} height={14} rx={3} />
          ))}
        </g>
      </g>
      <g className="art-ov art-ov--b">
        <rect x={920} y={510} width={220} height={140} rx={10}
          fill="currentColor" opacity={0.24} />
        <rect x={920} y={510} width={220} height={140} rx={10}
          fill="none" stroke="currentColor" strokeWidth={3.5} strokeDasharray="10 8" opacity={0.8} />
        {/* A picture placeholder, for the image overlay. */}
        <g fill="none" stroke="currentColor" strokeWidth={3.5} opacity={0.75}>
          <circle cx={975} cy={556} r={15} />
          <path d="M935 634 L1000 580 L1045 616 L1080 592 L1125 634 Z" fill="currentColor" opacity={0.5} />
        </g>
      </g>
    </g>
  );
}

const SCENES: Record<ArtKey, () => JSX.Element> = {
  agrobot: Agrobot,
  creatorjoy: CreatorJoy,
  digits: Digits,
  wireless: Wireless,
  pipeline: Pipeline,
  site: Site,
  overlay: Overlay,
};

/** Returns the scene for a key, or null so the caller falls back to a pattern. */
export function projectArt(key: ArtKey | undefined): JSX.Element | null {
  if (!key) return null;
  const Scene = SCENES[key];
  return Scene ? <Scene /> : null;
}
