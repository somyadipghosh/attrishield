class CustomerStore {
    constructor() {
        this.customers = [];
        this.subscribers = new Set();
    }

    init(customers) {
        this.customers = customers.map(customer => ({
            ...customer,
            systemStatus: this.calculateSystemStatus(customer),
            lastCheck: new Date().toISOString(),
            contactHistory: [],
            checkHistory: []
        }));
        this.notifySubscribers();
    }

    calculateSystemStatus(customer) {
        const issues = [
            customer.reducedUsage,
            customer.systemInactive,
            customer.supportCalls
        ].filter(Boolean).length;

        if (issues >= 2) return 'Critical';
        if (issues === 1) return 'Warning';
        return 'Healthy';
    }

    addCustomer(customer) {
        const newCustomer = {
            id: this.customers.length + 1,
            ...customer,
            systemStatus: this.calculateSystemStatus(customer),
            lastCheck: new Date().toISOString(),
            contactHistory: [],
            checkHistory: []
        };
        this.customers.push(newCustomer);
        this.notifySubscribers();
        return newCustomer;
    }

    getMetrics() {
        const total = this.customers.length;
        const critical = this.customers.filter(c => c.systemStatus === 'Critical').length;
        const warning = this.customers.filter(c => c.systemStatus === 'Warning').length;
        const healthy = this.customers.filter(c => c.systemStatus === 'Healthy').length;
        const contacted = this.customers.filter(c => c.contactHistory.length > 0).length;

        return {
            totalCustomers: total,
            criticalSystems: critical,
            warningSystems: warning,
            healthySystems: healthy,
            contactedCustomers: contacted,
            retentionRate: ((total - critical) / total * 100).toFixed(1),
            responseRate: (contacted / total * 100).toFixed(1)
        };
    }

    getCustomersByStatus(status) {
        return this.customers.filter(c => c.systemStatus === status);
    }

    updateCustomer(id, updates) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers[index] = {
                ...this.customers[index],
                ...updates,
                systemStatus: this.calculateSystemStatus({
                    ...this.customers[index],
                    ...updates
                })
            };
            this.notifySubscribers();
        }
    }

    addContactRecord(customerId, record) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            customer.contactHistory.unshift({
                ...record,
                timestamp: new Date().toISOString()
            });
            this.notifySubscribers();
        }
    }

    addCheckRecord(customerId, record) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            customer.checkHistory.unshift({
                ...record,
                timestamp: new Date().toISOString()
            });
            customer.lastCheck = new Date().toISOString();
            this.notifySubscribers();
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        callback(this.getMetrics());
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    notifySubscribers() {
        const metrics = this.getMetrics();
        this.subscribers.forEach(callback => callback(metrics));
    }
}

// Create global instance
window.customerStore = new CustomerStore();

// Initialize with sample data
window.addEventListener('DOMContentLoaded', () => {
    customerStore.init([
        {
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            reducedUsage: true,
            systemInactive: false,
            supportCalls: true
        },
        {
            name: "Sarah Smith",
            email: "sarah@example.com",
            phone: "+1234567891",
            reducedUsage: false,
            systemInactive: true,
            supportCalls: false
        }
        // Add more sample customers as needed
    ]);
});
