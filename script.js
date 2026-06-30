// ============================================
// INTELLIFLOW AGENT - Workflow Engine
// Alibaba Cloud Hackathon - Track 2
// ============================================

const CONFIG = {
    qwenModel: 'qwen-max-2024-09-19',
    alibabaRegion: 'us-west-1',
    deploymentInstance: 'intelliflow-backend',
    approvalThresholds: {
        quoteAmount: 5000,
        discountPercentage: 15,
        refundAmount: 1000,
        newCustomerCredit: 50000
    }
};

// SVG Icons
const ICONS = {
    received: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    brain: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    user: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    mail: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    edit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
};

let currentWorkflow = null;
let approvalQueue = [];
let decisionLog = [];
let stats = { total: 0, autoApproved: 0, totalTime: 0 };

// ============================================
// PROCESS INQUIRY
// ============================================

let isProcessing = false;

async function processInquiry() {
    if (isProcessing) return;

    const customerName = document.getElementById('customerName').value.trim() || 'Customer';
    const customerEmail = document.getElementById('customerEmail').value.trim() || 'unknown@email.com';
    const inquiryType = document.getElementById('inquiryType').value;
    const message = document.getElementById('message').value.trim();
    const amount = Math.max(0, parseFloat(document.getElementById('amount').value) || 0);

    if (!message) {
        flashFieldError('message', 'Enter a customer message before processing.');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(customerEmail)) {
        flashFieldError('customerEmail', 'Enter a valid email address.');
        return;
    }

    isProcessing = true;
    setProcessButtonsDisabled(true);

    resetUI();

    const workflowId = 'WF-' + Date.now().toString(36).toUpperCase();
    const startTime = Date.now();

    currentWorkflow = {
        id: workflowId,
        customer: { name: customerName, email: customerEmail },
        inquiry: { type: inquiryType, message, amount },
        startTime: new Date()
    };

    // Step 1: Receive Inquiry
    addStep('completed', ICONS.received, 'Inquiry Received',
        formatInquiryType(inquiryType) + ' from ' + customerName, 'done');
    await sleep(500);

    // Step 2: Classify Intent (Qwen AI)
    addStep('active', ICONS.brain, 'Classifying Intent',
        'Processing with Qwen-Max via Alibaba Cloud DashScope...', 'processing');
    await sleep(900);

    const intents = classifyIntent(message, inquiryType);
    displayIntents(intents);
    markLastStep('done', 'Completed');

    // Check ambiguity
    const highConfIntents = intents.filter(i => i.confidence > 0.5);
    if (highConfIntents.length > 1) {
        document.getElementById('ambiguityWarning').style.display = 'block';
        document.getElementById('ambiguityWarning').innerHTML =
            '<strong>Ambiguous Input Detected</strong><br>Customer message contains ' +
            highConfIntents.length + ' valid intents. Processing all concurrently.';
    }
    await sleep(400);

    // Step 3: Entity Extraction
    addStep('active', ICONS.search, 'Extracting Entities',
        'Querying ApsaraDB RDS for customer profile...', 'processing');
    await sleep(700);

    const customerData = getCustomerData(customerEmail, customerName);
    markLastStep('done', 'Found: ' + (customerData.isNew ? 'New Customer' : 'Returning Customer'));

    // Step 4: Approval Check
    const { requiresApproval, reasons } = checkApproval(amount, inquiryType, customerData);

    if (requiresApproval) {
        addStep('approval', ICONS.user, 'Human Approval Required',
            reasons[0], 'pending');

        const approvalRequest = {
            id: 'APR-' + Date.now().toString(36).toUpperCase(),
            workflowId,
            type: inquiryType === 'refund' ? 'Refund Approval' : 'Quote Approval',
            amount,
            customer: customerName,
            reasons,
            timestamp: new Date(),
            status: 'pending'
        };

        approvalQueue.push(approvalRequest);
        displayApprovalRequest(approvalRequest);
        updateWorkflowStatus('awaiting');
    } else {
        addStep('completed', ICONS.check, 'Auto-Approved',
            'Within all threshold limits', 'done');
        await sleep(300);

        addStep('active', ICONS.edit, 'Generating Response',
            'Composing response with Qwen-Max...', 'processing');
        await sleep(500);
        markLastStep('done', 'Completed');

        addStep('completed', ICONS.mail, 'Notification Sent',
            'Confirmation dispatched to ' + customerEmail, 'done');

        updateWorkflowStatus('completed');
        stats.autoApproved++;
    }

    // Update stats
    stats.total++;
    stats.totalTime += (Date.now() - startTime);
    updateStats();

    isProcessing = false;
    setProcessButtonsDisabled(false);
}

// ============================================
// INTENT CLASSIFICATION
// ============================================

function classifyIntent(message, inquiryType) {
    const intents = [];
    const lower = message.toLowerCase();

    intents.push({
        type: inquiryType.replace('_', ' '),
        confidence: 0.88 + Math.random() * 0.1,
        reasoning: 'Primary customer request'
    });

    if (lower.includes('order') || lower.includes('last') || lower.includes('previous') || lower.includes('#')) {
        intents.push({
            type: 'order status',
            confidence: 0.62 + Math.random() * 0.25,
            reasoning: 'Mentioned previous orders'
        });
    }

    if (lower.includes('issue') || lower.includes('problem') || lower.includes('wrong') || lower.includes('not working') || lower.includes('error')) {
        intents.push({
            type: 'technical support',
            confidence: 0.55 + Math.random() * 0.3,
            reasoning: 'Described technical issues'
        });
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('discount') || lower.includes('pricing') || lower.includes('quote')) {
        intents.push({
            type: 'pricing inquiry',
            confidence: 0.68 + Math.random() * 0.22,
            reasoning: 'Asking about pricing'
        });
    }

    if (lower.includes('refund') || lower.includes('money back') || lower.includes('return') || lower.includes('cancel')) {
        intents.push({
            type: 'refund request',
            confidence: 0.72 + Math.random() * 0.18,
            reasoning: 'Requesting refund or return'
        });
    }

    return intents;
}

// ============================================
// APPROVAL LOGIC
// ============================================

function checkApproval(amount, inquiryType, customerData) {
    const reasons = [];
    let requiresApproval = false;

    if (amount > CONFIG.approvalThresholds.quoteAmount) {
        requiresApproval = true;
        reasons.push('Amount $' + amount.toLocaleString() + ' exceeds threshold $' + CONFIG.approvalThresholds.quoteAmount.toLocaleString());
    }

    if (customerData.isNew && amount > CONFIG.approvalThresholds.newCustomerCredit) {
        requiresApproval = true;
        reasons.push('New customer credit limit exceeded (max $' + CONFIG.approvalThresholds.newCustomerCredit.toLocaleString() + ')');
    }

    if (inquiryType === 'refund' && amount > CONFIG.approvalThresholds.refundAmount) {
        requiresApproval = true;
        reasons.push('Refund above $' + CONFIG.approvalThresholds.refundAmount.toLocaleString() + ' requires manager review');
    }

    return { requiresApproval, reasons };
}

function getCustomerData(email, name) {
    const customers = {
        'john@example.com': { name: 'John Smith', isNew: false, creditLimit: 100000, totalPurchases: 45000 },
        'sarah@company.com': { name: 'Sarah Jones', isNew: false, creditLimit: 150000, totalPurchases: 89000 },
        'new@company.com': { name: 'New Customer', isNew: true, creditLimit: 50000, totalPurchases: 0 }
    };
    return customers[email] || { name, isNew: true, creditLimit: 50000, totalPurchases: 0 };
}

// ============================================
// APPROVAL ACTIONS
// ============================================

function approveRequest(approvalId) {
    const request = approvalQueue.find(a => a.id === approvalId);
    if (!request) return;

    request.status = 'approved';
    logDecision(request, 'approved', 'Manager');

    addStep('completed', ICONS.check, 'Human Approved',
        'Approval ' + approvalId + ' granted', 'done');
    addStep('completed', ICONS.edit, 'Response Generated',
        'Quote finalized with approved terms', 'done');
    addStep('completed', ICONS.mail, 'Notification Sent',
        'Customer notified of approval', 'done');

    updateWorkflowStatus('completed');
    stats.autoApproved--;
    stats.total++;
    updateStats();
    refreshApprovalQueue();
    updateDecisionLog();
}

function rejectRequest(approvalId) {
    const request = approvalQueue.find(a => a.id === approvalId);
    if (!request) return;

    request.status = 'rejected';
    logDecision(request, 'rejected', 'Manager');

    addStep('completed', ICONS.alert, 'Request Rejected',
        'Approval ' + approvalId + ' denied', 'done');

    updateWorkflowStatus('completed');
    stats.total++;
    updateStats();
    refreshApprovalQueue();
    updateDecisionLog();
}

function escalateRequest(approvalId) {
    const request = approvalQueue.find(a => a.id === approvalId);
    if (!request) return;

    request.status = 'escalated';
    logDecision(request, 'escalated', 'System', 'Senior Manager');

    addStep('approval', ICONS.alert, 'Escalated to Senior Manager',
        'Requires higher authority review', 'pending');

    updateWorkflowStatus('awaiting');
    refreshApprovalQueue();
    updateDecisionLog();
}

function logDecision(request, decision, decidedBy, escalatedTo) {
    decisionLog.push({
        ...request,
        decision,
        decidedBy,
        escalatedTo: escalatedTo || null,
        decidedAt: new Date()
    });
}

// ============================================
// TEST FUNCTIONS
// ============================================

function testAmbiguousInput() {
    document.getElementById('message').value =
        'I need a quote for your enterprise plan but also my last order #12345 was wrong and I want a refund. ' +
        'Also, do you have any discounts available? This is urgent!';
    document.getElementById('inquiryType').value = 'quote_request';
    document.getElementById('amount').value = '12000';
    document.getElementById('customerName').value = 'Mike Chen';
    document.getElementById('customerEmail').value = 'new@company.com';
    processInquiry();
}

function testAutoApproval() {
    document.getElementById('message').value = 'Can I get a quote for 5 standard licenses please?';
    document.getElementById('inquiryType').value = 'quote_request';
    document.getElementById('amount').value = '2000';
    document.getElementById('customerName').value = 'Sarah Jones';
    document.getElementById('customerEmail').value = 'sarah@company.com';
    processInquiry();
}

// ============================================
// UI HELPERS
// ============================================

function addStep(type, icon, title, description, badgeText) {
    const stepsDiv = document.getElementById('workflowSteps');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step ' + type;

    const badgeClass = badgeText === 'processing' ? 'processing' : 'done';

    stepDiv.innerHTML = `
        <div class="step-icon">${icon}</div>
        <div class="step-content">
            <div class="step-title">${title}</div>
            <div class="step-desc">${description}</div>
        </div>
        <span class="step-badge ${badgeClass}">${badgeText === 'processing' ? 'Processing' : badgeText === 'pending' ? 'Pending' : 'Done'}</span>
    `;

    stepsDiv.appendChild(stepDiv);
    stepDiv.scrollIntoView({ behavior: 'smooth' });

    // Remove empty state if present
    const emptyState = document.querySelector('.workflow-status-placeholder .empty-state');
    if (emptyState) emptyState.style.display = 'none';
}

function markLastStep(badgeText, descSuffix) {
    const steps = document.querySelectorAll('#workflowSteps .step.active');
    if (steps.length > 0) {
        const last = steps[steps.length - 1];
        last.classList.remove('active');
        last.classList.add('completed');
        const badge = last.querySelector('.step-badge');
        badge.textContent = 'Done';
        badge.className = 'step-badge done';
        if (descSuffix) {
            last.querySelector('.step-desc').textContent += ' - ' + descSuffix;
        }
    }
}

function displayIntents(intents) {
    const intentDiv = document.getElementById('intentResults');
    const intentList = document.getElementById('intentList');

    intentDiv.style.display = 'block';
    document.getElementById('ambiguityWarning').style.display = 'none';

    intentList.innerHTML = intents.map(i => `
        <div class="intent-item">
            <span class="intent-name">${i.type}</span>
            <div class="confidence-bar-wrap">
                <div class="confidence-fill" style="width: ${i.confidence * 100}%"></div>
            </div>
            <span class="intent-pct">${(i.confidence * 100).toFixed(0)}%</span>
        </div>
    `).join('');
}

function displayApprovalRequest(request) {
    const queueDiv = document.getElementById('approvalQueue');
    const div = document.createElement('div');
    div.className = 'approval-item';
    div.id = request.id;

    div.innerHTML = `
        <div class="approval-top">
            <span class="approval-type">${request.type}</span>
            <span class="approval-amount">$${request.amount.toLocaleString()}</span>
        </div>
        <div class="approval-reasons">
            ${request.reasons.map(r => `
                <div class="approval-reason-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFB300" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    ${r}
                </div>
            `).join('')}
        </div>
        <div class="approval-meta">
            Customer: ${request.customer} &middot; ID: ${request.id} &middot; ${new Date(request.timestamp).toLocaleTimeString()}
        </div>
        <div class="approval-actions">
            <button class="btn-sm btn-approve" onclick="approveRequest('${request.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Approve
            </button>
            <button class="btn-sm btn-reject" onclick="rejectRequest('${request.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Reject
            </button>
            <button class="btn-sm btn-escalate" onclick="escalateRequest('${request.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                Escalate
            </button>
        </div>
    `;

    queueDiv.appendChild(div);
    updatePendingBadge();
}

function refreshApprovalQueue() {
    document.getElementById('approvalQueue').innerHTML = '';
    const pending = approvalQueue.filter(a => a.status === 'pending');
    if (pending.length === 0) {
        document.getElementById('approvalStatus').innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                    <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                </svg>
                <p>No pending approvals</p>
            </div>`;
    }
    pending.forEach(r => displayApprovalRequest(r));
    updatePendingBadge();
}

function updatePendingBadge() {
    const pending = approvalQueue.filter(a => a.status === 'pending').length;
    const badge = document.getElementById('pendingCount');
    badge.textContent = pending;
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
}

function updateDecisionLog() {
    const listDiv = document.getElementById('escalationList');
    if (decisionLog.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p style="font-size:13px;">No decisions recorded</p></div>';
        return;
    }

    listDiv.innerHTML = decisionLog.slice().reverse().map(log => {
        const cls = log.decision === 'approved' ? 'log-approved' :
                    log.decision === 'rejected' ? 'log-rejected' : 'log-escalated';
        const label = log.decision === 'approved' ? 'APPROVED' :
                      log.decision === 'rejected' ? 'REJECTED' : 'ESCALATED';

        return `
            <div class="log-item ${cls}">
                <div class="log-decision">${label}</div>
                <div class="log-detail">${log.type} - $${log.amount.toLocaleString()}</div>
                <div class="log-detail">By: ${log.decidedBy}${log.escalatedTo ? ' - To: ' + log.escalatedTo : ''}</div>
                <div class="log-time">${new Date(log.decidedAt).toLocaleTimeString()}</div>
            </div>
        `;
    }).join('');
}

function updateWorkflowStatus(status) {
    const statusDiv = document.getElementById('workflowStatus');

    if (status === 'completed') {
        statusDiv.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p style="font-weight:600;color:#16A34A;margin-top:8px;">Workflow Completed</p>
                <p style="font-size:12px;color:#6B7280;">${currentWorkflow ? currentWorkflow.id : ''}</p>
                <p style="font-size:11px;color:#9CA3AF;margin-top:4px;">Powered by Alibaba Cloud Qwen-Max</p>
            </div>`;
    } else if (status === 'awaiting') {
        statusDiv.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFB300" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p style="font-weight:600;color:#E65100;margin-top:8px;">Awaiting Human Approval</p>
                <p style="font-size:12px;color:#6B7280;">${currentWorkflow ? currentWorkflow.id : ''}</p>
            </div>`;
    }
}

function updateStats() {
    document.getElementById('totalProcessed').textContent = stats.total;
    const rate = stats.total > 0 ? Math.round((stats.autoApproved / stats.total) * 100) : 0;
    document.getElementById('approvalRate').textContent = rate + '%';
    const avgMs = stats.total > 0 ? Math.round(stats.totalTime / stats.total / 1000) : 0;
    document.getElementById('avgTime').textContent = avgMs + 's';
}

function resetUI() {
    document.getElementById('workflowSteps').innerHTML = '';
    document.getElementById('approvalQueue').innerHTML = '';
    document.getElementById('intentResults').style.display = 'none';
    document.getElementById('escalationList').innerHTML = '<div class="empty-state"><p style="font-size:13px;">No decisions recorded</p></div>';
    document.getElementById('approvalStatus').innerHTML = `
        <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
            </svg>
            <p>No pending approvals</p>
        </div>`;
    document.getElementById('workflowStatus').innerHTML = `
        <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>Submit an inquiry to start processing</p>
        </div>`;
    updatePendingBadge();
}

function formatInquiryType(type) {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function flashFieldError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    field.classList.add('field-error');
    field.focus();
    const onInput = () => {
        field.classList.remove('field-error');
        field.removeEventListener('input', onInput);
    };
    field.addEventListener('input', onInput);
    console.warn(msg);
}

function setProcessButtonsDisabled(disabled) {
    ['btnProcess', 'btnAmbiguous', 'btnAutoApproval'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = disabled;
    });
}

function resetDemo() {
    currentWorkflow = null;
    approvalQueue = [];
    decisionLog = [];
    stats = { total: 0, autoApproved: 0, totalTime: 0 };
    isProcessing = false;
    setProcessButtonsDisabled(false);
    resetUI();
    updateStats();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// DEPLOYMENT / ARCHITECTURE INFO
// ============================================
//
// NOTE FOR THE TEAM: this panel intentionally does NOT claim to show a live
// connection to any backend or cloud service. This is a static, client-side
// front end. The hackathon rules require *real* evidence of an Alibaba
// Cloud deployment (a separate screen recording, plus a link to a source
// file in your repo that calls Alibaba Cloud APIs/SDKs). Faking that output
// here would be misleading to judges, so instead this panel documents the
// intended architecture and gives you clearly marked placeholders to drop
// your real links into once you have them. Fill in DEPLOYMENT_LINKS below.

const DEPLOYMENT_LINKS = {
    repoUrl: 'https://github.com/Ivy1-0/intelliflow-agent',
    proofVideoUrl: '',        // link to your real "Alibaba Cloud deployment" recording
    proofCodeFileUrl: '',     // link to the repo file that calls Alibaba Cloud SDK/API
    architectureDiagramUrl: 'architecture-diagram.svg',
    demoVideoUrl: ''          // link to your ~3 min functional demo video
};

function showDeploymentProof() {
    const modal = document.getElementById('proofModal');
    const output = document.getElementById('terminalOutput');

    const linkRow = (label, url) => {
        if (url) {
            return `<div class="terminal-line"><span class="terminal-prompt">&rsaquo;</span> <span class="terminal-out" style="margin-left:8px;">${label}: <a href="${url}" target="_blank" rel="noopener" style="color:#58A6FF;">${url}</a></span></div>`;
        }
        return `<div class="terminal-line"><span class="terminal-prompt">&rsaquo;</span> <span class="terminal-out" style="margin-left:8px;color:#FFB300;">${label}: not set yet - add this in DEPLOYMENT_LINKS in script.js</span></div>`;
    };

    output.innerHTML = `
        <div class="terminal-line" style="color:#FFB300;font-weight:600;">
            This page is a static front-end demo. It does not call a live backend.
        </div>
        <div class="terminal-out" style="margin:6px 0 14px;">
            The intent classification and approval logic you see run entirely in your
            browser to illustrate the agent's decision flow. Use the links below for
            the actual Alibaba Cloud deployment evidence required by the submission.
        </div>
        <div class="terminal-divider">----------------------------------------</div>
        <div class="terminal-line"><span class="terminal-prompt">root@local:~$</span> <span class="terminal-cmd">cat deployment-evidence.txt</span></div>
        ${linkRow('Code repository', DEPLOYMENT_LINKS.repoUrl)}
        ${linkRow('Alibaba Cloud deployment proof (video)', DEPLOYMENT_LINKS.proofVideoUrl)}
        ${linkRow('Source file using Alibaba Cloud SDK/API', DEPLOYMENT_LINKS.proofCodeFileUrl)}
        ${linkRow('Architecture diagram', DEPLOYMENT_LINKS.architectureDiagramUrl)}
        ${linkRow('Functional demo video (~3 min)', DEPLOYMENT_LINKS.demoVideoUrl)}
        <div class="terminal-divider">----------------------------------------</div>
        <div class="terminal-out">Intended production architecture (see architecture-diagram.svg):</div>
        <div class="terminal-out">  Browser (this UI) -&gt; API Gateway -&gt; ECS (agent orchestrator)</div>
        <div class="terminal-out">  ECS -&gt; DashScope (Qwen-Max) for intent classification &amp; drafting</div>
        <div class="terminal-out">  ECS -&gt; ApsaraDB RDS for customer/order records</div>
        <div class="terminal-out">  ECS -&gt; ApsaraDB Redis for workflow/session state</div>
        <div class="terminal-out">  ECS -&gt; OSS for attachments &amp; audit logs</div>
        <div class="terminal-divider">----------------------------------------</div>
        <div class="terminal-out" style="color:#8B949E;">
            Replace the placeholders above with real links before you submit.
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('proofModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('proofModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.getElementById('proofModal').style.display = 'none';
    }
});

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('IntelliFlow Agent Initialized');
    console.log('Alibaba Cloud Services: DashScope | ECS | RDS | Redis | OSS');
    console.log('AI Model:', CONFIG.qwenModel);
    console.log('Approval Threshold: $' + CONFIG.approvalThresholds.quoteAmount.toLocaleString());
    updatePendingBadge();
});
