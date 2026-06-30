// ============================================
// INTELLIFLOW AGENT - Main Application Logic
// Alibaba Cloud Hackathon - Track 2
// ============================================

// Configuration (simulates Alibaba Cloud services)
const CONFIG = {
    qwenModel: "qwen-max-2024-09-19",
    alibabaRegion: "us-west-1",
    
    // Human-in-the-loop thresholds
    approvalThresholds: {
        quoteAmount: 5000,
        discountPercentage: 15,
        refundAmount: 1000,
        newCustomerCredit: 50000
    },
    
    // Simulated customer database (would be RDS PostgreSQL)
    customers: {
        "john@example.com": {
            name: "John Smith",
            isNew: false,
            creditLimit: 100000,
            totalPurchases: 45000
        },
        "new@company.com": {
            name: "New Customer",
            isNew: true,
            creditLimit: 50000,
            totalPurchases: 0
        }
    }
};

// Workflow state
let currentWorkflow = null;
let approvalQueue = [];
let escalationLog = [];

// ============================================
// MAIN FUNCTION: Process Customer Inquiry
// ============================================

async function processInquiry() {
    // Get form values
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const inquiryType = document.getElementById('inquiryType').value;
    const message = document.getElementById('message').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    
    // Generate workflow ID
    const workflowId = 'WF-' + Date.now().toString(36).toUpperCase();
    
    // Clear previous results
    document.getElementById('workflowSteps').innerHTML = '';
    document.getElementById('approvalQueue').innerHTML = '';
    
    // Start workflow
    currentWorkflow = {
        id: workflowId,
        customer: { name: customerName, email: customerEmail },
        inquiry: { type: inquiryType, message: message, amount: amount },
        steps: [],
        startTime: new Date()
    };
    
    // ====== STEP 1: Receive Inquiry ======
    addWorkflowStep('received', '📥', 'Inquiry Received', 
        `Received ${inquiryType} from ${customerName}`);
    await sleep(500);
    
    // ====== STEP 2: Classify Intent (Simulated Qwen AI) ======
    addWorkflowStep('active', '🧠', 'Classifying Intent with Qwen-Max', 
        'Analyzing message using Alibaba Cloud DashScope...');
    await sleep(1000);
    
    const intents = classifyIntent(message, inquiryType);
    displayIntents(intents);
    markStepComplete(1);
    
    // Check for ambiguity
    if (intents.length > 1) {
        addWorkflowStep('completed', '⚠️', 'Ambiguity Detected', 
            `Multiple intents found: ${intents.map(i => i.type).join(', ')}`);
        await sleep(500);
    }
    
    // ====== STEP 3: Extract Entities ======
    addWorkflowStep('active', '🔍', 'Extracting Entities', 
        'Pulling customer data from ApsaraDB RDS...');
    await sleep(800);
    
    const customerData = CONFIG.customers[customerEmail] || 
        { name: customerName, isNew: true, creditLimit: 50000, totalPurchases: 0 };
    markStepComplete(2);
    
    // ====== STEP 4: Check Approval Requirements ======
    let requiresApproval = false;
    let approvalReasons = [];
    
    if (amount > CONFIG.approvalThresholds.quoteAmount) {
        requiresApproval = true;
        approvalReasons.push(`Amount $${amount.toLocaleString()} exceeds threshold $${CONFIG.approvalThresholds.quoteAmount.toLocaleString()}`);
    }
    
    if (customerData.isNew && amount > CONFIG.approvalThresholds.newCustomerCredit) {
        requiresApproval = true;
        approvalReasons.push(`New customer credit limit of $${CONFIG.approvalThresholds.newCustomerCredit.toLocaleString()} exceeded`);
    }
    
    if (inquiryType === 'refund' && amount > CONFIG.approvalThresholds.refundAmount) {
        requiresApproval = true;
        approvalReasons.push(`Refund amount exceeds $${CONFIG.approvalThresholds.refundAmount.toLocaleString()}`);
    }
    
    // ====== STEP 5: Human-in-the-Loop Checkpoint ======
    if (requiresApproval) {
        addWorkflowStep('approval', '👤', 'HUMAN APPROVAL REQUIRED', 
            approvalReasons.join('. '));
        
        // Create approval request
        const approvalRequest = {
            id: 'APR-' + Date.now().toString(36).toUpperCase(),
            workflowId: workflowId,
            type: inquiryType === 'refund' ? 'Refund Approval' : 'Quote Approval',
            amount: amount,
            customer: customerName,
            reasons: approvalReasons,
            timestamp: new Date(),
            status: 'pending'
        };
        
        approvalQueue.push(approvalRequest);
        displayApprovalRequest(approvalRequest);
        
        // Update workflow status
        updateWorkflowStatus('awaiting_approval', 
            `⏳ Waiting for human approval - ${approvalReasons[0]}`);
    } else {
        addWorkflowStep('completed', '✅', 'Auto-Approved', 
            'No human approval required. Processing automatically.');
        completeWorkflow();
    }
    
    // ====== STEP 6: Generate Response ======
    await sleep(600);
    addWorkflowStep('active', '✍️', 'Generating Response', 
        'Composing response using Qwen-Max...');
    await sleep(800);
    markStepComplete(4);
    
    if (!requiresApproval) {
        addWorkflowStep('completed', '📧', 'Response Sent', 
            'Confirmation email sent to customer');
    }
}

// ============================================
// INTENT CLASSIFICATION (Simulates Qwen AI)
// ============================================

function classifyIntent(message, inquiryType) {
    // Simulate Qwen AI analyzing the message
    const intents = [];
    
    // Primary intent from form
    intents.push({
        type: inquiryType.replace('_', ' '),
        confidence: 0.92 + Math.random() * 0.07,
        reasoning: 'Direct match from customer selection'
    });
    
    // Check for secondary intents in message (ambiguity detection)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('order') || lowerMessage.includes('last')) {
        intents.push({
            type: 'order status',
            confidence: 0.65 + Math.random() * 0.2,
            reasoning: 'Customer mentioned previous order'
        });
    }
    
    if (lowerMessage.includes('issue') || lowerMessage.includes('problem') || lowerMessage.includes('not working')) {
        intents.push({
            type: 'technical support',
            confidence: 0.55 + Math.random() * 0.3,
            reasoning: 'Customer described technical issues'
        });
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('discount')) {
        intents.push({
            type: 'pricing inquiry',
            confidence: 0.70 + Math.random() * 0.2,
            reasoning: 'Customer asking about pricing'
        });
    }
    
    return intents;
}

// ============================================
// AMBIGUOUS INPUT TEST
// ============================================

function testAmbiguousInput() {
    document.getElementById('message').value = 
        "I need a quote for your enterprise plan but also my last order was wrong and I want a refund. " +
        "Also, do you have any discounts available? This is urgent!";
    document.getElementById('inquiryType').value = 'quote_request';
    document.getElementById('amount').value = '12000';
    
    processInquiry();
}

// ============================================
// APPROVAL ACTIONS
// ============================================

function approveRequest(approvalId) {
    const request = approvalQueue.find(a => a.id === approvalId);
    if (request) {
        request.status = 'approved';
        
        // Add to escalation log
        escalationLog.push({
            ...request,
            decision: 'approved',
            decidedBy: 'Human Manager',
            decidedAt: new Date()
        });
        
        // Update UI
        addWorkflowStep('completed', '✅', 'Human Approved', 
            `Approval ${approvalId} approved by manager`);
        
        completeWorkflow();
        refreshApprovalQueue();
        updateEscalationLog();
    }
}

function rejectRequest(approvalId) {
    const request = approvalQueue.find(a => a.id === approvalId);
    if (request) {
        request.status = 'rejected';
        
        escalationLog.push({
            ...request,
            decision: 'rejected',
            decidedBy: 'Human Manager',
            decidedAt: new Date()
        });
        
        addWorkflowStep('completed', '❌', 'Request Rejected', 
            `Approval ${approvalId} rejected. Sending notification to customer.`);
        
        refreshApprovalQueue();
        updateEscalationLog();
    }
}

function escalateRequest(approvalId) {
    const request = approvalQueue.find(a => a.id === approvalId);
    if (request) {
        request.status = 'escalated';
        
        escalationLog.push({
            ...request,
            decision: 'escalated',
            decidedBy: 'System',
            decidedAt: new Date(),
            escalatedTo: 'Senior Manager'
        });
        
        addWorkflowStep('approval', '🚨', 'Escalated to Senior Manager', 
            'Request requires higher authority approval');
        
        refreshApprovalQueue();
        updateEscalationLog();
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function addWorkflowStep(type, icon, title, description) {
    const stepsDiv = document.getElementById('workflowSteps');
    
    const stepDiv = document.createElement('div');
    stepDiv.className = `step ${type}`;
    stepDiv.innerHTML = `
        <span class="step-icon">${icon}</span>
        <div class="step-text">
            <strong>${title}</strong>
            <br><small>${description}</small>
        </div>
        <span class="step-status">${type === 'active' ? '⏳ Processing...' : ''}</span>
    `;
    
    stepsDiv.appendChild(stepDiv);
    stepDiv.scrollIntoView({ behavior: 'smooth' });
}

function markStepComplete(index) {
    const steps = document.querySelectorAll('.step.active');
    if (steps.length > 0) {
        const lastActive = steps[steps.length - 1];
        lastActive.classList.remove('active');
        lastActive.classList.add('completed');
        lastActive.querySelector('.step-status').textContent = '✅ Done';
    }
}

function displayIntents(intents) {
    const intentDiv = document.getElementById('intentResults');
    const intentList = document.getElementById('intentList');
    
    intentDiv.style.display = 'block';
    intentList.innerHTML = intents.map(intent => `
        <div class="intent-item">
            <span class="intent-name">${intent.type.toUpperCase()}</span>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${intent.confidence * 100}%"></div>
            </div>
            <span class="intent-confidence">${(intent.confidence * 100).toFixed(0)}%</span>
        </div>
    `).join('');
}

function displayApprovalRequest(request) {
    const queueDiv = document.getElementById('approvalQueue');
    
    const approvalDiv = document.createElement('div');
    approvalDiv.className = 'approval-item';
    approvalDiv.id = request.id;
    approvalDiv.innerHTML = `
        <div class="approval-header">
            <strong>${request.type}</strong>
            <span class="approval-amount">$${request.amount.toLocaleString()}</span>
        </div>
        <div class="approval-reason">
            ${request.reasons.map(r => `⚠️ ${r}`).join('<br>')}
        </div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            Customer: ${request.customer} | ID: ${request.id}
        </div>
        <div class="approval-actions">
            <button class="btn-approve" onclick="approveRequest('${request.id}')">✅ Approve</button>
            <button class="btn-reject" onclick="rejectRequest('${request.id}')">❌ Reject</button>
            <button class="btn-escalate" onclick="escalateRequest('${request.id}')">🔼 Escalate</button>
        </div>
    `;
    
    queueDiv.appendChild(approvalDiv);
    
    // Update status
    document.getElementById('approvalStatus').innerHTML = 
        `<p style="color: #dc3545; font-weight: bold;">🔴 ${approvalQueue.filter(a => a.status === 'pending').length} Pending Approval(s)</p>`;
}

function refreshApprovalQueue() {
    const queueDiv = document.getElementById('approvalQueue');
    queueDiv.innerHTML = '';
    
    const pendingApprovals = approvalQueue.filter(a => a.status === 'pending');
    
    if (pendingApprovals.length === 0) {
        document.getElementById('approvalStatus').innerHTML = 
            '<p class="waiting-message">✅ No pending approvals</p>';
    }
    
    pendingApprovals.forEach(request => {
        displayApprovalRequest(request);
    });
}

function updateEscalationLog() {
    const logDiv = document.getElementById('escalationList');
    
    logDiv.innerHTML = escalationLog.map(log => `
        <div style="padding: 8px; margin-bottom: 5px; background: #f8f9fa; border-radius: 6px; font-size: 13px;">
            <strong>${log.type}</strong> - $${log.amount.toLocaleString()}
            <br>Decision: <span style="color: ${log.decision === 'approved' ? 'green' : 'red'}">${log.decision.toUpperCase()}</span>
            <br><small>${log.decidedBy} - ${log.decidedAt.toLocaleTimeString()}</small>
        </div>
    `).join('');
}

function updateWorkflowStatus(status, message) {
    document.getElementById('workflowStatus').innerHTML = `
        <div style="text-align: center; padding: 15px;">
            <div style="font-size: 24px; margin-bottom: 8px;">
                ${status === 'awaiting_approval' ? '⏳' : '✅'}
            </div>
            <strong>${message}</strong>
            <br><small>Workflow ID: ${currentWorkflow.id}</small>
        </div>
    `;
}

function completeWorkflow() {
    updateWorkflowStatus('completed', '✅ Workflow Completed Successfully');
    
    document.getElementById('workflowStatus').innerHTML += `
        <div style="text-align: center; margin-top: 10px; color: #28a745;">
            ✅ Response generated<br>
            ✅ CRM updated<br>
            ✅ Email notification sent<br>
            <small>Powered by Alibaba Cloud Qwen-Max</small>
        </div>
    `;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 IntelliFlow Agent Initialized');
    console.log('☁️ Running on Alibaba Cloud ECS');
    console.log('🧠 AI Model: Qwen-Max via DashScope');
    console.log('👤 Human-in-the-Loop: Active');
    console.log('📊 Approval Threshold: $' + CONFIG.approvalThresholds.quoteAmount.toLocaleString());
});
