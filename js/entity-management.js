// Entity Management Module
let entities = [];
let familyMembers = [];
let entityMappings = []; // Maps entities to family members
let editingEntityId = null;
let editingMemberId = null;
let editingMappingId = null;

// ==================== INITIALIZATION ====================
function init() {
    loadAllData();
    updateEntitySummary();
    updateFamilySummary();
    renderEntities();
    displayMembers();
    displayMappings();
}

function loadAllData() {
    entities = loadFromLocalStorage('fincentEntities', []);
    familyMembers = loadFromLocalStorage('familyMembers', []);
    entityMappings = loadFromLocalStorage('entityMappings', []);

    if (entities.length === 0) {
        const defaultEntity = {
            id: generateId(),
            name: 'My Account',
            type: 'individual',
            pan: '',
            taxRegime: 'new',
            netWorth: 0,
            properties: [],
            createdAt: new Date().toISOString()
        };
        entities.push(defaultEntity);
        saveAllData();
    }
}

function saveAllData() {
    saveToLocalStorage('fincentEntities', entities);
    saveToLocalStorage('familyMembers', familyMembers);
    saveToLocalStorage('entityMappings', entityMappings);
}

// ==================== ENTITY MANAGEMENT ====================
function updateEntitySummary() {
    const stats = {
        total: entities.length,
        individual: entities.filter(e => e.type === 'individual').length,
        familyTypes: entities.filter(e => ['spouse', 'family', 'huf'].includes(e.type)).length,
        combined: entities.reduce((sum, e) => sum + (e.netWorth || 0), 0)
    };

    document.getElementById('entitySummaryStats').innerHTML = `
        <div class="stat-card">
            <h4>Total Entities</h4>
            <div class="value">${stats.total}</div>
        </div>
        <div class="stat-card">
            <h4>Individuals</h4>
            <div class="value">${stats.individual}</div>
        </div>
        <div class="stat-card">
            <h4>Family/Combined</h4>
            <div class="value">${stats.familyTypes}</div>
        </div>
        <div class="stat-card">
            <h4>Combined Net Worth</h4>
            <div class="value">${formatCurrency(stats.combined)}</div>
        </div>
    `;
}

function renderEntities() {
    const grid = document.getElementById('entitiesGrid');
    grid.innerHTML = '';

    entities.forEach(entity => {
        const mappedMembers = entityMappings.filter(m => m.entityId === entity.id);
        const memberCount = mappedMembers.length;

        const card = document.createElement('div');
        card.className = 'entity-card';
        card.innerHTML = `
            <div class="entity-icon">${getEntityIcon(entity.type)}</div>
            <div class="entity-name">${entity.name}</div>
            <div class="entity-type">${getEntityTypeLabel(entity.type)}</div>
            <div class="entity-info" style="margin-bottom: 12px;">
                PAN: ${entity.pan || 'Not Set'}<br>
                Tax: ${entity.taxRegime === 'new' ? 'New Regime' : 'Old Regime'}<br>
                Net Worth: ${formatCurrency(entity.netWorth || 0)}<br>
                <strong>Mapped Members: ${memberCount}</strong>
            </div>
            <div class="entity-actions">
                <button class="btn btn-primary btn-small" onclick="editEntity('${entity.id}')">Edit</button>
                <button class="btn btn-secondary btn-small" onclick="mapMembersToEntity('${entity.id}')">Map Members</button>
                <button class="btn btn-danger btn-small" onclick="deleteEntity('${entity.id}')">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });

    if (entities.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No entities created yet.</p></div>';
    }
}

function openAddEntityModal() {
    editingEntityId = null;
    document.getElementById('entityModalTitle').textContent = 'Add New Entity';
    document.getElementById('entityName').value = '';
    document.getElementById('entityType').value = '';
    document.getElementById('entityPan').value = '';
    document.getElementById('entityTaxRegime').value = 'new';
    document.querySelectorAll('#entityModal input[type="checkbox"]').forEach(cb => cb.checked = false);
    openModal('entityModal');
}

function editEntity(entityId) {
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return;

    editingEntityId = entityId;
    document.getElementById('entityModalTitle').textContent = 'Edit Entity';
    document.getElementById('entityName').value = entity.name;
    document.getElementById('entityType').value = entity.type;
    document.getElementById('entityPan').value = entity.pan || '';
    document.getElementById('entityTaxRegime').value = entity.taxRegime || 'new';

    document.querySelectorAll('#entityModal input[type="checkbox"]').forEach(cb => {
        cb.checked = entity.properties && entity.properties.includes(cb.value);
    });

    openModal('entityModal');
}

function closeEntityModal() {
    closeModal('entityModal');
    editingEntityId = null;
}

function handleEntitySubmit(e) {
    e.preventDefault();

    const name = document.getElementById('entityName').value.trim();
    const type = document.getElementById('entityType').value;
    const pan = document.getElementById('entityPan').value.trim();
    const taxRegime = document.getElementById('entityTaxRegime').value;
    const properties = Array.from(document.querySelectorAll('#entityModal input[type="checkbox"]:checked')).map(cb => cb.value);

    if (!name || !type) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (pan && !validatePAN(pan)) {
        showNotification('Invalid PAN format', 'error');
        return;
    }

    if (editingEntityId) {
        const entity = entities.find(e => e.id === editingEntityId);
        if (entity) {
            entity.name = name;
            entity.type = type;
            entity.pan = pan;
            entity.taxRegime = taxRegime;
            entity.properties = properties;
        }
    } else {
        entities.push({
            id: generateId(),
            name,
            type,
            pan,
            taxRegime,
            properties,
            netWorth: 0,
            createdAt: new Date().toISOString()
        });
    }

    saveAllData();
    updateEntitySummary();
    renderEntities();
    closeEntityModal();
    showNotification(editingEntityId ? 'Entity updated successfully!' : 'Entity created successfully!', 'success');
}

function deleteEntity(entityId) {
    if (!confirmDelete('this entity')) return;

    entities = entities.filter(e => e.id !== entityId);
    entityMappings = entityMappings.filter(m => m.entityId !== entityId);
    saveAllData();
    updateEntitySummary();
    renderEntities();
    displayMappings();
    showNotification('Entity deleted successfully!', 'success');
}

function updateEntityTypeInfo() {
    const type = document.getElementById('entityType').value;
    console.log('Selected entity type:', type);
}

// ==================== FAMILY MEMBER MANAGEMENT ====================
function updateFamilySummary() {
    const stats = {
        total: familyMembers.length,
        withPAN: familyMembers.filter(m => m.pan).length,
        huf: familyMembers.filter(m => m.isHUF).length,
        active: familyMembers.filter(m => m.active !== false).length
    };

    document.getElementById('familySummaryStats').innerHTML = `
        <div class="stat-card">
            <h4>Total Members</h4>
            <div class="value">${stats.total}</div>
        </div>
        <div class="stat-card">
            <h4>With PAN</h4>
            <div class="value">${stats.withPAN}</div>
        </div>
        <div class="stat-card">
            <h4>HUF Members</h4>
            <div class="value">${stats.huf}</div>
        </div>
        <div class="stat-card">
            <h4>Active</h4>
            <div class="value">${stats.active}</div>
        </div>
    `;
}

function displayMembers() {
    const container = document.getElementById('membersContainer');

    if (familyMembers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👨‍👩‍👧‍👦</div>
                <p>No family members added yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = familyMembers.map(member => `
        <div class="family-card">
            <div class="family-header">
                <div class="family-name">${member.name}</div>
                <span class="status-badge ${member.active === false ? 'inactive' : ''}">
                    ${member.active === false ? 'Inactive' : 'Active'}
                </span>
            </div>
            <div class="family-info">
                <div class="info-item">
                    <div class="info-label">Relationship</div>
                    <div class="info-value">${member.relationship || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Age</div>
                    <div class="info-value">${calculateAge(member.dob)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">PAN</div>
                    <div class="info-value">${member.pan || '-'}</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="action-btn edit" onclick="editMember('${member.id}')">Edit</button>
                <button class="action-btn delete" onclick="deleteMember('${member.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function openAddMemberModal() {
    editingMemberId = null;
    document.getElementById('memberModalTitle').textContent = 'Add Family Member';
    clearForm('memberForm');
    openModal('memberModal');
}

function editMember(memberId) {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    editingMemberId = memberId;
    document.getElementById('memberModalTitle').textContent = 'Edit Family Member';
    document.getElementById('memberName').value = member.name;
    document.getElementById('memberRelationship').value = member.relationship || '';
    document.getElementById('memberDOB').value = member.dob || '';
    document.getElementById('memberGender').value = member.gender || '';
    document.getElementById('memberPAN').value = member.pan || '';
    document.getElementById('memberAadhaar').value = member.aadhaar || '';
    document.getElementById('memberIsHUF').checked = member.isHUF || false;
    document.getElementById('memberNotes').value = member.notes || '';
    openModal('memberModal');
}

function closeMemberModal() {
    closeModal('memberModal');
    editingMemberId = null;
}

function handleMemberSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('memberName').value.trim();
    const relationship = document.getElementById('memberRelationship').value;

    if (!name || !relationship) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const pan = document.getElementById('memberPAN').value.trim();
    const aadhaar = document.getElementById('memberAadhaar').value.trim();

    if (pan && !validatePAN(pan)) {
        showNotification('Invalid PAN format', 'error');
        return;
    }

    if (aadhaar && !validateAadhaar(aadhaar)) {
        showNotification('Aadhaar must be 12 digits', 'error');
        return;
    }

    const memberData = {
        name,
        relationship,
        dob: document.getElementById('memberDOB').value,
        gender: document.getElementById('memberGender').value,
        pan,
        aadhaar,
        isHUF: document.getElementById('memberIsHUF').checked,
        notes: document.getElementById('memberNotes').value,
        active: true
    };

    if (editingMemberId) {
        const member = familyMembers.find(m => m.id === editingMemberId);
        if (member) Object.assign(member, memberData);
    } else {
        familyMembers.push({
            id: generateId(),
            ...memberData
        });
    }

    saveAllData();
    updateFamilySummary();
    displayMembers();
    displayMappings(); // Update mappings display
    closeMemberModal();
    showNotification(editingMemberId ? 'Member updated successfully!' : 'Member created successfully!', 'success');
}

function deleteMember(memberId) {
    if (!confirmDelete('this family member')) return;

    familyMembers = familyMembers.filter(m => m.id !== memberId);
    entityMappings = entityMappings.filter(m => m.memberIds && !m.memberIds.includes(memberId));
    saveAllData();
    updateFamilySummary();
    displayMembers();
    displayMappings();
    showNotification('Member deleted successfully!', 'success');
}

// ==================== ENTITY-FAMILY MAPPINGS ====================
function openMappingModal() {
    editingMappingId = null;
    document.getElementById('mappingModalTitle').textContent = 'Map Family Members to Entity';
    populateEntityDropdown();
    renderMembersCheckbox([]);
    openModal('mappingModal');
}

function mapMembersToEntity(entityId) {
    editingMappingId = null;
    document.getElementById('mappingModalTitle').textContent = 'Map Family Members to Entity';
    
    const select = document.getElementById('mappingEntity');
    select.value = entityId;
    
    const existingMapping = entityMappings.find(m => m.entityId === entityId);
    const mappedMemberIds = existingMapping ? existingMapping.memberIds : [];
    
    renderMembersCheckbox(mappedMemberIds);
    openModal('mappingModal');
}

function populateEntityDropdown() {
    const select = document.getElementById('mappingEntity');
    select.innerHTML = '<option value="">-- Select Entity --</option>';
    entities.forEach(entity => {
        const option = document.createElement('option');
        option.value = entity.id;
        option.textContent = entity.name;
        select.appendChild(option);
    });
}

function renderMembersCheckbox(selectedMemberIds = []) {
    const container = document.getElementById('membersList');

    if (familyMembers.length === 0) {
        container.innerHTML = '<p class="no-members-text">No family members available. Please add family members first.</p>';
        return;
    }

    container.innerHTML = familyMembers.map(member => `
        <label class="member-checkbox-item">
            <input type="checkbox" value="${member.id}" ${selectedMemberIds.includes(member.id) ? 'checked' : ''}>
            <div class="member-checkbox-info">
                <div class="member-checkbox-name">${member.name}</div>
                <div class="member-checkbox-relation">${member.relationship} ${member.dob ? '• Age: ' + calculateAge(member.dob) : ''}</div>
            </div>
            ${member.pan ? '<span style="font-size: 11px; color: #64748b;">PAN: ' + member.pan + '</span>' : ''}
        </label>
    `).join('');
}

function closeMappingModal() {
    closeModal('mappingModal');
    editingMappingId = null;
}

function handleMappingSubmit(e) {
    e.preventDefault();

    const entityId = document.getElementById('mappingEntity').value;
    const selectedCheckboxes = document.querySelectorAll('#membersList input[type="checkbox"]:checked');
    const memberIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!entityId) {
        showNotification('Please select an entity', 'error');
        return;
    }

    if (memberIds.length === 0) {
        showNotification('Please select at least one family member', 'error');
        return;
    }

    // Remove existing mapping for this entity
    entityMappings = entityMappings.filter(m => m.entityId !== entityId);

    // Add new mapping
    entityMappings.push({
        id: generateId(),
        entityId,
        memberIds,
        createdAt: new Date().toISOString()
    });

    saveAllData();
    renderEntities(); // Update entity card with member count
    displayMappings();
    closeMappingModal();
    showNotification('Entity-Family mapping saved successfully!', 'success');
}

function displayMappings() {
    const container = document.getElementById('mappingsContainer');

    if (entityMappings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No entity-family mappings created yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = entityMappings.map(mapping => {
        const entity = entities.find(e => e.id === mapping.entityId);
        const members = familyMembers.filter(m => mapping.memberIds.includes(m.id));

        if (!entity) return '';

        return `
            <div class="family-card">
                <div class="family-header">
                    <div class="family-name">${getEntityIcon(entity.type)} ${entity.name}</div>
                    <div>
                        <button class="action-btn edit" onclick="mapMembersToEntity('${entity.id}')">Edit</button>
                        <button class="action-btn delete" onclick="deleteMapping('${mapping.id}')">Delete</button>
                    </div>
                </div>
                <div class="entity-mapping-section">
                    <div class="entity-mapping-title">Mapped Family Members (${members.length})</div>
                    <div class="mapped-members">
                        ${members.length > 0 ? members.map(m => `
                            <div class="member-tag">
                                ${m.name} (${m.relationship})
                            </div>
                        `).join('') : '<span class="no-members-text">No members mapped</span>'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function deleteMapping(mappingId) {
    if (!confirmDelete('this mapping')) return;

    entityMappings = entityMappings.filter(m => m.id !== mappingId);
    saveAllData();
    renderEntities();
    displayMappings();
    showNotification('Mapping deleted successfully!', 'success');
}

// ==================== PAN STATUS ====================
function displayPANTable() {
    const tbody = document.getElementById('panTableBody');
    let allRecords = [];

    entities.forEach(entity => {
        allRecords.push({
            type: 'Entity',
            name: entity.name,
            details: getEntityTypeLabel(entity.type),
            pan: entity.pan || 'Not Provided',
            status: entity.pan ? 'Submitted' : 'Pending'
        });
    });

    familyMembers.forEach(member => {
        allRecords.push({
            type: 'Member',
            name: member.name,
            details: member.relationship,
            pan: member.pan || 'Not Provided',
            status: member.pan ? 'Submitted' : 'Pending'
        });
    });

    tbody.innerHTML = allRecords.map(record => `
        <tr>
            <td>${record.type}</td>
            <td>${record.name}</td>
            <td>${record.details}</td>
            <td><strong>${record.pan}</strong></td>
            <td><span class="status-badge ${record.status === 'Pending' ? 'inactive' : ''}">${record.status}</span></td>
        </tr>
    `).join('');
}

// ==================== TAB SWITCHING ====================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (tabName === 'pan-status') {
        displayPANTable();
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', init);
