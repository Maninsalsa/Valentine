class Petal {
    constructor(manager) {
        // Store reference to the PetalManager instance for coordination
        this.manager = manager;
        
        // Create petal DOM element
        this.element = document.createElement('div');
        this.element.className = 'petal';
        
        // Initialize position, size, rotation and movement properties
        this.reset();
        
        // Apply initial visual styles
        this.applyStyles();
        
        // Add petal to the container
        document.getElementById('petal-container').appendChild(this.element);
        
        // Begin falling animation
        this.fall();
    }

    applyStyles() {
        // Set visual properties of the petal element - pink color, rounded shape
        Object.assign(this.element.style, {
            width: this.size + 'px',
            height: this.size + 'px',
            transform: `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`,
            position: 'absolute',
            backgroundColor: '#ff5757',  // Light pink color for petals
            borderRadius: '50% 0 50% 50%', // Petal-like shape
            opacity: '0.8'  // Slight transparency
        });
    }

    reset() {
        // Randomize petal properties for natural variation
        this.size = Math.random() * 15 + 10;  // Size between 10-25px
        this.x = Math.random() * window.innerWidth;  // Random horizontal position
        this.y = -this.size;  // Start above viewport
        this.rotation = Math.random() * 360;  // Random rotation
        this.speed = Math.random() * 2 + 1;  // Vertical fall speed
        this.wobble = Math.random() * 2 - 1;  // Horizontal drift for natural movement
    }

    fall() {
        const animate = () => {
            // Remove petal if window is being resized to prevent visual artifacts
            if (this.manager.isResizing) {
                this.element.remove();
                this.manager.removePetal(this);
                return;
            }

            // Update position and rotation for falling animation
            this.y += this.speed;
            this.x += this.wobble;
            this.rotation += this.wobble;

            // Apply new transform for smooth animation
            this.element.style.transform = 
                `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;

            const groundY = window.innerHeight * 0.9;  // Ground position at 90% of viewport height
            
            // Remove if fallen too far below ground
            if (this.y > groundY + 100) {
                this.element.remove();
                this.manager.removePetal(this);
                return;
            }

            // Trigger landing animation when petal reaches ground
            if (this.y > groundY) {
                this.land(groundY);
                return;
            }

            // Continue animation frame loop
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    land(groundY) {
        // Skip landing animation if window is being resized
        if (this.manager.isResizing) {
            this.element.remove();
            this.manager.removePetal(this);
            return;
        }

        // Remove the falling petal animation
        this.element.remove();
        this.manager.removePetal(this);
        
        // Create new petal element for landing animation with updated styles
        const landedPetal = document.createElement('div');
        const landedStyles = {
            className: 'landed-petal',
            width: this.size + 'px',
            height: this.size + 'px',
            left: this.x + 'px',
            bottom: Math.random() * (window.innerHeight * 0.1) + 'px',  // Random ground position
            transform: `rotate(${Math.random() * 360}deg)`  // Random final rotation
        };

        // Apply landing styles to the new petal
        Object.assign(landedPetal, {
            className: landedStyles.className
        });
        Object.assign(landedPetal.style, {
            width: landedStyles.width,
            height: landedStyles.height,
            left: landedStyles.left,
            bottom: landedStyles.bottom,
            transform: landedStyles.transform
        });

        // Add landed petal to ground and set up fade out animation
        if (!this.manager.isResizing) {
            document.getElementById('ground').appendChild(landedPetal);
            
            // Fade out landed petal after delay and remove from DOM
            setTimeout(() => {
                if (!this.manager.isResizing) {
                    landedPetal.style.opacity = '0';
                    setTimeout(() => landedPetal.remove(), 1000);
                }
            }, 2000);

            // Create new falling petal to maintain constant petal count
            this.manager.addPetal();
        }
    }
}

class PetalManager {
    constructor() {
        // Configuration object for animation parameters
        this.config = {
            petalCount: window.innerWidth < 768 ? 10 : 20, // Responsive petal count
            paperDelay: 500,  // Delay before paper appears
            resizeDelay: 250, // Debounce delay for resize events
            fadeOutDuration: 300 // Duration of fade animations
        };
        
        // Track animation state
        this.state = {
            isResizing: false,
            hasStarted: false
        };
        
        // Collections to manage active elements
        this.activePetals = new Set();
        this.paper = null;
        this.originalPetals = []; // Store initial state for reset
        
        this.init();
    }

    init() {
        this.clearState();
        this.setupResizeHandler();
        this.setupPlayButton();
    }

    clearState() {
        // Remove all existing petals from DOM
        const existingPetals = document.querySelectorAll('.petal, .landed-petal');
        existingPetals.forEach(petal => petal.remove());
        
        // Clear the ground container
        const ground = document.getElementById('ground');
        if (ground) {
            ground.innerHTML = '';
        }
    }

    setupPlayButton() {
        const playButton = document.querySelector('.play-button');
        const overlay = document.querySelector('.play-overlay');
        
        console.log('Setting up play button');  // Debug log for initialization
        
        playButton.addEventListener('click', (e) => {
            console.log('Play button clicked');  // Track click events
            if (this.state.hasStarted) {
                console.log('Already started, returning');  // Prevent multiple starts
                return;
            }
            
            // Store initial state for potential reset
            this.originalPetals = [...this.activePetals];
            
            // Begin animation sequence
            this.state.hasStarted = true;
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                console.log('Removing overlay');  // Track animation progress
                overlay.remove();
                this.createPetals(this.config.petalCount);
                
                setTimeout(() => {
                    console.log('Creating paper');  // Track paper creation
                    if (!this.paper && !this.state.isResizing) {
                        this.paper = new Paper(this);
                    }
                }, this.config.paperDelay);
            }, this.config.fadeOutDuration);
        });

        // Handle mobile touch events
        playButton.addEventListener('touchstart', (e) => {
            console.log('Play button touched');  // Track mobile interactions
            e.preventDefault();
            e.stopPropagation();
            playButton.click();
        }, { passive: false });
    }

    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            if (!this.state.hasStarted || this.state.isResizing) return;
            
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Recalculate positions for responsive layout
                const groundY = window.innerHeight * 0.9;
                
                // Adjust paper position based on landing state
                if (!this.paper.state.hasLanded) {
                    this.paper.reset();
                    this.paper.fall();
                } else {
                    // Update landed paper position
                    this.paper.y = groundY - this.config.groundOffset;
                    this.paper.updatePosition();
                }
            }, 100);
        });
    }

    addPetal() {
        const petal = new Petal(this);
        this.activePetals.add(petal);
        return petal;
    }

    removePetal(petal) {
        this.activePetals.delete(petal);
    }

    clearAllPetals() {
        // Remove all petals and clean up DOM
        this.activePetals.forEach(petal => {
            if (petal.element) {
                petal.element.remove();
            }
        });
        this.activePetals.clear();

        const ground = document.getElementById('ground');
        ground.innerHTML = '';

        if (this.paper) {
            this.paper.destroy();
            this.paper = null;
        }
    }

    createPetals(count) {
        let created = 0;
        const create = () => {
            if (!this.state.isResizing && created < count) {
                this.addPetal();
                created++;
                requestAnimationFrame(create);
            }
        };
        requestAnimationFrame(create);
    }

    restoreOriginalState() {
        if (!this.state.hasStarted) return;
        
        // Reset to initial state
        this.clearAllPetals();
        
        // Restore original petals
        this.originalPetals.forEach(petal => {
            const newPetal = new Petal(this);
            newPetal.x = petal.x;
            newPetal.y = petal.y;
            this.activePetals.add(newPetal);
        });
        
        this.state.hasStarted = false;
    }
}

class Paper {
    constructor(manager) {
        console.log('Paper constructor called');  // Track paper initialization
        this.manager = manager;
        this.element = document.createElement('div');
        this.element.className = 'paper';
        
        // Initialize paper state
        this.state = {
            hasLanded: false,
            isPlaying: false
        };
        
        // Setup audio element with error handling
        console.log('Attempting to load audio file...');
        this.audio = new Audio('/TMWYHI.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.5;

        // Audio debugging listeners
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error details:', {
                error: this.audio.error,
                code: this.audio.error.code,
                message: this.audio.error.message,
                src: this.audio.src
            });
        });

        this.audio.addEventListener('loadstart', () => {
            console.log('Audio load started');
        });

        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
        });

        this.element.style.zIndex = '1';
        
        this.reset();
        
        document.getElementById('petal-container').appendChild(this.element);
        
        // Create and add text element
        const text = document.createElement('div');
        text.className = 'dear-baby';
        text.textContent = 'For Baby';
        this.element.appendChild(text);
        
        // Remove any existing text elements
        const oldText = document.querySelector('body > .dear-baby');
        if (oldText) {
            oldText.remove();
        }

        this.setupResizeHandler();
        
        // Initialize animations and audio
        this.fall();
        this.audio.play().catch(error => {
            console.error('Play error:', error);
            console.log('Audio state:', {
                readyState: this.audio.readyState,
                networkState: this.audio.networkState,
                src: this.audio.src,
                currentSrc: this.audio.currentSrc
            });
        });

        // Setup interaction handlers
        console.log('Adding click listeners to paper');
        this.element.addEventListener('click', (e) => {
            console.log('Paper clicked directly');
            this.handleInteraction(e);
        });
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInteraction(e);
        }, { passive: false });

        // Enable interactions
        document.getElementById('petal-container').style.pointerEvents = 'auto';
    }

    reset() {
        // Reset audio and position state
        this.clearAudio();
        
        this.x = window.innerWidth / 2;
        this.y = -100;
        this.rotation = 0;
        
        // Calculate animation timing
        const groundY = window.innerHeight * 0.9;
        const totalDistance = groundY + 100;
        
        // Set precise animation duration
        const durationInSeconds = 10.9;
        const framesPerSecond = 60;
        const totalFrames = durationInSeconds * framesPerSecond;
        
        this.speed = totalDistance / totalFrames;
        
        this.wobble = Math.random() * 0.5 - 0.25;
        this.updatePosition();
    }

    updatePosition() {
        this.element.style.transform = 
            `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
    }

    clearAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }

    fall() {
        const animate = () => {
            if (this.manager.isResizing) {
                this.clearAudio();
                this.reset();
                return;
            }

            // Update position for falling animation
            this.y += this.speed;
            this.x += this.wobble;
            this.rotation += this.wobble;

            this.updatePosition();

            const groundY = window.innerHeight * 0.9;
            
            if (this.y > groundY) {
                this.land(groundY);
                return;
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    land(groundY) {
        console.log('Paper landing');  // Track landing state
        this.state.hasLanded = true;
        console.log('hasLanded set to:', this.state.hasLanded);
        this.y = groundY - 40;  // Offset from ground
        this.updatePosition();
    }

    destroy() {
        // Clean up resources
        this.clearAudio();
        if (this.element) {
            this.element.remove();
        }
    }

    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            if (!this.manager.state.hasStarted || !this.state.hasLanded) return;
            
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newGroundY = window.innerHeight * 0.9;
                
                // Adjust paper position on resize
                if (this.y < newGroundY - 40) {
                    this.state.hasLanded = false;
                    this.fall();
                }
            }, 100);
        });
    }

    handleInteraction(e) {
        if (this.manager.isResizing) {
            console.log('Interaction blocked - resizing');
            return;
        }
        
        console.log('Showing card overlay');
        const overlay = document.querySelector('.card-overlay');
        if (!overlay) {
            console.error('Card overlay not found in DOM');
            return;
        }
        overlay.classList.add('active');
        
        // Create card content with animated elements
        const cardContent = overlay.querySelector('.card-content');
        cardContent.innerHTML = `
            <div class="heart-container">
                <div class="heart"></div>
                <div class="heart"></div>
                <div class="heart"></div>
                <div class="heart"></div>
            </div>
            <div class="letter-text">
                <div class="typewriter">Dear Baby,</div>
                <div class="typewriter">You are the sexiest, bravest, smartest, and kindest person I've ever met.</div>
                <div class="typewriter">And I know I'm the luckiest man alive being with you.</div>
                <div class="typewriter">We've been through so much, and I know we'll be alright</div>
                <div class="typewriter">As long as we have each other.</div>
                <div class="signature">
                    All my love,<br><br>
                    Robert
                </div>
            </div>
        `;

        // Initialize typewriter animation
        setTimeout(() => {
            this.startTypewriter(overlay);
        }, 750);
        
        // Setup close button handler
        const closeButton = overlay.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                overlay.classList.remove('active');
            });
        }
        
        // Setup overlay click handler
        overlay.addEventListener('click', (e) => {
            if (!e.target.closest('.card')) {
                overlay.classList.remove('active');
            }
        });
    }

    startTypewriter(overlay) {
        // Initialize typewriter animation elements
        const typewriters = overlay.querySelectorAll('.typewriter');
        const signature = overlay.querySelector('.signature');
        let delay = 0;
        
        // Animate each line of text
        typewriters.forEach((element, index) => {
            const text = element.textContent;
            element.textContent = '';
            element.classList.add('typing');
            
            let charIndex = 0;
            setTimeout(() => {
                const interval = setInterval(() => {
                    if (charIndex < text.length) {
                        element.textContent += text[charIndex];
                        charIndex++;
                    } else {
                        clearInterval(interval);
                        if (index === typewriters.length - 1) {
                            // Show signature after text completes
                            setTimeout(() => {
                                signature.classList.add('show');
                            }, 500);
                        }
                    }
                }, 50); // Character typing speed
            }, delay);
            
            delay += text.length * 50 + 500; // Calculate delay between lines
        });
    }
}

// Initialize animation manager
const petalManager = new PetalManager();