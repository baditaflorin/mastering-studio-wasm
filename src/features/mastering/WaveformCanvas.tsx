import { useEffect, useRef } from 'react';

interface WaveformCanvasProps {
  original?: Float32Array;
  mastered?: Float32Array;
}

export function WaveformCanvas({ original, mastered }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * ratio;
    const height = canvas.clientHeight * ratio;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#fffdfa';
    context.fillRect(0, 0, width, height);
    drawGrid(context, width, height);

    if (original) {
      drawWaveform(context, original, width, height, '#006d77', -height * 0.17);
    }

    if (mastered) {
      drawWaveform(context, mastered, width, height, '#e85d4f', height * 0.17);
    }

    if (!original && !mastered) {
      context.fillStyle = '#6d6258';
      context.font = `${14 * ratio}px system-ui, sans-serif`;
      context.textAlign = 'center';
      context.fillText('Waveform appears after import', width / 2, height / 2);
    }
  }, [original, mastered]);

  return (
    <canvas
      ref={canvasRef}
      className="h-52 w-full rounded-md border border-neutral-200 bg-panel"
      role="img"
      aria-label="Original and mastered waveform preview"
    />
  );
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  context.strokeStyle = '#ece3d5';
  context.lineWidth = 1;

  for (let index = 1; index < 6; index += 1) {
    const y = (height / 6) * index;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.strokeStyle = '#d7cbbb';
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
}

function drawWaveform(
  context: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  color: string,
  offsetY: number
): void {
  const center = height / 2 + offsetY;
  const verticalScale = height * 0.28;
  const samplesPerPixel = Math.max(1, Math.floor(data.length / width));

  context.strokeStyle = color;
  context.lineWidth = Math.max(1.5, window.devicePixelRatio || 1);
  context.beginPath();

  for (let x = 0; x < width; x += 1) {
    let min = 1;
    let max = -1;
    const start = x * samplesPerPixel;
    const end = Math.min(data.length, start + samplesPerPixel);

    for (let index = start; index < end; index += 1) {
      const sample = data[index] ?? 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }

    context.moveTo(x, center + min * verticalScale);
    context.lineTo(x, center + max * verticalScale);
  }

  context.stroke();
}
