export class SquareTransitionPlugin {
    constructor() {
        this.squares = [];
        this.isAnimating = false;
        this.animationDuration = 1500; // 1 second in milliseconds
        this.totalSquares = 45; // We'll aim for approximately this many squares
        this.gap = 10;
        this.blankSquareProbability = 0.3; // 30% chance for each square to go blank
        this.blankColor = '#FFFFFF'; // Color of the blank squares
    }

    async applyEffect(mainCanvas, mainCtx, loadedMedia, currentIndex, prevIndex, mediaData) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const width = mainCanvas.width;
        const height = mainCanvas.height;

        // Calculate the number of columns and rows to create square cells
        const aspectRatio = width / height;
        const cols = Math.round(Math.sqrt(this.totalSquares * aspectRatio));
        const rows = Math.round(this.totalSquares / cols);

        const squareSize = Math.min(width / cols, height / rows);
        const actualCols = Math.floor(width / squareSize);
        const actualRows = Math.floor(height / squareSize);

        this.squares = [];
        for (let i = 0; i < actualRows; i++) {
            for (let j = 0; j < actualCols; j++) {
                this.squares.push({
                    x: j * squareSize,
                    y: i * squareSize,
                    width: squareSize,
                    height: squareSize + this.gap,
                    progress: 0,
                    isBlank: Math.random() < this.blankSquareProbability
                });
            }
        }

        // Shuffle the squares for random animation order
        this.shuffleArray(this.squares);

        // Create offscreen canvases for previous and current images
        const prevCanvas = this.createOffscreenCanvas(width, height);
        const currentCanvas = this.createOffscreenCanvas(width, height);

        this.drawMediaToCanvas(prevCanvas, loadedMedia[prevIndex]);
        this.drawMediaToCanvas(currentCanvas, loadedMedia[currentIndex]);

        // Animate the transition
        await this.animateTransition(mainCanvas, mainCtx, prevCanvas, currentCanvas);


        if (loadedMedia[currentIndex].tagName === 'IMG'){
            this.drawText(mainCtx, mediaData[currentIndex])
        } else {
            loadedMedia[currentIndex].pause() 
            loadedMedia[currentIndex].currentTime = 1.5
            loadedMedia[currentIndex].play()    
        }

        this.isAnimating = false;
    }

    createOffscreenCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    drawMediaToCanvas(canvas, media) {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    async animateTransition(mainCanvas, mainCtx, prevCanvas, currentCanvas) {
        return new Promise((resolve) => {
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / this.animationDuration, 1);

                // mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
                
                this.squares.forEach((square, index) => {
                    const squareProgress = Math.min(progress * 2 - index / this.squares.length, 1);
                    square.progress = this.easeInOutCubic(Math.max(squareProgress, 0));

                    mainCtx.save();
                    mainCtx.beginPath();
                    mainCtx.rect(square.x, square.y, square.width, square.height);
                    // mainCtx.lineWidth = 1;
                    // mainCtx.strokeStyle = '#fff';
                    // mainCtx.stroke();

                    mainCtx.clip();

                    if (square.isBlank) {
                        // Transition to and from blank
                        if (square.progress < 0.5) {
                            mainCtx.globalAlpha = 1 - square.progress * 2;
                            mainCtx.drawImage(prevCanvas, 0, 0);
                            mainCtx.globalAlpha = square.progress * 2;
                            mainCtx.fillStyle = this.blankColor;
                            mainCtx.fillRect(square.x, square.y, square.width, square.height);
                        } else {
                            mainCtx.globalAlpha = 2 - square.progress * 2;
                            mainCtx.fillStyle = this.blankColor;
                            mainCtx.fillRect(square.x, square.y, square.width, square.height);
                            mainCtx.globalAlpha = square.progress * 2 - 1;
                            mainCtx.drawImage(currentCanvas, 0, 0);
                        }
                    } else {
                        // Normal transition
                        mainCtx.globalAlpha = 1 - square.progress;
                        mainCtx.drawImage(prevCanvas, 0, 0);
                        mainCtx.globalAlpha = square.progress;
                        mainCtx.drawImage(currentCanvas, 0, 0);
                    }

                    mainCtx.restore();                    
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
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