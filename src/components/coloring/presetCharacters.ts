export interface PresetCharacter {
  id: string;
  name: string;
  label: string;
  emoji: string;
  description: string;
  svg: string;
}

const ROBI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="width:100%;height:auto;display:block">
  <!-- Left ear -->
  <ellipse id="robi-ear-l" class="colorable" cx="152" cy="128" rx="30" ry="60" fill="white" stroke="black" stroke-width="3.5"/>
  <ellipse id="robi-ear-l-in" class="colorable" cx="152" cy="128" rx="16" ry="40" fill="white" stroke="black" stroke-width="2"/>
  <!-- Right ear -->
  <ellipse id="robi-ear-r" class="colorable" cx="248" cy="128" rx="30" ry="60" fill="white" stroke="black" stroke-width="3.5"/>
  <ellipse id="robi-ear-r-in" class="colorable" cx="248" cy="128" rx="16" ry="40" fill="white" stroke="black" stroke-width="2"/>
  <!-- Antenna -->
  <line x1="200" y1="60" x2="200" y2="105" stroke="black" stroke-width="3" stroke-linecap="round"/>
  <circle id="robi-antenna" class="colorable" cx="200" cy="50" r="13" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="200" cy="50" r="5" fill="black"/>
  <!-- Head -->
  <circle id="robi-head" class="colorable" cx="200" cy="195" r="85" fill="white" stroke="black" stroke-width="4"/>
  <!-- Left eye -->
  <circle id="robi-eye-l" class="colorable" cx="170" cy="183" r="20" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="170" cy="183" r="11" fill="black"/>
  <circle cx="175" cy="177" r="4.5" fill="white"/>
  <!-- Right eye -->
  <circle id="robi-eye-r" class="colorable" cx="230" cy="183" r="20" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="230" cy="183" r="11" fill="black"/>
  <circle cx="235" cy="177" r="4.5" fill="white"/>
  <!-- Mouth -->
  <path d="M182,218 Q200,232 218,218" fill="none" stroke="black" stroke-width="3" stroke-linecap="round"/>
  <!-- Cheeks -->
  <ellipse id="robi-cheek-l" class="colorable" cx="155" cy="214" rx="15" ry="10" fill="white" stroke="black" stroke-width="1.5"/>
  <ellipse id="robi-cheek-r" class="colorable" cx="245" cy="214" rx="15" ry="10" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Body -->
  <rect id="robi-body" class="colorable" x="140" y="272" width="120" height="130" rx="26" fill="white" stroke="black" stroke-width="4"/>
  <!-- Belly panel -->
  <rect id="robi-belly" class="colorable" x="158" y="288" width="84" height="90" rx="12" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Dials -->
  <circle id="robi-dial1" class="colorable" cx="183" cy="310" r="12" fill="white" stroke="black" stroke-width="2"/>
  <circle id="robi-dial2" class="colorable" cx="217" cy="310" r="12" fill="white" stroke="black" stroke-width="2"/>
  <rect id="robi-dial3" class="colorable" x="170" y="332" width="60" height="18" rx="8" fill="white" stroke="black" stroke-width="2"/>
  <!-- Bow tie -->
  <path id="robi-bow-l" class="colorable" d="M200,274 L183,264 L183,282 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <path id="robi-bow-r" class="colorable" d="M200,274 L217,264 L217,282 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <circle id="robi-bow-c" class="colorable" cx="200" cy="274" r="6" fill="white" stroke="black" stroke-width="2"/>
  <!-- Left arm -->
  <rect id="robi-arm-l" class="colorable" x="98" y="280" width="42" height="78" rx="20" fill="white" stroke="black" stroke-width="3.5"/>
  <!-- Right arm -->
  <rect id="robi-arm-r" class="colorable" x="260" y="280" width="42" height="78" rx="20" fill="white" stroke="black" stroke-width="3.5"/>
  <!-- Left leg -->
  <rect id="robi-leg-l" class="colorable" x="153" y="392" width="38" height="68" rx="18" fill="white" stroke="black" stroke-width="3.5"/>
  <!-- Right leg -->
  <rect id="robi-leg-r" class="colorable" x="209" y="392" width="38" height="68" rx="18" fill="white" stroke="black" stroke-width="3.5"/>
</svg>`;

const BORI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="width:100%;height:auto;display:block">
  <!-- Left wing -->
  <ellipse id="bori-wing-l" class="colorable" cx="143" cy="308" rx="32" ry="75" fill="white" stroke="black" stroke-width="3" transform="rotate(-15,143,308)"/>
  <!-- Right wing -->
  <ellipse id="bori-wing-r" class="colorable" cx="257" cy="308" rx="32" ry="75" fill="white" stroke="black" stroke-width="3" transform="rotate(15,257,308)"/>
  <!-- Body -->
  <ellipse id="bori-body" class="colorable" cx="200" cy="328" rx="70" ry="118" fill="white" stroke="black" stroke-width="4"/>
  <!-- Belly -->
  <ellipse id="bori-belly" class="colorable" cx="200" cy="330" rx="46" ry="86" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Head -->
  <circle id="bori-head" class="colorable" cx="200" cy="178" r="74" fill="white" stroke="black" stroke-width="4"/>
  <!-- Left eye -->
  <circle id="bori-eye-l" class="colorable" cx="175" cy="162" r="18" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="175" cy="162" r="10" fill="black"/>
  <circle cx="180" cy="156" r="4" fill="white"/>
  <!-- Right eye -->
  <circle id="bori-eye-r" class="colorable" cx="225" cy="162" r="18" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="225" cy="162" r="10" fill="black"/>
  <circle cx="230" cy="156" r="4" fill="white"/>
  <!-- Beak -->
  <path id="bori-beak" class="colorable" d="M192,183 L200,200 L208,183 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Cheeks -->
  <ellipse id="bori-cheek-l" class="colorable" cx="160" cy="180" rx="14" ry="9" fill="white" stroke="black" stroke-width="1.5"/>
  <ellipse id="bori-cheek-r" class="colorable" cx="240" cy="180" rx="14" ry="9" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Bow tie left -->
  <path id="bori-bow-l" class="colorable" d="M200,240 L182,230 L182,250 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Bow tie right -->
  <path id="bori-bow-r" class="colorable" d="M200,240 L218,230 L218,250 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Bow tie center -->
  <circle id="bori-bow-c" class="colorable" cx="200" cy="240" r="7" fill="white" stroke="black" stroke-width="2"/>
  <!-- Left foot -->
  <ellipse id="bori-foot-l" class="colorable" cx="178" cy="452" rx="28" ry="13" fill="white" stroke="black" stroke-width="3"/>
  <!-- Right foot -->
  <ellipse id="bori-foot-r" class="colorable" cx="222" cy="452" rx="28" ry="13" fill="white" stroke="black" stroke-width="3"/>
</svg>`;

const PPOMI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="width:100%;height:auto;display:block">
  <!-- Left ear -->
  <path id="ppomi-ear-l" class="colorable" d="M148,118 L128,68 L168,90 Z" fill="white" stroke="black" stroke-width="3.5"/>
  <path id="ppomi-ear-l-in" class="colorable" d="M148,112 L136,80 L160,94 Z" fill="white" stroke="black" stroke-width="2"/>
  <!-- Right ear -->
  <path id="ppomi-ear-r" class="colorable" d="M252,118 L272,68 L232,90 Z" fill="white" stroke="black" stroke-width="3.5"/>
  <path id="ppomi-ear-r-in" class="colorable" d="M252,112 L264,80 L240,94 Z" fill="white" stroke="black" stroke-width="2"/>
  <!-- Head -->
  <circle id="ppomi-head" class="colorable" cx="200" cy="195" r="88" fill="white" stroke="black" stroke-width="4"/>
  <!-- Left eye -->
  <circle id="ppomi-eye-l" class="colorable" cx="168" cy="182" r="22" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="168" cy="182" r="12" fill="black"/>
  <circle cx="174" cy="175" r="5" fill="white"/>
  <!-- Right eye -->
  <circle id="ppomi-eye-r" class="colorable" cx="232" cy="182" r="22" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="232" cy="182" r="12" fill="black"/>
  <circle cx="238" cy="175" r="5" fill="white"/>
  <!-- Nose -->
  <ellipse id="ppomi-nose" class="colorable" cx="200" cy="210" rx="7" ry="5" fill="white" stroke="black" stroke-width="2"/>
  <!-- Mouth -->
  <path d="M192,218 Q200,228 208,218" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Whiskers left -->
  <line x1="138" y1="212" x2="178" y2="216" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="136" y1="220" x2="178" y2="220" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Whiskers right -->
  <line x1="262" y1="212" x2="222" y2="216" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="264" y1="220" x2="222" y2="220" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Star cheek left -->
  <path id="ppomi-star-l" class="colorable" d="M155,200 L158,192 L161,200 L153,195 L163,195 Z" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Star cheek right -->
  <path id="ppomi-star-r" class="colorable" d="M245,200 L248,192 L251,200 L243,195 L253,195 Z" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Body -->
  <ellipse id="ppomi-body" class="colorable" cx="200" cy="365" rx="80" ry="100" fill="white" stroke="black" stroke-width="4"/>
  <!-- Belly -->
  <ellipse id="ppomi-belly" class="colorable" cx="200" cy="368" rx="52" ry="72" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Tail -->
  <path id="ppomi-tail" class="colorable" d="M280,380 Q320,350 310,410 Q300,440 270,420" fill="white" stroke="black" stroke-width="3" stroke-linejoin="round"/>
  <!-- Left arm/paw -->
  <ellipse id="ppomi-paw-l" class="colorable" cx="122" cy="345" rx="26" ry="52" fill="white" stroke="black" stroke-width="3.5" transform="rotate(20,122,345)"/>
  <!-- Right arm/paw -->
  <ellipse id="ppomi-paw-r" class="colorable" cx="278" cy="345" rx="26" ry="52" fill="white" stroke="black" stroke-width="3.5" transform="rotate(-20,278,345)"/>
</svg>`;

const DORI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="width:100%;height:auto;display:block">
  <!-- Tail -->
  <path id="dori-tail" class="colorable" d="M260,380 Q320,380 330,430 Q340,460 300,455 Q280,450 268,430" fill="white" stroke="black" stroke-width="3"/>
  <!-- Left wing -->
  <path id="dori-wing-l" class="colorable" d="M148,280 Q100,230 110,190 Q120,165 145,200 Q155,215 160,270" fill="white" stroke="black" stroke-width="3"/>
  <!-- Right wing -->
  <path id="dori-wing-r" class="colorable" d="M252,280 Q300,230 290,190 Q280,165 255,200 Q245,215 240,270" fill="white" stroke="black" stroke-width="3"/>
  <!-- Body -->
  <ellipse id="dori-body" class="colorable" cx="200" cy="355" rx="78" ry="108" fill="white" stroke="black" stroke-width="4"/>
  <!-- Belly -->
  <ellipse id="dori-belly" class="colorable" cx="200" cy="358" rx="50" ry="78" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Back spikes -->
  <path id="dori-spike1" class="colorable" d="M200,248 L192,228 L208,244 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <path id="dori-spike2" class="colorable" d="M215,252 L210,232 L224,248 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <path id="dori-spike3" class="colorable" d="M185,252 L176,232 L192,248 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Head -->
  <circle id="dori-head" class="colorable" cx="200" cy="195" r="80" fill="white" stroke="black" stroke-width="4"/>
  <!-- Left horn -->
  <path id="dori-horn-l" class="colorable" d="M172,128 L162,100 L185,122 Z" fill="white" stroke="black" stroke-width="3"/>
  <!-- Right horn -->
  <path id="dori-horn-r" class="colorable" d="M228,128 L238,100 L215,122 Z" fill="white" stroke="black" stroke-width="3"/>
  <!-- Left eye -->
  <circle id="dori-eye-l" class="colorable" cx="172" cy="185" r="21" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="172" cy="185" r="12" fill="black"/>
  <circle cx="178" cy="178" r="5" fill="white"/>
  <!-- Right eye -->
  <circle id="dori-eye-r" class="colorable" cx="228" cy="185" r="21" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="228" cy="185" r="12" fill="black"/>
  <circle cx="234" cy="178" r="5" fill="white"/>
  <!-- Nostrils -->
  <circle cx="193" cy="212" r="4" fill="black"/>
  <circle cx="207" cy="212" r="4" fill="black"/>
  <!-- Smile -->
  <path d="M180,222 Q200,238 220,222" fill="none" stroke="black" stroke-width="3" stroke-linecap="round"/>
  <!-- Cheeks -->
  <ellipse id="dori-cheek-l" class="colorable" cx="155" cy="210" rx="14" ry="9" fill="white" stroke="black" stroke-width="1.5"/>
  <ellipse id="dori-cheek-r" class="colorable" cx="245" cy="210" rx="14" ry="9" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Left leg -->
  <ellipse id="dori-leg-l" class="colorable" cx="168" cy="458" rx="28" ry="18" fill="white" stroke="black" stroke-width="3"/>
  <!-- Right leg -->
  <ellipse id="dori-leg-r" class="colorable" cx="232" cy="458" rx="28" ry="18" fill="white" stroke="black" stroke-width="3"/>
</svg>`;

const NORI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="width:100%;height:auto;display:block">
  <!-- Left ear -->
  <circle id="nori-ear-l" class="colorable" cx="138" cy="132" r="38" fill="white" stroke="black" stroke-width="4"/>
  <circle id="nori-ear-l-in" class="colorable" cx="138" cy="132" r="22" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Right ear -->
  <circle id="nori-ear-r" class="colorable" cx="262" cy="132" r="38" fill="white" stroke="black" stroke-width="4"/>
  <circle id="nori-ear-r-in" class="colorable" cx="262" cy="132" r="22" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Head -->
  <circle id="nori-head" class="colorable" cx="200" cy="200" r="92" fill="white" stroke="black" stroke-width="4"/>
  <!-- Left eye -->
  <circle id="nori-eye-l" class="colorable" cx="168" cy="183" r="22" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="168" cy="183" r="13" fill="black"/>
  <circle cx="174" cy="176" r="5.5" fill="white"/>
  <!-- Right eye -->
  <circle id="nori-eye-r" class="colorable" cx="232" cy="183" r="22" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="232" cy="183" r="13" fill="black"/>
  <circle cx="238" cy="176" r="5.5" fill="white"/>
  <!-- Snout -->
  <ellipse id="nori-snout" class="colorable" cx="200" cy="223" rx="30" ry="22" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Heart nose -->
  <path id="nori-nose" class="colorable" d="M200,212 C200,208 194,204 190,207 C186,210 186,215 190,220 L200,228 L210,220 C214,215 214,210 210,207 C206,204 200,208 200,212 Z" fill="white" stroke="black" stroke-width="2"/>
  <!-- Mouth -->
  <path d="M188,230 Q200,240 212,230" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Cheeks -->
  <ellipse id="nori-cheek-l" class="colorable" cx="160" cy="218" rx="16" ry="11" fill="white" stroke="black" stroke-width="1.5"/>
  <ellipse id="nori-cheek-r" class="colorable" cx="240" cy="218" rx="16" ry="11" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Body -->
  <ellipse id="nori-body" class="colorable" cx="200" cy="375" rx="88" ry="102" fill="white" stroke="black" stroke-width="4"/>
  <!-- Belly -->
  <ellipse id="nori-belly" class="colorable" cx="200" cy="375" rx="58" ry="72" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Left arm -->
  <ellipse id="nori-arm-l" class="colorable" cx="115" cy="360" rx="28" ry="55" fill="white" stroke="black" stroke-width="3.5" transform="rotate(20,115,360)"/>
  <!-- Right arm -->
  <ellipse id="nori-arm-r" class="colorable" cx="285" cy="360" rx="28" ry="55" fill="white" stroke="black" stroke-width="3.5" transform="rotate(-20,285,360)"/>
  <!-- Left leg -->
  <ellipse id="nori-leg-l" class="colorable" cx="170" cy="468" rx="30" ry="15" fill="white" stroke="black" stroke-width="3"/>
  <!-- Right leg -->
  <ellipse id="nori-leg-r" class="colorable" cx="230" cy="468" rx="30" ry="15" fill="white" stroke="black" stroke-width="3"/>
</svg>`;

const SORI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" style="width:100%;height:auto;display:block">
  <!-- Left wing -->
  <path id="sori-wing-l" class="colorable" d="M148,295 Q80,250 90,185 Q100,145 145,200 Q158,220 162,290" fill="white" stroke="black" stroke-width="3"/>
  <path id="sori-wing-l2" class="colorable" d="M148,300 Q70,320 72,375 Q74,400 130,380 Q148,370 158,310" fill="white" stroke="black" stroke-width="3"/>
  <!-- Right wing -->
  <path id="sori-wing-r" class="colorable" d="M252,295 Q320,250 310,185 Q300,145 255,200 Q242,220 238,290" fill="white" stroke="black" stroke-width="3"/>
  <path id="sori-wing-r2" class="colorable" d="M252,300 Q330,320 328,375 Q326,400 270,380 Q252,370 242,310" fill="white" stroke="black" stroke-width="3"/>
  <!-- Dress -->
  <path id="sori-dress" class="colorable" d="M148,288 Q130,340 125,420 Q175,445 200,448 Q225,445 275,420 Q270,340 252,288 Q225,272 200,272 Q175,272 148,288 Z" fill="white" stroke="black" stroke-width="3.5"/>
  <!-- Dress trim -->
  <path id="sori-trim" class="colorable" d="M125,418 Q175,442 200,445 Q225,442 275,418 Q265,435 250,442 Q225,455 200,457 Q175,455 150,442 Q135,435 125,418 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Body connector -->
  <ellipse id="sori-torso" class="colorable" cx="200" cy="278" rx="50" ry="20" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Head -->
  <circle id="sori-head" class="colorable" cx="200" cy="192" r="82" fill="white" stroke="black" stroke-width="4"/>
  <!-- Star crown left -->
  <path id="sori-crown-l" class="colorable" d="M155,125 L158,113 L161,125 L150,118 L166,118 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Star crown center -->
  <path id="sori-crown-c" class="colorable" d="M200,112 L204,98 L208,112 L196,104 L212,104 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Star crown right -->
  <path id="sori-crown-r" class="colorable" d="M245,125 L248,113 L251,125 L240,118 L256,118 Z" fill="white" stroke="black" stroke-width="2.5"/>
  <!-- Hair band -->
  <path id="sori-band" class="colorable" d="M118,175 Q200,148 282,175" fill="none" stroke="black" stroke-width="5" stroke-linecap="round"/>
  <!-- Left eye -->
  <circle id="sori-eye-l" class="colorable" cx="170" cy="188" r="22" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="170" cy="188" r="13" fill="black"/>
  <circle cx="176" cy="181" r="5.5" fill="white"/>
  <!-- Right eye -->
  <circle id="sori-eye-r" class="colorable" cx="230" cy="188" r="22" fill="white" stroke="black" stroke-width="3"/>
  <circle cx="230" cy="188" r="13" fill="black"/>
  <circle cx="236" cy="181" r="5.5" fill="white"/>
  <!-- Nose -->
  <ellipse cx="200" cy="213" rx="6" ry="4.5" fill="black"/>
  <!-- Smile -->
  <path d="M183,224 Q200,238 217,224" fill="none" stroke="black" stroke-width="3" stroke-linecap="round"/>
  <!-- Cheeks -->
  <ellipse id="sori-cheek-l" class="colorable" cx="154" cy="214" rx="16" ry="11" fill="white" stroke="black" stroke-width="1.5"/>
  <ellipse id="sori-cheek-r" class="colorable" cx="246" cy="214" rx="16" ry="11" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Sparkle stars on dress -->
  <path id="sori-spark1" class="colorable" d="M175,330 L177,322 L179,330 L172,325 L182,325 Z" fill="white" stroke="black" stroke-width="1.5"/>
  <path id="sori-spark2" class="colorable" d="M220,355 L222,347 L224,355 L217,350 L227,350 Z" fill="white" stroke="black" stroke-width="1.5"/>
  <path id="sori-spark3" class="colorable" d="M195,385 L197,377 L199,385 L192,380 L202,380 Z" fill="white" stroke="black" stroke-width="1.5"/>
  <!-- Wand -->
  <line x1="280" y1="340" x2="310" y2="260" stroke="black" stroke-width="3" stroke-linecap="round"/>
  <path id="sori-wand-star" class="colorable" d="M310,252 L313,240 L316,252 L306,245 L320,245 Z" fill="white" stroke="black" stroke-width="2.5"/>
</svg>`;

export const PRESET_CHARACTERS: PresetCharacter[] = [
  {
    id: "robi",
    name: "Robi",
    label: "로비",
    emoji: "🤖",
    description: "귀여운 로봇 토끼",
    svg: ROBI_SVG,
  },
  {
    id: "bori",
    name: "Bori",
    label: "보리",
    emoji: "🐧",
    description: "뽀통령 아기 펭귄",
    svg: BORI_SVG,
  },
  {
    id: "ppomi",
    name: "Ppomi",
    label: "뽀미",
    emoji: "🐱",
    description: "별 뺨 동그란 고양이",
    svg: PPOMI_SVG,
  },
  {
    id: "dori",
    name: "Dori",
    label: "도리",
    emoji: "🐉",
    description: "통통한 아기 용",
    svg: DORI_SVG,
  },
  {
    id: "nori",
    name: "Nori",
    label: "노리",
    emoji: "🐻",
    description: "하트코 곰돌이",
    svg: NORI_SVG,
  },
  {
    id: "sori",
    name: "Sori",
    label: "소리",
    emoji: "⭐",
    description: "반짝반짝 별 요정",
    svg: SORI_SVG,
  },
];

export function getCharacterById(id: string): PresetCharacter | undefined {
  return PRESET_CHARACTERS.find((c) => c.id === id);
}
