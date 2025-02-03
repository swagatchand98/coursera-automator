class CourseraAutomator {
    constructor() {
      this.isAutomating = false;
      this.hasSkipped = false;
      this.currentUrl = window.location.href;
      this.setupObservers();
    }
  
    setupObservers() {
      this.setupVideoObserver();
      this.setupUrlObserver();
    }

    setupVideoObserver() {
      const observer = new MutationObserver(() => {
        if (this.isOnLecturePage() && !this.isAutomating) {
          this.startAutomation();
        } else if (this.isOnSupplementPage() && !this.isAutomating) {
          this.handleSupplementPage();
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    setupUrlObserver() {
      setInterval(() => {
        if (window.location.href !== this.currentUrl) {
          console.log('URL changed, resetting automation');
          this.currentUrl = window.location.href;
          this.isAutomating = false;
          this.hasSkipped = false;
          
          if (this.isOnLecturePage()) {
            this.startAutomation();
          } else if (this.isOnSupplementPage()) {
            this.handleSupplementPage();
          }
        }
      }, 1000);
    }
  
    isOnLecturePage() {
      return window.location.href.includes('/lecture/');
    }

    isOnSupplementPage() {
      return window.location.href.includes('/supplement/');
    }

    async handleSupplementPage() {
      console.log('Handling supplement page');
      this.isAutomating = true;

      try {
        // for the "next" button
        const nextButtonSelectors = [
          'button[aria-label*="next"]',
          'button[aria-label*="Next"]',
          'button:contains("Next")',
          'button.next-button',
          '[data-e2e="next-item-button"]',
          'button[data-track-component="next_item"]'
        ];

        // Try each selector
        for (const selector of nextButtonSelectors) {
          const nextButton = await this.waitForElement(selector);
          if (nextButton) {
            console.log('Found next button, clicking');
            nextButton.click();
            break;
          }
        }

      } catch (error) {
        console.error('Error handling supplement page:', error);
      } finally {
        this.isAutomating = false;
      }
    }
  
    async startAutomation() {
      if (this.isAutomating) return;
      
      console.log('Starting automation');
      this.isAutomating = true;
      this.hasSkipped = false;
      
      try {
        const video = await this.waitForElement('video');
        if (!video) {
          console.log('No video element found');
          return;
        }
  
        await new Promise(resolve => {
          if (video.readyState >= 1) resolve();
          else video.addEventListener('loadedmetadata', resolve);
        });
  
        const duration = video.duration;
        console.log('Video duration:', duration);

        // apply skip logic if video is longer than 3 minutes
        if (duration > 180) {
          const timeUpdateHandler = () => {
            if (video.currentTime >= 90 && !this.hasSkipped) {
              console.log('Video longer than 3 minutes, skipping to last 1.5 minutes');
              this.hasSkipped = true;
              video.currentTime = duration - 90;
            }
          };
          
          video.addEventListener('timeupdate', timeUpdateHandler);
        } else {
          console.log('Video is less than 3 minutes, playing normally');
        }

        video.addEventListener('ended', () => {
          console.log('Video ended, resetting flags');
          this.hasSkipped = false;
          this.isAutomating = false;
        });

        video.addEventListener('emptied', () => {
          console.log('Video unloaded, resetting flags');
          this.hasSkipped = false;
          this.isAutomating = false;
        });
      } catch (error) {
        console.error('Error during automation:', error);
        this.isAutomating = false;
      }
    }
  
    async waitForElement(selector, timeout = 5000) {
      const element = document.querySelector(selector);
      if (element) return element;
  
      return new Promise(resolve => {
        const observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        });
  
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
  
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    }
  }
  
  window.addEventListener('load', () => {
    new CourseraAutomator();
  });