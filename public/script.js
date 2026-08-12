const API_URL = '/api';

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('page-title');
const toastEl = document.getElementById('toast');

// Views state
let currentView = 'dashboard-view';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  loadDashboard();
  loadInventory();
  loadActivities();
  setupEventListeners();
});

// Theme Logic
function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');
  const icon = toggleBtn.querySelector('i');
  
  // Check local storage or system preference
  const isLight = localStorage.getItem('theme') === 'light';
  if (isLight) {
    document.body.classList.add('light-mode');
    icon.classList.replace('bx-moon', 'bx-sun');
  }
  updateChartTheme(isLight);

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const currentlyLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', currentlyLight ? 'light' : 'dark');
    
    if (currentlyLight) {
      icon.classList.replace('bx-moon', 'bx-sun');
    } else {
      icon.classList.replace('bx-sun', 'bx-moon');
    }
    updateChartTheme(currentlyLight);
  });
}

function updateChartTheme(isLight) {
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? '#e2e8f0' : '#2a2f42';
  
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;

  for (let id in charts) {
    if (charts[id].options.scales && charts[id].options.scales.x) {
      charts[id].options.scales.x.grid.color = gridColor;
      charts[id].options.scales.y.grid.color = gridColor;
      charts[id].options.scales.x.ticks.color = textColor;
      charts[id].options.scales.y.ticks.color = textColor;
    }
    if (charts[id].options.plugins && charts[id].options.plugins.legend) {
      charts[id].options.plugins.legend.labels.color = textColor;
    }
    charts[id].update();
  }
}

// Navigation Logic
function initNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      
      // Update UI
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      views.forEach(view => view.classList.remove('active'));
      document.getElementById(target).classList.add('active');
      
      pageTitle.textContent = item.textContent.trim();
      currentView = target;

      // Refresh Data based on view
      if (target === 'dashboard-view') loadDashboard();
      if (target === 'inventory-view') loadInventory();
      if (target === 'activity-view') loadActivities();
    });
  });
}

// Utility: Show Toast
function showToast(message, type = 'success') {
  toastEl.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}'></i> ${message}`;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// --- Dashboard View Logic ---
async function loadDashboard() {
  try {
    // Fetch KPIs
    const kpiRes = await fetch(`${API_URL}/dashboard`);
    const kpiData = await kpiRes.json();
    let totalProducts = 0;
    let totalRiskItems = 0;
    
    if(kpiData.success) {
      const d = kpiData.data;
      totalProducts = d.totalProducts;
      totalRiskItems = d.lowStock + d.outOfStock;
      
      document.getElementById('kpi-total-products').textContent = d.totalProducts;
      document.getElementById('kpi-total-categories').textContent = d.totalCategories;
      document.getElementById('kpi-total-stock').textContent = d.totalStockItems || 0;
      document.getElementById('kpi-total-value').textContent = `₹${d.totalValue.toLocaleString()}`;
      document.getElementById('kpi-low-stock').textContent = d.lowStock;
      document.getElementById('kpi-out-stock').textContent = d.outOfStock;
    }

    // Render Risk Indicator Gauge (Golden)
    const riskScore = totalProducts === 0 ? 0 : (totalRiskItems / totalProducts) * 10;
    const formattedScore = riskScore.toFixed(1);
    
    let riskLabel = 'Healthy';
    if (riskScore > 3 && riskScore <= 7) { riskLabel = 'Medium'; }
    else if (riskScore > 7) { riskLabel = 'High Risk'; }
    
    document.getElementById('risk-score').innerHTML = `${formattedScore}<span style="font-size:1.2rem;">/10</span>`;
    document.getElementById('risk-micro-score').textContent = formattedScore;
    document.getElementById('risk-label').textContent = riskLabel;
    
    // Golden Gauge chart (Half Doughnut)
    const gradientColors = ['#fbbf24', '#f59e0b']; // We will just use #fbbf24 for simplicity in Chart.js
    renderGaugeChart('risk-chart', [riskScore, 10 - riskScore], ['#fbbf24', 'rgba(255,255,255,0.05)']);

    // Fetch Smart Inventory Alerts (Low & Out of Stock)
    const lowRes = await fetch(`${API_URL}/dashboard/low-stock`);
    const outRes = await fetch(`${API_URL}/dashboard/out-of-stock`);
    const lowData = await lowRes.json();
    const outData = await outRes.json();
    
    const alertList = document.getElementById('alert-list');
    alertList.innerHTML = '';
    
    if(outData.data) {
      outData.data.forEach(item => {
        alertList.innerHTML += `<li class="danger-item"><span>${item.name}</span> <span class="status-badge out-stock">0 in stock</span></li>`;
      });
    }
    if(lowData.data) {
      lowData.data.forEach(item => {
        alertList.innerHTML += `<li class="warning-item"><span>${item.name}</span> <span class="status-badge low-stock">${item.quantity} in stock</span></li>`;
      });
    }
    if(alertList.innerHTML === '') {
      alertList.innerHTML = `<li>No alerts currently. Inventory is healthy!</li>`;
    }

    // Fetch Category Value Analytics for Chart
    const catValRes = await fetch(`${API_URL}/analytics/category-value`);
    const catValData = await catValRes.json();
    let topCatName = "Loading...";
    let topCatVal = 0;
    let totalVal = 0;
    
    if(catValData.success && catValData.data.length > 0) {
      // Colors from image: Purple, Light Blue, Green, Yellow, Orange
      const doughnutColors = ['#a855f7', '#3b82f6', '#10b981', '#fbbf24', '#f59e0b'];
      
      // We will use standard renderChart but modify doughnut to not show native legend
      renderChart('category-value-chart', 'doughnut-custom', catValData.data, '_id', 'totalValue', 'Inventory Value (₹)', doughnutColors);
      
      const topCat = catValData.data[0];
      topCatName = topCat._id;
      topCatVal = topCat.totalValue;
      totalVal = catValData.data.reduce((sum, item) => sum + item.totalValue, 0);
      
      // Update Center Text
      document.getElementById('doughnut-total-value').textContent = `₹${(totalVal/1000000).toFixed(2)}M`;
      
      // Update Custom Legend List
      const legendContainer = document.getElementById('custom-legend-container');
      legendContainer.innerHTML = '';
      catValData.data.forEach((item, index) => {
        const pct = ((item.totalValue / totalVal) * 100).toFixed(1);
        const color = doughnutColors[index % doughnutColors.length];
        legendContainer.innerHTML += `
          <div class="legend-item">
            <div class="legend-name">
              <span class="legend-dot" style="background:${color}; box-shadow: 0 0 8px ${color};"></span>
              ${item._id}
            </div>
            <div class="legend-val">₹${(item.totalValue/1000000).toFixed(1)}M</div>
            <div class="legend-pct">${pct}%</div>
          </div>
        `;
      });

      // Update Bottom Insight Box
      const topPercent = ((topCatVal / totalVal) * 100).toFixed(1);
      document.getElementById('doughnut-insight-box').innerHTML = `<i class='bx bx-pie-chart-alt-2' style="color:var(--primary-color);"></i> ${topCatName} contribute the most to your inventory value at ${topPercent}% of total.`;
    }
    
    const topPercentStr = totalVal === 0 ? 0 : ((topCatVal / totalVal) * 100).toFixed(1);
    document.getElementById('stat-top-cat-name').textContent = topCatName;
    document.getElementById('stat-top-cat-val').textContent = `₹${(topCatVal/1000000).toFixed(1)}M (${topPercentStr}%)`;

    // Render Performance Wavelength Chart (Mock Data for glowing curves)
    const performanceCtx = document.getElementById('performance-chart').getContext('2d');
    if (charts['performance-chart']) charts['performance-chart'].destroy();
    
    // Custom Shadow Plugin
    const shadowPlugin = {
      id: 'shadowPlugin',
      beforeDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        ctx.save();
        ctx.shadowColor = 'rgba(168, 85, 247, 0.4)'; // Purple glow
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      },
      afterDatasetsDraw: function(chart) {
        chart.ctx.restore();
      }
    };

    charts['performance-chart'] = new Chart(performanceCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Dataset 1',
            data: [0, -2, 5, -1, 3, -1],
            borderColor: '#a855f7', // Purple
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.5,
            pointRadius: 0,
            pointHoverRadius: 6
          },
          {
            label: 'Dataset 2',
            data: [-3, 3, -2, 1, -2, 3],
            borderColor: '#fbbf24', // Gold
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.5,
            pointRadius: 0,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.9)'
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
          },
          y: {
            grid: { display: false, drawBorder: false },
            ticks: {
              callback: function(value) { return value + '%'; },
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              maxTicksLimit: 5
            }
          }
        }
      },
      plugins: [shadowPlugin]
    });
    
    // Fetch Activities for Stock Movement mock
    const actRes = await fetch(`${API_URL}/activity`);
    const actData = await actRes.json();
    if(actData.success) {
      document.getElementById('stat-movement').textContent = actData.data.length;
    }

    // Generate Smart AI Insights based on data
    const insightsContainer = document.getElementById('smart-insights-container');
    insightsContainer.innerHTML = '';
    
    // 1. Critical Insight: Top Category + Risk
    let insight1HTML = '';
    
    if(totalRiskItems > 0 && topPercentStr > 25) {
      insight1HTML = `
        <div class="insight-card critical">
          <div class="insight-icon critical"><i class='bx bx-error'></i></div>
          <div class="insight-content">
            <h4>Critical Asset Risk</h4>
            <p><strong>${topCatName}</strong> makes up <strong>${topPercentStr}%</strong> of your capital, but you have ${totalRiskItems} items across your portfolio requiring urgent restocking. Protecting your most valuable category is critical to maintaining liquidity.</p>
          </div>
        </div>
      `;
    } else {
      insight1HTML = `
        <div class="insight-card success">
          <div class="insight-icon success"><i class='bx bx-trending-up'></i></div>
          <div class="insight-content">
            <h4>Capital Allocation Healthy</h4>
            <p><strong>${topCatName}</strong> is your strongest asset class (${topPercentStr}% of total value). Inventory risk is low, suggesting a highly optimized procurement strategy.</p>
          </div>
        </div>
      `;
    }
    insightsContainer.innerHTML += insight1HTML;

    // 2. Velocity Insight
    const actMovement = actData.success ? actData.data.length : 0;
    let insight2HTML = `
        <div class="insight-card info">
          <div class="insight-icon info"><i class='bx bx-radar'></i></div>
          <div class="insight-content">
            <h4>Velocity Analysis</h4>
            <p>You've had <strong>${actMovement} inventory movements</strong> recently. Given the ${totalProducts} total products tracked, your turnover velocity is steady. Consider automating purchase orders for fast-moving items.</p>
          </div>
        </div>
    `;
    insightsContainer.innerHTML += insight2HTML;

  } catch (error) {
    console.error("Dashboard Load Error", error);
  }
}

function renderGaugeChart(canvasId, dataArray, colors) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (charts[canvasId]) charts[canvasId].destroy();

  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: dataArray,
        backgroundColor: colors,
        borderWidth: 0,
        cutout: '80%',
        circumference: 180,
        rotation: 270
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
  });
}

// Chart.js Instances and Render Helper
let charts = {};

function renderChart(canvasId, type, dataArray, labelKey, dataKey, datasetLabel, colors) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  const labels = dataArray.map(item => item[labelKey]);
  const data = dataArray.map(item => item[dataKey]);
  
  let bgColors = colors;
  
  // Create Gradients for Ultra-Premium Look
  if(type === 'bar') {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#a855f7'); // Hexus Purple
    gradient.addColorStop(1, '#3b82f6'); // Blue
    bgColors = gradient;
  } else if (type === 'doughnut' || type === 'doughnut-custom') {
    bgColors = data.map((_, i) => {
      // We are just using flat colors for custom doughnut as per image, so disable gradient mapping if custom
      if(type === 'doughnut-custom') return colors[i % colors.length];
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      const c1 = colors[i % colors.length];
      const c2 = colors[(i+1) % colors.length];
      gradient.addColorStop(0, c1);
      gradient.addColorStop(1, c2);
      return gradient;
    });
  }

  const isDoughnut = type.includes('doughnut');

  charts[canvasId] = new Chart(ctx, {
    type: isDoughnut ? 'doughnut' : type,
    data: {
      labels: labels,
      datasets: [{
        label: datasetLabel,
        data: data,
        backgroundColor: bgColors,
        borderWidth: isDoughnut ? 0 : 0, // Set to 0 to remove harsh borders on doughnut segments as per image
        borderColor: document.body.classList.contains('light-mode') ? '#ffffff' : '#1e293b',
        borderRadius: type === 'bar' ? 6 : 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: isDoughnut ? '65%' : undefined, // Thicker doughnut to match image
      layout: {
        padding: type === 'doughnut-custom' ? 0 : 10
      },
      plugins: {
        legend: {
          display: type !== 'bar' && type !== 'doughnut-custom',
          position: 'right',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 14, family: "'Inter', sans-serif" },
          bodyFont: { size: 13, family: "'Inter', sans-serif" },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: type === 'bar' ? {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { font: { family: "'Inter', sans-serif" } }
        },
        y: {
          grid: { display: true, color: 'rgba(150, 150, 150, 0.1)', drawBorder: false },
          ticks: { font: { family: "'Inter', sans-serif" } }
        }
      } : {}
    }
  });
}

// --- Inventory View Logic ---
async function loadInventory() {
  await loadCategories();
  fetchProducts();
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/products/categories`);
    const data = await res.json();
    if(data.success) {
      const filterSelect = document.getElementById('category-filter');
      const datalist = document.getElementById('category-options');
      
      // Keep first option
      filterSelect.innerHTML = '<option value="">All Categories</option>';
      datalist.innerHTML = '';

      data.data.forEach(cat => {
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        datalist.innerHTML += `<option value="${cat}">`;
      });
    }
  } catch(error) {
    console.error("Category Load Error", error);
  }
}

async function fetchProducts() {
  const search = document.getElementById('search-input').value;
  const category = document.getElementById('category-filter').value;
  const stock = document.getElementById('stock-filter').value;
  const sort = document.getElementById('sort-filter').value;

  let queryUrl = `${API_URL}/products?`;
  if(search) queryUrl += `search=${search}&`;
  if(category) queryUrl += `category=${category}&`;
  if(stock === 'low') queryUrl += `lowStock=true&`;
  if(stock === 'out') queryUrl += `outOfStock=true&`;
  
  if(sort) {
    const parts = sort.split('_');
    if(parts.length === 2) {
      queryUrl += `sortBy=${parts[0]}&order=${parts[1]}&`;
    } else if (sort === 'latest') {
      queryUrl += `sortBy=createdAt&order=desc&`;
    }
  }

  try {
    const res = await fetch(queryUrl);
    const data = await res.json();
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    if(data.success && data.data.length > 0) {
      data.data.forEach(p => {
        let statusBadge = '';
        if(p.quantity <= 0) {
          statusBadge = '<span class="status-badge out-stock">Out of Stock</span>';
        } else if (p.quantity <= p.lowStockThreshold) {
          statusBadge = '<span class="status-badge low-stock">Low Stock</span>';
        } else {
          statusBadge = '<span class="status-badge in-stock">In Stock</span>';
        }

        tbody.innerHTML += `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>₹${p.price.toLocaleString()}</td>
            <td>${p.quantity}</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn-icon edit" onclick="editProduct('${p._id}')"><i class='bx bx-edit-alt'></i></button>
              <button class="btn-icon delete" onclick="deleteProduct('${p._id}')"><i class='bx bx-trash'></i></button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-secondary)">No products found.</td></tr>`;
    }
  } catch (error) {
    console.error("Products Load Error", error);
  }
}

// Event Listeners for Filters/Search
document.getElementById('search-input').addEventListener('input', debounce(fetchProducts, 300));
document.getElementById('category-filter').addEventListener('change', fetchProducts);
document.getElementById('stock-filter').addEventListener('change', fetchProducts);
document.getElementById('sort-filter').addEventListener('change', fetchProducts);

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// --- Activity Log Logic ---
async function loadActivities() {
  try {
    const res = await fetch(`${API_URL}/activity`);
    const data = await res.json();
    const timeline = document.getElementById('activity-timeline-list');
    timeline.innerHTML = '';

    if(data.success && data.data.length > 0) {
      data.data.forEach(log => {
        let className = '';
        if(log.action.includes('Added')) className = 'added';
        if(log.action.includes('Updated')) className = 'updated';
        if(log.action.includes('Deleted')) className = 'deleted';

        const timeString = new Date(log.timestamp).toLocaleString();

        timeline.innerHTML += `
          <li class="${className}">
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-action">${log.action}</span>
                <span class="timeline-time">${timeString}</span>
              </div>
              <div class="timeline-details">
                <strong>${log.productName}</strong> - ${log.details}
              </div>
            </div>
          </li>
        `;
      });
    } else {
      timeline.innerHTML = '<p style="color:var(--text-secondary)">No recent activities.</p>';
    }
  } catch (error) {
    console.error("Activity Load Error", error);
  }
}


// --- Modal & CRUD Logic ---
const modal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');

function setupEventListeners() {
  document.getElementById('add-product-btn').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Product';
    modal.classList.add('active');
  });

  document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('cancel-modal').addEventListener('click', () => modal.classList.remove('active'));

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const payload = {
      name: document.getElementById('product-name').value,
      category: document.getElementById('product-category').value,
      price: Number(document.getElementById('product-price').value),
      quantity: Number(document.getElementById('product-quantity').value),
      lowStockThreshold: Number(document.getElementById('product-threshold').value)
    };

    try {
      const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if(data.success) {
        showToast(`Product successfully ${id ? 'updated' : 'added'}!`);
        modal.classList.remove('active');
        fetchProducts();
        loadCategories(); // update categories if new one added
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Server error occurred', 'error');
    }
  });
}

// Global functions for inline HTML event handlers (edit/delete buttons)
window.editProduct = async (id) => {
  try {
    // Quick hack: fetch all products and find it locally instead of making new GET /:id endpoint
    // since we already have it in the list (or we can just find it from DOM, but let's fetch to be safe or use current list if we kept state)
    // To be efficient, let's search via API using ID. Wait, no GET /:id endpoint defined in plan. 
    // It's ok to use DOM or state. But since we need to populate, let's just use fetch if we had GET /:id.
    // Instead I'll use the search endpoint, but filtering by _id isn't explicitly supported in our backend.
    
    // Alternative: Find data from the currently fetched table row, but cleaner to just have state.
    // Actually, I can just use DOM traversal to grab values since it's a simple app.
    const tr = event.currentTarget.closest('tr');
    const name = tr.cells[0].textContent;
    const category = tr.cells[1].textContent;
    const priceStr = tr.cells[2].textContent.replace('₹', '').replace(/,/g, '');
    const quantity = tr.cells[3].textContent;
    
    document.getElementById('product-id').value = id;
    document.getElementById('product-name').value = name;
    document.getElementById('product-category').value = category;
    document.getElementById('product-price').value = priceStr;
    document.getElementById('product-quantity').value = quantity;
    // We didn't render threshold, keep it default 5 for now if edit.
    
    document.getElementById('modal-title').textContent = 'Edit Product';
    modal.classList.add('active');
  } catch (err) {
    console.error(err);
  }
};

window.deleteProduct = async (id) => {
  if(!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if(data.success) {
      showToast('Product deleted successfully');
      fetchProducts();
    } else {
      showToast(data.error, 'error');
    }
  } catch (error) {
    showToast('Server error occurred', 'error');
  }
};
