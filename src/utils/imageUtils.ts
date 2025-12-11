/**
 * Compresses and resizes an image file to a reasonable size for storage and display.
 * Limits width to 1200px and converts to JPEG with 0.8 quality.
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        
        // Only resize if width > MAX_WIDTH
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          width = MAX_WIDTH;
          height = img.height * scaleSize;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG at 80% quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};