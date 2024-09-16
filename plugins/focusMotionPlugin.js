export class FocusMotionPlugin {
    constructor(duration = 1500, layers = 3, maskSize = 0.5) {
      this.duration = duration;
      this.layers = layers;
      this.maskSize = maskSize;
      this.canvases = [];
      this.contexts = [];
    }
  
    async applyEffect(canvas, ctx, loadedMedia, currentIndex, previousIndex) {
      const startTime = performance.now();
      const currentMedia = loadedMedia[currentIndex];
  
      // Get snapshot of the first frame
      const snapshot = await this.getSnapshot(currentMedia);
  
      // Create multiple canvases
      this.createCanvases(canvas.width, canvas.height);
  
      // Apply snapshot to all canvases
      this.applySnapshotToCanvases(snapshot);
  
      return new Promise((resolve) => {
        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / this.duration, 1);
  
          // Clear the main canvas
          // ctx.clearRect(0, 0, canvas.width, canvas.height);
  
          // Apply mask and draw each canvas with offset
          for (let i = 0; i < this.layers; i++) {
            const offset = (i + 1) * 10 * Math.sin(progress * Math.PI * 2 + i * Math.PI / this.layers);
            this.applyMaskToCanvas(this.contexts[i], progress, i);
            ctx.drawImage(this.canvases[i], offset, offset);
          }
  
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Clean up
            this.canvases.forEach(c => c.remove());
            this.canvases = [];
            this.contexts = [];
            resolve();
          }
        };
  
        requestAnimationFrame(animate);
      });
    }
  
    async getSnapshot(media) {
      if (media.tagName === 'VIDEO') {
        await this.prepareVideo(media);
      }
      const snapshotCanvas = document.createElement('canvas');
      snapshotCanvas.width = media.width || media.videoWidth;
      snapshotCanvas.height = media.height || media.videoHeight;
      const snapshotCtx = snapshotCanvas.getContext('2d');
      snapshotCtx.drawImage(media, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
      return snapshotCanvas;
    }
  
    createCanvases(width, height) {
      for (let i = 0; i < this.layers; i++) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = width;
        layerCanvas.height = height;
        this.canvases.push(layerCanvas);
        this.contexts.push(layerCanvas.getContext('2d'));
      }
    }
  
    applySnapshotToCanvases(snapshot) {
      this.canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
      });
    }
  
    applyMaskToCanvas(ctx, progress, layerIndex) {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.sqrt(width * width + height * height) / 2;
      const minRadius = maxRadius * this.maskSize;
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, minRadius,
        centerX, centerY, maxRadius
      );
  
      const offset = (layerIndex + 1) / this.layers;
      const gradientProgress = (progress + offset) % 1;
      
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(gradientProgress, 'rgba(255, 255, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
  
    async prepareVideo(video) {
      video.currentTime = 0;
      video.muted = true;
      await video.play();
      
      return new Promise((resolve) => {
        const checkVideo = () => {
          if (video.readyState >= 3) {
            resolve();
          } else {
            requestAnimationFrame(checkVideo);
          }
        };
        checkVideo();
      });
    }
  }