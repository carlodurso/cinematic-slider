export class FadeEffectPlugin {
  constructor(duration = 700) {
    this.duration = duration;
  }

  async applyEffect(canvas, ctx, loadedMedia, currentIndex, previousIndex, mediaUrls) {
    const startTime = performance.now();
    const currentMedia = loadedMedia[currentIndex];
    const previousMedia = loadedMedia[previousIndex];
    const currentMediaData = mediaUrls[currentIndex];
    // const previousMediaData = mediaUrls[previousIndex];

    return new Promise((resolve) => {
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the previous media and text
        if (previousMedia) {
          ctx.globalAlpha = 1 - progress;
          this.drawMedia(ctx, previousMedia, canvas.width, canvas.height);
          // this.drawText(ctx, previousMediaData, canvas);
        }

        // Draw the current media and text
        ctx.globalAlpha = progress;
        this.drawMedia(ctx, currentMedia, canvas.width, canvas.height);
        this.drawText(ctx, currentMediaData, canvas);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          ctx.globalAlpha = 1;
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  drawMedia(ctx, media, width, height) {
    ctx.drawImage(media, 0, 0, width, height);
  }

  drawText(ctx, mediaData, canvas) {
    // Draw the heading if it exists
    if (mediaData.heading) {
      const headingOptions = mediaData.headingOptions || {};
      ctx.fillStyle = headingOptions.color || '#FFFFFF';
      ctx.font = headingOptions.font || 'regular 24px Arial';
      const headingPosition = headingOptions.position || { x: 50, y: 50 };
      ctx.fillText(mediaData.heading, headingPosition.x, headingPosition.y);
    }
    
    // Draw the subtitle if it exists
    if (mediaData.subtitle) {
      const subtitleOptions = mediaData.subtitleOptions || {};
      ctx.fillStyle = subtitleOptions.color || '#CCCCCC';
      ctx.font = subtitleOptions.font || 'italic 18px Arial';
      const subtitlePosition = subtitleOptions.position || { x: 50, y: 100 };
      ctx.fillText(mediaData.subtitle, subtitlePosition.x, subtitlePosition.y);
    }
  }
}