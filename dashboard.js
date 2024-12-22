// Sample data
const alerts = [
    { id: 1, customer: "John D.", risk: "High", trigger: "Reduced App Usage", lastContact: "15 days ago" },
    { id: 2, customer: "Sarah M.", risk: "Medium", trigger: "Multiple Support Calls", lastContact: "2 days ago" },
    { id: 3, customer: "Robert K.", risk: "High", trigger: "System Inactive", lastContact: "7 days ago" }
];

const riskFactors = [
    { name: "Reduced App Usage", count: 32, percentage: 75 },
    { name: "Low System Activity", count: 28, percentage: 65 },
    { name: "Multiple Support Calls", count: 15, percentage: 45 }
];

function updateCustomerMetrics() {
    const manualCustomers = JSON.parse(localStorage.getItem('customers')) || [];
    const totalCustomers = systemCustomers.length + manualCustomers.length;
    
    // Update active systems count
    const activeSystemsMetric = document.querySelector('.metric-card:first-child .value');
    if (activeSystemsMetric) {
        activeSystemsMetric.textContent = totalCustomers;
    }

    // Calculate and update average system usage
    const allCustomers = [...systemCustomers, ...manualCustomers];
    const avgUsage = allCustomers.reduce((sum, customer) => sum + customer.systemUsage, 0) / allCustomers.length;
    const usageMetric = document.querySelector('.metric-card:nth-child(2) .value');
    if (usageMetric) {
        usageMetric.textContent = Math.round(avgUsage) + '%';
    }
}

// Render alerts
function renderAlerts() {
    const container = document.getElementById('alerts-container');
    container.innerHTML = alerts.map(alert => `
        <div class="alert ${alert.risk === 'High' ? 'high' : 'medium'}">
            <div class="alert-header">
                <strong>${alert.customer}</strong> - ${alert.trigger}
            </div>
            <div>Last Contact: ${alert.lastContact}</div>
        </div>
    `).join('');
}

// Render risk factors
function renderRiskFactors() {
    const container = document.getElementById('risk-factors');
    container.innerHTML = riskFactors.map(factor => `
        <div class="risk-factor">
            <div class="risk-factor-header">
                <span>${factor.name}</span>
                <strong>${factor.count} Customers</strong>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${factor.percentage}%"></div>
            </div>
        </div>
    `).join('');
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [
                {
                    label: 'System Events',
                    data: [120, 80, 250, 310, 290, 340],
                    borderColor: '#2563eb',
                    tension: 0.4
                },
                {
                    label: 'App Usage',
                    data: [45, 20, 180, 220, 200, 250],
                    borderColor: '#16a34a',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Simulated AI model data
const simulatedData = {
    predictions: [
        { customer_id: "CS001", 
            risk_level: "High", 
            probability: 0.89, trends: "↑", lastActivity: "2 hours ago"
        },
        { customer_id: "CS002", risk_level: "High", probability: 0.78, trends: "↑", lastActivity: "5 hours ago" },

        { customer_id: "CS003", risk_level: "Medium", probability: 0.45, trends: "→", lastActivity: "1 hour ago" }
    ],
    riskFactors: [
        { factor: "Reduced System Usage", impact: 0.85, trend: "Increasing" },
        { factor: "Missed Payments", impact: 0.65, trend: "Stable" },
        { factor: "Support Tickets", impact: 0.45, trend: "Decreasing" }
    ]
};

function initializeAIDashboard() {
    // Initialize charts with "real-time" updates
    initializeCharts();
    updateAlerts();
    simulateRealTimeUpdates();
}

function initializeCharts() {
    // Activity Chart with "AI predictions"
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    const activityData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Actual Usage',
            data: [85, 82, 78, 75, 72, 70],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }, {
            label: 'AI Predicted',
            data: [85, 81, 77, 74, 71, 68],
            borderColor: 'rgb(255, 99, 132)',
            borderDash: [5, 5],
            tension: 0.1
        }]
    };
    
    new Chart(activityCtx, {
        type: 'line',
        data: activityData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: {
                title: { display: true, text: 'AI-Powered Usage Prediction' }
            }
        }
    });

    // Risk Assessment Chart
    const riskCtx = document.getElementById('riskFactorsChart').getContext('2d');
    new Chart(riskCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [15, 30, 55],
                backgroundColor: ['#ff6b6b', '#ffd93d', '#6bff6b']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'ML-Based Risk Distribution' }
            }
        }
    });

    document.querySelectorAll('.loading').forEach(el => {
        el.innerHTML = 'AI Analysis Complete';
        setTimeout(() => el.style.display = 'none', 1000);
    });
}

function updateAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    const alertsHTML = simulatedData.predictions
        .map(customer => `
            <div class="alert-item ${customer.risk_level.toLowerCase()}-risk">
                <div class="alert-header">
                    <span>Customer ${customer.customer_id}</span>
                    <span class="risk-badge ${customer.risk_level.toLowerCase()}">
                        ${(customer.probability * 100).toFixed(1)}% Risk ${customer.trends}
                    </span>
                </div>
                <div class="alert-details">
                    <p>Last Activity: ${customer.lastActivity}</p>
                    <p>AI Confidence: ${(customer.probability * 100).toFixed(1)}%</p>
                </div>
            </div>
        `)
        .join('');
    
    alertsContainer.innerHTML = alertsHTML;
}

function simulateRealTimeUpdates() {
    // Simulate real-time updates
    setInterval(() => {
        const metrics = document.querySelectorAll('.metric-card .value');
        metrics.forEach(metric => {
            const currentValue = parseInt(metric.textContent);
            const newValue = currentValue + Math.floor(Math.random() * 3) - 1;
            metric.textContent = newValue;
        });
    }, 5000);
}

function updateFeatureImportance(importance) {
    const riskFactorsContainer = document.getElementById('risk-factors');
    const factors = Object.entries(importance)
        .sort(([,a], [,b]) => b - a)
        .map(([feature, score]) => ({
            name: feature.replace(/_/g, ' ').toUpperCase(),
            percentage: Math.round(score * 100)
        }));

    riskFactorsContainer.innerHTML = factors.map(factor => `
        <div class="risk-factor">
            <div class="risk-factor-header">
                <span>${factor.name}</span>
                <strong>${factor.percentage}% Impact</strong>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${factor.percentage}%"></div>
            </div>
        </div>
    `).join('');
}

// Add this function after the existing initialization functions
function initializeSentimentAnalysis() {
    // Simulated AI sentiment data
    const sentimentData = {
        positive: 35,
        neutral: 45,
        negative: 20,
        overallScore: 7.2,
        trend: 0.5 // Add trend data
    };

    // Update sentiment score
    const sentimentScore = document.getElementById('sentiment-score');
    const sentimentTrend = document.getElementById('sentiment-trend');
    
    sentimentScore.textContent = sentimentData.overallScore.toFixed(1) + '/10';
    // Update trend text immediately instead of showing "Calculating..."
    sentimentTrend.textContent = `${sentimentData.trend > 0 ? '+' : ''}${sentimentData.trend} vs last week`;
    sentimentTrend.className = `change ${sentimentData.trend >= 0 ? 'positive' : 'negative'}`;

    // Update progress bars
    document.getElementById('positiveBar').style.width = sentimentData.positive + '%';
    document.getElementById('neutralBar').style.width = sentimentData.neutral + '%';
    document.getElementById('negativeBar').style.width = sentimentData.negative + '%';

    document.getElementById('positivePercent').textContent = sentimentData.positive + '%';
    document.getElementById('neutralPercent').textContent = sentimentData.neutral + '%';
    document.getElementById('negativePercent').textContent = sentimentData.negative + '%';

    // Update emoji based on highest percentage
    const emoji = document.getElementById('sentimentEmoji');
    const label = document.getElementById('sentimentLabel');
    
    const highestSentiment = Object.entries({
        positive: sentimentData.positive,
        neutral: sentimentData.neutral,
        negative: sentimentData.negative
    }).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Set emoji and label based on dominant sentiment
    switch(highestSentiment) {
        case 'positive':
            emoji.textContent = '😊';
            label.textContent = 'Positive';
            sentimentScore.className = 'value positive';
            break;
        case 'neutral':
            emoji.textContent = '😐';
            label.textContent = 'Neutral';
            sentimentScore.className = 'value neutral';
            break;
        case 'negative':
            emoji.textContent = '😟';
            label.textContent = 'Negative';
            sentimentScore.className = 'value negative';
            break;
    }

    // Simulate real-time updates
    setInterval(() => {
        // Randomly adjust percentages while maintaining total of 100%
        const adjustPercent = () => {
            sentimentData.positive += (Math.random() * 6) - 3;
            sentimentData.neutral += (Math.random() * 6) - 3;
            sentimentData.negative += (Math.random() * 6) - 3;

            // Normalize to ensure total is 100%
            const total = sentimentData.positive + sentimentData.neutral + sentimentData.negative;
            sentimentData.positive = Math.max(0, Math.min(100, (sentimentData.positive / total) * 100));
            sentimentData.neutral = Math.max(0, Math.min(100, (sentimentData.neutral / total) * 100));
            sentimentData.negative = Math.max(0, Math.min(100, (sentimentData.negative / total) * 100));
        };

        adjustPercent();

        // Update progress bars
        document.getElementById('positiveBar').style.width = sentimentData.positive.toFixed(1) + '%';
        document.getElementById('neutralBar').style.width = sentimentData.neutral.toFixed(1) + '%';
        document.getElementById('negativeBar').style.width = sentimentData.negative.toFixed(1) + '%';

        document.getElementById('positivePercent').textContent = sentimentData.positive.toFixed(1) + '%';
        document.getElementById('neutralPercent').textContent = sentimentData.neutral.toFixed(1) + '%';
        document.getElementById('negativePercent').textContent = sentimentData.negative.toFixed(1) + '%';

        // Update emoji based on new highest percentage
        const newHighestSentiment = Object.entries({
            positive: sentimentData.positive,
            neutral: sentimentData.neutral,
            negative: sentimentData.negative
        }).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        switch(newHighestSentiment) {
            case 'positive':
                emoji.textContent = '😊';
                label.textContent = 'Positive';
                sentimentScore.className = 'value positive';
                break;
            case 'neutral':
                emoji.textContent = '😐';
                label.textContent = 'Neutral';
                sentimentScore.className = 'value neutral';
                break;
            case 'negative':
                emoji.textContent = '😟';
                label.textContent = 'Negative';
                sentimentScore.className = 'value negative';
                break;
        }
    }, 5000);
}

// Initialize with loading effects
document.addEventListener('DOMContentLoaded', () => {
    // Initialize activity chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    new Chart(activityCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'System Usage',
                data: [85, 82, 78, 75, 72, 70],
                borderColor: '#2563eb',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'AI-Powered Usage Prediction',
                    padding: 20
                }
            }
        }
    });

    // Initialize risk factors chart
    const riskCtx = document.getElementById('riskFactorsChart').getContext('2d');
    new Chart(riskCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [15, 30, 55],
                backgroundColor: ['#ff6b6b', '#ffd93d', '#6bff6b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { 
                    display: true, 
                    text: 'ML-Based Risk Distribution',
                    padding: 20
                }
            }
        }
    });

    // Render risk factors
    const riskFactorsContainer = document.getElementById('risk-factors');
    const riskFactorsData = [
        { name: "Low System Usage", count: 45, percentage: 85 },
        { name: "Missed Payments", count: 32, percentage: 65 },
        { name: "Support Tickets", count: 28, percentage: 55 },
        { name: "System Errors", count: 15, percentage: 35 }
    ];

    riskFactorsContainer.innerHTML = riskFactorsData.map(factor => `
        <div class="risk-factor">
            <div class="risk-factor-header">
                <span>${factor.name}</span>
                <strong>${factor.count} Customers</strong>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${factor.percentage}%"></div>
            </div>
        </div>
    `).join('');

    // Update alerts
    const alertsContainer = document.getElementById('alerts-container');
    const alerts = [
        { id: "CS001", risk: "High", probability: 0.89, activity: "2 hours ago" },
        { id: "CS002", risk: "High", probability: 0.78, activity: "5 hours ago" },
        { id: "CS003", risk: "Medium", probability: 0.45, activity: "1 hour ago" }
    ];

    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.risk.toLowerCase()}-risk">
            <div class="alert-header">
                <span>Customer ${alert.id}</span>
                <span class="risk-badge ${alert.risk.toLowerCase()}">
                    ${(alert.probability * 100).toFixed(1)}% Risk
                </span>
            </div>
            <div class="alert-details">
                <p>Last Activity: ${alert.activity}</p>
                <p>AI Confidence: ${(alert.probability * 100).toFixed(1)}%</p>
            </div>
        </div>
    `).join('');

    // Remove all loading indicators
    document.querySelectorAll('.loading').forEach(el => {
        el.style.display = 'none';
    });

    initializeSentimentAnalysis();
    // Add customer metrics update
    updateCustomerMetrics();
    
    // Update metrics every minute
    setInterval(updateCustomerMetrics, 60000);
});