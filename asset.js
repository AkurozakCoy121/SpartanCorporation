// Asset Management System
let assets = [];
let currentUser = null;
let pendingExternalLink = null;

// Use Firebase from global scope (initialized in script.js)
// const db is already declared in script.js

// Initialize asset system
document.addEventListener('DOMContentLoaded', async function() {
    loadUserSession();
    await loadAssets();
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

// Load assets from Firebase
async function loadAssets() {
    try {
        const assetsSnapshot = await db.collection('assets').orderBy('createdAt', 'desc').get();
        assets = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Assets loaded from Firebase:', assets.length);
    } catch (error) {
        console.error('Error loading assets from Firebase:', error);
        // Fallback to localStorage
        assets = JSON.parse(localStorage.getItem('spartanAssets') || '[]');
    }
    
    displayAssets();
}

// Display assets
function displayAssets() {
    const grid = document.getElementById('assetsGrid');
    
    if (assets.length === 0) {
        grid.innerHTML = `
            <div class="empty-assets">
                <h3>No Assets Yet</h3>
                <p>Be the first to upload an asset!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = assets.map(asset => createAssetCard(asset)).join('');
}

// Create asset card HTML
function createAssetCard(asset) {
    const externalLinks = asset.externalLinks || [];
    const isOwner = currentUser && asset.authorId === currentUser.id;
    
    return `
        <div class="asset-card" onclick="openAssetDetail('${asset.id}')">
            <img src="${asset.imageUrl}" alt="${asset.name}" class="asset-image" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            
            <div class="asset-card-header">
                <div class="asset-info">
                    <div class="asset-title">${asset.name}</div>
                    <div class="asset-author">by ${asset.author}</div>
                    <div class="asset-category">${asset.category}</div>
                </div>
                
                ${isOwner ? `
                    <div class="asset-menu">
                        <button class="asset-menu-btn" onclick="toggleAssetMenu('${asset.id}', event)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                            </svg>
                        </button>
                        <div class="asset-dropdown" id="assetMenu-${asset.id}">
                            <button class="asset-dropdown-item" onclick="editAsset('${asset.id}', event)">Edit Asset</button>
                            <button class="asset-dropdown-item" onclick="deleteAsset('${asset.id}', event)">Delete Asset</button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="asset-description">${asset.description.substring(0, 100)}${asset.description.length > 100 ? '...' : ''}</div>
            
            <div class="asset-stats">
                <span class="asset-stat">👁️ ${asset.views || 0}</span>
                <span class="asset-stat">💬 ${asset.comments ? asset.comments.length : 0}</span>
            </div>
            
            <div class="asset-date">
                Updated: ${asset.updatedAt ? new Date(asset.updatedAt.toDate ? asset.updatedAt.toDate() : asset.updatedAt).toLocaleDateString() : new Date(asset.createdAt?.toDate ? asset.createdAt.toDate() : asset.createdAt || Date.now()).toLocaleDateString()}
            </div>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Upload form submission
    document.getElementById('uploadAssetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadAsset();
    });
}

// Open upload modal
function openUploadModal() {
    if (!currentUser) {
        alert('Please login to upload assets');
        window.location.href = 'auth.html';
        return;
    }
    
    // Pre-fill user data
    document.getElementById('assetAuthor').value = currentUser.robloxName;
    document.getElementById('robloxName').value = currentUser.robloxName;
    
    document.getElementById('uploadAssetModal').style.display = 'flex';
}

// Close upload modal
function closeUploadModal() {
    document.getElementById('uploadAssetModal').style.display = 'none';
    document.getElementById('uploadAssetForm').reset();
    document.getElementById('assetDescription').innerHTML = '';
    
    // Reset external links
    const linksSection = document.getElementById('externalLinksSection');
    linksSection.innerHTML = `
        <div class="external-link-item">
            <input type="text" class="form-input" placeholder="Link Name" name="linkName">
            <input type="url" class="form-input" placeholder="https://example.com" name="linkUrl">
            <button type="button" class="remove-link-btn" onclick="removeExternalLink(this)">Remove</button>
        </div>
    `;
}

// Upload asset
async function uploadAsset() {
    const name = document.getElementById('assetName').value.trim();
    const imageUrl = document.getElementById('assetImageUrl').value.trim();
    const robloxCreatorLink = document.getElementById('robloxCreatorLink').value.trim();
    const author = document.getElementById('assetAuthor').value.trim();
    const robloxName = document.getElementById('robloxName').value.trim();
    const category = document.getElementById('assetCategory').value;
    const description = document.getElementById('assetDescription').innerHTML.trim();
    
    if (!name || !imageUrl || !author || !robloxName || !category || !description) {
        alert('Please fill all required fields');
        return;
    }
    
    // Collect external links
    const externalLinks = [];
    const linkItems = document.querySelectorAll('.external-link-item');
    linkItems.forEach(item => {
        const linkName = item.querySelector('input[name="linkName"]').value.trim();
        const linkUrl = item.querySelector('input[name="linkUrl"]').value.trim();
        
        if (linkName && linkUrl) {
            externalLinks.push({ name: linkName, url: linkUrl });
        }
    });
    
    // Check if editing existing asset
    const editingId = document.getElementById('uploadAssetForm').getAttribute('data-editing');
    
    if (editingId) {
        // Update existing asset
        const asset = assets.find(a => a.id === editingId);
        if (asset) {
            asset.name = name;
            asset.imageUrl = imageUrl;
            asset.robloxCreatorLink = robloxCreatorLink || null;
            asset.author = author;
            asset.robloxName = robloxName;
            asset.category = category;
            asset.description = description;
            asset.externalLinks = externalLinks;
            asset.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            try {
                await db.collection('assets').doc(editingId).update(asset);
                console.log('Asset updated in Firebase:', asset.name);
            } catch (error) {
                console.error('Error updating asset:', error);
            }
            
            // Reset form
            document.getElementById('uploadAssetForm').removeAttribute('data-editing');
            document.querySelector('.asset-modal-title').textContent = 'Upload New Asset';
            document.querySelector('.btn-submit').textContent = 'Upload Asset';
            
            displayAssets();
            closeUploadModal();
            
            alert('Asset updated successfully!');
        }
    } else {
        // Create new asset
        const assetId = generateAssetId();
        const asset = {
            id: assetId,
            name: name,
            imageUrl: imageUrl,
            robloxCreatorLink: robloxCreatorLink || null,
            author: author,
            robloxName: robloxName,
            authorId: currentUser.id,
            category: category,
            description: description,
            externalLinks: externalLinks,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            views: 0,
            comments: []
        };
        
        try {
            await db.collection('assets').doc(assetId).set(asset);
            console.log('Asset uploaded to Firebase:', asset.name);
            
            assets.unshift(asset);
            displayAssets();
            closeUploadModal();
            
            alert('Asset uploaded successfully!');
        } catch (error) {
            console.error('Error uploading asset to Firebase:', error);
            
            // Fallback to localStorage
            const localAssets = JSON.parse(localStorage.getItem('spartanAssets') || '[]');
            localAssets.unshift(asset);
            localStorage.setItem('spartanAssets', JSON.stringify(localAssets));
            
            assets.unshift(asset);
            displayAssets();
            closeUploadModal();
            
            alert('Asset uploaded successfully!');
        }
    }
}

// Generate asset ID
function generateAssetId() {
    return 'asset_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

// Rich text editor functions
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('assetDescription').focus();
}

function insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
        const text = window.getSelection().toString() || url;
        document.execCommand('createLink', false, url);
        document.getElementById('assetDescription').focus();
    }
}

// External links management
function addExternalLink() {
    const linksSection = document.getElementById('externalLinksSection');
    const newLinkItem = document.createElement('div');
    newLinkItem.className = 'external-link-item';
    newLinkItem.innerHTML = `
        <input type="text" class="form-input" placeholder="Link Name" name="linkName">
        <input type="url" class="form-input" placeholder="https://example.com" name="linkUrl">
        <button type="button" class="remove-link-btn" onclick="removeExternalLink(this)">Remove</button>
    `;
    linksSection.appendChild(newLinkItem);
}

function removeExternalLink(button) {
    const linkItem = button.closest('.external-link-item');
    const linksSection = document.getElementById('externalLinksSection');
    
    // Keep at least one link item
    if (linksSection.children.length > 1) {
        linkItem.remove();
    } else {
        // Clear the inputs instead of removing
        linkItem.querySelector('input[name="linkName"]').value = '';
        linkItem.querySelector('input[name="linkUrl"]').value = '';
    }
}

// External link warning system
function showExternalLinkWarning(url, event) {
    event.preventDefault();
    pendingExternalLink = url;
    document.getElementById('externalLinkWarning').style.display = 'flex';
}

function closeWarningModal() {
    document.getElementById('externalLinkWarning').style.display = 'none';
    pendingExternalLink = null;
}

function proceedToExternalLink() {
    if (pendingExternalLink) {
        window.open(pendingExternalLink, '_blank');
        closeWarningModal();
    }
}

// Clear current user (called from logout)
function clearCurrentUser() {
    currentUser = null;
}

// Export functions to window for global access
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.formatText = formatText;
window.insertLink = insertLink;
window.addExternalLink = addExternalLink;
window.removeExternalLink = removeExternalLink;
window.showExternalLinkWarning = showExternalLinkWarning;
window.closeWarningModal = closeWarningModal;
window.proceedToExternalLink = proceedToExternalLink;
window.clearCurrentUser = clearCurrentUser;
window.filterAssets = filterAssets;

// Filter assets function
function filterAssets() {
    const searchTerm = document.getElementById('searchAssets').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredAssets = assets;
    
    // Filter by search term
    if (searchTerm) {
        filteredAssets = filteredAssets.filter(asset => 
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.author.toLowerCase().includes(searchTerm) ||
            asset.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    if (categoryFilter) {
        filteredAssets = filteredAssets.filter(asset => asset.category === categoryFilter);
    }
    
    displayFilteredAssets(filteredAssets);
}

// Display filtered assets
function displayFilteredAssets(filteredAssets) {
    const grid = document.getElementById('assetsGrid');
    
    if (filteredAssets.length === 0) {
        grid.innerHTML = `
            <div class="empty-assets">
                <h3>No Assets Found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredAssets.map(asset => createAssetCard(asset)).join('');
}

// Export filter function
window.filterAssets = filterAssets;
// Open Asset Detail Modal
function openAssetDetail(assetId) {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    // Increment view count
    asset.views = (asset.views || 0) + 1;
    
    const externalLinks = asset.externalLinks || [];
    const comments = asset.comments || [];
    const isOwner = currentUser && asset.authorId === currentUser.id;
    
    const modal = document.createElement('div');
    modal.className = 'asset-detail-modal';
    modal.innerHTML = `
        <div class="asset-detail-content">
            <div class="asset-detail-header">
                <h2 class="asset-detail-title">${asset.name}</h2>
                <button class="asset-modal-close" onclick="this.closest('.asset-detail-modal').remove()">&times;</button>
            </div>
            
            <div class="asset-detail-body">
                <div class="asset-detail-left">
                    <img src="${asset.imageUrl}" alt="${asset.name}" class="asset-detail-image" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
                    
                    <div class="asset-detail-info">
                        <div class="asset-detail-meta">
                            <span class="asset-detail-author">by ${asset.author}</span>
                            <span class="asset-detail-category">${asset.category}</span>
                        </div>
                        
                        <div class="asset-detail-stats">
                            <span class="asset-stat">👁️ ${asset.views || 0} views</span>
                            <span class="asset-stat">💬 ${comments.length} comments</span>
                        </div>
                        
                        <div class="asset-detail-actions">
                            ${asset.robloxCreatorLink ? `
                                <a href="${asset.robloxCreatorLink}" target="_blank" class="btn-add-roblox">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,7V13H13V7H11M11,15V17H13V15H11Z"/>
                                    </svg>
                                    Add to Roblox
                                </a>
                            ` : ''}
                            

                        </div>
                        
                        ${externalLinks.length > 0 ? `
                            <div class="asset-external-links">
                                <h4>External Links:</h4>
                                ${externalLinks.map(link => `
                                    <a href="#" class="external-link-item" onclick="showExternalLinkWarning('${link.url}', event)">
                                        🔗 ${link.name}
                                    </a>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="asset-detail-right">
                    <div class="asset-description-full">
                        <h4>Description:</h4>
                        <div class="description-content">${asset.description}</div>
                    </div>
                    
                    <div class="asset-comments-section">
                        <h4>Comments (${comments.length})</h4>
                        
                        ${currentUser ? `
                            <div class="comment-form">
                                <textarea class="comment-input" id="commentInput-${asset.id}" placeholder="Write a comment..." maxlength="500"></textarea>
                                <button class="btn-comment" onclick="addComment('${asset.id}')">Post Comment</button>
                            </div>
                        ` : `
                            <p class="login-prompt">Please <a href="auth.html">login</a> to comment</p>
                        `}
                        
                        <div class="comments-list" id="commentsList-${asset.id}">
                            ${comments.map(comment => `
                                <div class="comment-item">
                                    <div class="comment-header">
                                        <span class="comment-author">${comment.author}</span>
                                        <span class="comment-time">${new Date(comment.timestamp?.toDate ? comment.timestamp.toDate() : comment.timestamp).toLocaleDateString()}</span>
                                        ${comment.userId === currentUser?.id ? `
                                            <div class="comment-menu">
                                                <button class="comment-menu-btn" onclick="toggleCommentMenu('${comment.id}')">⋯</button>
                                                <div class="comment-dropdown" id="commentMenu-${comment.id}">
                                                    <button onclick="editComment('${comment.id}', '${asset.id}')">Edit</button>
                                                    <button onclick="deleteComment('${comment.id}', '${asset.id}')">Delete</button>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="comment-content" id="commentContent-${comment.id}">${comment.content}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Toggle Asset Menu
function toggleAssetMenu(assetId, event) {
    event.stopPropagation();
    const menu = document.getElementById(`assetMenu-${assetId}`);
    
    // Close all other menus
    document.querySelectorAll('.asset-dropdown').forEach(dropdown => {
        if (dropdown.id !== `assetMenu-${assetId}`) {
            dropdown.classList.remove('show');
        }
    });
    
    menu.classList.toggle('show');
}

// Edit Asset
function editAsset(assetId, event) {
    event.stopPropagation();
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    // Pre-fill form with existing data
    document.getElementById('assetName').value = asset.name;
    document.getElementById('assetImageUrl').value = asset.imageUrl;
    document.getElementById('robloxCreatorLink').value = asset.robloxCreatorLink || '';
    document.getElementById('assetAuthor').value = asset.author;
    document.getElementById('robloxName').value = asset.robloxName;
    document.getElementById('assetCategory').value = asset.category;
    document.getElementById('assetDescription').innerHTML = asset.description;
    
    // Set external links
    const linksSection = document.getElementById('externalLinksSection');
    linksSection.innerHTML = '';
    
    if (asset.externalLinks && asset.externalLinks.length > 0) {
        asset.externalLinks.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'external-link-item';
            linkItem.innerHTML = `
                <input type="text" class="form-input" placeholder="Link Name" name="linkName" value="${link.name}">
                <input type="url" class="form-input" placeholder="https://example.com" name="linkUrl" value="${link.url}">
                <button type="button" class="remove-link-btn" onclick="removeExternalLink(this)">Remove</button>
            `;
            linksSection.appendChild(linkItem);
        });
    } else {
        linksSection.innerHTML = `
            <div class="external-link-item">
                <input type="text" class="form-input" placeholder="Link Name" name="linkName">
                <input type="url" class="form-input" placeholder="https://example.com" name="linkUrl">
                <button type="button" class="remove-link-btn" onclick="removeExternalLink(this)">Remove</button>
            </div>
        `;
    }
    
    // Change form to edit mode
    document.querySelector('.asset-modal-title').textContent = 'Edit Asset';
    document.querySelector('.btn-submit').textContent = 'Update Asset';
    
    // Store editing asset ID
    document.getElementById('uploadAssetForm').setAttribute('data-editing', assetId);
    
    document.getElementById('uploadAssetModal').style.display = 'flex';
    toggleAssetMenu(assetId, event);
}

// Delete Asset
async function deleteAsset(assetId, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
        try {
            await db.collection('assets').doc(assetId).delete();
            console.log('Asset deleted from Firebase');
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
        
        // Update local array
        assets = assets.filter(a => a.id !== assetId);
        displayAssets();
        
        alert('Asset deleted successfully');
    }
    toggleAssetMenu(assetId, event);
}



// Add Comment
async function addComment(assetId) {
    if (!currentUser) {
        alert('Please login to comment');
        return;
    }
    
    const input = document.getElementById(`commentInput-${assetId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    const comment = {
        id: generateCommentId(),
        assetId: assetId,
        userId: currentUser.id,
        author: currentUser.robloxName,
        content: content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const asset = assets.find(a => a.id === assetId);
    if (!asset.comments) asset.comments = [];
    asset.comments.push(comment);
    
    try {
        await db.collection('assetComments').doc(comment.id).set(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
    }
    
    input.value = '';
    
    // Refresh comments
    const commentsList = document.getElementById(`commentsList-${assetId}`);
    if (commentsList) {
        commentsList.innerHTML = asset.comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${new Date(comment.timestamp?.toDate ? comment.timestamp.toDate() : comment.timestamp).toLocaleDateString()}</span>
                    ${comment.userId === currentUser?.id ? `
                        <div class="comment-menu">
                            <button class="comment-menu-btn" onclick="toggleCommentMenu('${comment.id}')">⋯</button>
                            <div class="comment-dropdown" id="commentMenu-${comment.id}">
                                <button onclick="editComment('${comment.id}', '${assetId}')">Edit</button>
                                <button onclick="deleteComment('${comment.id}', '${assetId}')">Delete</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-content" id="commentContent-${comment.id}">${comment.content}</div>
            </div>
        `).join('');
    }
}

// Generate Comment ID
function generateCommentId() {
    return 'comment_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

// Toggle Comment Menu
function toggleCommentMenu(commentId) {
    const menu = document.getElementById(`commentMenu-${commentId}`);
    document.querySelectorAll('.comment-dropdown').forEach(dropdown => {
        if (dropdown.id !== `commentMenu-${commentId}`) {
            dropdown.classList.remove('show');
        }
    });
    menu.classList.toggle('show');
}

// Edit Comment
function editComment(commentId, assetId) {
    const commentContent = document.getElementById(`commentContent-${commentId}`);
    const currentContent = commentContent.textContent;
    
    commentContent.innerHTML = `
        <input type="text" class="edit-comment-input" value="${currentContent}" maxlength="500">
        <div class="edit-comment-actions">
            <button class="btn-save" onclick="saveEditComment('${commentId}', '${assetId}')">Save</button>
            <button class="btn-cancel" onclick="cancelEditComment('${commentId}', '${currentContent}')">Cancel</button>
        </div>
    `;
    
    toggleCommentMenu(commentId);
}

// Save Edit Comment
async function saveEditComment(commentId, assetId) {
    const input = document.querySelector(`#commentContent-${commentId} .edit-comment-input`);
    const newContent = input.value.trim();
    
    if (!newContent) return;
    
    const asset = assets.find(a => a.id === assetId);
    const comment = asset.comments.find(c => c.id === commentId);
    if (comment) {
        comment.content = newContent;
        comment.edited = true;
        comment.editedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        try {
            await db.collection('assetComments').doc(commentId).update({
                content: newContent,
                edited: true,
                editedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error editing comment:', error);
        }
    }
    
    const commentContent = document.getElementById(`commentContent-${commentId}`);
    commentContent.textContent = newContent;
}

// Cancel Edit Comment
function cancelEditComment(commentId, originalContent) {
    const commentContent = document.getElementById(`commentContent-${commentId}`);
    commentContent.textContent = originalContent;
}

// Delete Comment
async function deleteComment(commentId, assetId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        const asset = assets.find(a => a.id === assetId);
        asset.comments = asset.comments.filter(c => c.id !== commentId);
        
        try {
            await db.collection('assetComments').doc(commentId).delete();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
        
        // Refresh comments
        const commentsList = document.getElementById(`commentsList-${assetId}`);
        if (commentsList) {
            commentsList.innerHTML = asset.comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${new Date(comment.timestamp?.toDate ? comment.timestamp.toDate() : comment.timestamp).toLocaleDateString()}</span>
                        ${comment.userId === currentUser?.id ? `
                            <div class="comment-menu">
                                <button class="comment-menu-btn" onclick="toggleCommentMenu('${comment.id}')">⋯</button>
                                <div class="comment-dropdown" id="commentMenu-${comment.id}">
                                    <button onclick="editComment('${comment.id}', '${assetId}')">Edit</button>
                                    <button onclick="deleteComment('${comment.id}', '${assetId}')">Delete</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="comment-content" id="commentContent-${comment.id}">${comment.content}</div>
                </div>
            `).join('');
        }
        
        toggleCommentMenu(commentId);
    }
}

// Export new functions
window.openAssetDetail = openAssetDetail;
window.toggleAssetMenu = toggleAssetMenu;
window.editAsset = editAsset;
window.deleteAsset = deleteAsset;

window.addComment = addComment;
window.toggleCommentMenu = toggleCommentMenu;
window.editComment = editComment;
window.saveEditComment = saveEditComment;
window.cancelEditComment = cancelEditComment;
window.deleteComment = deleteComment;