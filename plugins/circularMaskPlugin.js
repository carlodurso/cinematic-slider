export class CircularMaskPlugin {
    constructor() {
      this.canvases = [];
      this.contexts = [];
      this.partList = [
        { xpos: 200, radius: 0 },
        { xpos: -75, radius: 0 },
        { xpos: 50, radius: 0 },
        { xpos: -25, radius: 0 }

      ];
      this.partMove = { val: 1 };
      this.isAnimating = false;
      this.bottomCanvas = null;
      this.bottomContext = null;
      this.currentVideo = null;
      this.animationStartTime = 0;
      this.animationDuration = 1000; // 1 second in milliseconds
    }
  
    async applyEffect(mainCanvas, mainCtx, loadedMedia, currentIndex, prevIndex){  
      if (this.isAnimating) return;
      this.isAnimating = true;
  
      // Ensure canvases are created or reset
      this.setupCanvases(mainCanvas);
  
      // Set up the circular masks
      this.setupMasks(mainCanvas);
  
      // Animate the transition
      await this.animateTransition(loadedMedia, currentIndex, prevIndex, mainCanvas);
  
      // Reset for next transition
      this.partMove.val = 1;
      this.isAnimating = false;
  
      // Hide additional canvases after transition
      this.hideAdditionalCanvases();
    }
  
    setupCanvases(mainCanvas) {
        if (this.canvases.length === 0) {
          // Create bottom canvas first
          this.bottomCanvas = this.createCanvas(mainCanvas, 0);
          this.bottomCanvas.id = "bottomCanvas";
          this.bottomContext = this.bottomCanvas.getContext('2d');
    
          // Create mask canvases
          for (let i = 0; i < 4; i++) {
            const canvas = this.createCanvas(mainCanvas, i + 1);
            canvas.id = "additional"+i
            this.canvases.push(canvas);
            this.contexts.push(canvas.getContext('2d'));
          }
        } else {
          // Reset existing canvases
          this.resetCanvas(this.bottomCanvas, mainCanvas);
          this.bottomContext = this.bottomCanvas.getContext('2d');
          this.canvases.forEach((canvas, i) => {
            this.resetCanvas(canvas, mainCanvas);
            this.contexts[i] = canvas.getContext('2d');
          });
        }
      }
    
      createCanvas(mainCanvas, zIndex) {
        const canvas = document.createElement('canvas');
        this.resetCanvas(canvas, mainCanvas);
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = zIndex;
        mainCanvas.parentNode.appendChild(canvas);
        return canvas;
      }
    
      resetCanvas(canvas, mainCanvas) {
        canvas.width = mainCanvas.width;
        canvas.height = mainCanvas.height;
        canvas.style.display = 'block';
      }
    
      setupMasks(mainCanvas) {
        const VW = mainCanvas.width;
        this.partList[0].radius = VW * 0.6;
        this.partList[1].radius = VW * 0.4;
        this.partList[2].radius = VW * 0.25;
        this.partList[3].radius = VW * 0.08;
      }
  
    async animateTransition(loadedMedia, currentIndex, prevIndex, mainCanvas) {
      return new Promise((resolve) => {
        this.animationStartTime = performance.now();
        const animate = (currentTime) => {
          const elapsedTime = currentTime - this.animationStartTime;
          const progress = Math.min(elapsedTime / this.animationDuration, 1);
          
          // Update partMove.val
          this.partMove.val = 1 - this.easeInOutCubic(progress);
          
          // Draw bottom canvas
          this.drawBottomCanvas(loadedMedia[currentIndex], mainCanvas.width, mainCanvas.height);
          
          // Draw mask canvases
          this.drawImages(loadedMedia, currentIndex, prevIndex);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(animate);
      });
    }
  
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
   
    drawBottomCanvas(nextMedia, width, height) {
      this.bottomCanvas.style.opacity = '1';
      this.bottomContext.clearRect(0, 0, width, height);
      this.drawMedia(this.bottomContext, nextMedia, 0, 0, width, height);
    }

    drawImages(loadedMedia, currentIndex, prevIndex) {

        const imgPrev = loadedMedia[prevIndex];
        const imgNext = loadedMedia[currentIndex];
        const VW = this.canvases[0].width;
        const VH = this.canvases[0].height;
    
        for (let i = 0; i < this.partList.length; i++) {
          const obj = this.partList[i];
          const ctx = this.contexts[i];
          const xPrev = -obj.xpos * (1 - this.partMove.val);
          const xNext = obj.xpos * this.partMove.val;
    
          ctx.clearRect(0, 0, VW, VH);
          ctx.save();
          ctx.beginPath();
          ctx.arc(VW / 2, VH / 2, obj.radius, 0, 2 * Math.PI, false);
          ctx.clip();
    
          // Draw next image
          ctx.globalAlpha = 1;
          this.drawMedia(ctx, imgNext, xNext, 0, VW, VH);

          // Draw previous image
          ctx.globalAlpha = this.partMove.val;
          this.drawMedia(ctx, imgPrev, xPrev, 0, VW, VH);
    
          ctx.restore();
    
          // Add white stroke to canvas
          if (i > 20) {
            ctx.beginPath();
            ctx.arc(VW / 2, VH / 2, obj.radius, 0, 2 * Math.PI, false);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
          }
        }
      }

      drawMedia(ctx, media, x, y, width, height) {
          ctx.drawImage(media, x, y, width, height);
      }
      
      fade(element) {
        var op = 1;  // initial opacity
        var timer = setInterval(function () {
            if (op <= 0.1){
                clearInterval(timer);
                element.style.display = 'none';
            }
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ")";
            op -= op * 0.1 + 0.062;
        }, 15);
    }

      hideAdditionalCanvases() {
        this.canvases.forEach(canvas => {
          canvas.style.display = 'none';
        });
        
        this.fade(this.bottomCanvas)
      }
  }