// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAP7lzXcSwmkOk88rXIx77j8s4gsfUs6k0",
    authDomain: "unews-4db42.firebaseapp.com",
    projectId: "unews-4db42",
    storageBucket: "unews-4db42.firebasestorage.app",
    messagingSenderId: "382914552995",
    appId: "1:382914552995:web:ca6f2c0f6a250c39fc4b16",
    measurementId: "G-38CHL8F98F"
};

// Game Release Management
const gameReleases = {
    "HangSim": {
        status: "pre-alpha", // pre-alpha, beta, released
        robloxUrl: null, // Will be set when released
        releaseDate: null,
        notifySubscribers: [],
        releaseBanner: null // URL for release banner
    },
    "Go Hunting": {
        status: "pre-alpha",
        robloxUrl: null,
        releaseDate: null,
        notifySubscribers: [],
        releaseBanner: null
    },
    "Gunung Watu Welah": {
        status: "coming-soon",
        robloxUrl: null,
        releaseDate: null,
        notifySubscribers: [],
        releaseBanner: null
    }
};

// Sample notifications data
let notifications = [
    {
        id: 1,
        title: "Welcome to Spartan Studio!",
        message: "Thank you for visiting our website. Stay tuned for exciting game releases!",
        time: "Just now",
        isNew: true,
        type: "welcome"
    }
];

// Browser Notification Permission
let notificationPermission = false;

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        
        if (notificationPermission) {
            showNotification({
                id: Date.now(),
                title: "Notifications Enabled!",
                message: "You'll now receive notifications when games are released!",
                time: "Just now",
                isNew: true,
                type: "system"
            });
        } else {
            alert('Please enable notifications to get updates about game releases!');
        }
        
        return notificationPermission;
    }
    return false;
}

// Send browser notification
function sendBrowserNotification(title, message, icon = null) {
    if (notificationPermission && 'Notification' in window) {
        const notification = new Notification(title, {
            body: message,
            icon: icon || 'https://res.cloudinary.com/dqrp70g9u/image/upload/v1765560274/Music_Player-removebg-preview_t5iv3j.png',
            badge: 'https://res.cloudinary.com/dqrp70g9u/image/upload/v1765560274/Music_Player-removebg-preview_t5iv3j.png'
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => notification.close(), 5000);
    }
}

// Removed notify functionality as requested

// Show custom login modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h2>Login Required</h2>
                <button class="auth-modal-close" onclick="closeAuthModal()">&times;</button>
            </div>
            <div class="auth-modal-body">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="register">Register</button>
                </div>
                
                <div class="auth-form-container">
                    <!-- Login Form -->
                    <div class="auth-form active" id="loginForm">
                        <div class="form-group">
                            <label>Roblox Username</label>
                            <input type="text" id="loginUsername" placeholder="Enter your Roblox username" required>
                        </div>
                        <div class="form-group">
                            <label>Email (Optional)</label>
                            <input type="email" id="loginEmail" placeholder="your.email@example.com">
                        </div>
                        <button class="auth-submit-btn" onclick="handleLogin()">Login</button>
                    </div>
                    
                    <!-- Register Form -->
                    <div class="auth-form" id="registerForm">
                        <div class="form-group">
                            <label>Roblox Username</label>
                            <input type="text" id="registerUsername" placeholder="Enter your Roblox username" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="registerEmail" placeholder="your.email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label>Confirm Email</label>
                            <input type="email" id="confirmEmail" placeholder="Confirm your email" required>
                        </div>
                        <button class="auth-submit-btn" onclick="handleRegister()">Register</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Setup tab switching
    setupAuthTabs();
}

// Setup auth tabs
function setupAuthTabs() {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
        const tabs = document.querySelectorAll('.auth-modal .auth-tab');
        const forms = document.querySelectorAll('.auth-modal .auth-form');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');
                
                // Remove active class from all tabs and forms
                tabs.forEach(t => t.classList.remove('active'));
                forms.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding form
                tab.classList.add('active');
                const targetForm = document.getElementById(targetTab + 'Form');
                if (targetForm) {
                    targetForm.classList.add('active');
                }
            });
        });
    }, 100);
}

// Close auth modal
function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Handle login
function handleLogin() {
    const username = document.getElementById('loginUsername')?.value?.trim();
    const email = document.getElementById('loginEmail')?.value?.trim();
    
    if (!username) {
        alert('Please enter your Roblox username');
        return;
    }
    
    loginUser(username, email || '');
    closeAuthModal();
    
    // Show success message instead of redirect
    showNotification({
        id: Date.now(),
        title: "Login Successful!",
        message: `Welcome back, ${username}! You can now subscribe to game notifications.`,
        time: "Just now",
        isNew: true,
        type: "system"
    });
}

// Handle register
function handleRegister() {
    const username = document.getElementById('registerUsername')?.value?.trim();
    const email = document.getElementById('registerEmail')?.value?.trim();
    const confirmEmail = document.getElementById('confirmEmail')?.value?.trim();
    
    if (!username) {
        alert('Please enter your Roblox username');
        return;
    }
    
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    if (!confirmEmail) {
        alert('Please confirm your email');
        return;
    }
    
    if (email !== confirmEmail) {
        alert('Emails do not match');
        return;
    }
    
    loginUser(username, email);
    closeAuthModal();
    
    // Show success message instead of redirect
    showNotification({
        id: Date.now(),
        title: "Registration Successful!",
        message: `Welcome to Spartan Studio, ${username}! You can now subscribe to game notifications.`,
        time: "Just now",
        isNew: true,
        type: "system"
    });
}

// Get unique user ID
function getUserId() {
    let userId = localStorage.getItem('spartanUserId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('spartanUserId', userId);
    }
    return userId;
}

// Admin function to release a game (you can call this from console)
function releaseGame(gameName, robloxUrl, releaseBannerUrl = null) {
    if (!gameReleases[gameName]) {
        console.error('Game not found:', gameName);
        return;
    }
    
    // Update game status
    gameReleases[gameName].status = 'released';
    gameReleases[gameName].robloxUrl = robloxUrl;
    gameReleases[gameName].releaseDate = new Date().toISOString();
    gameReleases[gameName].releaseBanner = releaseBannerUrl;
    
    // Notify all subscribers
    const subscribers = gameReleases[gameName].notifySubscribers;
    const currentUserId = getUserId();
    
    if (subscribers.includes(currentUserId)) {
        // Add website notification
        notifications.unshift({
            id: Date.now(),
            title: `🎮 ${gameName} is Now Available!`,
            message: `${gameName} has been released! Click to play now on Roblox.`,
            time: "Just now",
            isNew: true,
            type: "game-release",
            gameName: gameName,
            robloxUrl: robloxUrl
        });
        
        // Send browser notification
        sendBrowserNotification(
            `🎮 ${gameName} Released!`,
            `${gameName} is now available to play! Click to open the game.`
        );
        
        updateNotificationBadge();
        renderNotifications();
        updateGameButtons();
    }
    
    // Show release banner if provided
    if (releaseBannerUrl) {
        showReleaseBanner(gameName, robloxUrl, releaseBannerUrl);
    }
    
    // Save to localStorage
    localStorage.setItem('gameReleases', JSON.stringify(gameReleases));
    
    console.log(`Game ${gameName} has been released!`);
}

// Show release banner
function showReleaseBanner(gameName, robloxUrl, bannerUrl) {
    // Check if banner was already shown
    const shownBanners = JSON.parse(localStorage.getItem('shownReleaseBanners') || '[]');
    if (shownBanners.includes(gameName)) {
        return;
    }
    
    // Create banner element
    const banner = document.createElement('div');
    banner.className = 'release-banner';
    banner.innerHTML = `
        <div class="release-banner-content">
            <button class="release-banner-close" onclick="closeReleaseBanner('${gameName}')">&times;</button>
            <div class="release-banner-image">
                <img src="${bannerUrl}" alt="${gameName} Release Banner">
            </div>
            <div class="release-banner-info">
                <h2>🎉 ${gameName} is Now Live!</h2>
                <p>The wait is over! ${gameName} is now available to play on Roblox.</p>
                <button class="release-banner-play" onclick="window.open('${robloxUrl}', '_blank')">
                    <span>Play Now</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Show banner with animation
    setTimeout(() => banner.classList.add('show'), 100);
}

// Close release banner
function closeReleaseBanner(gameName) {
    const banner = document.querySelector('.release-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 300);
        
        // Mark as shown
        const shownBanners = JSON.parse(localStorage.getItem('shownReleaseBanners') || '[]');
        shownBanners.push(gameName);
        localStorage.setItem('shownReleaseBanners', JSON.stringify(shownBanners));
    }
}

// Check for released games on page load
function checkReleasedGames() {
    Object.keys(gameReleases).forEach(gameName => {
        const game = gameReleases[gameName];
        if (game.status === 'released' && game.releaseBanner) {
            const shownBanners = JSON.parse(localStorage.getItem('shownReleaseBanners') || '[]');
            if (!shownBanners.includes(gameName)) {
                showReleaseBanner(gameName, game.robloxUrl, game.releaseBanner);
            }
        }
    });
}

// Update game buttons based on release status
function updateGameButtons() {
    document.querySelectorAll('.notify-btn, .play-btn').forEach(button => {
        const gameName = button.getAttribute('data-game');
        if (gameName && gameReleases[gameName]) {
            const game = gameReleases[gameName];
            
            if (game.status === 'released' && game.robloxUrl) {
                button.textContent = 'PLAY NOW';
                button.className = button.className.replace('notify-btn', 'play-btn').replace('notify-style', 'play-style');
                button.onclick = () => window.open(game.robloxUrl, '_blank');
                button.disabled = false;
            } else {
                if (button.textContent !== 'Coming Soon') {
                    button.textContent = 'NOTIFY ME';
                    button.onclick = () => subscribeToGameNotifications(gameName);
                }
            }
        }
    });
}

// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const notificationBell = document.getElementById('notificationBell');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationBadge = document.getElementById('notificationBadge');
const notificationList = document.getElementById('notificationList');
const markAllRead = document.getElementById('markAllRead');
const wishlistModal = document.getElementById('wishlistModal');
const closeWishlistModal = document.getElementById('closeWishlistModal');
const wishlistForm = document.getElementById('wishlistForm');

// Mobile Navigation
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
    });
});

// Notification System
function updateNotificationBadge() {
    const newCount = notifications.filter(n => n.isNew).length;
    if (notificationBadge) {
        if (newCount > 0) {
            notificationBadge.textContent = newCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

function renderNotifications() {
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="notification-item"><div class="notification-message">No notifications yet</div></div>';
        return;
    }
    
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.isNew ? 'new' : ''}`;
        notificationElement.innerHTML = `
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${notification.time}</div>
        `;
        
        notificationElement.addEventListener('click', () => {
            if (notification.isNew) {
                notification.isNew = false;
                updateNotificationBadge();
                renderNotifications();
            }
            
            // Handle game release notifications
            if (notification.type === 'game-release' && notification.robloxUrl) {
                window.open(notification.robloxUrl, '_blank');
            }
        });
        
        notificationList.appendChild(notificationElement);
    });
}

// Notification Bell Click
notificationBell?.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('show');
});

// Mark all as read
markAllRead?.addEventListener('click', () => {
    // Remove all notifications permanently
    notifications = [];
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
    
    // Hide notification dropdown
    notificationDropdown?.classList.remove('show');
});

// Close notification dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!notificationDropdown?.contains(e.target) && !notificationBell?.contains(e.target)) {
        notificationDropdown?.classList.remove('show');
    }
});

// Wishlist Modal Functions
function openWishlistModal(gameName) {
    if (wishlistModal) {
        wishlistModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Store game name for form submission
        wishlistModal.setAttribute('data-game', gameName);
    }
}

function closeWishlistModalFunc() {
    if (wishlistModal) {
        wishlistModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        wishlistForm?.reset();
    }
}

// Wishlist Modal Event Listeners
closeWishlistModal?.addEventListener('click', closeWishlistModalFunc);
document.getElementById('cancelWishlist')?.addEventListener('click', closeWishlistModalFunc);

// Close modal when clicking outside
wishlistModal?.addEventListener('click', (e) => {
    if (e.target === wishlistModal) {
        closeWishlistModalFunc();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (wishlistModal?.style.display === 'block') {
            closeWishlistModalFunc();
        }
        if (notificationDropdown?.classList.contains('show')) {
            notificationDropdown.classList.remove('show');
        }
    }
});

// Wishlist Form Submission
wishlistForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(wishlistForm);
    const robloxUsername = formData.get('robloxUsername');
    const email = formData.get('email');
    const gameName = wishlistModal.getAttribute('data-game');
    
    // Here you would typically send data to Firebase
    console.log('Wishlist submission:', {
        game: gameName,
        robloxUsername,
        email,
        timestamp: new Date().toISOString()
    });
    
    // Add success notification
    notifications.unshift({
        id: Date.now(),
        title: "Added to Wishlist!",
        message: `${gameName} has been added to your wishlist. We'll notify you when it's available!`,
        time: "Just now",
        isNew: true
    });
    
    updateNotificationBadge();
    renderNotifications();
    closeWishlistModalFunc();
    
    // Show success message
    alert(`Thank you! ${gameName} has been added to your wishlist.`);
});

// Banner Carousel
let currentSlide = 0;
const slides = document.querySelectorAll('.banner-slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    if (slides.length === 0) return;
    
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Show current slide
    if (slides[index]) {
        slides[index].classList.add('active');
        if (dots[index]) {
            dots[index].classList.add('active');
        }
    }
}

function nextSlide() {
    if (slides.length === 0) return;
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

// Auto-advance carousel
if (slides.length > 0) {
    setInterval(nextSlide, 5000);
}

// Dot navigation
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
    });
});

// FAQ Functionality
document.addEventListener('DOMContentLoaded', () => {
    // FAQ Category Switching
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqContents = document.querySelectorAll('.faq-category-content');
    
    faqCategories.forEach(category => {
        category.addEventListener('click', () => {
            const targetCategory = category.getAttribute('data-category');
            
            // Remove active class from all categories and contents
            faqCategories.forEach(cat => cat.classList.remove('active'));
            faqContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked category and corresponding content
            category.classList.add('active');
            document.getElementById(targetCategory)?.classList.add('active');
        });
    });
    
    // FAQ Item Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question?.addEventListener('click', () => {
            // Close other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    updateNotificationBadge();
    renderNotifications();
    loadProfile();
    
    // Show first slide
    if (slides.length > 0) {
        showSlide(0);
    }
});

// Contact Form (for contact page)
const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    
    // Add notification
    notifications.unshift({
        id: Date.now(),
        title: "Message Sent!",
        message: `Thank you ${name}! We'll get back to you soon at spctacularstudio@gmail.com`,
        time: "Just now",
        isNew: true
    });
    
    updateNotificationBadge();
    renderNotifications();
    contactForm.reset();
    
    alert('Message sent successfully! We\'ll get back to you soon.');
});

// Profile System
let userProfile = {
    username: null,
    email: null,
    robloxId: null,
    joinDate: new Date().getFullYear(),
    isLoggedIn: false
};

// Theme System
let currentTheme = localStorage.getItem('spartanTheme') || 'dark';

function initializeTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeIcon();
    }
}

function toggleTheme() {
    if (currentTheme === 'dark') {
        currentTheme = 'light';
        document.body.classList.add('light-theme');
    } else {
        currentTheme = 'dark';
        document.body.classList.remove('light-theme');
    }
    
    localStorage.setItem('spartanTheme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (currentTheme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Profile Functions
function updateProfileDisplay() {
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileStatus = document.getElementById('profileStatus');
    // Removed notify count elements
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (profileUsername) {
        profileUsername.textContent = userProfile.isLoggedIn ? userProfile.username : 'Guest User';
    }
    if (profileEmail) {
        profileEmail.textContent = userProfile.isLoggedIn ? userProfile.email : 'Not logged in';
    }
    if (profileStatus) {
        profileStatus.textContent = userProfile.isLoggedIn ? 'Online' : 'Offline';
        profileStatus.className = `profile-status ${userProfile.isLoggedIn ? 'online' : 'offline'}`;
    }
    // Removed notify count references
    if (loginBtn && logoutBtn) {
        loginBtn.style.display = userProfile.isLoggedIn ? 'none' : 'block';
        logoutBtn.style.display = userProfile.isLoggedIn ? 'block' : 'none';
    }
    
    // Removed notify games display update
}

// Removed notify games display functionality

function loginUser(username, email) {
    userProfile.username = username;
    userProfile.email = email;
    userProfile.isLoggedIn = true;
    userProfile.robloxId = Math.floor(Math.random() * 1000000); // Mock ID
    
    // Save to localStorage
    localStorage.setItem('spartanProfile', JSON.stringify(userProfile));
    
    updateProfileDisplay();
    
    // Add login notification
    notifications.unshift({
        id: Date.now(),
        title: "Login Successful!",
        message: `Welcome back, ${username}! Your profile has been loaded.`,
        time: "Just now",
        isNew: true
    });
    
    updateNotificationBadge();
    renderNotifications();
}

function logoutUser() {
    userProfile = {
        username: null,
        email: null,
        robloxId: null,
        joinDate: new Date().getFullYear(),
        isLoggedIn: false
    };
    
    localStorage.removeItem('spartanProfile');
    updateProfileDisplay();
    
    // Add logout notification
    showNotification({
        id: Date.now(),
        title: "Logged Out",
        message: "You have been successfully logged out. See you soon!",
        time: "Just now",
        isNew: true,
        type: "system"
    });
}

function addToWishlist(gameName, gameImage = '', gameStatus = 'Pre-Alpha') {
    if (!userProfile.isLoggedIn) {
        alert('Please login first to add games to your wishlist!');
        return;
    }
    
    // Check if already in wishlist
    if (userProfile.wishlist.find(game => game.name === gameName)) {
        alert('This game is already in your wishlist!');
        return;
    }
    
    const wishlistItem = {
        name: gameName,
        image: gameImage,
        status: gameStatus,
        dateAdded: new Date().toLocaleDateString()
    };
    
    userProfile.wishlist.push(wishlistItem);
    localStorage.setItem('spartanProfile', JSON.stringify(userProfile));
    
    updateProfileDisplay();
    
    return true;
}

// Profile Button Click
document.getElementById('profileBtn')?.addEventListener('click', () => {
    window.location.href = 'profile.html';
});

// Login/Logout Buttons
document.getElementById('loginBtn')?.addEventListener('click', () => {
    const username = prompt('Enter your Roblox username:');
    const email = prompt('Enter your email (optional):') || '';
    
    if (username) {
        loginUser(username, email);
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        logoutUser();
    }
});

// Load profile on page load
function loadProfile() {
    const saved = localStorage.getItem('spartanProfile');
    if (saved) {
        userProfile = JSON.parse(saved);
    }
    updateProfileDisplay();
}

// Make functions globally available
window.openWishlistModal = openWishlistModal;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.addToWishlist = addToWishlist;

// Console welcome message
console.log(`
🎮 Welcome to Spartan Corporation Studio!
🚀 Creating amazing Roblox experiences since 2025
⭐ Visit our games and add them to your wishlist!

📧 Contact: spctacularstudio@gmail.com
🔔 Notifications: ${notifications.filter(n => n.isNew).length} new
`);
// Load saved data
function loadSavedData() {
    // Load game releases
    const savedReleases = localStorage.getItem('gameReleases');
    if (savedReleases) {
        Object.assign(gameReleases, JSON.parse(savedReleases));
    }
    
    // Load notification permission
    const savedPermission = localStorage.getItem('notificationPermission');
    if (savedPermission === 'true') {
        notificationPermission = true;
    }
    
    // Load notifications
    const savedNotifications = localStorage.getItem('spartanNotifications');
    if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
    }
}

// Save notifications to localStorage
function saveNotifications() {
    localStorage.setItem('spartanNotifications', JSON.stringify(notifications));
}

// Enhanced notification rendering with save
function showNotification(notification) {
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
}

// Removed notify button setup as requested

// Enhanced DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data first
    loadSavedData();
    
    // Initialize theme
    initializeTheme();
    
    // Setup theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Initialize FAQ functionality
    initializeFAQ();
    
    // Removed notify buttons setup
    
    updateNotificationBadge();
    renderNotifications();
    loadProfile();
    updateGameButtons();
    checkReleasedGames();
    
    // Show first slide
    if (slides.length > 0) {
        showSlide(0);
    }
});

// Make admin functions globally available for testing
window.releaseGame = releaseGame;
window.gameReleases = gameReleases;
// Removed subscribeToGameNotifications from global scope
window.closeReleaseBanner = closeReleaseBanner;
window.closeAuthModal = closeAuthModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
// Fix FAQ functionality
function initializeFAQ() {
    // FAQ Category Switching
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqContents = document.querySelectorAll('.faq-category-content');
    
    faqCategories.forEach(category => {
        category.addEventListener('click', () => {
            const targetCategory = category.getAttribute('data-category');
            
            // Remove active class from all categories and contents
            faqCategories.forEach(cat => cat.classList.remove('active'));
            faqContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked category and corresponding content
            category.classList.add('active');
            document.getElementById(targetCategory)?.classList.add('active');
        });
    });
    
    // FAQ Item Toggle - Fixed to work with plus buttons
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');
        
        if (question) {
            question.addEventListener('click', () => {
                // Toggle current item
                item.classList.toggle('active');
            });
        }
        
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
}

// Call FAQ initialization
initializeFAQ();