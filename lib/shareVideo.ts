interface ShareVideoOptions {
  canvas: HTMLCanvasElement;
  durationMs: number;
  fileName: string;
}

export async function recordKOClip(options: ShareVideoOptions): Promise<Blob> {
  const stream = options.canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  return new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = () => {
      reject(new Error('MediaRecorder error'));
    };

    recorder.start();
    setTimeout(() => recorder.stop(), options.durationMs);
  });
}

export async function shareClip(blob: Blob, title: string): Promise<void> {
  if (navigator.share) {
    const file = new File([blob], `${title}.webm`, { type: 'video/webm' });
    await navigator.share({
      title,
      files: [file],
    });
  }
}
