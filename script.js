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
        // Set visual properties of the petal element
        Object.assign(this.element.style, {
            width: this.size + 'px',
            height: this.size + 'px',
            transform: `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`,
            position: 'absolute',
            backgroundColor: '#ff5757',
            borderRadius: '50% 0 50% 50%',
            opacity: '0.8'
        });
    }

    reset() {
        // Randomize petal properties
        this.size = Math.random() * 15 + 10;  // Size between 10-25px
        this.x = Math.random() * window.innerWidth;  // Random horizontal position
        this.y = -this.size;  // Start above viewport
        this.rotation = Math.random() * 360;  // Random rotation
        this.speed = Math.random() * 2 + 1;  // Vertical fall speed
        this.wobble = Math.random() * 2 - 1;  // Horizontal drift
    }

    fall() {
        const animate = () => {
            // Remove petal if window is being resized
            if (this.manager.isResizing) {
                this.element.remove();
                this.manager.removePetal(this);
                return;
            }

            // Update position and rotation
            this.y += this.speed;
            this.x += this.wobble;
            this.rotation += this.wobble;

            // Apply new transform
            this.element.style.transform = 
                `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;

            const groundY = window.innerHeight * 0.9;  // Ground position at 90% of viewport height
            
            // Remove if fallen too far
            if (this.y > groundY + 100) {
                this.element.remove();
                this.manager.removePetal(this);
                return;
            }

            // Land if reached ground
            if (this.y > groundY) {
                this.land(groundY);
                return;
            }

            // Continue animation
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    land(groundY) {
        // Skip landing if resizing
        if (this.manager.isResizing) {
            this.element.remove();
            this.manager.removePetal(this);
            return;
        }

        // Remove falling petal
        this.element.remove();
        this.manager.removePetal(this);
        
        // Create landed petal element with new styles
        const landedPetal = document.createElement('div');
        const landedStyles = {
            className: 'landed-petal',
            width: this.size + 'px',
            height: this.size + 'px',
            left: this.x + 'px',
            bottom: Math.random() * (window.innerHeight * 0.1) + 'px',  // Random position on ground
            transform: `rotate(${Math.random() * 360}deg)`  // Random final rotation
        };

        // Apply styles to landed petal
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

        // Add landed petal and set up fade out
        if (!this.manager.isResizing) {
            document.getElementById('ground').appendChild(landedPetal);
            
            // Fade out and remove after delay
            setTimeout(() => {
                if (!this.manager.isResizing) {
                    landedPetal.style.opacity = '0';
                    setTimeout(() => landedPetal.remove(), 1000);
                }
            }, 2000);

            // Create new falling petal to maintain count
            this.manager.addPetal();
        }
    }
}

class PetalManager {
    constructor() {
        // Configuration object for better maintainability
        this.config = {
            petalCount: window.innerWidth < 768 ? 10 : 20, // Reduce petals on mobile
            paperDelay: 500,
            resizeDelay: 250,
            fadeOutDuration: 300
        };
        
        this.state = {
            isResizing: false,
            hasStarted: false
        };
        
        this.activePetals = new Set();
        this.paper = null;
        this.originalPetals = []; // Track original state
        
        this.init();
    }

    init() {
        this.clearState();
        this.setupResizeHandler();
        this.setupPlayButton();
    }

    clearState() {
        // Clear any existing petals
        const existingPetals = document.querySelectorAll('.petal, .landed-petal');
        existingPetals.forEach(petal => petal.remove());
        
        // Clear the ground
        const ground = document.getElementById('ground');
        if (ground) {
            ground.innerHTML = '';
        }
    }

    setupPlayButton() {
        const playButton = document.querySelector('.play-button');
        const overlay = document.querySelector('.play-overlay');
        
        console.log('Setting up play button');  // Debug log
        
        playButton.addEventListener('click', (e) => {
            console.log('Play button clicked');  // Debug log
            if (this.state.hasStarted) {
                console.log('Already started, returning');  // Debug log
                return;
            }
            
            // Store original state
            this.originalPetals = [...this.activePetals];
            
            // Start animation
            this.state.hasStarted = true;
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                console.log('Removing overlay');  // Debug log
                overlay.remove();
                this.createPetals(this.config.petalCount);
                
                setTimeout(() => {
                    console.log('Creating paper');  // Debug log
                    if (!this.paper && !this.state.isResizing) {
                        this.paper = new Paper(this);
                    }
                }, this.config.paperDelay);
            }, this.config.fadeOutDuration);
        });

        // Add specific mobile touch handler
        playButton.addEventListener('touchstart', (e) => {
            console.log('Play button touched');  // Debug log
            e.preventDefault(); // Prevent double-firing
            e.stopPropagation(); // Stop event bubbling
            playButton.click(); // Trigger the click handler
        });
    }

    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            if (!this.state.hasStarted || this.state.isResizing) return;
            
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Recalculate positions relative to new window size
                const groundY = window.innerHeight * 0.9;
                
                // If paper hasn't landed yet, adjust its fall
                if (!this.paper.state.hasLanded) {
                    this.paper.reset();
                    this.paper.fall();
                } else {
                    // If already landed, just update position
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

    // Add method to restore original state
    restoreOriginalState() {
        if (!this.state.hasStarted) return;
        
        // Clear current state
        this.clearAllPetals();
        
        // Restore original petals
        this.originalPetals.forEach(petal => {
            const newPetal = new Petal(this);
            newPetal.x = petal.x;
            newPetal.y = petal.y;
            // ... restore other properties ...
            this.activePetals.add(newPetal);
        });
        
        this.state.hasStarted = false;
    }
}

class Paper {
    constructor(manager) {
        console.log('Paper constructor called');
        this.manager = manager;
        this.element = document.createElement('div');
        this.element.className = 'paper';
        
        // Initialize state first
        this.state = {
            hasLanded: false,
            isPlaying: false
        };
        
        // Initialize audio
        console.log('Attempting to load audio file...');
        this.audio = new Audio('/TMWYHI.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.5;

        // Add these event listeners for debugging
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
        
        const text = document.createElement('div');
        text.className = 'dear-baby';
        text.textContent = 'For Baby';
        this.element.appendChild(text);
        
        const oldText = document.querySelector('body > .dear-baby');
        if (oldText) {
            oldText.remove();
        }

        // Setup resize handler
        this.setupResizeHandler();
        
        // Start falling and playing music
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

        // Add event listeners for click/touch
        console.log('Adding click listeners to paper');
        this.element.addEventListener('click', (e) => {
            console.log('Paper clicked directly');
            this.handleInteraction(e);
        });
        this.element.addEventListener('touchstart', (e) => {
            console.log('Paper touched');
            e.preventDefault();
            this.handleInteraction(e);
        });

        // Remove pointer-events: none from container
        document.getElementById('petal-container').style.pointerEvents = 'auto';
    }

    reset() {
        // Clear audio state
        this.clearAudio();
        
        this.x = window.innerWidth / 2;
        this.y = -100;
        this.rotation = 0;
        
        // Calculate the total distance to travel
        const groundY = window.innerHeight * 0.9;  // Ground position
        const totalDistance = groundY + 100;  // Distance from start (-100) to ground
        
        // Calculate pixels per frame for exact 11 second duration
        const durationInSeconds = 10.9;
        const framesPerSecond = 60;
        const totalFrames = durationInSeconds * framesPerSecond;
        
        // Speed = total distance / total frames
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
        console.log('Paper landing');
        this.state.hasLanded = true;
        console.log('hasLanded set to:', this.state.hasLanded);
        this.y = groundY - 40;
        this.updatePosition();
    }

    // Add a method to handle cleanup
    destroy() {
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
                
                // If current position is above new ground level
                if (this.y < newGroundY - 40) {  // Using fixed offset of 40
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
        
        // Update card content
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

        // Start typewriter effect after card opens
        setTimeout(() => {
            this.startTypewriter(overlay);
        }, 750); // Wait for card opening animation
        
        // Add click handler for close button
        const closeButton = overlay.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();  // Prevent event from bubbling to overlay
                overlay.classList.remove('active');
            });
        }
        
        // Add click handler to close overlay
        overlay.addEventListener('click', (e) => {
            if (!e.target.closest('.card')) {
                overlay.classList.remove('active');
            }
        });
    }

    startTypewriter(overlay) {
        const typewriters = overlay.querySelectorAll('.typewriter');
        const signature = overlay.querySelector('.signature');
        let delay = 0;
        
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
                            // Show signature after last typewriter finishes
                            setTimeout(() => {
                                signature.classList.add('show');
                            }, 500);
                        }
                    }
                }, 50); // Speed of typing
            }, delay);
            
            delay += text.length * 50 + 500; // Delay between sections
        });
    }
}

// Initialize only the PetalManager (it will handle everything else)
const petalManager = new PetalManager();