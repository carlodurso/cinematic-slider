export class SwipeEffectPlugin {
  constructor(options = {}) {
    this.direction = options.direction || 'random';
    this.speed = options.speed || 27;
    this.directions = ['left', 'right', 'up', 'down'];
  }

  easeIn(t) {
    return t * t * t;
  }

  async applyEffect(canvas, ctx, images, currentIndex, previousIndex, mediaUrls) {
    const currentMedia = images[currentIndex];
    const previousMedia = images[previousIndex];
    const currentMediaData = mediaUrls[currentIndex];
    const previousMediaData = mediaUrls[previousIndex];

    if (!currentMedia || !previousMedia) {
      console.error("Images not loaded properly.");
      return;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    let swipeDirection = this.direction;
    if (swipeDirection === 'random') {
      swipeDirection = this.directions[Math.floor(Math.random() * this.directions.length)];
    }

    let initialPosition, finalPosition, swipeOffset;

    switch (swipeDirection) {
      case 'left':
        initialPosition = canvasWidth;
        finalPosition = 0;
        swipeOffset = -1;
        break;
      case 'right':
        initialPosition = -canvasWidth;
        finalPosition = 0;
        swipeOffset = 1;
        break;
      case 'up':
        initialPosition = canvasHeight;
        finalPosition = 0;
        swipeOffset = -1;
        break;
      case 'down':
        initialPosition = -canvasHeight;
        finalPosition = 0;
        swipeOffset = 1;
        break;
      default:
        console.error("Invalid swipe direction specified.");
        return;
    }

    let currentPosition = initialPosition;
    let elapsedTime = 0;
    const duration = 35 / this.speed;

    return new Promise((resolve) => {
      const swipeAnimation = () => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the previous image and text
        ctx.drawImage(previousMedia, 0, 0, canvasWidth, canvasHeight);
        this.drawText(ctx, previousMediaData, canvas);

        const t = Math.min(elapsedTime / duration, 1);
        const easeFactor = this.easeIn(t);

        // Create a clipping region for the current image and text
        ctx.save();
        if (swipeDirection === 'left' || swipeDirection === 'right') {
          currentPosition = initialPosition + swipeOffset * easeFactor * canvasWidth;
          ctx.beginPath();
          ctx.rect(currentPosition, 0, canvasWidth, canvasHeight);
          ctx.clip();
        } else {
          currentPosition = initialPosition + swipeOffset * easeFactor * canvasHeight;
          ctx.beginPath();
          ctx.rect(0, currentPosition, canvasWidth, canvasHeight);
          ctx.clip();
        }

        // Draw the current image and text within the clipping region
        ctx.drawImage(currentMedia, 0, 0, canvasWidth, canvasHeight);
        this.drawText(ctx, currentMediaData, canvas);
        
        ctx.restore();

        if (t < 1) {
          elapsedTime += 0.02;
          requestAnimationFrame(swipeAnimation);
        } else {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          ctx.drawImage(currentMedia, 0, 0, canvasWidth, canvasHeight);
          this.drawText(ctx, currentMediaData, canvas);
          resolve();
        }
      };

      swipeAnimation();
    });
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