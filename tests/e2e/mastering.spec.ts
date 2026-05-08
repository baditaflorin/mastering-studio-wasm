import { expect, test } from '@playwright/test';

test('masters a generated WAV on the happy path', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Import a track' })).toBeVisible();
  await expect(page.getByText(/v.+ · .+/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Star/ })).toHaveAttribute(
    'href',
    'https://github.com/baditaflorin/mastering-studio-wasm'
  );
  await expect(page.getByRole('link', { name: /PayPal/ })).toHaveAttribute(
    'href',
    'https://www.paypal.com/paypalme/florinbadita'
  );

  await page.setInputFiles('input[type="file"]', {
    name: 'tone.wav',
    mimeType: 'audio/wav',
    buffer: createWavBuffer()
  });

  await expect(page.getByText(/tone\.wav/)).toBeVisible();
  await page.getByRole('button', { name: /Run mastering/ }).click();
  await expect(page.getByText('Master ready')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('button', { name: 'WAV' })).toBeEnabled();
});

function createWavBuffer(): Buffer {
  const sampleRate = 44_100;
  const seconds = 1.2;
  const channels = 2;
  const sampleCount = Math.round(sampleRate * seconds);
  const bytesPerSample = 2;
  const dataSize = sampleCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;

  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.16;
    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    buffer.writeInt16LE(intSample, offset);
    buffer.writeInt16LE(intSample, offset + 2);
    offset += 4;
  }

  return buffer;
}
