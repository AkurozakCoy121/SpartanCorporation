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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Admin System Configuration
const ADMIN_CREDENTIALS = {
    id: "5496306569",
    password: "MeSpartanCorporation13465347765447",
    username: "Super Admin"
};

// Initialize admin system
let currentAdmin = null;
let users = [];
let games = [];
let wishlists = [];
let notificationHistory = [];

// Check admin authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    loadAllData();
    initializeDefaultData();
    updateDashboard();
    populateAllTables();
});

// Authentication Functions
function checkAdminAuth() {
    const session = localStorage.getItem(STORAGE_KEYS.adminSession);
    if (!session) {
        redirectToLogin();
        return;
    }
    
    try {
        const sessionData = JSON.parse(session);
        if (sessionData.id === ADMIN_CREDENTIALS.id && sessionData.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
            currentAdmin = sessionData;
            document.getElementById('adminUsername').textContent = ADMIN_CREDENTIALS.username;
        } else {
            redirectToLogin();
        }
    } catch (e) {
        redirectToLogin();
    }
}

function redirectToLogin() {
    const adminId = prompt('Enter Admin ID:');
    const adminPassword = prompt('Enter Admin Password:');
    
    if (adminId === ADMIN_CREDENTIALS.id && adminPassword === ADMIN_CREDENTIALS.password) {
        const session = {
            id: adminId,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.adminSession, JSON.stringify(session));
        currentAdmin = session;
        document.getElementById('adminUsername').textContent = ADMIN_CREDENTIALS.username;
        loadAllData();
        updateDashboard();
        populateAllTables();
    } else {
        alert('Invalid credentials!');
        window.location.href = 'index.html';
    }
}

function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem(STORAGE_KEYS.adminSession);
        window.location.href = 'index.html';
    }
}

// Firebase Data Manunctions
function loadAllData() {
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    wishlists = JSON.parse(localStorage.getItem(STORAGE_KEYS.wishlists) || '[]');
    notificationHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications) || '[]');
}

function saveAllData() {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(games));
    localStorage.setItem(STORAGE_KEYS.wishlists, JSON.stringify(wishlists));
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notificationHistory));
}

async function initializeDefaultData() {
    // Initialize default games if empty
    if (games.length === 0) {
        const defaultGames = [
            {
                id: 'hangsim',
                name: 'HangSim',
                status: 'coming-soon',
                robloxUrl: null,
                image: 'https://res.cloudinary.com/dqrp70g9u/image/upload/v1765560573/ssd_eeifra.png',
                releaseDate: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                id: 'gohunting',
                name: 'Go Hunting',
                status: 'coming-soon',
                robloxUrl: null,
                image: 'https://res.cloudinary.com/dqrp70g9u/image/upload/v1765560621/Music_Player_fgvcif.png',
                releaseDate: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                id: 'gunungwatuwelah',
                name: 'Gunung Watu Welah',
                status: 'coming-soon',
                robloxUrl: null,
                image: null,
                releaseDate: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        // Save to Firebase
        for (const game of defaultGames) {
            await saveGame(game);
            games.push(game);
        }
    }
}

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked nav link
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // Update section-specific data
    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'accounts') {
        populateAccountsTable();
    } else if (sectionId === 'games') {
        populateGamesTable();
    } else if (sectionId === 'notifications') {
        populateNotificationUsers();
        populateNotificationHistory();
    } else if (sectionId === 'wishlist') {
        populateWishlistTable();
    }
}

// Dashboard Functions
function updateDashboard() {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalGames').textContent = games.length;
    document.getElementById('pendingWishlists').textContent = wishlists.filter(w => w.status === 'pending').length;
    document.getElementById('totalNotifications').textContent = notificationHistory.length;
}

// Account Management Functions
function populateAccountsTable() {
    const tbody = document.getElementById('accountsTable');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.robloxName}</td>
            <td><span class="status-badge ${user.role === 'admin' ? 'status-approved' : 'status-pending'}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary" onclick="editAccount('${user.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteAccount('${user.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAddAccountModal() {
    document.getElementById('addAccountModal').style.display = 'block';
}

function addAccount() {
    const username = document.getElementById('newUsername').value;
    const robloxName = document.getElementById('newRobloxName').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !robloxName || !password) {
        alert('Please fill all fields');
        return;
    }
    
    const newUser = {
        id: generateUserId(),
        username: username,
        robloxName: robloxName,
        password: password,
        role: role,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveAllData();
    populateAccountsTable();
    closeModal('addAccountModal');
    
    // Clear form
    document.getElementById('newUsername').value = '';
    document.getElementById('newRobloxName').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newRole').value = 'user';
    
    alert(`Account created! User ID: ${newUser.id}`);
}

function editAccount(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newUsername = prompt('Enter new username:', user.username);
    const newRobloxName = prompt('Enter new Roblox name:', user.robloxName);
    const newRole = prompt('Enter new role (user/admin):', user.role);
    
    if (newUsername) user.username = newUsername;
    if (newRobloxName) user.robloxName = newRobloxName;
    if (newRole && (newRole === 'user' || newRole === 'admin')) user.role = newRole;
    
    saveAllData();
    populateAccountsTable();
}

function deleteAccount(userId) {
    if (confirm('Are you sure you want to delete this account?')) {
        users = users.filter(u => u.id !== userId);
        saveAllData();
        populateAccountsTable();
        updateDashboard();
    }
}

// Game Management Functions
function populateGamesTable() {
    const tbody = document.getElementById('gamesTable');
    tbody.innerHTML = '';
    
    games.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${game.name}</td>
            <td><span class="status-badge status-${game.status.replace('-', '')}">${game.status.replace('-', ' ')}</span></td>
            <td>${game.robloxUrl ? `<a href="${game.robloxUrl}" target="_blank" style="color: #667eea;">View Game</a>` : 'Not Set'}</td>
            <td>${game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'TBA'}</td>
            <td>
                <button class="btn-secondary" onclick="editGame('${game.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteGame('${game.id}')">Delete</button>
                ${game.status === 'coming-soon' ? `<button class="btn-success" onclick="releaseGame('${game.id}')">Release</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAddGameModal() {
    document.getElementById('addGameModal').style.display = 'block';
}

function addGame() {
    const name = document.getElementById('newGameName').value;
    const status = document.getElementById('newGameStatus').value;
    const url = document.getElementById('newGameUrl').value;
    const image = document.getElementById('newGameImage').value;
    
    if (!name) {
        alert('Please enter game name');
        return;
    }
    
    const newGame = {
        id: name.toLowerCase().replace(/\s+/g, ''),
        name: name,
        status: status,
        robloxUrl: url || null,
        image: image || null,
        releaseDate: status === 'released' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString()
    };
    
    games.push(newGame);
    saveAllData();
    populateGamesTable();
    closeModal('addGameModal');
    
    // Clear form
    document.getElementById('newGameName').value = '';
    document.getElementById('newGameStatus').value = 'coming-soon';
    document.getElementById('newGameUrl').value = '';
    document.getElementById('newGameImage').value = '';
}

function editGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    const newName = prompt('Enter new game name:', game.name);
    const newStatus = prompt('Enter new status (coming-soon/released):', game.status);
    const newUrl = prompt('Enter Roblox URL:', game.robloxUrl || '');
    
    if (newName) game.name = newName;
    if (newStatus && (newStatus === 'coming-soon' || newStatus === 'released')) {
        game.status = newStatus;
        if (newStatus === 'released' && !game.releaseDate) {
            game.releaseDate = new Date().toISOString();
        }
    }
    if (newUrl) game.robloxUrl = newUrl;
    
    saveAllData();
    populateGamesTable();
}

function releaseGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    const robloxUrl = prompt('Enter Roblox game URL:');
    if (!robloxUrl) return;
    
    game.status = 'released';
    game.robloxUrl = robloxUrl;
    game.releaseDate = new Date().toISOString();
    
    saveAllData();
    populateGamesTable();
    
    // Notify all users who have this game in wishlist
    const gameWishlists = wishlists.filter(w => w.gameId === gameId && w.status === 'approved');
    gameWishlists.forEach(wishlist => {
        const notification = {
            id: generateNotificationId(),
            title: `🎮 ${game.name} is Now Available!`,
            message: `${game.name} has been released! Click to play now on Roblox.`,
            recipient: wishlist.userId,
            recipientType: 'specific',
            createdAt: new Date().toISOString(),
            status: 'sent'
        };
        notificationHistory.push(notification);
    });
    
    saveAllData();
    alert(`Game released! ${gameWishlists.length} users will be notified.`);
}

function deleteGame(gameId) {
    if (confirm('Are you sure you want to delete this game?')) {
        games = games.filter(g => g.id !== gameId);
        saveAllData();
        populateGamesTable();
        updateDashboard();
    }
}

// Notification Functions
function populateNotificationUsers() {
    const select = document.getElementById('specificUser');
    select.innerHTML = '<option value="">Select a user</option>';
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.username} (${user.robloxName})`;
        select.appendChild(option);
    });
}

function populateNotificationHistory() {
    const tbody = document.getElementById('notificationHistory');
    tbody.innerHTML = '';
    
    notificationHistory.slice(-20).reverse().forEach(notification => {
        const row = document.createElement('tr');
        const recipient = notification.recipientType === 'all' ? 'All Users' : 
                         users.find(u => u.id === notification.recipient)?.username || 'Unknown';
        
        row.innerHTML = `
            <td>${notification.title}</td>
            <td>${recipient}</td>
            <td>${new Date(notification.createdAt).toLocaleDateString()}</td>
            <td><span class="status-badge status-approved">${notification.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('notificationType').addEventListener('change', function() {
    const specificGroup = document.getElementById('specificUserGroup');
    if (this.value === 'specific') {
        specificGroup.style.display = 'block';
    } else {
        specificGroup.style.display = 'none';
    }
});

function sendNotification() {
    const type = document.getElementById('notificationType').value;
    const title = document.getElementById('notificationTitle').value;
    const message = document.getElementById('notificationMessage').value;
    const specificUser = document.getElementById('specificUser').value;
    
    if (!title || !message) {
        alert('Please fill title and message');
        return;
    }
    
    if (type === 'specific' && !specificUser) {
        alert('Please select a user');
        return;
    }
    
    const notification = {
        id: generateNotificationId(),
        title: title,
        message: message,
        recipient: type === 'all' ? null : specificUser,
        recipientType: type,
        createdAt: new Date().toISOString(),
        status: 'sent'
    };
    
    notificationHistory.push(notification);
    saveAllData();
    populateNotificationHistory();
    updateDashboard();
    
    // Clear form
    document.getElementById('notificationTitle').value = '';
    document.getElementById('notificationMessage').value = '';
    document.getElementById('specificUser').value = '';
    
    alert('Notification sent successfully!');
}

// Wishlist Management Functions
function populateWishlistTable() {
    const tbody = document.getElementById('wishlistTable');
    tbody.innerHTML = '';
    
    wishlists.forEach(wishlist => {
        const user = users.find(u => u.id === wishlist.userId);
        const game = games.find(g => g.id === wishlist.gameId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user ? user.username : 'Unknown'}</td>
            <td>${wishlist.robloxName}</td>
            <td>${game ? game.name : 'Unknown Game'}</td>
            <td>${new Date(wishlist.createdAt).toLocaleDateString()}</td>
            <td><span class="status-badge status-${wishlist.status}">${wishlist.status}</span></td>
            <td>
                ${wishlist.status === 'pending' ? `
                    <button class="btn-success" onclick="approveWishlist('${wishlist.id}')">Approve</button>
                    <button class="btn-danger" onclick="rejectWishlist('${wishlist.id}')">Reject</button>
                ` : ''}
                <button class="btn-secondary" onclick="deleteWishlist('${wishlist.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function approveWishlist(wishlistId) {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    if (wishlist) {
        wishlist.status = 'approved';
        saveAllData();
        populateWishlistTable();
        updateDashboard();
    }
}

function rejectWishlist(wishlistId) {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    if (wishlist) {
        wishlist.status = 'rejected';
        saveAllData();
        populateWishlistTable();
        updateDashboard();
    }
}

function deleteWishlist(wishlistId) {
    if (confirm('Are you sure you want to delete this wishlist entry?')) {
        wishlists = wishlists.filter(w => w.id !== wishlistId);
        saveAllData();
        populateWishlistTable();
        updateDashboard();
    }
}

// Utility Functions
function generateUserId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

function generateNotificationId() {
    return 'notif_' + Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

function generateWishlistId() {
    return 'wish_' + Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

// Modal Functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Populate all tables on load
function populateAllTables() {
    populateAccountsTable();
    populateGamesTable();
    populateNotificationUsers();
    populateNotificationHistory();
    populateWishlistTable();
}

// Export functions for external use
window.adminSystem = {
    addWishlist: function(userId, gameId, robloxName) {
        const wishlist = {
            id: generateWishlistId(),
            userId: userId,
            gameId: gameId,
            robloxName: robloxName,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        wishlists.push(wishlist);
        saveAllData();
        return wishlist;
    },
    
    getGames: function() {
        return games;
    },
    
    getUsers: function() {
        return users;
    },
    
    authenticateUser: function(userId, password) {
        const user = users.find(u => u.id === userId && u.password === password);
        return user || null;
    },
    
    registerUser: function(username, robloxName, password) {
        const newUser = {
            id: generateUserId(),
            username: username,
            robloxName: robloxName,
            password: password,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveAllData();
        return newUser;
    },
    
    getUserNotifications: function(userId) {
        return notificationHistory.filter(n => 
            n.recipientType === 'all' || n.recipient === userId
        );
    }
};