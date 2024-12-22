// Define initial customers data
const INITIAL_CUSTOMERS = [
    {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        risk: "High",
        phone: "+1234567890",
        status: "Active",
        trigger: "Low System Usage",
        lastContact: "15 days ago",
        sentiment: "negative",
        joinDate: "2023-01-15",
        systemId: "SYS001"
    },
    {
        id: 2,
        name: "Sarah Smith",
        email: "sarah.smith@example.com",
        risk: "Medium",
        phone: "+1234567891",
        status: "Active",
        trigger: "Payment Delay",
        lastContact: "5 days ago",
        sentiment: "neutral",
        joinDate: "2023-02-20",
        systemId: "SYS002"
    },
    {
        id: 3,
        name: "Robert Johnson",
        email: "robert.j@example.com",
        risk: "High",
        phone: "+1234567892",
        status: "Active",
        trigger: "System Inactive",
        lastContact: "7 days ago",
        sentiment: "negative",
        joinDate: "2023-03-10",
        systemId: "SYS003"
    },
    {
        id: 4,
        name: "Emily Brown",
        email: "emily.b@example.com",
        risk: "Medium",
        phone: "+1234567893",
        status: "Active",
        trigger: "Reduced Usage",
        lastContact: "3 days ago",
        sentiment: "neutral",
        joinDate: "2023-04-05",
        systemId: "SYS004"
    },
    {
        id: 5,
        name: "Michael Wilson",
        email: "michael.w@example.com",
        risk: "Low",
        phone: "+1234567894",
        status: "Active",
        trigger: null,
        lastContact: "1 day ago",
        sentiment: "positive",
        joinDate: "2023-05-15",
        systemId: "SYS005"
    },
    {
        id: 6,
        name: "Lisa Anderson",
        email: "lisa.a@example.com",
        risk: "Low",
        phone: "+1234567895",
        status: "Active",
        trigger: null,
        lastContact: "2 days ago",
        sentiment: "positive",
        joinDate: "2023-06-20",
        systemId: "SYS006"
    }
];

class CustomerDataManager {
    constructor() {
        this.customers = [];
        this.observers = new Map();
    }

    initialize() {
        this.customers = INITIAL_CUSTOMERS.map(customer => ({
            ...customer,
            systems: [{
                id: customer.systemId,
                status: this.getRiskStatus(customer.risk),
                battery: this.getInitialBattery(customer.risk),
                signal: this.getInitialSignal(customer.risk),
                lastCheck: customer.lastContact,
                checkHistory: []
            }],
            contactHistory: [],
        }));
        this.notifyAll();
    }

    getRiskStatus(risk) {
        switch(risk) {
            case 'High': return 'Critical';
            case 'Medium': return 'Warning';
            default: return 'Healthy';
        }
    }

    getInitialBattery(risk) {
        switch(risk) {
            case 'High': return '15%';
            case 'Medium': return '45%';
            default: return '85%';
        }
    }

    getInitialSignal(risk) {
        switch(risk) {
            case 'High': return '35%';
            case 'Medium': return '65%';
            default: return '95%';
        }
    }

    // Metrics calculation
    getMetrics() {
        const total = this.customers.length;
        const atRisk = this.customers.filter(c => c.risk === 'High').length;
        const activeAlerts = this.customers.filter(c => c.trigger).length;
        const contacted = this.customers.filter(c => c.lastContact !== 'Never').length;

        return {
            totalCustomers: total,
            criticalSystems: atRisk,
            activeAlerts: activeAlerts,
            retentionRate: ((total - atRisk) / total * 100).toFixed(1),
            contactedCustomers: contacted,
            responseRate: ((contacted / total) * 100).toFixed(1)
        };
    }

    // System health metrics
    getSystemHealthMetrics() {
        const systems = this.customers.flatMap(c => c.systems);
        const total = systems.length;
        const healthy = systems.filter(s => s.status === 'Healthy').length;
        const warning = systems.filter(s => s.status === 'Warning').length;
        const critical = systems.filter(s => s.status === 'Critical').length;

        return {
            total,
            healthy: {count: healthy, percentage: (healthy/total*100).toFixed(1)},
            warning: {count: warning, percentage: (warning/total*100).toFixed(1)},
            critical: {count: critical, percentage: (critical/total*100).toFixed(1)}
        };
    }

    // Observer pattern implementation
    subscribe(component, callback) {
        this.observers.set(component, callback);
    }

    unsubscribe(component) {
        this.observers.delete(component);
    }

    notifyAll() {
        this.observers.forEach(callback => callback(this));
    }

    // Data modification methods
    updateCustomer(customerId, updates) {
        const index = this.customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...updates };
            this.notifyAll();
        }
    }

    updateSystem(customerId, systemId, updates) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            const system = customer.systems.find(s => s.id === systemId);
            if (system) {
                Object.assign(system, updates);
                this.notifyAll();
            }
        }
    }

    addContactRecord(customerId, contactDetails) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            customer.contactHistory.unshift(contactDetails);
            customer.lastContact = 'Just now';
            this.notifyAll();
        }
    }
}

// Create global instance
window.customerData = new CustomerDataManager();

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
    customerData.initialize();
});
