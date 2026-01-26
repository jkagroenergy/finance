// ==================== HOME PAGE JAVASCRIPT ==================== 

let sidebarOpen = true;
let entitiesData = [];

// ==================== SIDEBAR FUNCTIONS ====================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const contentWrapper = document.getElementById('contentWrapper');
    
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('visible');
        contentWrapper.classList.remove('sidebar-hidden');
    } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('visible');
        contentWrapper.classList.add('sidebar-hidden');
    }
}

function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    submenu.classList.toggle('active');
}

function navigateTo(page) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
    
    // Remove active class from menu items
    document.querySelectorAll('.sidebar-menu a').forEach(link => link.classList.remove('active'));
    
    // Show selected section
    const section = document.getElementById(page + '-section');
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked menu item
    const menuItem = document.querySelector(`[data-page="${page}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 600) {
        sidebarOpen = false;
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('contentWrapper').classList.add('sidebar-hidden');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    
    if (window.innerWidth <= 600 && sidebarOpen && !sidebar.contains(event.target) && !toggle.contains(event.target)) {
        sidebarOpen = false;
        sidebar.classList.add('hidden');
        document.getElementById('contentWrapper').classList.add('sidebar-hidden');
    }
});

// ==================== INITIALIZATION ====================
window.addEventListener('load', function() {
    const sidebar = document.getElementById('sidebar');
    const contentWrapper = document.getElementById('contentWrapper');
    
    if (window.innerWidth <= 600) {
        sidebarOpen = false;
        sidebar.classList.add('hidden');
        contentWrapper.classList.add('sidebar-hidden');
    } else {
        sidebarOpen = true;
        sidebar.classList.add('visible');
        contentWrapper.classList.remove('sidebar-hidden');
    }
    
    // Load saved font scale
    const savedScale = localStorage.getItem('fontScale') || '0.95';
    setFontScale(parseFloat(savedScale));
    
    // Load entities for profile menu
    loadEntitiesForMenu();
    
    // Restore breadcrumb if entity was previously selected
    setTimeout(() => {
        restoreBreadcrumbOnLoad();
    }, 100);
});

// ==================== FONT SIZE CONTROL ====================
function setFontScale(scale) {
    document.documentElement.style.setProperty('--font-scale', scale);
    localStorage.setItem('fontScale', scale);
    
    // Apply zoom to entire document for consistent scaling
    document.body.style.zoom = scale;
    
    // Apply to all iframes
    document.querySelectorAll('iframe').forEach(frame => {
        try {
            if (frame.contentDocument) {
                frame.contentDocument.documentElement.style.setProperty('--font-scale', scale);
                frame.contentDocument.body.style.zoom = scale;
            }
        } catch (e) {
            // Cross-origin iframe - will use its own font scale
        }
    });
}

function increaseFont() {
    const current = parseFloat(localStorage.getItem('fontScale') || '0.95');
    const newScale = Math.min(current + 0.05, 1.25);
    setFontScale(newScale);
}

function decreaseFont() {
    const current = parseFloat(localStorage.getItem('fontScale') || '0.95');
    const newScale = Math.max(current - 0.05, 0.75);
    setFontScale(newScale);
}

function resetFont() {
    setFontScale(0.95);
}

// ==================== PROFILE MENU FUNCTIONS ====================
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
}

function closeProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.remove('active');
}

// Close profile dropdown when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.querySelector('.profile-menu');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileMenu && !profileMenu.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// ==================== ENTITY MENU FUNCTIONS ====================
function loadEntitiesForMenu() {
    const entities = loadFromLocalStorage('fincentEntities', []);
    entitiesData = entities;
    updateEntityMenu();
}

function updateEntityMenu() {
    const entityContainer = document.getElementById('entitySwitcher');
    
    if (!entityContainer) return;
    
    if (entitiesData.length === 0) {
        entityContainer.innerHTML = '<div class="no-entities-text">No entities created yet</div>';
        return;
    }
    
    const entityItems = entitiesData.map(entity => {
        const typeLabel = getEntityTypeLabel(entity.type);
        const icon = getEntityIcon(entity.type);
        
        return `
            <a href="#" class="entity-item" onclick="selectEntity('${entity.id}', event)">
                <span class="entity-item-icon">${icon}</span>
                <span class="entity-item-name">${entity.name}</span>
                <span class="entity-item-type">${typeLabel}</span>
            </a>
        `;
    }).join('');
    
    entityContainer.innerHTML = entityItems;
}

function selectEntity(entityId, event) {
    event.preventDefault();
    localStorage.setItem('selectedEntity', entityId);
    
    // Close profile dropdown
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    // Update breadcrumb
    const entity = entitiesData.find(e => e.id === entityId);
    if (entity) {
        updateBreadcrumb(entity);
        showNotification(`Selected: ${entity.name}`, 'success');
    }
}

function updateBreadcrumb(entity) {
    const breadcrumb = document.getElementById('entityBreadcrumb');
    const entityNameEl = document.getElementById('breadcrumbEntityName');
    const entityTypeEl = document.getElementById('breadcrumbEntityType');
    
    if (breadcrumb && entityNameEl && entityTypeEl) {
        entityNameEl.textContent = entity.name;
        entityTypeEl.textContent = getEntityTypeLabel(entity.type);
        breadcrumb.style.display = 'flex';
    }
}

function clearEntitySelection() {
    localStorage.removeItem('selectedEntity');
    const breadcrumb = document.getElementById('entityBreadcrumb');
    if (breadcrumb) breadcrumb.style.display = 'none';
    showNotification('Entity selection cleared', 'info');
}

function restoreBreadcrumbOnLoad() {
    const selectedEntityId = localStorage.getItem('selectedEntity');
    if (selectedEntityId) {
        const entity = entitiesData.find(e => e.id === selectedEntityId);
        if (entity) {
            updateBreadcrumb(entity);
        }
    }
}

function openEntityManagement(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Close profile dropdown immediately
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    // Navigate using navigateTo function which uses iframes
    navigateTo('entity-family');
}

// ==================== CHANGE PASSWORD MODAL ====================
function openChangePasswordModal(e) {
    if (e) e.preventDefault();
    document.getElementById('changePasswordModal').classList.add('active');
    document.getElementById('profileDropdown').classList.remove('active');
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('active');
    clearPasswordForm();
}

function clearPasswordForm() {
    const modal = document.getElementById('changePasswordModal');
    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });
    const errors = modal.querySelectorAll('.error-message');
    errors.forEach(error => error.classList.remove('show'));
}

function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;

    if (newPassword.length < 8) {
        showPasswordError('newPassword', 'Password must be at least 8 characters');
        isValid = false;
    }

    if (newPassword !== confirmPassword) {
        showPasswordError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    if (isValid) {
        // Store new password
        const user = JSON.parse(localStorage.getItem('fincentUser') || '{}');
        user.password = newPassword;
        localStorage.setItem('fincentUser', JSON.stringify(user));
        
        showNotification('Password changed successfully!', 'success');
        closeChangePasswordModal();
    }
}

function showPasswordError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorDiv = input.nextElementSibling;
    input.classList.add('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function logout() {
    // Clear user session if needed
    localStorage.removeItem('currentUser');
    // Redirect to landing page
    window.location.href = '../index.html';
}

// ==================== MODAL FUNCTIONS ====================
function closeModal() {
    closeChangePasswordModal();
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeChangePasswordModal();
    }
});

// Close modal on background click
document.addEventListener('click', function(e) {
    const modal = document.getElementById('changePasswordModal');
    if (modal && e.target === modal) {
        closeChangePasswordModal();
    }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Load data from localStorage with error handling
 */
function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error loading from localStorage: ${error}`);
        return defaultValue;
    }
}

/**
 * Get entity type icon
 */
function getEntityIcon(entityType) {
    const icons = {
        individual: '👤',
        spouse: '💑',
        family: '👨‍👩‍👧‍👦',
        huf: '🏠',
        joint: '🤝',
        business: '🏢'
    };
    return icons[entityType] || '💼';
}

/**
 * Get entity type label
 */
function getEntityTypeLabel(entityType) {
    const labels = {
        individual: 'Individual',
        spouse: 'Spouse',
        family: 'Family',
        huf: 'HUF',
        joint: 'Joint',
        business: 'Business'
    };
    return labels[entityType] || 'Unknown';
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Simple notification - can be enhanced with a toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

// ==================== REFRESH ENTITIES WHEN RETURNING FROM ENTITY MANAGEMENT ====================
// This function can be called when returning from entity-family-management page
function refreshEntitiesMenu() {
    loadEntitiesForMenu();
}

// Listen for storage changes (when another tab/window updates entities)
window.addEventListener('storage', function(e) {
    if (e.key === 'fincentEntities') {
        loadEntitiesForMenu();
    }
});
