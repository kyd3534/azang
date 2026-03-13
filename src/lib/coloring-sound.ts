/**
 * 색칠하기 효과음
 * 채우기: Web Audio API 버블 팝 (합성)
 * 브러시: /sounds/freesound_community-pencil-29272.mp3
 * 지우개: /sounds/freesound_community-pencil-eraser-erasing-71215.mp3
 */

let _ac: AudioContext | null = null;

function getAC(): AudioContext {
  if (!_ac || _ac.state === "closed") _ac = new AudioContext();
  if (_ac.state === "suspended") _ac.resume();
  return _ac;
}

/* ── 파일 버퍼 로더 ── */
async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  try {
    const ac = getAC();
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return await ac.decodeAudioData(arr);
  } catch {
    return null;
  }
}

/* ── 브러시 (연필 사각사각) ── */
let _pencilBuf: AudioBuffer | null = null;
let _pencilLoading = false;

async function ensurePencil() {
  if (_pencilBuf || _pencilLoading) return;
  _pencilLoading = true;
  _pencilBuf = await loadBuffer("/sounds/freesound_community-pencil-29272.mp3");
  _pencilLoading = false;
}

/* ── 지우개 ── */
let _eraserBuf: AudioBuffer | null = null;
let _eraserLoading = false;

async function ensureEraser() {
  if (_eraserBuf || _eraserLoading) return;
  _eraserLoading = true;
  _eraserBuf = await loadBuffer("/sounds/freesound_community-pencil-eraser-erasing-71215.mp3");
  _eraserLoading = false;
}

// 페이지 로드 시 미리 로드
if (typeof window !== "undefined") {
  ensurePencil();
  ensureEraser();
}

/* ── 채우기: 버블 팝 (Web Audio 합성) ── */
export function playFillSound() {
  try {
    const ac = getAC();
    const t = ac.currentTime;
    const gain = ac.createGain();
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    const o1 = ac.createOscillator();
    o1.type = "sine";
    o1.frequency.setValueAtTime(700, t);
    o1.frequency.exponentialRampToValueAtTime(130, t + 0.22);
    o1.connect(gain);
    o1.start(t); o1.stop(t + 0.28);

    const o2 = ac.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(1050, t);
    o2.frequency.exponentialRampToValueAtTime(195, t + 0.18);
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.09, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o2.connect(g2); g2.connect(ac.destination);
    o2.start(t); o2.stop(t + 0.18);

    const click = ac.createOscillator();
    click.type = "square"; click.frequency.value = 300;
    const gc = ac.createGain();
    gc.gain.setValueAtTime(0.06, t);
    gc.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    click.connect(gc); gc.connect(ac.destination);
    click.start(t); click.stop(t + 0.03);
  } catch { /* ignore */ }
}

/* ── 브러시: 연필 소리 ── */
let _lastBrush = 0;
let _brushSrc: AudioBufferSourceNode | null = null;

export function playBrushSound() {
  const now = Date.now();
  if (now - _lastBrush < 60) return;
  _lastBrush = now;

  const buf = _pencilBuf;
  if (!buf) return;

  try {
    const ac = getAC();
    const t = ac.currentTime;
    try { _brushSrc?.stop(); } catch { /* */ }

    const src = ac.createBufferSource();
    src.buffer = buf;
    const clipDur = 0.18;
    const maxOff = Math.max(0, buf.duration - clipDur);
    const offset = Math.random() * maxOff;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + clipDur);

    src.connect(gain); gain.connect(ac.destination);
    src.start(t, offset, clipDur);
    _brushSrc = src;
  } catch { /* ignore */ }
}

/* ── 지우개 소리 ── */
let _lastEraser = 0;
let _eraserSrc: AudioBufferSourceNode | null = null;

export function playEraserSound() {
  const now = Date.now();
  if (now - _lastEraser < 400) return;
  _lastEraser = now;

  const buf = _eraserBuf;
  if (!buf) return;

  try {
    const ac = getAC();
    const t = ac.currentTime;
    try { _eraserSrc?.stop(); } catch { /* */ }

    const src = ac.createBufferSource();
    src.buffer = buf;
    const clipDur = 0.5;
    const maxOff = Math.max(0, buf.duration - clipDur);
    const offset = Math.random() * maxOff;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + clipDur);

    src.connect(gain); gain.connect(ac.destination);
    src.start(t, offset, clipDur);
    _eraserSrc = src;
  } catch { /* ignore */ }
}
