const PageInitializers = {
    dashboard: (customerData) => {
        const metrics = customerData.getMetrics();
        PageInitializers.shared.updateMetrics(metrics);
    },

    customerList: (customerData) => {
        const customerGrid = document.querySelector('.customer-grid');
        if (customerGrid) {
            customerGrid.innerHTML = customerData.customers.map(customer => `
                <div class="customer-card ${customer.sentiment}">
                    <h3>${customer.name}</h3>
                    <div class="customer-details">
                        <p>Email: ${customer.email}</p>
                        <p>Risk Level: <span class="status-badge status-${customer.risk.toLowerCase()}">${customer.risk}</span></p>
                        <p>Status: ${customer.status}</p>
                        <p>Last Contact: ${customer.lastContact}</p>
                        <p>Join Date: ${customer.joinDate}</p>
                        <span class="sentiment-badge ${customer.sentiment}">${customer.sentiment}</span>
                    </div>
                </div>
            `).join('');
        }
    },

    systemHealth: (customerData) => {
        const systems = customerData.customers.flatMap(c => ({
            ...c.systems[0],
            customerName: c.name,
            customerId: c.id
        }));
        
        renderSystemsTable(systems);
        PageInitializers.shared.updateMetrics(customerData.getSystemHealthMetrics());
    },

    outreach: (customerData) => {
        const atRiskCustomers = customerData.customers.filter(c => 
            c.risk === 'High' || c.risk === 'Medium'
        );
        
        renderCustomerList(atRiskCustomers);
        updateCampaignMetrics({
            total: atRiskCustomers.length,
            contacted: atRiskCustomers.filter(c => c.lastContact !== 'Never').length
        });
    },

    customerManagement: (customerData) => {
        renderCustomerGrid(customerData.customers);
        PageInitializers.shared.updateMetrics(customerData.getMetrics());
    },

    shared: {
        updateMetrics(metrics, prefix = '') {
            Object.keys(metrics).forEach(key => {
                const element = document.getElementById(prefix + key);
                if (element) {
                    element.textContent = key.includes('Rate') ? 
                        `${metrics[key]}%` : metrics[key];
                }
            });
        },

        renderTable(data, tableId, rowTemplate) {
            const tbody = document.getElementById(tableId);
            if (tbody) {
                tbody.innerHTML = data.map(rowTemplate).join('');
            }
        }
    }
};

// Initialize pages
document.addEventListener('DOMContentLoaded', () => {
    const pageName = document.body.dataset.page;
    if (pageName && PageInitializers[pageName]) {
        customerData.subscribe(pageName, PageInitializers[pageName]);
        PageInitializers[pageName](customerData);
    }
});
