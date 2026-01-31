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
    // mappings UI removed from markup — only display if container exists
    if (document.getElementById('mappingsContainer')) displayMappings();
}

function loadAllData() {
    entities = loadFromLocalStorage('fincentEntities', []);
    familyMembers = loadFromLocalStorage('familyMembers', []);
    entityMappings = loadFromLocalStorage('entityMappings', []);
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
        family: entities.filter(e => e.type === 'family').length,
        huf: entities.filter(e => e.type === 'huf').length,
        business: entities.filter(e => e.type === 'business').length
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
            <div class="value">${stats.family}</div>
        </div>
        <div class="stat-card">
            <h4>HUF</h4>
            <div class="value">${stats.huf}</div>
        </div>
        <div class="stat-card">
            <h4>Business</h4>
            <div class="value">${stats.business}</div>
        </div>
    `;
}

function renderEntities() {
    const grid = document.getElementById('entitiesGrid');
    grid.innerHTML = '';

    // Render as table for better readability
    const mappingRows = entities.map(entity => {
        const mapping = entityMappings.find(m => m.entityId === entity.id);
        const memberCount = mapping && mapping.memberIds ? mapping.memberIds.length : 0;

        // Render Map Members button; disable for individual entities
        const mapBtn = entity.type === 'individual'
            ? `<button class="btn btn-secondary btn-small" disabled title="Mapping not allowed for Individual">Map Members</button>`
            : `<button class="btn btn-secondary btn-small" onclick="mapMembersToEntity('${entity.id}')">Map Members</button>`;

        return `
            <tr>
                <td><div style="display:flex; align-items:center; gap:10px;"><span>${getEntityIcon(entity.type)}</span><strong>${entity.name}</strong></div></td>
                <td>${getEntityTypeLabel(entity.type)}</td>
                <td>${memberCount}</td>
                <td>${entity.pan ? entity.pan : '-'}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary btn-small" onclick="editEntity('${entity.id}')">Edit</button>
                        ${mapBtn}
                        <button class="btn btn-danger btn-small" onclick="deleteEntity('${entity.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    grid.innerHTML = `
        <div class="entities-table-wrapper">
            <table class="entities-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Members</th>
                        <th>PAN</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${mappingRows}
                </tbody>
            </table>
        </div>
    `;

    if (entities.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No entities created yet.</p></div>';
    }
}

function openAddEntityModal() {
    editingEntityId = null;
    document.getElementById('entityModalTitle').textContent = 'Add New Entity';
    document.getElementById('entityName').value = '';
    document.getElementById('entityType').value = '';
    document.getElementById('entityPAN').value = '';
    renderEntityMembersCheckbox([]);
    openModal('entityModal');
}

function editEntity(entityId) {
    const entity = entities.find(e => e.id === entityId);
    if (!entity) return;

    editingEntityId = entityId;
    document.getElementById('entityModalTitle').textContent = 'Edit Entity';
    document.getElementById('entityName').value = entity.name;
    document.getElementById('entityType').value = entity.type;
    document.getElementById('entityPAN').value = entity.pan || '';

    const existingMapping = entityMappings.find(m => m.entityId === entityId);
    const mappedMemberIds = existingMapping ? existingMapping.memberIds : [];
    renderEntityMembersCheckbox(mappedMemberIds);
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
    const pan = (document.getElementById('entityPAN') && document.getElementById('entityPAN').value.trim()) || '';
    const selectedCheckboxes = document.querySelectorAll('#entityMembersList input[type="checkbox"]:checked');
    const memberIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (!name || !type) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    let entityId;
    if (editingEntityId) {
        const entity = entities.find(e => e.id === editingEntityId);
        if (entity) {
            entity.name = name;
            entity.type = type;
            entity.pan = pan;
            entityId = entity.id;
        }
    } else {
        const newEntity = {
            id: generateId(),
            name,
            type,
            pan,
            netWorth: 0,
            createdAt: new Date().toISOString()
        };
        entities.push(newEntity);
        entityId = newEntity.id;
    }

    // Update mapping for this entity
    entityMappings = entityMappings.filter(m => m.entityId !== entityId);
    if (memberIds && memberIds.length > 0) {
        entityMappings.push({
            id: generateId(),
            entityId,
            memberIds,
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

function renderEntityMembersCheckbox(selectedMemberIds = []) {
    const container = document.getElementById('entityMembersList');

    if (!container) return;

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

    container.innerHTML = `
        <table class="members-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Relationship</th>
                    <th>Age</th>
                    <th>PAN</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${familyMembers.map(member => `
                    <tr>
                        <td><strong>${member.name}</strong></td>
                        <td>${member.relationship || '-'}</td>
                        <td>${calculateAge(member.dob)}</td>
                        <td>${member.pan || '-'}</td>
                        <td><span class="status-badge ${member.active === false ? 'inactive' : ''}">${member.active === false ? 'Inactive' : 'Active'}</span></td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <button class="action-btn edit" onclick="editMember('${member.id}')">Edit</button>
                                <button class="action-btn delete" onclick="deleteMember('${member.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
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
    document.getElementById('memberDOB').value = formatISOToDDMMYYYY(member.dob) || '';
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
    const dobInput = document.getElementById('memberDOB').value.trim();
    let dobIso = '';
    if (dobInput) {
        dobIso = parseDDMMYYYYToISO(dobInput);
        if (!dobIso) {
            showNotification('Invalid Date of Birth. Use dd/mm/yyyy', 'error');
            return;
        }
    }

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
        dob: dobIso,
        gender: document.getElementById('memberGender').value,
        pan,
        aadhaar,
        isHUF: document.getElementById('memberIsHUF').checked,
        notes: document.getElementById('memberNotes').value,
        active: true
    };

    if (editingMemberId) {
        const member = familyMembers.find(m => m.id === editingMemberId);
        if (member) {
            const previousPan = member.pan || '';
            Object.assign(member, memberData);

            const newPan = memberData.pan || '';

            // Find any mapping that links this member to an individual entity
            let individualMapping = null;
            for (let m of entityMappings) {
                if (m.memberIds && m.memberIds.includes(editingMemberId)) {
                    const ent = entities.find(e => e.id === m.entityId);
                    if (ent && ent.type === 'individual') {
                        individualMapping = { mapping: m, entity: ent };
                        break;
                    }
                }
            }

            if (newPan && !individualMapping) {
                // PAN added: create individual entity and mapping
                const newEntity = {
                    id: generateId(),
                    name: memberData.name,
                    type: 'individual',
                    pan: newPan,
                    netWorth: 0,
                    createdAt: new Date().toISOString()
                };
                entities.push(newEntity);
                entityMappings.push({
                    id: generateId(),
                    entityId: newEntity.id,
                    memberIds: [editingMemberId],
                    createdAt: new Date().toISOString()
                });
            } else if (!newPan && individualMapping) {
                // PAN removed: remove mapping and entity if unused
                const entId = individualMapping.mapping.entityId;
                entityMappings = entityMappings.filter(m => m.id !== individualMapping.mapping.id);
                const stillUsed = entityMappings.some(m => m.entityId === entId);
                if (!stillUsed) {
                    entities = entities.filter(e => e.id !== entId);
                }
            } else if (newPan && individualMapping) {
                // PAN present and mapping exists: update entity details
                individualMapping.entity.name = memberData.name;
                individualMapping.entity.pan = newPan;
            }
        }
    } else {
        const newMemberId = generateId();
        familyMembers.push({
            id: newMemberId,
            ...memberData
        });

        // If PAN provided, create an individual entity and mapping
        if (memberData.pan) {
            const newEntity = {
                id: generateId(),
                name: memberData.name,
                type: 'individual',
                pan: memberData.pan || '',
                netWorth: 0,
                createdAt: new Date().toISOString()
            };
            entities.push(newEntity);

            entityMappings.push({
                id: generateId(),
                entityId: newEntity.id,
                memberIds: [newMemberId],
                createdAt: new Date().toISOString()
            });
        }
    }

    saveAllData();
    updateFamilySummary();
    displayMembers();
    displayMappings(); // Update mappings display
    updateEntitySummary();
    renderEntities();
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
    // Open the entity edit modal so user can associate members
    editEntity(entityId);
}

function populateEntityDropdown() {
    // mapping UI removed - no-op
    return;
}

function renderMembersCheckbox(selectedMemberIds = []) {
    const container = document.getElementById('entityMembersList');
    if (!container) return;

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
    // mapping modal removed
    editingMappingId = null;
}

function handleMappingSubmit(e) {
    // mapping modal removed - no-op
    return;
}

function displayMappings() {
    // mappings UI removed - no-op
    return;
}

function deleteMapping(mappingId) {
    // mappings UI removed - no-op
    return;
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
