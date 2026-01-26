// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate age from date of birth
 */
function calculateAge(dob) {
    if (!dob) return '-';
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return age;
}

/**
 * Format number to Indian currency
 */
function formatCurrency(amount) {
    return '₹' + (amount || 0).toLocaleString('en-IN');
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate PAN format
 */
function validatePAN(pan) {
    if (!pan) return true; // PAN is optional
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}

/**
 * Validate Aadhaar format
 */
function validateAadhaar(aadhaar) {
    if (!aadhaar) return true; // Aadhaar is optional
    const aadhaarRegex = /^[0-9]{12}$/;
    return aadhaarRegex.test(aadhaar);
}

/**
 * Save data to localStorage with error handling
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error saving to localStorage: ${error}`);
        return false;
    }
}

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
 * Clear modal form
 */
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

/**
 * Close modal when clicking outside
 */
function setupModalClickOutside(modalId, closeCallback) {
    window.addEventListener('click', function(event) {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (closeCallback) closeCallback();
            modal.classList.remove('active');
        }
    });
}

/**
 * Show notification/alert
 */
function showNotification(message, type = 'info') {
    // Simple notification - can be enhanced with a toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message); // Fallback to browser alert
}

/**
 * Confirm action before proceeding
 */
function confirmDelete(itemName = 'this item') {
    return confirm(`Are you sure you want to delete ${itemName}?`);
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
 * Switch between tabs
 */
function switchTab(tabName, tabsSelector = '.tab-content', btnsSelector = '.tab-btn') {
    document.querySelectorAll(tabsSelector).forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll(btnsSelector).forEach(btn => btn.classList.remove('active'));
    
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.classList.add('active');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Debounce function for search/input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Search in array
 */
function searchArray(array, searchTerm, searchKeys) {
    if (!searchTerm) return array;
    
    const term = searchTerm.toLowerCase();
    return array.filter(item => {
        return searchKeys.some(key => {
            const value = item[key];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

/**
 * Sort array by key
 */
function sortArray(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filter array by multiple conditions
 */
function filterArray(array, filters) {
    return array.filter(item => {
        return Object.keys(filters).every(key => {
            if (Array.isArray(filters[key])) {
                return filters[key].includes(item[key]);
            }
            return item[key] === filters[key];
        });
    });
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects
 */
function mergeObjects(target, source) {
    return { ...target, ...source };
}
