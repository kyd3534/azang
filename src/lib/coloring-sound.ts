/**
 * 색칠하기 효과음 — Web Audio API (CDN 없음, 순수 합성)
 * 채우기: 통통 버블 팝
 * 브러시: 사각사각 노이즈 (60ms 스로틀)
 * 지우개: 낮은 스크럽 소리 (80ms 스로틀)
 */

let _ac: AudioContext | null = null;

function getAC(): AudioContext {
  if (!_ac || _ac.state === "closed") {
    _ac = new AudioContext();
  }
  if (_ac.state === "suspended") _ac.resume();
  return _ac;
}

/* ── 채우기: 버블 팝 (이중 오실레이터 pitch sweep) ── */
export function playFillSound() {
  try {
    const ac = getAC();
    const t = ac.currentTime;
    const gain = ac.createGain();
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    // 메인 팝 — 고음에서 저음으로 쭉 내려옴
    const o1 = ac.createOscillator();
    o1.type = "sine";
    o1.frequency.setValueAtTime(700, t);
    o1.frequency.exponentialRampToValueAtTime(130, t + 0.22);
    o1.connect(gain);
    o1.start(t); o1.stop(t + 0.28);

    // 배음 (5도 위) — 풍성하게
    const o2 = ac.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(1050, t);
    o2.frequency.exponentialRampToValueAtTime(195, t + 0.18);
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.09, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o2.connect(g2); g2.connect(ac.destination);
    o2.start(t); o2.stop(t + 0.18);

    // 클릭 어택 (짧은 임펄스)
    const click = ac.createOscillator();
    click.type = "square";
    click.frequency.value = 300;
    const gc = ac.createGain();
    gc.gain.setValueAtTime(0.06, t);
    gc.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    click.connect(gc); gc.connect(ac.destination);
    click.start(t); click.stop(t + 0.03);
  } catch { /* ignore */ }
}

/* ── 브러시: 사각사각 밴드패스 노이즈 (60ms 스로틀) ── */
let _lastBrush = 0;
export function playBrushSound() {
  const now = Date.now();
  if (now - _lastBrush < 60) return;
  _lastBrush = now;
  try {
    const ac = getAC();
    const t = ac.currentTime;
    const dur = 0.07;
    const sr = ac.sampleRate;

    const buf = ac.createBuffer(1, Math.floor(sr * dur), sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    // 밴드패스: 종이 질감 주파수 대역
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2800;
    bp.Q.value = 1.2;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.13, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(bp); bp.connect(gain); gain.connect(ac.destination);
    src.start(t);
  } catch { /* ignore */ }
}

/* ── 지우개: 낮은 스크럽 노이즈 (80ms 스로틀) ── */
let _lastEraser = 0;
export function playEraserSound() {
  const now = Date.now();
  if (now - _lastEraser < 80) return;
  _lastEraser = now;
  try {
    const ac = getAC();
    const t = ac.currentTime;
    const dur = 0.09;
    const sr = ac.sampleRate;

    const buf = ac.createBuffer(1, Math.floor(sr * dur), sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    // 로우패스: 지우개 특유의 낮고 부드러운 마찰음
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;

    // 약간의 왜곡감을 위한 하이패스 믹스
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 200;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(lp); lp.connect(hp); hp.connect(gain); gain.connect(ac.destination);
    src.start(t);
  } catch { /* ignore */ }
}
