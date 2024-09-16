export class ZoomEffectPlugin {
    constructor() {
      this.isFirstTransition = true;
    }
  
    async applyEffect(canvas, ctx, images, currentIndex, previousIndex, mediaUrls) {
      const currentMedia = images[currentIndex];
      const previousMedia = images[previousIndex];
  
      // Ensure videos are ready to play
      if (currentMedia.tagName === 'VIDEO' && currentMedia.readyState < 2) {
        await new Promise(resolve => {
          currentMedia.oncanplay = resolve;
          currentMedia.load();
        });
      }
  
      // Create snapshots for current and previous media
      const previousSnapshot = await this.createSnapshot(previousMedia);
      const currentSnapshot = await this.createSnapshot(currentMedia);
  
      if (!currentMedia || !previousMedia) {
        console.error("Media not loaded properly.");
        return;
      }
  
      let scale = 0.2;
      let alpha = 0.5;
      let rotation = -32 * (Math.PI / 180);
      
      const zoomSpeed = 0.03;
      const fadeSpeed = 0.05;
      const rotationSpeed = 0.02;
  
      return new Promise((resolve) => {
        const animateZoom = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw the previous snapshot as the background
          this.drawMediaToFit(ctx, previousSnapshot, canvas.width, canvas.height);
  
          // Apply zoom, fade, and rotation for the current snapshot
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rotation);
          ctx.scale(scale, scale);
  
          // Draw the current snapshot
          this.drawMediaToFit(ctx, currentSnapshot, canvas.width, canvas.height, true);
          
          ctx.restore();
  
          // Update transformations for the next frame
          scale += zoomSpeed;
          alpha += fadeSpeed;
          rotation += rotationSpeed;
  
          if (scale >= 0.85) {
            scale += zoomSpeed * 0.5;
            rotation += rotationSpeed * 0.5;
          }
  
          if (scale < 1 || alpha < 1 || rotation < 0) {
            requestAnimationFrame(animateZoom);
          } else {
            // Animation complete
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.drawMediaToFit(ctx, currentMedia, canvas.width, canvas.height);
  
            if (currentMedia.tagName === 'VIDEO') {
              currentMedia.currentTime = 0;
              currentMedia.play();
              
              const updateVideoFrame = () => {
                if (!currentMedia.paused && !currentMedia.ended) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  this.drawMediaToFit(ctx, currentMedia, canvas.width, canvas.height);
                  this.drawText(ctx, mediaUrls[currentIndex]);
                  requestAnimationFrame(updateVideoFrame);
                }
              };
              updateVideoFrame();
            } else {
              this.drawText(ctx, mediaUrls[currentIndex]);
            }
  
            this.isFirstTransition = false;
            resolve();
          }
        };
  
        animateZoom();
      });
    }
  
    async createSnapshot(media) {
      const snapshotCanvas = document.createElement('canvas');
      snapshotCanvas.width = media.videoWidth || media.naturalWidth || media.width;
      snapshotCanvas.height = media.videoHeight || media.naturalHeight || media.height;
      const snapshotCtx = snapshotCanvas.getContext('2d');
      
      if (media.tagName === 'VIDEO') {
        // Ensure the video is at the first frame
        media.currentTime = 0;
        await new Promise(resolve => {
          media.onseeked = resolve;
        });
      }
      
      snapshotCtx.drawImage(media, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
  
      return snapshotCanvas;
    }
  
    drawMediaToFit(ctx, media, canvasWidth, canvasHeight, centered = false) {
      const mediaWidth = media.width || media.videoWidth;
      const mediaHeight = media.height || media.videoHeight;
  
      const scale = Math.max(canvasWidth / mediaWidth, canvasHeight / mediaHeight);
      const drawWidth = mediaWidth * scale;
      const drawHeight = mediaHeight * scale;
  
      let drawX = (canvasWidth - drawWidth) / 2;
      let drawY = (canvasHeight - drawHeight) / 2;
  
      if (centered) {
        drawX = -drawWidth / 2;
        drawY = -drawHeight / 2;
      }
  
      ctx.drawImage(media, drawX, drawY, drawWidth, drawHeight);
    }
  
    drawText(ctx, mediaData) {
      if (!mediaData) return;
  
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