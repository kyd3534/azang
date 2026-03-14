"use client";

import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

const SIZE = 280;
const BRUSH = 18;
const RADIUS = 22;
const THRESHOLD = 0.68;

type Waypoint = [number, number];
interface Shape { name: string; emoji: string; category: string; waypoints: Waypoint[]; }

// ── 헬퍼 함수 ─────────────────────────────────────────────────────────────────
const C = 140;
function seg(a: Waypoint, b: Waypoint, n = 7): Waypoint[] {
  return Array.from({ length: n }, (_, i): Waypoint => [
    a[0] + (b[0] - a[0]) * i / (n - 1),
    a[1] + (b[1] - a[1]) * i / (n - 1),
  ]);
}
function poly(pts: Waypoint[], n = 7): Waypoint[] {
  const r: Waypoint[] = [];
  for (let i = 0; i < pts.length - 1; i++) r.push(...seg(pts[i], pts[i + 1], n));
  r.push(pts[pts.length - 1]);
  return r;
}
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, pts = 32): Waypoint[] {
  return Array.from({ length: pts }, (_, i): Waypoint => {
    const a = a0 + (a1 - a0) * i / (pts - 1);
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}
function polygon(n: number, r: number, cx = C, cy = C, start = -Math.PI / 2): Waypoint[] {
  const verts: Waypoint[] = Array.from({ length: n }, (_, i): Waypoint => {
    const a = start + (i / n) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const wps: Waypoint[] = [];
  for (let i = 0; i < n; i++) wps.push(...seg(verts[i], verts[(i + 1) % n], 9));
  return wps;
}
function starShape(n: number, outer: number, inner: number, cx = C, cy = C): Waypoint[] {
  const pts: Waypoint[] = Array.from({ length: n * 2 }, (_, i): Waypoint => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const wps: Waypoint[] = [];
  for (let i = 0; i < pts.length; i++) wps.push(...seg(pts[i], pts[(i + 1) % pts.length], 5));
  return wps;
}
function heart(cx = C, cy = C, scale = 7): Waypoint[] {
  return Array.from({ length: 48 }, (_, i): Waypoint => {
    const t = (i / 48) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [cx + x * scale, cy + y * scale];
  });
}
// 알파벳·숫자 정밀 좌표 상수 (캔버스 280×280 기준)
const L=80, R=200, MX=140, ML=108, MR=172;
const T=40, B=240, MY=140, MT=100, MB=185;

// ── 모양 정의 ──────────────────────────────────────────────────────────────────
const SHAPES: Shape[] = [
  // === 기본 도형 ===
  { name: "원", emoji: "⭕", category: "도형", waypoints: arc(C, C, 95, 95, -Math.PI / 2, Math.PI * 1.5, 48) },
  { name: "타원(가로)", emoji: "🥚", category: "도형", waypoints: arc(C, C, 110, 70, -Math.PI / 2, Math.PI * 1.5, 48) },
  { name: "타원(세로)", emoji: "⚽", category: "도형", waypoints: arc(C, C, 70, 105, -Math.PI / 2, Math.PI * 1.5, 48) },
  { name: "정삼각형", emoji: "🔺", category: "도형", waypoints: polygon(3, 100) },
  { name: "역삼각형", emoji: "🔻", category: "도형", waypoints: polygon(3, 100, C, C, Math.PI / 2) },
  { name: "직각삼각형", emoji: "📐", category: "도형", waypoints: poly([[75, 230], [75, 35], [205, 230], [75, 230]]) },
  { name: "정사각형", emoji: "⬛", category: "도형", waypoints: polygon(4, 100) },
  { name: "직사각형(가로)", emoji: "🟥", category: "도형", waypoints: poly([[50, 100], [230, 100], [230, 180], [50, 180], [50, 100]]) },
  { name: "직사각형(세로)", emoji: "📄", category: "도형", waypoints: poly([[90, 30], [190, 30], [190, 250], [90, 250], [90, 30]]) },
  { name: "마름모", emoji: "♦️", category: "도형", waypoints: poly([[140, 30], [230, 140], [140, 250], [50, 140], [140, 30]]) },
  { name: "오각형", emoji: "⭐", category: "도형", waypoints: polygon(5, 100) },
  { name: "육각형", emoji: "⬡", category: "도형", waypoints: polygon(6, 100) },
  { name: "칠각형", emoji: "🔷", category: "도형", waypoints: polygon(7, 95) },
  { name: "팔각형", emoji: "🛑", category: "도형", waypoints: polygon(8, 95) },
  { name: "십이각형", emoji: "🔵", category: "도형", waypoints: polygon(12, 95) },
  { name: "십자(+)", emoji: "➕", category: "도형", waypoints: poly([[140, 35], [140, 105], [205, 105], [205, 175], [140, 175], [140, 245], [140, 175], [75, 175], [75, 105], [140, 105]]) },
  { name: "평행사변형", emoji: "▱", category: "도형", waypoints: poly([[90, 210], [50, 210], [170, 60], [230, 60], [90, 210]]) },
  { name: "사다리꼴", emoji: "🔲", category: "도형", waypoints: poly([[55, 220], [225, 220], [195, 60], [85, 60], [55, 220]]) },
  // === 별 ===
  { name: "4꼭지 별", emoji: "✨", category: "별", waypoints: starShape(4, 100, 40) },
  { name: "5꼭지 별", emoji: "⭐", category: "별", waypoints: starShape(5, 100, 42) },
  { name: "6꼭지 별", emoji: "🌟", category: "별", waypoints: starShape(6, 95, 48) },
  { name: "7꼭지 별", emoji: "💫", category: "별", waypoints: starShape(7, 95, 50) },
  { name: "8꼭지 별", emoji: "✳️", category: "별", waypoints: starShape(8, 95, 52) },
  { name: "뾰족 별", emoji: "🌠", category: "별", waypoints: starShape(5, 105, 22) },
  { name: "날카로운 별", emoji: "💥", category: "별", waypoints: starShape(12, 95, 60) },
  // === 특수 ===
  { name: "하트", emoji: "❤️", category: "특수", waypoints: heart() },
  { name: "초승달", emoji: "🌙", category: "특수", waypoints: [...arc(C, C, 90, 90, -Math.PI * 0.8, Math.PI * 0.8, 32), ...arc(C + 30, C, 80, 90, Math.PI * 0.85, -Math.PI * 0.85, 32)] },
  { name: "무한대", emoji: "♾️", category: "특수", waypoints: Array.from({ length: 64 }, (_, i): Waypoint => { const t = (i / 64) * Math.PI * 2; const d = 1 / (1 + 0.5 * Math.sin(t) * Math.sin(t)); return [C + 90 * Math.cos(t) * d, C + 45 * Math.sin(2 * t) * d * 0.5]; }) },
  { name: "나선형", emoji: "🌀", category: "특수", waypoints: Array.from({ length: 80 }, (_, i): Waypoint => { const t = (i / 80) * Math.PI * 6; const r = 10 + t * 8; return [C + r * Math.cos(t), C + r * Math.sin(t)]; }) },
  { name: "지그재그", emoji: "〰️", category: "특수", waypoints: Array.from({ length: 10 }, (_, i): Waypoint => [40 + i * 22, i % 2 === 0 ? 90 : 190]) },
  { name: "파도", emoji: "🌊", category: "특수", waypoints: Array.from({ length: 48 }, (_, i): Waypoint => [30 + i * 4.6, C + 60 * Math.sin((i / 48) * Math.PI * 4)]) },
  { name: "화살표 ↑", emoji: "⬆️", category: "특수", waypoints: poly([[140, 30], [70, 120], [110, 120], [110, 250], [170, 250], [170, 120], [210, 120], [140, 30]]) },
  { name: "화살표 →", emoji: "➡️", category: "특수", waypoints: poly([[30, 140], [160, 140], [160, 100], [250, 140], [160, 180], [160, 140]]) },
  { name: "화살표 ↙", emoji: "↙️", category: "특수", waypoints: poly([[210, 50], [50, 210], [120, 210], [50, 210], [50, 140]]) },
  { name: "별 뱃지", emoji: "🏅", category: "특수", waypoints: [...arc(C, C, 70, 70, 0, Math.PI * 2, 32), ...starShape(5, 48, 20, C, C)] },
  // === 숫자 (정밀 좌표) ===
  { name: "숫자 0", emoji: "0️⃣", category: "숫자",
    waypoints: arc(MX, MY, 62, 95, 0, Math.PI * 2, 52) },
  { name: "숫자 1", emoji: "1️⃣", category: "숫자",
    waypoints: [...seg([112, 88], [140, 40], 5), ...seg([140, 40], [140, 240], 16), ...seg([110, 240], [170, 240], 6)] },
  { name: "숫자 2", emoji: "2️⃣", category: "숫자",
    waypoints: [...arc(140, 108, 58, 65, -Math.PI, 0, 22), ...poly([[198, 140], [82, 240], [198, 240]], 12)] },
  { name: "숫자 3", emoji: "3️⃣", category: "숫자",
    waypoints: [...arc(140, 108, 60, 68, -Math.PI * 0.85, Math.PI * 0.85, 26), ...arc(140, 185, 60, 55, -Math.PI * 0.85, Math.PI * 0.85, 26)] },
  { name: "숫자 4", emoji: "4️⃣", category: "숫자",
    waypoints: [...poly([[175, 40], [82, 175], [202, 175]], 14), ...seg([175, 40], [175, 240], 14)] },
  { name: "숫자 5", emoji: "5️⃣", category: "숫자",
    waypoints: [...seg([198, 40], [82, 40], 8), ...seg([82, 40], [82, 138], 8), ...seg([82, 138], [158, 138], 6), ...arc(140, 192, 60, 50, -Math.PI * 0.85, Math.PI * 0.9, 26)] },
  { name: "숫자 6", emoji: "6️⃣", category: "숫자",
    waypoints: [...arc(140, 185, 58, 55, 0, Math.PI * 2, 34), ...arc(140, 140, 52, 100, -Math.PI * 0.05, -Math.PI, 22)] },
  { name: "숫자 7", emoji: "7️⃣", category: "숫자",
    waypoints: [...seg([82, 40], [200, 40], 9), ...seg([200, 40], [108, 240], 15)] },
  { name: "숫자 8", emoji: "8️⃣", category: "숫자",
    waypoints: [...arc(140, 105, 52, 62, 0, Math.PI * 2, 30), ...arc(140, 185, 54, 55, 0, Math.PI * 2, 30)] },
  { name: "숫자 9", emoji: "9️⃣", category: "숫자",
    waypoints: [...arc(140, 112, 58, 70, 0, Math.PI * 2, 34), ...seg([198, 112], [162, 240], 15)] },
  // === 알파벳 (정밀 좌표) ===
  { name: "A", emoji: "🅰️", category: "알파벳",
    waypoints: [...poly([[L, B], [MX, T], [R, B]], 14), ...seg([106, 162], [174, 162], 7)] },
  { name: "B", emoji: "🅱️", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([L, T], [ML+20, T], 5), ...arc(ML+22, MT+8, 50, 62, -Math.PI/2, Math.PI/2, 20), ...seg([L, MY+5], [ML+18, MY+5], 5), ...arc(ML+20, MB, 52, 45, -Math.PI/2, Math.PI/2, 20), ...seg([L, B], [ML+18, B], 5)] },
  { name: "C", emoji: "©️", category: "알파벳",
    waypoints: arc(MX, MY, 84, 95, Math.PI * 0.28, Math.PI * 1.72, 40) },
  { name: "D", emoji: "🔡", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([L, T], [ML+10, T], 4), ...arc(ML+12, MY, 60, 100, -Math.PI/2, Math.PI/2, 28), ...seg([L, B], [ML+10, B], 4)] },
  { name: "E", emoji: "📝", category: "알파벳",
    waypoints: [...seg([R, T], [L, T], 8), ...seg([L, T], [L, B], 14), ...seg([L, B], [R, B], 8), ...seg([L, MY], [MR-10, MY], 7)] },
  { name: "F", emoji: "📋", category: "알파벳",
    waypoints: [...seg([R, T], [L, T], 8), ...seg([L, T], [L, B], 14), ...seg([L, MY-5], [MR-10, MY-5], 7)] },
  { name: "G", emoji: "🔤", category: "알파벳",
    waypoints: [...arc(MX, MY, 84, 95, Math.PI * 0.28, Math.PI * 1.72, 36), ...seg([MX, MY], [R, MY], 5), ...seg([R, MY], [R, MB], 5)] },
  { name: "H", emoji: "♓", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([L, MY], [R, MY], 8), ...seg([R, T], [R, B], 14)] },
  { name: "I", emoji: "ℹ️", category: "알파벳",
    waypoints: [...seg([ML, T], [MR, T], 5), ...seg([MX, T], [MX, B], 14), ...seg([ML, B], [MR, B], 5)] },
  { name: "J", emoji: "🔡", category: "알파벳",
    waypoints: [...seg([ML, T], [MR, T], 5), ...seg([MR, T], [MR, MB], 10), ...arc(MR-30, MB, 30, 40, 0, Math.PI, 18)] },
  { name: "K", emoji: "🔤", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([R, T], [L, MY], 12), ...seg([L, MY], [R, B], 12)] },
  { name: "L", emoji: "🔡", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([L, B], [R, B], 8)] },
  { name: "M", emoji: "Ⓜ️", category: "알파벳",
    waypoints: poly([[L, B], [L, T], [MX, 165], [R, T], [R, B]], 12) },
  { name: "N", emoji: "🔡", category: "알파벳",
    waypoints: poly([[L, B], [L, T], [R, B], [R, T]], 14) },
  { name: "O", emoji: "🅾️", category: "알파벳",
    waypoints: arc(MX, MY, 76, 96, 0, Math.PI * 2, 52) },
  { name: "P", emoji: "🅿️", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([L, T], [ML+22, T], 5), ...arc(ML+24, MT+8, 50, 62, -Math.PI/2, Math.PI/2, 20), ...seg([L, MY+5], [ML+20, MY+5], 5)] },
  { name: "Q", emoji: "❓", category: "알파벳",
    waypoints: [...arc(MX, MY-10, 76, 88, 0, Math.PI * 2, 42), ...seg([163, 175], [192, 218], 6)] },
  { name: "R", emoji: "®️", category: "알파벳",
    waypoints: [...seg([L, T], [L, B], 14), ...seg([L, T], [ML+22, T], 5), ...arc(ML+24, MT+8, 50, 62, -Math.PI/2, Math.PI/2, 20), ...seg([L, MY+5], [ML+20, MY+5], 5), ...seg([ML+10, MY+8], [R, B], 12)] },
  { name: "S", emoji: "💲", category: "알파벳",
    waypoints: [...arc(MX-2, MT+5, 60, 62, 0, -Math.PI, 22), ...arc(MX+2, MB, 60, 55, -Math.PI, 0, 22)] },
  { name: "T", emoji: "✝️", category: "알파벳",
    waypoints: [...seg([L, T], [R, T], 9), ...seg([MX, T], [MX, B], 14)] },
  { name: "U", emoji: "⛎", category: "알파벳",
    waypoints: [...seg([L, T], [L, MB], 11), ...arc(MX, MB, 60, 48, -Math.PI, 0, 22), ...seg([R, MB], [R, T], 11)] },
  { name: "V", emoji: "✌️", category: "알파벳",
    waypoints: poly([[L, T], [MX, B], [R, T]], 16) },
  { name: "W", emoji: "〰️", category: "알파벳",
    waypoints: poly([[L, T], [106, B], [MX, 162], [174, B], [R, T]], 14) },
  { name: "X", emoji: "❌", category: "알파벳",
    waypoints: [...seg([L, T], [R, B], 14), ...seg([R, T], [L, B], 14)] },
  { name: "Y", emoji: "🔤", category: "알파벳",
    waypoints: [...seg([L, T], [MX, MY], 10), ...seg([R, T], [MX, MY], 10), ...seg([MX, MY], [MX, B], 10)] },
  { name: "Z", emoji: "💤", category: "알파벳",
    waypoints: poly([[L, T], [R, T], [L, B], [R, B]], 16) },
  // === 사물 ===
  { name: "집", emoji: "🏠", category: "사물", waypoints: poly([[140, 30], [230, 120], [190, 120], [190, 240], [90, 240], [90, 120], [50, 120], [140, 30], [120, 240], [120, 170], [160, 170], [160, 240]]) },
  { name: "나무", emoji: "🌳", category: "사물", waypoints: [...polygon(3, 80, C, 110), ...poly([[C, 160], [C, 240], [115, 240], [165, 240], [C, 240]]) ] },
  { name: "꽃", emoji: "🌸", category: "사물", waypoints: [...Array.from({ length: 36 }, (_, i): Waypoint => { const a = (i / 36) * Math.PI * 2; const r = 60 + 35 * Math.abs(Math.cos(3 * a)); return [C + r * Math.cos(a), C + r * Math.sin(a)]; }), ...arc(C, C, 25, 25, 0, Math.PI * 2, 20)] },
  { name: "태양", emoji: "☀️", category: "사물", waypoints: [...arc(C, C, 55, 55, 0, Math.PI * 2, 32), ...Array.from({ length: 8 }, (_, i): Waypoint[] => { const a = (i / 8) * Math.PI * 2; return [[C + 65 * Math.cos(a), C + 65 * Math.sin(a)], [C + 95 * Math.cos(a), C + 95 * Math.sin(a)], [C + 65 * Math.cos(a), C + 65 * Math.sin(a)]]; }).flat()] },
  { name: "구름", emoji: "☁️", category: "사물", waypoints: [...arc(100, 155, 35, 35, -Math.PI, Math.PI * 0.2, 20), ...arc(140, 120, 45, 45, -Math.PI * 0.9, Math.PI * 0.1, 20), ...arc(185, 145, 35, 35, -Math.PI * 0.8, Math.PI * 0.5, 20), ...poly([[220, 180], [80, 180], [65, 155]])] },
  { name: "버섯", emoji: "🍄", category: "사물", waypoints: [...arc(C, 130, 80, 80, -Math.PI, 0, 28), ...poly([[60, 130], [60, 190], [100, 190], [100, 240], [180, 240], [180, 190], [220, 190], [220, 130]])] },
  { name: "물고기", emoji: "🐟", category: "사물", waypoints: [...arc(115, C, 65, 45, -Math.PI * 0.7, Math.PI * 0.7, 28), ...poly([[210, C], [255, 100], [255, 180], [210, C]])] },
  { name: "새", emoji: "🐦", category: "사물", waypoints: poly([[50, 160], [100, 120], [140, 110], [190, 100], [230, 80], [210, 130], [160, 160], [130, 200], [100, 230], [80, 200], [50, 160]]) },
  { name: "고양이 얼굴", emoji: "🐱", category: "사물", waypoints: [...arc(C, C + 10, 90, 90, 0, Math.PI * 2, 36), ...poly([[75, 60], [85, 30], [110, 65]]), ...poly([[170, 65], [195, 30], [205, 60]]), ...poly([[115, 150], [140, 165], [165, 150]])] },
  { name: "왕관", emoji: "👑", category: "사물", waypoints: poly([[50, 230], [50, 130], [100, 165], [140, 70], [180, 165], [230, 130], [230, 230], [50, 230]]) },
  { name: "열쇠", emoji: "🔑", category: "사물", waypoints: [...arc(90, C, 55, 55, 0, Math.PI * 2, 28), ...poly([[120, C + 10], [230, C + 10], [230, C + 30], [200, C + 30], [200, C + 10], [230, C + 10], [230, C - 10]])] },
  { name: "아이스크림", emoji: "🍦", category: "사물", waypoints: [...arc(C, 110, 65, 55, -Math.PI, 0, 28), ...poly([[75, 110], [140, 250], [205, 110]])] },
  { name: "피자 조각", emoji: "🍕", category: "사물", waypoints: poly([[140, 35], [240, 220], [40, 220], [140, 35]]) },
  { name: "번개", emoji: "⚡", category: "사물", waypoints: poly([[175, 30], [100, 145], [155, 145], [105, 250], [200, 115], [140, 115], [175, 30]]) },
  { name: "우산", emoji: "☂️", category: "사물", waypoints: [...arc(C, 130, 100, 80, -Math.PI, 0, 28), ...poly([[C, 130], [C, 230]]), ...arc(C - 25, 230, 25, 20, 0, Math.PI, 12)] },
  { name: "나비", emoji: "🦋", category: "사물", waypoints: [...arc(80, 100, 60, 70, -Math.PI * 0.3, Math.PI * 0.8, 24), ...poly([[C, 130]]), ...arc(200, 100, 60, 70, Math.PI * 0.2, -Math.PI * 1.1, 24), ...poly([[C, 130], [C - 10, 200], [C + 10, 200], [C, 130]])] },
  { name: "눈사람", emoji: "⛄", category: "사물", waypoints: [...arc(C, 100, 55, 55, 0, Math.PI * 2, 28), ...arc(C, 195, 70, 70, 0, Math.PI * 2, 28)] },
  { name: "로켓", emoji: "🚀", category: "사물", waypoints: poly([[140, 25], [105, 110], [90, 200], [115, 220], [140, 200], [165, 220], [190, 200], [175, 110], [140, 25], [105, 170], [85, 200], [95, 220], [105, 170], [175, 170], [195, 200], [185, 220], [175, 170]]) },
  { name: "반지", emoji: "💍", category: "사물", waypoints: [...arc(C, C, 75, 75, 0, Math.PI * 2, 32), ...arc(C, C, 50, 50, 0, Math.PI * 2, 32)] },
];

const CATEGORIES_LIST = ["전체", "도형", "별", "특수", "숫자", "알파벳", "사물"];

export default function DrawingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [category, setCategory] = useState("전체");
  const [shapeIdx, setShapeIdx] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const drawnPoints = useRef<Waypoint[]>([]);

  const filtered = useMemo(() =>
    category === "전체" ? SHAPES : SHAPES.filter(s => s.category === category),
    [category]
  );
  const shape = filtered[shapeIdx % filtered.length];

  function computeCoverage(): number {
    const pts = drawnPoints.current;
    if (pts.length === 0) return 0;
    let hit = 0;
    for (const wp of shape.waypoints) {
      for (const dp of pts) {
        if (Math.hypot(wp[0] - dp[0], wp[1] - dp[1]) <= RADIUS) { hit++; break; }
      }
    }
    return hit / shape.waypoints.length;
  }

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
    drawnPoints.current = [];
    setCoverage(0);
    setCleared(false);
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    return [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy];
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath(); ctx.moveTo(pos[0], pos[1]);
    canvasRef.current!.setPointerCapture(e.pointerId);
  }

  function continueDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = BRUSH; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(99,102,241,0.55)";
    ctx.lineTo(pos[0], pos[1]); ctx.stroke();
    drawnPoints.current.push(pos);
    const cov = computeCoverage();
    setCoverage(cov);
    if (cov >= THRESHOLD && !cleared) setCleared(true);
  }

  function endDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }

  function pickRandom() {
    clearCanvas();
    let idx;
    do { idx = Math.floor(Math.random() * filtered.length); }
    while (filtered.length > 1 && idx === shapeIdx % filtered.length);
    setShapeIdx(idx);
  }

  function changeCategory(cat: string) {
    setCategory(cat);
    clearCanvas();
    const pool = cat === "전체" ? SHAPES : SHAPES.filter(s => s.category === cat);
    setShapeIdx(Math.floor(Math.random() * pool.length));
  }

  const catColor: Record<string, string> = {
    "도형": "#3B82F6", "별": "#F59E0B", "특수": "#EC4899",
    "숫자": "#10B981", "알파벳": "#8B5CF6", "사물": "#EF4444", "전체": "#6366F1",
  };
  const cc = catColor[shape.category] ?? "#6366F1";

  return (
    <div className="w-full">
      <PageHeader title="따라 그리기" emoji="✏️" backHref="/dashboard/games" />

      {/* Category filter */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {CATEGORIES_LIST.map(cat => (
          <button key={cat} onClick={() => changeCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all`}
            style={category === cat
              ? { background: catColor[cat], color: "white" }
              : { background: `${catColor[cat]}18`, color: catColor[cat] }
            }>
            {cat} {cat !== "전체" && `(${SHAPES.filter(s => s.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Shape info */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{shape.emoji}</span>
        <div>
          <span className="font-black text-lg text-gray-700">{shape.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${cc}18`, color: cc }}>
            {shape.category}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => speak(`${shape.name}`, { lang: "ko" })}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
            style={{ background: `${cc}18`, color: cc, border: `1.5px solid ${cc}40` }}
          >
            🔊 듣기
          </button>
          <span className="text-xs text-gray-400">{filtered.length}개</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${cc}, ${cc}99)` }}
            animate={{ width: `${Math.min(coverage * 100, 100)}%` }}
            transition={{ duration: 0.12 }}
          />
        </div>
        <span className="text-sm font-bold w-10" style={{ color: cc }}>{Math.round(coverage * 100)}%</span>
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ width: SIZE, height: SIZE, border: `2px solid ${cc}40`, background: "#F8FAFF" }}>
        {/* Guide dots */}
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width={SIZE} height={SIZE}>
          {shape.waypoints.map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r={showHint ? 7 : 4}
              fill={showHint ? `${cc}99` : `${cc}44`}
              stroke={cc} strokeWidth={showHint ? 1.5 : 0.8}
              opacity={0.85}
            />
          ))}
        </svg>
        <canvas ref={canvasRef} width={SIZE} height={SIZE}
          style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
          onPointerDown={startDraw}
          onPointerMove={continueDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
        />
      </div>

      {/* Success */}
      <AnimatePresence>
        {cleared && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mt-4 rounded-2xl p-4 text-center"
            style={{ background: `${cc}12`, border: `2px solid ${cc}50` }}>
            <p className="text-xl font-black" style={{ color: cc }}>🎉 잘 그렸어요!</p>
            <Button className="mt-2" onClick={pickRandom}
              style={{ background: `linear-gradient(90deg,${cc},${cc}cc)`, color: "white" }}>
              다음 모양 →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <Button variant="outline" size="sm" onClick={clearCanvas}>🗑️ 지우기</Button>
        <Button variant="outline" size="sm" onClick={pickRandom}>🎲 랜덤 모양</Button>
        <Button variant="outline" size="sm"
          onPointerDown={() => setShowHint(true)}
          onPointerUp={() => setShowHint(false)}
          onPointerLeave={() => setShowHint(false)}>
          💡 힌트
        </Button>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {shape.emoji} 점들을 따라 그려요 · {Math.round(THRESHOLD * 100)}% 이상 채우면 성공!
      </p>
    </div>
  );
}
