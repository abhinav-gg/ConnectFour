
const HUGGINGFACE_API_KEY = '';

export async function validateProfilePicture(url: string): Promise<boolean> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Missing HUGGINGFACE_API_KEY in environment.');
  }

  const imageBuffer = null

  const response = await fetch(
    'https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} – ${err}`);
  }

  const result = await response.json();

  /**
   * Response shape:
   * [
   *   { label: 'drawings', score: 0.003 },
   *   { label: 'neutral', score: 0.98 },
   *   { label: 'sexy', score: 0.015 },
   *   { label: 'porn', score: 0.0001 },
   *   { label: 'hentai', score: 0.0003 }
   * ]
   */

  const nsfwLabels = ['porn', 'sexy', 'hentai'];
  const threshold = 0.15;

  const isNSFW = result.some(
    (entry: any) => nsfwLabels.includes(entry.label) && entry.score > threshold
  );

  return !isNSFW; // true = clean, false = NSFW
}
