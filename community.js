// Use Firebase from global scope (initialized in script.js)
// const db is already declared in script.js

// Community System
let communities = [];
let userCommunities = [];
let currentUser = null;
let defaultCensoredWords = ['spam', 'scam', 'hack'];
let censoredWords = [...defaultCensoredWords];

// Initialize community system
document.addEventListener('DOMContentLoaded', async function() {
    loadUserSession();
    await loadCommunities();
    populateDefaultCensoredWords();
    setupEventListeners();
});

// Load user session
function loadUserSession() {
    const userSession = localStorage.getItem('spartanUserSession');
    if (userSession) {
        try {
            const session = JSON.parse(userSession);
            if (session.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
                currentUser = session;
            }
        } catch (e) {
            localStorage.removeItem('spartanUserSession');
        }
    }
}

// Load communities from Firebase
async function loadCommunities() {
    try {
        // Load communities from Firebase
        const communitiesSnapshot = await db.collection('communities').orderBy('createdAt', 'desc').get();
        communities = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load user communities from Firebase
        const userCommunitiesSnapshot = await db.collection('userCommunities').get();
        userCommunities = userCommunitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('Communities loaded from Firebase:', communities.length);
        console.log('User communities loaded from Firebase:', userCommunities.length);
        
    } catch (error) {
        console.error('Error loading communities from Firebase:', error);
        // Fallback to localStorage
        communities = JSON.parse(localStorage.getItem('spartanCommunities') || '[]');
        userCommunities = JSON.parse(localStorage.getItem('spartanUserCommunities') || '[]');
    }
    
    populateAllCommunities();
    populateMyCommunities();
}

// Save community to Firebase
async function saveCommunity(community) {
    try {
        await db.collection('communities').doc(community.id).set(community);
        console.log('Community saved to Firebase:', community.title);
    } catch (error) {
        console.error('Error saving community to Firebase:', error);
        // Fallback to localStorage
        const localCommunities = JSON.parse(localStorage.getItem('spartanCommunities') || '[]');
        localCommunities.push(community);
        localStorage.setItem('spartanCommunities', JSON.stringify(localCommunities));
    }
}

// Save user community membership to Firebase
async function saveUserCommunity(userCommunity) {
    try {
        await db.collection('userCommunities').doc(userCommunity.id).set(userCommunity);
        console.log('User community membership saved to Firebase');
    } catch (error) {
        console.error('Error saving user community to Firebase:', error);
        // Fallback to localStorage
        const localUserCommunities = JSON.parse(localStorage.getItem('spartanUserCommunities') || '[]');
        localUserCommunities.push(userCommunity);
        localStorage.setItem('spartanUserCommunities', JSON.stringify(localUserCommunities));
    }
}

// Delete community from Firebase
async function deleteCommunityFromFirebase(communityId) {
    try {
        await db.collection('communities').doc(communityId).delete();
        console.log('Community deleted from Firebase');
    } catch (error) {
        console.error('Error deleting community from Firebase:', error);
    }
}

// Delete user community membership from Firebase
async function deleteUserCommunityFromFirebase(membershipId) {
    try {
        await db.collection('userCommunities').doc(membershipId).delete();
        console.log('User community membership deleted from Firebase');
    } catch (error) {
        console.error('Error deleting user community from Firebase:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Allow all join checkbox
    document.getElementById('allowAllJoin').addEventListener('change', function() {
        const passwordField = document.getElementById('communityPassword');
        if (this.checked) {
            passwordField.disabled = true;
            passwordField.value = '';
            passwordField.placeholder = 'Public community - no password needed';
        } else {
            passwordField.disabled = false;
            passwordField.placeholder = 'Enter password for private community';
        }
    });
    
    // Enable censor checkbox
    document.getElementById('enableCensor').addEventListener('change', function() {
        const censorSection = document.getElementById('censoredWordsSection');
        if (this.checked) {
            censorSection.style.display = 'block';
        } else {
            censorSection.style.display = 'none';
        }
    });
    
    // Create community form
    document.getElementById('createCommunityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createCommunity();
    });
}

// Community tab switching
function showCommunitySection(section, clickedElement) {
    // Remove active class from all tabs and sections
    document.querySelectorAll('.community-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.community-section').forEach(sec => sec.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding section
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    if (section === 'all') {
        document.getElementById('allCommunities').classList.add('active');
        populateAllCommunities();
    } else if (section === 'my') {
        document.getElementById('myCommunities').classList.add('active');
        populateMyCommunities();
    }
}

// Populate all communities
function populateAllCommunities() {
    const grid = document.getElementById('allCommunitiesGrid');
    
    if (communities.length === 0) {
        grid.innerHTML = `
            <div class="empty-communities">
                <h3>No Communities Yet</h3>
                <p>Be the first to create a community!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = communities.map(community => createCommunityCard(community, false)).join('');
}

// Populate user's communities
function populateMyCommunities() {
    const grid = document.getElementById('myCommunitiesGrid');
    
    if (!currentUser) {
        grid.innerHTML = `
            <div class="empty-communities">
                <h3>Login Required</h3>
                <p>Please login to see your communities</p>
                <button class="create-community-btn" onclick="window.location.href='auth.html'">Login</button>
            </div>
        `;
        return;
    }
    
    const myCommunities = communities.filter(c => 
        c.authorId === currentUser.id || 
        userCommunities.some(uc => uc.communityId === c.id && uc.userId === currentUser.id && uc.status === 'approved')
    );
    
    if (myCommunities.length === 0) {
        grid.innerHTML = `
            <div class="empty-communities">
                <h3>No Communities</h3>
                <p>You haven't joined any communities yet</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = myCommunities.map(community => createCommunityCard(community, true)).join('');
}

// Create community card HTML
function createCommunityCard(community, isOwned) {
    const isOwner = currentUser && community.authorId === currentUser.id;
    const isMember = userCommunities.some(uc => 
        uc.communityId === community.id && 
        uc.userId === currentUser?.id && 
        uc.status === 'approved'
    );
    const memberCount = userCommunities.filter(uc => 
        uc.communityId === community.id && 
        uc.status === 'approved'
    ).length + 1; // +1 for owner
    
    // Debug log
    console.log(`Community: ${community.title}, CurrentUser: ${currentUser?.id}, AuthorId: ${community.authorId}, IsOwner: ${isOwner}`);
    
    return `
        <div class="community-card">
            ${!community.isPublic ? '<div class="community-badge private">Private</div>' : '<div class="community-badge">Public</div>'}
            
            <div class="community-card-header">
                <div class="community-info">
                    <h3>${community.title}</h3>
                    <div class="community-author">by ${community.author}</div>
                </div>
                
                ${isOwner ? `
                    <div class="community-menu">
                        <button class="community-menu-btn" onclick="toggleCommunityMenu('${community.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                            </svg>
                        </button>
                        <div class="community-dropdown" id="menu-${community.id}">
                            <button class="community-dropdown-item" onclick="editCommunity('${community.id}')">Edit Community</button>
                            <button class="community-dropdown-item" onclick="manageMembersModal('${community.id}')">Manage Members</button>
                            <button class="community-dropdown-item" onclick="viewCommunityStats('${community.id}')">View Stats</button>
                            <button class="community-dropdown-item" onclick="deleteCommunity('${community.id}')">Delete Community</button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="community-description">${community.description}</div>
            
            <div class="community-stats">
                <div class="community-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,4C16.88,4 17.67,4.38 18.18,5H20C21.11,5 22,5.89 22,7V9C22,10.11 21.11,11 20,11H4C2.89,11 2,10.11 2,9V7C2,5.89 2.89,5 4,5H5.82C6.33,4.38 7.12,4 8,4H16M16,6H8A1,1 0 0,0 7,7A1,1 0 0,0 8,8H16A1,1 0 0,0 17,7A1,1 0 0,0 16,6Z"/>
                    </svg>
                    ${memberCount} members
                </div>
                <div class="community-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                    </svg>
                    ${community.isPublic ? 'Public' : 'Private'}
                </div>
                ${community.enableCensor ? `
                    <div class="community-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
                        </svg>
                        Moderated
                    </div>
                ` : ''}
            </div>
            
            <div class="community-actions">
                ${!isOwner && !isMember ? `
                    <button class="btn-join" onclick="joinCommunity('${community.id}')">Join Community</button>
                ` : ''}
                
                ${!isOwner && isMember ? `
                    <button class="btn-chat" onclick="openCommunityForum('${community.id}')">Forum</button>
                    <button class="btn-leave" onclick="leaveCommunity('${community.id}')">Leave Community</button>
                ` : ''}
                
                ${isOwner ? `
                    <button class="btn-chat" onclick="openCommunityForum('${community.id}')">Forum</button>
                    <button class="btn-join" onclick="openCommunityLink('${community.id}')">Open Community</button>
                ` : ''}
            </div>
        </div>
    `;
}

// Open create community modal
function openCreateCommunityModal() {
    if (!currentUser) {
        alert('Please login to create a community');
        window.location.href = 'auth.html';
        return;
    }
    
    document.getElementById('createCommunityModal').style.display = 'flex';
    document.getElementById('communityAuthor').value = currentUser.robloxName;
}

// Close community modal
function closeCommunityModal() {
    document.getElementById('createCommunityModal').style.display = 'none';
    document.getElementById('createCommunityForm').reset();
    censoredWords = [...defaultCensoredWords];
    populateDefaultCensoredWords();
}

// Populate default censored words
function populateDefaultCensoredWords() {
    const list = document.getElementById('censoredWordsList');
    list.innerHTML = censoredWords.map(word => `
        <div class="censored-word-item">
            <span style="color: #cccccc;">${word}</span>
            <button class="remove-word-btn" onclick="removeCensoredWord('${word}')">Remove</button>
        </div>
    `).join('');
}

// Add censored word
function addCensoredWord() {
    const input = document.getElementById('newCensoredWord');
    const word = input.value.trim().toLowerCase();
    
    if (!word) {
        alert('Please enter a word');
        return;
    }
    
    if (censoredWords.includes(word)) {
        alert('Word already in list');
        return;
    }
    
    censoredWords.push(word);
    input.value = '';
    populateDefaultCensoredWords();
}

// Remove censored word
function removeCensoredWord(word) {
    censoredWords = censoredWords.filter(w => w !== word);
    populateDefaultCensoredWords();
}

// Create community
async function createCommunity() {
    const title = document.getElementById('communityTitle').value.trim();
    const description = document.getElementById('communityDescription').value.trim();
    const author = document.getElementById('communityAuthor').value.trim();
    const password = document.getElementById('communityPassword').value.trim();
    const isPublic = document.getElementById('allowAllJoin').checked;
    const enableCensor = document.getElementById('enableCensor').checked;
    
    if (!title || !description || !author) {
        alert('Please fill all required fields');
        return;
    }
    
    if (!isPublic && !password) {
        alert('Private communities require a password');
        return;
    }
    
    // Check if editing existing community
    const editingId = document.getElementById('createCommunityForm').getAttribute('data-editing');
    
    if (editingId) {
        // Update existing community
        const community = communities.find(c => c.id === editingId);
        if (community) {
            community.title = title;
            community.description = description;
            community.author = author;
            community.password = isPublic ? null : password;
            community.isPublic = isPublic;
            community.enableCensor = enableCensor;
            community.censoredWords = enableCensor ? [...censoredWords] : [];
            community.updatedAt = new Date().toISOString();
            
            await saveCommunity(community);
            
            // Reset form
            document.getElementById('createCommunityForm').removeAttribute('data-editing');
            document.querySelector('.community-modal-title').textContent = 'Create New Community';
            document.querySelector('.btn-submit-wishlist').textContent = 'Create Community';
            
            alert('Community updated successfully!');
        }
    } else {
        // Create new community
        const communityId = generateCommunityId();
        const community = {
            id: communityId,
            title: title,
            description: description,
            author: author,
            authorId: currentUser.id,
            password: isPublic ? null : password,
            isPublic: isPublic,
            enableCensor: enableCensor,
            censoredWords: enableCensor ? [...censoredWords] : [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            vercelUrl: `https://spartancorporation.vercel.app/community.html`
        };
        
        communities.push(community);
        await saveCommunity(community);
        
        // Create Vercel redirect
        createVercelRedirect(community);
        
        alert(`Community created successfully!\\nVercel URL: ${community.vercelUrl}`);
    }
    
    closeCommunityModal();
    await loadCommunities(); // Reload from Firebase
}

// Generate community ID
function generateCommunityId() {
    return 'comm_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

// Create Vercel redirect (simulation)
function createVercelRedirect(community) {
    // In real implementation, this would create actual Vercel deployment
    console.log(`Creating Vercel redirect for community: ${community.title}`);
    console.log(`URL: ${community.vercelUrl}`);
    
    // Store redirect info for vercel.html
    const redirects = JSON.parse(localStorage.getItem('spartanCommunityRedirects') || '{}');
    redirects[community.id] = {
        url: community.vercelUrl,
        title: community.title,
        description: community.description,
        author: community.author,
        isPublic: community.isPublic,
        password: community.password
    };
    localStorage.setItem('spartanCommunityRedirects', JSON.stringify(redirects));
}

// Join community
function joinCommunity(communityId) {
    if (!currentUser) {
        alert('Please login to join communities');
        window.location.href = 'auth.html';
        return;
    }
    
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    if (!community.isPublic) {
        // Show password modal
        showJoinPasswordModal(community);
    } else {
        // Join directly
        addUserToCommunity(communityId, currentUser.id, 'approved');
    }
}

// Show join password modal
function showJoinPasswordModal(community) {
    const modal = document.getElementById('joinCommunityModal');
    const content = document.getElementById('joinCommunityContent');
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #ffffff; margin-bottom: 10px;">${community.title}</h3>
            <p style="color: #cccccc;">This is a private community. Please enter the password to join.</p>
        </div>
        
        <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="joinPassword" placeholder="Enter community password">
        </div>
        
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeJoinModal()">Cancel</button>
            <button class="btn-submit-wishlist" onclick="submitJoinPassword('${community.id}')">Join</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Submit join password
function submitJoinPassword(communityId) {
    const password = document.getElementById('joinPassword').value.trim();
    const community = communities.find(c => c.id === communityId);
    
    if (password === community.password) {
        addUserToCommunity(communityId, currentUser.id, 'approved');
        closeJoinModal();
    } else {
        alert('Incorrect password');
    }
}

// Close join modal
function closeJoinModal() {
    document.getElementById('joinCommunityModal').style.display = 'none';
}

// Add user to community
async function addUserToCommunity(communityId, userId, status) {
    const membership = {
        id: generateMembershipId(),
        communityId: communityId,
        userId: userId,
        status: status, // pending, approved, rejected
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    userCommunities.push(membership);
    await saveUserCommunity(membership);
    
    populateAllCommunities();
    populateMyCommunities();
    
    alert('Successfully joined the community!');
}

// Leave community
async function leaveCommunity(communityId) {
    if (confirm('Are you sure you want to leave this community?')) {
        const membership = userCommunities.find(uc => 
            uc.communityId === communityId && uc.userId === currentUser.id
        );
        
        if (membership) {
            await deleteUserCommunityFromFirebase(membership.id);
            userCommunities = userCommunities.filter(uc => uc.id !== membership.id);
        }
        
        populateAllCommunities();
        populateMyCommunities();
        
        alert('You have left the community');
    }
}

// Toggle community menu
function toggleCommunityMenu(communityId) {
    const menu = document.getElementById(`menu-${communityId}`);
    
    // Close all other menus
    document.querySelectorAll('.community-dropdown').forEach(dropdown => {
        if (dropdown.id !== `menu-${communityId}`) {
            dropdown.classList.remove('show');
        }
    });
    
    menu.classList.toggle('show');
}

// Edit community
function editCommunity(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    // Pre-fill form with existing data
    document.getElementById('communityTitle').value = community.title;
    document.getElementById('communityDescription').value = community.description;
    document.getElementById('communityAuthor').value = community.author;
    document.getElementById('communityPassword').value = community.password || '';
    document.getElementById('allowAllJoin').checked = community.isPublic;
    document.getElementById('enableCensor').checked = community.enableCensor;
    
    censoredWords = [...(community.censoredWords || defaultCensoredWords)];
    populateDefaultCensoredWords();
    
    // Change form to edit mode
    document.querySelector('.community-modal-title').textContent = 'Edit Community';
    document.querySelector('.btn-submit-wishlist').textContent = 'Update Community';
    
    // Store editing community ID
    document.getElementById('createCommunityForm').setAttribute('data-editing', communityId);
    
    document.getElementById('createCommunityModal').style.display = 'flex';
    toggleCommunityMenu(communityId);
}

// Delete community
async function deleteCommunity(communityId) {
    if (confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
        // Delete community from Firebase
        await deleteCommunityFromFirebase(communityId);
        
        // Delete all user memberships for this community
        const membershipsToDelete = userCommunities.filter(uc => uc.communityId === communityId);
        for (const membership of membershipsToDelete) {
            await deleteUserCommunityFromFirebase(membership.id);
        }
        
        // Update local arrays
        communities = communities.filter(c => c.id !== communityId);
        userCommunities = userCommunities.filter(uc => uc.communityId !== communityId);
        
        populateAllCommunities();
        populateMyCommunities();
        
        alert('Community deleted successfully');
    }
    toggleCommunityMenu(communityId);
}

// Open community link
function openCommunityLink(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (community) {
        window.open(community.vercelUrl, '_blank');
    }
}

// Generate membership ID
function generateMembershipId() {
    return 'member_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.community-menu')) {
        document.querySelectorAll('.community-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Clear current user (called from logout)
function clearCurrentUser() {
    currentUser = null;
    populateAllCommunities();
    populateMyCommunities();
}

// View Community Stats
function viewCommunityStats(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    const members = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'approved'
    );
    const pendingMembers = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'pending'
    );
    
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.innerHTML = `
        <div class="community-modal-content">
            <div class="community-modal-header">
                <h2 class="community-modal-title">Community Stats - ${community.title}</h2>
                <button class="community-modal-close" onclick="this.closest('.community-modal').remove()">&times;</button>
            </div>
            
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-number">${members.length + 1}</div>
                    <div class="stat-label">Total Members</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${pendingMembers.length}</div>
                    <div class="stat-label">Pending Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${community.isPublic ? 'Public' : 'Private'}</div>
                    <div class="stat-label">Community Type</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${community.enableCensor ? 'Yes' : 'No'}</div>
                    <div class="stat-label">Word Censoring</div>
                </div>
            </div>
            
            <div class="community-info-section">
                <h3>Community Information</h3>
                <p><strong>Created:</strong> ${community.createdAt ? new Date(community.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Description:</strong> ${community.description}</p>
                <p><strong>Author:</strong> ${community.author}</p>
                ${community.censoredWords && community.censoredWords.length > 0 ? 
                    `<p><strong>Censored Words:</strong> ${community.censoredWords.join(', ')}</p>` : ''}
            </div>
            
            <div class="form-actions">
                <button class="btn-cancel" onclick="this.closest('.community-modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    toggleCommunityMenu(communityId);
}

// Manage Members Modal
function manageMembersModal(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    const members = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'approved'
    );
    const pendingMembers = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'pending'
    );
    
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.innerHTML = `
        <div class="community-modal-content">
            <div class="community-modal-header">
                <h2 class="community-modal-title">Manage Members - ${community.title}</h2>
                <button class="community-modal-close" onclick="this.closest('.community-modal').remove()">&times;</button>
            </div>
            
            <div class="members-section">
                <h3>Current Members (${members.length + 1})</h3>
                <div class="members-list">
                    <div class="member-item owner">
                        <div class="member-info">
                            <strong>${community.author}</strong>
                            <span class="member-role">Owner</span>
                        </div>
                    </div>
                    ${members.map(member => `
                        <div class="member-item">
                            <div class="member-info">
                                <strong>${member.robloxName || 'Unknown'}</strong>
                                <span class="member-role">Member</span>
                            </div>
                            <button class="btn-danger" onclick="removeMember('${member.id}', '${communityId}')">Remove</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${pendingMembers.length > 0 ? `
                <div class="members-section">
                    <h3>Pending Requests (${pendingMembers.length})</h3>
                    <div class="members-list">
                        ${pendingMembers.map(member => `
                            <div class="member-item pending">
                                <div class="member-info">
                                    <strong>${member.robloxName || 'Unknown'}</strong>
                                    <span class="member-role">Pending</span>
                                </div>
                                <div class="member-actions">
                                    <button class="btn-success" onclick="approveMember('${member.id}', '${communityId}')">Approve</button>
                                    <button class="btn-danger" onclick="rejectMember('${member.id}', '${communityId}')">Reject</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="add-member-section">
                <h3>Add Member</h3>
                <div class="form-group">
                    <label class="form-label">Roblox Username</label>
                    <input type="text" class="form-input" id="newMemberName" placeholder="Enter Roblox username">
                </div>
                <button class="btn-submit-wishlist" onclick="addMemberToCommunity('${communityId}')">Add Member</button>
            </div>
            
            <div class="form-actions">
                <button class="btn-cancel" onclick="this.closest('.community-modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    toggleCommunityMenu(communityId);
}

// Member Management Functions
async function removeMember(memberId, communityId) {
    if (confirm('Are you sure you want to remove this member?')) {
        await deleteUserCommunityFromFirebase(memberId);
        userCommunities = userCommunities.filter(uc => uc.id !== memberId);
        
        // Refresh the modal
        document.querySelector('.community-modal').remove();
        manageMembersModal(communityId);
        
        // Refresh community displays
        populateAllCommunities();
        populateMyCommunities();
        
        alert('Member removed successfully');
    }
}

async function approveMember(memberId, communityId) {
    const membership = userCommunities.find(uc => uc.id === memberId);
    if (membership) {
        membership.status = 'approved';
        await saveUserCommunity(membership);
        
        // Refresh the modal
        document.querySelector('.community-modal').remove();
        manageMembersModal(communityId);
        
        // Refresh community displays
        populateAllCommunities();
        populateMyCommunities();
        
        alert('Member approved successfully');
    }
}

async function rejectMember(memberId, communityId) {
    if (confirm('Are you sure you want to reject this member request?')) {
        await deleteUserCommunityFromFirebase(memberId);
        userCommunities = userCommunities.filter(uc => uc.id !== memberId);
        
        // Refresh the modal
        document.querySelector('.community-modal').remove();
        manageMembersModal(communityId);
        
        // Refresh community displays
        populateAllCommunities();
        populateMyCommunities();
        
        alert('Member request rejected');
    }
}

async function addMemberToCommunity(communityId) {
    const robloxName = document.getElementById('newMemberName').value.trim();
    
    if (!robloxName) {
        alert('Please enter a Roblox username');
        return;
    }
    
    // Check if already a member
    const existingMember = userCommunities.find(uc => 
        uc.communityId === communityId && 
        uc.robloxName && 
        uc.robloxName.toLowerCase() === robloxName.toLowerCase()
    );
    
    if (existingMember) {
        alert('This user is already a member or has a pending request');
        return;
    }
    
    // Add as approved member (owner can directly add)
    const membership = {
        id: generateMembershipId(),
        communityId: communityId,
        userId: 'manual_' + Date.now(),
        robloxName: robloxName,
        status: 'approved',
        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    userCommunities.push(membership);
    await saveUserCommunity(membership);
    
    // Refresh community displays
    populateAllCommunities();
    populateMyCommunities();
    
    alert('Member added successfully');
}

// Clear current user (called from logout)
function clearCurrentUser() {
    currentUser = null;
    populateAllCommunities();
    populateMyCommunities();
}

// View Community Stats
function viewCommunityStats(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    const members = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'approved'
    );
    const pendingMembers = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'pending'
    );
    
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.innerHTML = `
        <div class="community-modal-content">
            <div class="community-modal-header">
                <h2 class="community-modal-title">Community Stats - ${community.title}</h2>
                <button class="community-modal-close" onclick="this.closest('.community-modal').remove()">&times;</button>
            </div>
            
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-number">${members.length + 1}</div>
                    <div class="stat-label">Total Members</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${pendingMembers.length}</div>
                    <div class="stat-label">Pending Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${community.isPublic ? 'Public' : 'Private'}</div>
                    <div class="stat-label">Community Type</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${community.enableCensor ? 'Yes' : 'No'}</div>
                    <div class="stat-label">Word Censoring</div>
                </div>
            </div>
            
            <div class="community-info-section">
                <h3>Community Information</h3>
                <p><strong>Created:</strong> ${community.createdAt ? new Date(community.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Description:</strong> ${community.description}</p>
                <p><strong>Author:</strong> ${community.author}</p>
                ${community.censoredWords && community.censoredWords.length > 0 ? 
                    `<p><strong>Censored Words:</strong> ${community.censoredWords.join(', ')}</p>` : ''}
            </div>
            
            <div class="form-actions">
                <button class="btn-cancel" onclick="this.closest('.community-modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    toggleCommunityMenu(communityId);
}

// Manage Members Modal
function manageMembersModal(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    const members = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'approved'
    );
    const pendingMembers = userCommunities.filter(uc => 
        uc.communityId === communityId && uc.status === 'pending'
    );
    
    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.innerHTML = `
        <div class="community-modal-content">
            <div class="community-modal-header">
                <h2 class="community-modal-title">Manage Members - ${community.title}</h2>
                <button class="community-modal-close" onclick="this.closest('.community-modal').remove()">&times;</button>
            </div>
            
            <div class="members-section">
                <h3>Current Members (${members.length + 1})</h3>
                <div class="members-list">
                    <div class="member-item owner">
                        <div class="member-info">
                            <strong>${community.author}</strong>
                            <span class="member-role">Owner</span>
                        </div>
                    </div>
                    ${members.map(member => `
                        <div class="member-item">
                            <div class="member-info">
                                <strong>${member.robloxName || 'Unknown'}</strong>
                                <span class="member-role">Member</span>
                            </div>
                            <button class="btn-danger" onclick="removeMember('${member.id}', '${communityId}')">Remove</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${pendingMembers.length > 0 ? `
                <div class="members-section">
                    <h3>Pending Requests (${pendingMembers.length})</h3>
                    <div class="members-list">
                        ${pendingMembers.map(member => `
                            <div class="member-item pending">
                                <div class="member-info">
                                    <strong>${member.robloxName || 'Unknown'}</strong>
                                    <span class="member-role">Pending</span>
                                </div>
                                <div class="member-actions">
                                    <button class="btn-success" onclick="approveMember('${member.id}', '${communityId}')">Approve</button>
                                    <button class="btn-danger" onclick="rejectMember('${member.id}', '${communityId}')">Reject</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="add-member-section">
                <h3>Add Member</h3>
                <div class="form-group">
                    <label class="form-label">Roblox Username</label>
                    <input type="text" class="form-input" id="newMemberName" placeholder="Enter Roblox username">
                </div>
                <button class="btn-submit-wishlist" onclick="addMemberToCommunity('${communityId}')">Add Member</button>
            </div>
            
            <div class="form-actions">
                <button class="btn-cancel" onclick="this.closest('.community-modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    toggleCommunityMenu(communityId);
}

// Export functions to window for global access
window.showCommunitySection = showCommunitySection;
window.openCreateCommunityModal = openCreateCommunityModal;
window.closeCommunityModal = closeCommunityModal;
window.addCensoredWord = addCensoredWord;
window.removeCensoredWord = removeCensoredWord;
window.joinCommunity = joinCommunity;
window.leaveCommunity = leaveCommunity;
window.toggleCommunityMenu = toggleCommunityMenu;
window.editCommunity = editCommunity;
window.deleteCommunity = deleteCommunity;
window.openCommunityLink = openCommunityLink;
window.closeJoinModal = closeJoinModal;
window.submitJoinPassword = submitJoinPassword;
window.clearCurrentUser = clearCurrentUser;
window.viewCommunityStats = viewCommunityStats;
window.manageMembersModal = manageMembersModal;
window.removeMember = removeMember;
window.approveMember = approveMember;
window.rejectMember = rejectMember;
window.addMemberToCommunity = addMemberToCommunity;

// Community Chat System
let communityMessages = [];

// Open Community Forum
function openCommunityForum(communityId) {
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    const modal = document.createElement('div');
    modal.className = 'community-modal chat-modal';
    modal.innerHTML = `
        <div class="community-modal-content chat-content">
            <div class="community-modal-header">
                <h2 class="community-modal-title">Forum - ${community.title}</h2>
                <button class="community-modal-close" onclick="this.closest('.community-modal').remove()">&times;</button>
            </div>
            
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages-${communityId}">
                    <!-- Messages will be loaded here -->
                </div>
                
                <div class="chat-input-container">
                    <input type="text" class="chat-input" id="chatInput-${communityId}" placeholder="Type your message..." maxlength="500">
                    <button class="chat-send-btn" onclick="sendMessage('${communityId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Load messages
    loadCommunityMessages(communityId);
    
    // Setup enter key for sending messages
    const chatInput = document.getElementById(`chatInput-${communityId}`);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage(communityId);
        }
    });
}

// Load Community Messages
async function loadCommunityMessages(communityId) {
    try {
        const messagesSnapshot = await db.collection('communityMessages')
            .where('communityId', '==', communityId)
            .limit(50)
            .get();
        
        let messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort messages by timestamp manually
        messages.sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timeA - timeB;
        });
        displayMessages(communityId, messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to localStorage
        const localMessages = JSON.parse(localStorage.getItem(`spartanChatMessages_${communityId}`) || '[]');
        displayMessages(communityId, localMessages);
    }
}

// Display Messages
function displayMessages(communityId, messages) {
    const chatContainer = document.getElementById(`chatMessages-${communityId}`);
    if (!chatContainer) return;
    
    chatContainer.innerHTML = messages.map(message => `
        <div class="chat-message ${message.userId === currentUser?.id ? 'own-message' : ''}">
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-time">${new Date(message.timestamp?.toDate ? message.timestamp.toDate() : message.timestamp).toLocaleTimeString()}</span>
                ${message.userId === currentUser?.id ? `
                    <div class="message-menu">
                        <button class="message-menu-btn" onclick="toggleMessageMenu('${message.id}')">⋯</button>
                        <div class="message-dropdown" id="msgMenu-${message.id}">
                            <button onclick="editMessage('${message.id}', '${communityId}')">Edit</button>
                            <button onclick="deleteMessage('${message.id}', '${communityId}')">Delete</button>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="message-content" id="msgContent-${message.id}">${message.content}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send Message
async function sendMessage(communityId) {
    const input = document.getElementById(`chatInput-${communityId}`);
    const content = input.value.trim();
    
    if (!content || !currentUser) return;
    
    const community = communities.find(c => c.id === communityId);
    if (!community) return;
    
    // Apply censoring if enabled
    let finalContent = content;
    if (community.enableCensor && community.censoredWords) {
        community.censoredWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            finalContent = finalContent.replace(regex, '*'.repeat(word.length));
        });
    }
    
    const message = {
        id: generateMessageId(),
        communityId: communityId,
        userId: currentUser.id,
        author: currentUser.robloxName,
        content: finalContent,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('communityMessages').doc(message.id).set(message);
    } catch (error) {
        console.error('Error sending message:', error);
        // Fallback to localStorage
        const localMessages = JSON.parse(localStorage.getItem(`spartanChatMessages_${communityId}`) || '[]');
        localMessages.push(message);
        localStorage.setItem(`spartanChatMessages_${communityId}`, JSON.stringify(localMessages));
    }
    
    input.value = '';
    loadCommunityMessages(communityId);
}

// Toggle Message Menu
function toggleMessageMenu(messageId) {
    const menu = document.getElementById(`msgMenu-${messageId}`);
    document.querySelectorAll('.message-dropdown').forEach(dropdown => {
        if (dropdown.id !== `msgMenu-${messageId}`) {
            dropdown.classList.remove('show');
        }
    });
    menu.classList.toggle('show');
}

// Edit Message
function editMessage(messageId, communityId) {
    const messageContent = document.getElementById(`msgContent-${messageId}`);
    const currentContent = messageContent.textContent;
    
    messageContent.innerHTML = `
        <input type="text" class="edit-message-input" value="${currentContent}" maxlength="500">
        <div class="edit-message-actions">
            <button class="btn-save" onclick="saveEditMessage('${messageId}', '${communityId}')">Save</button>
            <button class="btn-cancel" onclick="cancelEditMessage('${messageId}', '${currentContent}')">Cancel</button>
        </div>
    `;
    
    toggleMessageMenu(messageId);
}

// Save Edit Message
async function saveEditMessage(messageId, communityId) {
    const input = document.querySelector(`#msgContent-${messageId} .edit-message-input`);
    const newContent = input.value.trim();
    
    if (!newContent) return;
    
    try {
        await db.collection('communityMessages').doc(messageId).update({
            content: newContent,
            edited: true,
            editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error editing message:', error);
    }
    
    loadCommunityMessages(communityId);
}

// Cancel Edit Message
function cancelEditMessage(messageId, originalContent) {
    const messageContent = document.getElementById(`msgContent-${messageId}`);
    messageContent.textContent = originalContent;
}

// Delete Message
async function deleteMessage(messageId, communityId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            await db.collection('communityMessages').doc(messageId).delete();
        } catch (error) {
            console.error('Error deleting message:', error);
        }
        
        loadCommunityMessages(communityId);
        toggleMessageMenu(messageId);
    }
}

// Generate Message ID
function generateMessageId() {
    return 'msg_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

// Export new functions
window.openCommunityForum = openCommunityForum;
window.sendMessage = sendMessage;
window.toggleMessageMenu = toggleMessageMenu;
window.editMessage = editMessage;
window.saveEditMessage = saveEditMessage;
window.cancelEditMessage = cancelEditMessage;
window.deleteMessage = deleteMessage;