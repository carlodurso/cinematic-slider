import { mediaInfo } from './media.js'; 
// import { FadeEffectPlugin } from './plugins/fadeEffectPlugin.js'; 
// import { SwipeEffectPlugin } from './plugins/swipeEffectPlugin.js'; 
// import { ZoomEffectPlugin } from './plugins/zoomEffectPlugin.js'; 
// import { CircularMaskPlugin } from './plugins/circularMaskPlugin.js'; 
import { SquareTransitionPlugin } from './plugins/squareEffectPlugin.js'; 




let plugin = [new SquareTransitionPlugin()];

class CanvasImageSlider {
  constructor(containerId, mediaUrls, options = {}, plugin = [] || null) {
    this.container = document.getElementById(containerId);
    this.mediaUrls = mediaUrls; 
    this.currentMediaIndex = 0;
    this.options = options;
    this.plugin = plugin;

    // Add an audio element
    this.audio = new Audio('./audio/maui.mp3'); // Replace with your audio file path
    this.audio.loop = true; // Optionally, loop the audio
    this.audio.volume = 0.7; // Control the audio volume (0.0 to 1.0)

    this.setupCanvas();

    this.loadMedia().then(() => {
      this.resizeCanvas();
      this.drawMedia();
      
      if (this.options.audio) this.addSoundIcon();
      if (this.options.navigation) this.addSlideNavigation();
      if (this.options.autoCycle) this.startAutoCycle();


      this.container.style.width = `${this.canvas.width}px`;
      this.container.style.height = `${this.canvas.height}px`;
    });
  }

  // Play the sound
  playSound() {
    this.audio.play().catch((error) => {
      console.error("Audio playback failed: ", error);
    });
  }

  // Stop the sound
  stopSound() {
    this.audio.pause();
    this.audio.currentTime = 0; // Reset to the start of the audio
  }

  setupCanvas() {
    // Create canvas element dynamically
    this.canvas = document.createElement('canvas');
    this.canvas.id = "topmost"
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
  }

  // Load images and videos dynamically
  async loadMedia() {
    this.loadedMedia = await Promise.all(this.mediaUrls.map((url) => this.loadMediaItem(url)));
  }

  loadMediaItem(mediaItem) {
    return new Promise((resolve, reject) => {
      if (this.constructor.isVideo(mediaItem)) {  // Use this.constructor to access static methods
        // Handle video
        const video = document.createElement('video');
        video.src = mediaItem.src;
        video.onloadeddata = () => resolve(video);
        video.onerror = reject;
        video.muted = true; // Ensure autoplay without sound issues
      } else {
        // Handle image
        const img = new Image();
        img.src = mediaItem.src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      }
    });
  }

  
  static isVideo(mediaItem) {  // Make this a static method since it doesn't rely on class instance
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    const extension = mediaItem.src.split('.').pop();
    return videoExtensions.includes(extension);
  }

  resizeCanvas() {
    let mediaWidth = 0;
    let mediaHeight = 0;
    let lowestAspectRatio = Infinity;

    // Find the media with the largest width and the lowest aspect ratio
    this.loadedMedia.forEach(media => {
        const width = media.videoWidth || media.width;
        const height = media.videoHeight || media.height;
        const aspectRatio = width / height;

        // Get the media with the largest width
        if (width > mediaWidth) {
            mediaWidth = width;
            mediaHeight = height; // Store the corresponding height of the largest width
        }  

        // Find the lowest aspect ratio
        if (aspectRatio < lowestAspectRatio) {
            lowestAspectRatio = aspectRatio;
        }

    });

    // Set the canvas size based on the largest width and lowest aspect ratio
    this.canvas.width = mediaWidth / lowestAspectRatio;
    this.canvas.height = mediaHeight / lowestAspectRatio;
}

  drawMedia() {
    const media = this.loadedMedia[this.currentMediaIndex];
    const mediaData = this.mediaUrls[this.currentMediaIndex]; // Get the corresponding media data
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const mediaWidth = media.videoWidth || media.width;
    const mediaHeight = media.videoHeight || media.height;

    // Calculate the scaling factors to fit the media within the canvas dimensions
    const scaleX = this.canvas.width / mediaWidth;
    const scaleY = this.canvas.height / mediaHeight;

    // Use the smaller scaling factor to maintain the media's aspect ratio
    const scale = Math.min(scaleX, scaleY);

    // Calculate the new dimensions and offsets to center the media
    const drawWidth = mediaWidth * scale;
    const drawHeight = mediaHeight * scale;
    const offsetX = (this.canvas.width - drawWidth) / 2;
    const offsetY = (this.canvas.height - drawHeight) / 2;

    if (media.tagName === 'VIDEO') {
        media.play();

        const drawVideoFrame = () => {
            if (!media.paused && !media.ended) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(media, offsetX, offsetY, drawWidth, drawHeight);
            this.drawText(mediaData); // Draw headings and subtitles over the video
            requestAnimationFrame(drawVideoFrame); // Continuously update video frames
            }
        };

        drawVideoFrame(); // Start drawing video frames
    
    } else {
        // Draw the image with the calculated dimensions and offsets
        this.ctx.drawImage(media, 0, 0, this.canvas.width, this.canvas.height);
        this.drawText(this.mediaUrls[this.currentMediaIndex]); // Draw headings and subtitles over the image
    }
  }

  drawText(mediaData) {
    // Draw the heading if it exists
    if (mediaData.heading) {
        const headingOptions = mediaData.headingOptions || {};
        this.ctx.fillStyle = headingOptions.color || '#FFFFFF';
        this.ctx.font = headingOptions.font || 'regular 24px Arial';
        const headingPosition = headingOptions.position || { x: 50, y: 50 }; // Default to top-left
        this.ctx.fillText(mediaData.heading, headingPosition.x, headingPosition.y);
    }
    
    // Draw the subtitle if it exists
    if (mediaData.subtitle) {
        const subtitleOptions = mediaData.subtitleOptions || {};
        this.ctx.fillStyle = subtitleOptions.color || '#CCCCCC';
        this.ctx.font = subtitleOptions.font || 'italic 18px Arial';
        const subtitlePosition = subtitleOptions.position || { x: 50, y: 100 }; // Default to below heading
        this.ctx.fillText(mediaData.subtitle, subtitlePosition.x, subtitlePosition.y);
    }
  }

  flickMedia(option, element) {
  
    const currentMedia = this.loadedMedia[this.currentMediaIndex];
    this.previousMediaIndex = this.currentMediaIndex;

    // Stop video playback if the current media is a video
    if (currentMedia.tagName === 'VIDEO') {
      currentMedia.pause();
      // currentMedia.currentTime = 0; 
    }

    if(option) {
      this.currentMediaIndex = element === '>' ? (this.currentMediaIndex + 1) % this.mediaUrls.length 
      : (this.currentMediaIndex - 1 + this.mediaUrls.length) % this.mediaUrls.length;
    } else{
      this.currentMediaIndex = parseInt(element.target.dataset.index);
    }
    
    this.drawMedia();
    this.runPlugin();
    if (this.options.navigation) this.updateActiveDot(); // Highlight the active dot
  }
  

  startAutoCycle() {
    setInterval(() => this.flickMedia(true, '>'), this.options.autoCycleSpeed || 3000);
  }

  addArrowNavigation() {
    let time = new Date().getTime();  
    let timestamp;
         
    document.addEventListener('keyup', (e) => {
        timestamp = e.timeStamp / 1000;
    });
    
    document.addEventListener('keydown', (e) => {
        let delay = ((new Date().getTime()-time)/1000) - timestamp;

        if (delay > .33){
            if (e.key === "ArrowLeft") this.flickMedia(true, '<');        
            if (e.key === "ArrowRight") this.flickMedia(true, '>');
        }
    });
  }

  addSoundIcon(){
    const soundContainer = document.createElement('div');
    const icon = document.createElement('span');

    soundContainer.classList.add('sound');
    icon.classList.add('muted');

    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"> \
    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" /> \
    </svg>'

    soundContainer.appendChild(icon);

    icon.addEventListener('click', () => {

        if (icon.classList.contains('muted')) {
            this.playSound()
            icon.classList.remove('muted');
            icon.classList.add('playing');
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"> \
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" /> \
                                <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" /> \
                                </svg>'
        } else {
            this.stopSound()
            icon.classList.remove('playing');
            icon.classList.add('muted');
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"> \
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" /> \
                                </svg>'
        }
    })

    this.container.appendChild(soundContainer);
  }

  addSlideNavigation() {
    const dotContainer = document.createElement('div');
    const left = document.createElement('span');
    const right = document.createElement('span');
    
    left.innerHTML = "&nbsp;" //"&#xab;"
    right.innerHTML = "&nbsp;" //"&#xbb;"

    dotContainer.classList.add('dot-container');
    left.classList.add('left');
    right.classList.add('right');
    dotContainer.appendChild(left);  

    this.mediaUrls.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      dot.dataset.index = index;
      
      dot.addEventListener('click', (e) => {

        if (index !== this.currentMediaIndex){
          
          this.flickMedia(false, e)
        }
      });
    
      dotContainer.appendChild(dot);
    });
    
    dotContainer.appendChild(right);      
    this.container.appendChild(dotContainer);
    this.dots = dotContainer.querySelectorAll('.dot'); // Store dots for updating

    left.addEventListener('click', () => this.flickMedia(true, '<'));
    right.addEventListener('click', () => this.flickMedia(true, '>'));

    this.addArrowNavigation();
    this.updateActiveDot();  // Update the active dot
  }

  updateActiveDot() {
    if (!this.dots) return; // Ensure dots are initialized
    
    this.dots.forEach(dot => dot.classList.remove('active'));
    const activeDot = this.dots[this.currentMediaIndex];
    if (activeDot) activeDot.classList.add('active'); // Ensure the active dot exists
  }

 async runPlugin() {
    for (const plugin of this.plugin) {
      try {
        await plugin.applyEffect(this.canvas, this.ctx, this.loadedMedia, this.currentMediaIndex, this.previousMediaIndex || 0, this.mediaUrls);
      } catch (error) {
        console.error(`Error running plugin: ${error}`);
      }
    }
  }
}

// Initialize the slider
document.addEventListener("DOMContentLoaded", async () => {
  
  new CanvasImageSlider('slider-container', mediaInfo, {
    autoCycle: false,
    autoCycleSpeed: 9000,
    navigation: true,
    audio: true
  }, plugin);
});