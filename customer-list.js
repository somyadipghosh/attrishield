// Update system customers storage
let systemCustomers = JSON.parse(localStorage.getItem('systemCustomers')) || [
    { id: "CS001", name: "John Doe", systemUsage: 85, responseTime: 2.4, sentiment: "positive", isManual: false },
    { id: "CS002", name: "Jane Smith", systemUsage: 72, responseTime: 3.1, sentiment: "neutral", isManual: false },
    { id: "CS003", name: "Mike Johnson", systemUsage: 65, responseTime: 1.8, sentiment: "negative", isManual: false },
    { id: "CS004", name: "Sarah Wilson", systemUsage: 90, responseTime: 2.0, sentiment: "positive", isManual: false },
    { id: "CS005", name: "Robert Brown", systemUsage: 78, responseTime: 2.7, sentiment: "neutral", isManual: false }
];

// Initialize customer data storage
let customers = JSON.parse(localStorage.getItem('customers')) || [];

let customerToDelete = null;

function initializeCustomerList() {
    // Combine system and manual customers
    const allCustomers = [...systemCustomers, ...customers];
    displayCustomers('all');

    // Set up event listeners
    document.getElementById('addCustomerBtn').addEventListener('click', showModal);
    document.querySelector('.close').addEventListener('click', hideModal);
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmission);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayCustomers(btn.dataset.tab);
        });
    });

    // Add delete confirmation handlers
    document.getElementById('confirmDelete').addEventListener('click', () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete);
            document.getElementById('confirmModal').style.display = 'none';
            customerToDelete = null;
        }
    });

    document.getElementById('confirmCancel').addEventListener('click', () => {
        document.getElementById('confirmModal').style.display = 'none';
        customerToDelete = null;
    });

    // Close modal on outside click
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirmModal')) {
            document.getElementById('confirmModal').style.display = 'none';
            customerToDelete = null;
        }
    });

    // Improve modal handling
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('customerModal');
        const confirmModal = document.getElementById('confirmModal');
        if (e.target === modal) {
            hideModal();
        } else if (e.target === confirmModal) {
            hideDeleteConfirmation();
        }
    });

    // Add proper close button handling
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            hideModal();
            hideDeleteConfirmation();
        });
    });

    // Add ESC key handler for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal();
            hideDeleteConfirmation();
        }
    });

    // Improve modal click outside handling
    window.onclick = (e) => {
        const customerModal = document.getElementById('customerModal');
        const confirmModal = document.getElementById('confirmModal');
        
        if (e.target === customerModal) {
            hideModal();
        }
        if (e.target === confirmModal) {
            hideDeleteConfirmation();
        }
    };

    // Add event listeners for real-time risk calculation
    ['appUsage', 'responseTime'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateRiskLevel);
    });
}

function displayCustomers(filter) {
    const container = document.getElementById('customerList');
    let displayedCustomers = filter === 'manual' ? 
        customers : 
        [...systemCustomers, ...customers];

    if (displayedCustomers.length === 0) {
        container.innerHTML = `
            <div class="no-customers">
                <p>No customers to display</p>
                ${filter === 'manual' ? '<p>Click "Add New Customer" to add your first customer</p>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = displayedCustomers.map(customer => `
        <div class="customer-card ${customer.sentiment}">
            <button class="delete-btn" data-id="${customer.id}" data-type="${customer.isManual ? 'manual' : 'system'}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.5 10.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/>
                </svg>
            </button>
            <h3>${customer.name}</h3>
            <div class="customer-details">
                <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
                <p><strong>Risk Level:</strong> <span class="status-badge status-${(customer.risk || 'low').toLowerCase()}">${customer.risk || 'Low'}</span></p>
                ${renderIssues(customer)}
                <p><strong>Sentiment:</strong> <span class="sentiment-badge ${customer.sentiment}">${customer.sentiment}</span></p>
                <p class="source ${customer.isManual ? 'manual' : 'system'}">${customer.isManual ? 'Manual Entry' : 'System Entry'}</p>
                ${customer.dateAdded ? `<p><small>Added: ${new Date(customer.dateAdded).toLocaleDateString()}</small></p>` : ''}
            </div>
        </div>
    `).join('');

    // Update delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const customerId = btn.dataset.id;
            const customerType = btn.dataset.type;
            showDeleteConfirmation(customerId, customerType);
        });
    });
}

function renderIssues(customer) {
    const issues = [];
    if (customer.reducedUsage) issues.push('Reduced App Usage');
    if (customer.systemInactive) issues.push('System Inactive');
    if (customer.supportCalls) issues.push('Multiple Support Calls');
    
    return issues.length ? `
        <div class="issues">
            <h4>System Issues:</h4>
            <ul>
                ${issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
        </div>
    ` : '';
}

function showModal() {
    document.getElementById('customerModal').style.display = 'block';
    updateRiskLevel(); // Initialize risk level display
}

function hideModal() {
    document.getElementById('customerModal').style.display = 'none';
    document.getElementById('customerForm').reset();
}

function calculateRiskLevel(appUsage, responseTime, issues) {
    let riskScore = 0;
    
    // App usage scoring
    if (appUsage < 30) riskScore += 3;
    else if (appUsage < 60) riskScore += 2;
    else if (appUsage < 80) riskScore += 1;

    // Response time scoring
    if (responseTime > 4) riskScore += 3;
    else if (responseTime > 2) riskScore += 2;
    else if (responseTime > 1) riskScore += 1;

    // Issues scoring
    riskScore += issues.filter(Boolean).length;

    // Determine risk level
    if (riskScore >= 5) return 'High';
    if (riskScore >= 3) return 'Medium';
    return 'Low';
}

function updateRiskLevel() {
    const appUsage = parseFloat(document.getElementById('appUsage').value) || 0;
    const responseTime = parseFloat(document.getElementById('responseTime').value) || 0;
    const issues = [
        document.getElementById('reducedUsage').checked,
        document.getElementById('systemInactive').checked,
        document.getElementById('supportCalls').checked
    ];
    
    const calculatedRisk = calculateRiskLevel(appUsage, responseTime, issues);
    const riskBadge = document.getElementById('calculatedRisk');
    
    // Update calculated risk display
    riskBadge.className = 'status-badge';
    riskBadge.classList.add(`status-${calculatedRisk.toLowerCase()}`);
    riskBadge.textContent = calculatedRisk;
}

// Update form handling
function handleCustomerSubmission(event) {
    event.preventDefault();

    const appUsage = parseFloat(document.getElementById('appUsage').value);
    const responseTime = parseFloat(document.getElementById('responseTime').value);
    const manualRisk = document.getElementById('manualRisk').value;
    
    const newCustomer = {
        id: `MAN${customers.length + 1}`,
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        appUsage,
        responseTime,
        reducedUsage: document.getElementById('reducedUsage').checked,
        systemInactive: document.getElementById('systemInactive').checked,
        supportCalls: document.getElementById('supportCalls').checked,
        sentiment: document.getElementById('customerSentiment').value,
        isManual: true,
        dateAdded: new Date().toISOString(),
        risk: manualRisk || document.getElementById('calculatedRisk').textContent
    };

    // Add to customers array
    customers.push(newCustomer);
    localStorage.setItem('customers', JSON.stringify(customers));
    
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Customer added successfully';
    document.body.appendChild(successMessage);
    setTimeout(() => successMessage.remove(), 3000);
    
    hideModal();
    displayCustomers(document.querySelector('.tab-btn.active').dataset.tab);
    
    // Notify customer store of new customer
    if (window.customerStore) {
        window.customerStore.addCustomer(newCustomer);
    }
}

function showDeleteConfirmation(customerId, customerType) {
    customerToDelete = { id: customerId, type: customerType };
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.querySelector('#confirmModal p');
    confirmMessage.textContent = `Are you sure you want to delete this ${customerType} customer?`;
    confirmModal.style.display = 'block';
}

function deleteCustomer(customerData) {
    try {
        if (customerData.type === 'system') {
            systemCustomers = systemCustomers.filter(c => c.id !== customerData.id);
            localStorage.setItem('systemCustomers', JSON.stringify(systemCustomers));
        } else {
            customers = customers.filter(c => c.id !== customerData.id);
            localStorage.setItem('customers', JSON.stringify(customers));
        }
        
        showNotification(`${customerData.type.charAt(0).toUpperCase() + customerData.type.slice(1)} customer deleted successfully`, 'success');
        hideDeleteConfirmation();
        displayCustomers(document.querySelector('.tab-btn.active')?.dataset.tab || 'all');
        
        if (window.customerStore) {
            window.customerStore.notifySubscribers();
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Failed to delete customer', 'error');
    }
}

function hideDeleteConfirmation() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
    }
    customerToDelete = null;
}

// Add notification function if not exists
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCustomerList);
