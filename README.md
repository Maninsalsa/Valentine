# Valentine
Main Elements:
- div.play-overlay: Initial overlay with play button
- div.dear-baby: Initial text (hidden)
- div#petal-container: Container for falling petals and paper
- div#ground: Ground element where petals land
- div.card-overlay: Overlay for card display
- div.card: Card element with content

Styles Key Components:

1. Base Styles:
   - body: Gradient background, full viewport height, non-scalable viewport
   - #petal-container: Fixed container for animations with pointer events enabled
   - #ground: Gradient ground element (10% of viewport)

2. Animation Elements:
   - .petal: Falling petal style
   - .landed-petal: Style for petals that reached ground
   - .paper: Floating paper with glow animation and improved touch targets
   - .play-overlay: Full-screen translucent overlay with pointer events
   - .play-button: Circular play button with touch optimizations
   - .play-triangle: Play button triangle shape
   - .card: Animated card with opening effect
   - .card-content: Content area with fade-in animation

3. Animations:
   - @keyframes glow: Paper glowing effect
   - @keyframes openCard: Card opening animation
   - @keyframes fadeIn: Content fade-in animation
   - @keyframes heartBeat: Heart beating animation

Classes and Methods:

1. Petal Class:
   Methods:
   - constructor(manager): Creates new petal element
   - applyStyles(): Sets visual properties
   - reset(): Randomizes petal properties
   - fall(): Handles falling animation with resize protection
   - land(groundY): Handles landing behavior with resize protection

2. PetalManager Class:
   Properties:
   - activePetals: Set of current falling petals
   - originalPetals: Tracks original petal state
   - config: Configuration object for responsive settings
   - state: Tracks isResizing and hasStarted flags
   
   Methods:
   - constructor(): Initializes manager with responsive config
   - setupPlayButton(): Creates start button with mobile support
   - restoreOriginalState(): Restores initial petal configuration
   - setupResizeHandler(): Handles window resizing with debouncing

3. Paper Class:
   Properties:
   - element: Paper DOM element
   - audio: Background music element with error handling
   - state: Tracks hasLanded and isPlaying flags
   
   Methods:
   - constructor(manager): Creates paper element with touch support
   - reset(): Resets position for timed animation
   - updatePosition(): Updates paper position
   - clearAudio(): Stops and resets audio
   - fall(): Handles falling animation with timing
   - land(): Handles landing behavior
   - handleInteraction(): Processes click/touch events
   - startTypewriter(): Handles card text animation

Mobile Optimizations:
- Responsive design with mobile-specific styles
- Touch-optimized event handling
- Adjusted sizes and touch targets
- Performance optimizations for mobile devices
- Improved audio handling with error detection

Card Features:
- Animated opening effect
- Split design with content and crease line
- Responsive text layout
- Close button functionality
- Fade-in content animation

Event Handling Improvements:
- Touch event optimization
- Resize protection and debouncing
- Audio error handling and debugging
- State management for animations
- Event isolation and propagation control