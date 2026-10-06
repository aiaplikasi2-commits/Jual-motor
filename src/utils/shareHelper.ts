export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  // Robust base64 dataURL to File conversion without fetch dependency
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export interface ShareResult {
  success: boolean;
  sharedFiles: boolean;
  error?: string;
  userCancelled?: boolean;
}

/**
 * Shares files and/or text using Android Web Share API
 */
export async function shareAdContent(
  description: string,
  photos: string[] = []
): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return {
      success: false,
      sharedFiles: false,
      error: 'Fitur berbagi tidak didukung di browser ini.',
    };
  }

  const files: File[] = [];
  if (photos.length > 0) {
    try {
      for (let i = 0; i < photos.length; i++) {
        const file = await dataUrlToFile(photos[i], `motor_${i + 1}.jpg`);
        files.push(file);
      }
    } catch (e) {
      console.warn('Gagal mengubah data foto ke file:', e);
    }
  }

  // 1. Try sharing files + text together
  if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({
        files,
        text: description,
      });
      return { success: true, sharedFiles: true };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, sharedFiles: false, userCancelled: true };
      }
      console.warn('Gagal berbagi foto + teks, mencoba foto saja:', err);
    }

    // 2. Try sharing files only (often succeeds on WhatsApp where files + text fails)
    try {
      await copyToClipboard(description);
      await navigator.share({
        files,
      });
      return { success: true, sharedFiles: true };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, sharedFiles: false, userCancelled: true };
      }
      console.warn('Gagal berbagi foto saja:', err);
    }
  }

  // 3. Fallback: Share text only
  try {
    await navigator.share({
      text: description,
    });
    return { success: true, sharedFiles: false };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, sharedFiles: false, userCancelled: true };
    }
    return {
      success: false,
      sharedFiles: false,
      error: err?.message || 'Gagal membagikan iklan.',
    };
  }
}

/**
 * Specifically shares images to WhatsApp / apps by passing File objects
 */
export async function shareToWhatsAppWithPhotos(
  description: string,
  photos: string[] = []
): Promise<boolean> {
  // Copy caption first so user can paste immediately in WhatsApp
  await copyToClipboard(description);

  if (photos.length > 0 && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const files: File[] = [];
      for (let i = 0; i < photos.length; i++) {
        files.push(await dataUrlToFile(photos[i], `motor_iklan_${i + 1}.jpg`));
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          text: description,
        });
        return true;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return false;
      console.warn('Share intent error:', err);
    }
  }

  // Fallback direct WhatsApp text link
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(description)}`;
  window.open(url, '_blank');
  return true;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Clipboard writeText failed:', e);
  }

  // Fallback for older Android webviews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (e) {
    console.warn('Fallback copy failed:', e);
    return false;
  }
}

export async function downloadPhoto(dataUrl: string, filename = 'motor.jpg') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
