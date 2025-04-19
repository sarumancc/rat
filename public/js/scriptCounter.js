document.addEventListener('DOMContentLoaded', function() {
  // Check if we have geoipLogs data
  if (typeof geoipLogs !== 'undefined' && geoipLogs.length > 0) {
    // Store original logs for filtering
    window.originalLogs = [...geoipLogs];
    processGeoipData(geoipLogs);
  }
  
  // Set up event listeners for filter buttons
  document.getElementById('last24h').addEventListener('click', function() {
    filterData(24);
    setActiveButton(this);
  });
  
  document.getElementById('last7d').addEventListener('click', function() {
    filterData(24 * 7);
    setActiveButton(this);
  });
  
  document.getElementById('last30d').addEventListener('click', function() {
    filterData(24 * 30);
    setActiveButton(this);
  });
  
  document.getElementById('allTime').addEventListener('click', function() {
    filterData(0); // 0 means all time
    setActiveButton(this);
  });
  
  // Traffic chart period buttons
  document.getElementById('dailyTraffic').addEventListener('click', function() {
    updateTrafficChart('daily');
    setActiveButton(this);
  });
  
  document.getElementById('weeklyTraffic').addEventListener('click', function() {
    updateTrafficChart('weekly');
    setActiveButton(this);
  });
  
  document.getElementById('monthlyTraffic').addEventListener('click', function() {
    updateTrafficChart('monthly');
    setActiveButton(this);
  });
  
  // Search functionality
  document.getElementById('visitSearch').addEventListener('input', function() {
    searchVisits(this.value);
  });
  
  // Refresh sections button
  document.getElementById('refreshSections').addEventListener('click', function() {
    updateSectionChart(window.currentLogs || window.originalLogs || geoipLogs);
  });
});

// Process the geoip data and update all visualizations
function processGeoipData(logs) {
  // Store current filtered logs
  window.currentLogs = logs;
  
  // Process data for various visualizations
  updateSummaryStats(logs);
  updateSectionChart(logs);
  
  // Only update map if it's initialized
  if (window.visitorMap && typeof window.visitorMap.eachLayer === 'function') {
    updateMap(logs);
  } else {
    // If map isn't ready yet, wait a bit and try again
    setTimeout(() => {
      if (window.visitorMap) updateMap(logs);
    }, 500);
  }
  
  updateCountryTable(logs);
  updateTimeline(logs);
  updateTrafficChart('daily', logs);
  updateTimezoneChart(logs);
  updateVisitTable(logs);
}

// Update summary statistics
function updateSummaryStats(logs) {
  // Calculate total visits
  const totalVisits = logs.length;
  
  // Calculate unique visitors (by IP)
  const uniqueIPs = new Set(logs.map(log => log.ip)).size;
  
  // Calculate countries count
  const countries = new Set();
  logs.forEach(log => {
    if (log.geo && log.geo.country) {
      countries.add(log.geo.country);
    }
  });
  const countryCount = countries.size;
  
  // Update the DOM
  document.getElementById('totalVisits').textContent = totalVisits.toLocaleString();
  document.getElementById('uniqueVisitors').textContent = uniqueIPs.toLocaleString();
  document.getElementById('countriesCount').textContent = countryCount.toLocaleString();
}

// Update the section chart
function updateSectionChart(logs) {
  // Count visits by section
  const sectionCounts = {};
  logs.forEach(log => {
    if (log.section) {
      sectionCounts[log.section] = (sectionCounts[log.section] || 0) + 1;
    }
  });
  
  // Prepare data for chart
  const labels = Object.keys(sectionCounts);
  const data = Object.values(sectionCounts);
  const backgroundColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)'
  ];
  const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));
  
  // Check if chart already exists and destroy it
  if (window.sectionChart && typeof window.sectionChart.destroy === 'function') {
    window.sectionChart.destroy();
  }
  
  // Create new chart
  const ctx = document.getElementById('sectionChart').getContext('2d');
  window.sectionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Visits by Section',
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: borderColors.slice(0, labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Visits by Section'
        }
      }
    }
  });
}

// Update the map with visitor locations
function updateMap(logs) {
  // Get the map instance from window
  const map = window.visitorMap;
  
  // Check if map exists
  if (!map || typeof map.eachLayer !== 'function') {
    console.error('Map not initialized properly');
    return;
  }
  
  // Clear existing markers
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
  
  // Keep the base tile layer
  if (!window.baseLayer) {
    window.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }
  
  // Add markers for each location
  const markers = [];
  
  logs.forEach(log => {
    if (log.geo && log.geo.ll && log.geo.ll.length === 2) {
      const [lat, lng] = log.geo.ll;
      
      // Create marker
      const marker = L.marker([lat, lng]);
      
      // Create popup content
      let popupContent = `<b>${log.geo.city || 'Unknown City'}, ${log.geo.country || 'Unknown Country'}</b><br>`;
      popupContent += `Section: ${log.section}<br>`;
      popupContent += `Time: ${new Date(log.timestamp).toLocaleString()}<br>`;
      popupContent += `IP: ${log.ip.replace(/\d+$/, 'xxx')}`;
      
      marker.bindPopup(popupContent);
      markers.push(marker);
    }
  });
  
  // Create marker layer group
  window.markerLayer = L.layerGroup(markers).addTo(map);
  
  // If we have markers, fit the map to show all of them
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [30, 30] });
  }
}

// Update the country table
function updateCountryTable(logs) {
  // Count visits by country
  const countryCounts = {};
  let totalVisits = 0;
  
  logs.forEach(log => {
    if (log.geo && log.geo.country) {
      countryCounts[log.geo.country] = (countryCounts[log.geo.country] || 0) + 1;
      totalVisits++;
    } else {
      countryCounts['Unknown'] = (countryCounts['Unknown'] || 0) + 1;
      totalVisits++;
    }
  });
  
  // Sort countries by visit count
  const sortedCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 countries
  
  // Get country names from codes
  const countryNames = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
    'BR': 'Brazil',
    'IN': 'India',
    'RU': 'Russia',
    'MX': 'Mexico',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'CL': 'Chile',
    // Add more as needed
    'Unknown': 'Unknown'
  };
  
  // Build table HTML
  let tableHTML = '';
  
  sortedCountries.forEach(([countryCode, count]) => {
    const percentage = ((count / totalVisits) * 100).toFixed(1);
    const countryName = countryNames[countryCode] || countryCode;
    const flagUrl = countryCode !== 'Unknown' ? 
      `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png` : '';
    
    tableHTML += '<tr>';
    tableHTML += `<td>${flagUrl ? `<img src="${flagUrl}" alt="${countryCode}" class="country-flag">` : ''}${countryName}</td>`;
    tableHTML += `<td>${count}</td>`;
    tableHTML += `<td>${percentage}%</td>`;
    tableHTML += `<td><span class="badge bg-success">+5%</span></td>`; // Placeholder trend
    tableHTML += '</tr>';
  });
  
  // If no countries, show message
  if (sortedCountries.length === 0) {
    tableHTML = '<tr><td colspan="4" class="text-center">No country data available</td></tr>';
  }
  
  // Update the table
  document.getElementById('countriesTableBody').innerHTML = tableHTML;
}

// Update the recent visits timeline
function updateTimeline(logs) {
  // Sort logs by timestamp (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  
  // Build timeline HTML
  let timelineHTML = '';
  
  sortedLogs.forEach(log => {
    const date = new Date(log.timestamp);
    const timeAgo = getTimeAgo(date);
    const country = log.geo?.country || 'Unknown';
    const city = log.geo?.city || 'Unknown';
    const section = log.section || 'Unknown';
    const ip = log.ip ? log.ip.replace(/\d+$/, 'xxx') : 'Unknown';
    
    timelineHTML += '<div class="timeline-item">';
    timelineHTML += `<div class="timeline-date">${timeAgo}</div>`;
    timelineHTML += `<div>Visitor from <strong>${city}, ${country}</strong> viewed <strong>${section}</strong></div>`;
    timelineHTML += `<small class="text-muted">IP: ${ip}</small>`;
    timelineHTML += '</div>';
  });
  
  // If no visits, show message
  if (sortedLogs.length === 0) {
    timelineHTML = '<div class="text-center p-3">No recent visits to display</div>';
  }
  
  // Update the timeline
  document.getElementById('visitsTimeline').innerHTML = timelineHTML;
}

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
}

// Update the traffic chart
function updateTrafficChart(period, logs) {
  if (!logs) {
    logs = window.currentLogs || window.originalLogs || [];
  }
  
  // Group logs by time period
  const timeData = {};
  
  if (period === 'daily') {
    // Group by day
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const day = date.toISOString().split('T')[0];
      timeData[day] = (timeData[day] || 0) + 1;
    });
  } else if (period === 'weekly') {
    // Group by week
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const week = weekStart.toISOString().split('T')[0];
      timeData[week] = (timeData[week] || 0) + 1;
    });
  } else if (period === 'monthly') {
    // Group by month
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      timeData[month] = (timeData[month] || 0) + 1;
    });
  }
  
  // Sort dates
  const sortedDates = Object.keys(timeData).sort();
  
  // Prepare chart data
  const chartData = {
    labels: sortedDates,
    datasets: [{
      label: 'Visits',
      data: sortedDates.map(date => timeData[date]),
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
  
  // Check if chart already exists and destroy it
  if (window.trafficChart && typeof window.trafficChart.destroy === 'function') {
    window.trafficChart.destroy();
  }
  
  // Create new chart
  const ctx = document.getElementById('trafficChart').getContext('2d');
  window.trafficChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `${period.charAt(0).toUpperCase() + period.slice(1)} Traffic`
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

// Update the timezone chart
function updateTimezoneChart(logs) {
  // Count visits by timezone
  const timezoneCounts = {};
  logs.forEach(log => {
    if (log.geo && log.geo.timezone) {
      timezoneCounts[log.geo.timezone] = (timezoneCounts[log.geo.timezone] || 0) + 1;
    } else {
      timezoneCounts['Unknown'] = (timezoneCounts['Unknown'] || 0) + 1;
    }
  });
  
  // Group timezones by region for better visualization
  const regionCounts = {
    'Americas': 0,
    'Europe': 0,
    'Asia/Pacific': 0,
    'Africa/ME': 0,
    'Unknown': 0
  };
  
  Object.entries(timezoneCounts).forEach(([timezone, count]) => {
    if (timezone.startsWith('America')) {
      regionCounts['Americas'] += count;
    } else if (timezone.startsWith('Europe')) {
      regionCounts['Europe'] += count;
    } else if (timezone.startsWith('Asia') || timezone.startsWith('Australia') || timezone.startsWith('Pacific')) {
      regionCounts['Asia/Pacific'] += count;
    } else if (timezone.startsWith('Africa') || timezone.startsWith('Indian')) {
      regionCounts['Africa/ME'] += count;
    } else {
      regionCounts['Unknown'] += count;
    }
  });
  
  // Prepare chart data
  const labels = Object.keys(regionCounts);
  const data = Object.values(regionCounts);
  const backgroundColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(153, 102, 255, 0.7)'
  ];
  const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));
  
  // Check if chart already exists and destroy it
  if (window.timezoneChart && typeof window.timezoneChart.destroy === 'function') {
    window.timezoneChart.destroy();
  }
  
  // Create new chart
  const ctx = document.getElementById('timezoneChart').getContext('2d');
  window.timezoneChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Visits by Timezone Region',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: 'Timezone Distribution'
        }
      }
    }
  });
}

// Update the detailed visit table
function updateVisitTable(logs) {
  // Sort logs by timestamp (newest first)
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
  
  // Pagination settings
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  window.currentPage = window.currentPage || 1;
  
  // Ensure current page is valid
  if (window.currentPage > totalPages) {
    window.currentPage = totalPages || 1;
  }
  
  // Get current page data
  const startIndex = (window.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = sortedLogs.slice(startIndex, endIndex);
  
  // Build table HTML
  let tableHTML = '';
  
  currentPageData.forEach(log => {
    const date = new Date(log.timestamp).toLocaleString();
    const section = log.section || 'Unknown';
    const ip = log.ip ? log.ip.replace(/\d+$/, 'xxx') : 'Unknown';
    const country = log.geo?.country || 'Unknown';
    const city = log.geo?.city || 'Unknown';
    const timezone = log.geo?.timezone || 'Unknown';
    
    // Determine badge color based on section
    let badgeClass = 'bg-primary';
    if (section === 'docs') badgeClass = 'bg-success';
    if (section === 'gallery') badgeClass = 'bg-info';
    if (section === 'imageviewer') badgeClass = 'bg-warning';
    
    tableHTML += '<tr>';
    tableHTML += `<td>${date}</td>`;
    tableHTML += `<td><span class="badge ${badgeClass}">${section}</span></td>`;
    tableHTML += `<td>${ip}</td>`;
    tableHTML += `<td>${country}</td>`;
    tableHTML += `<td>${city}</td>`;
    tableHTML += `<td>${timezone}</td>`;
    tableHTML += '</tr>';
  });
  
  // If no visits, show message
  if (currentPageData.length === 0) {
    tableHTML = '<tr><td colspan="6" class="text-center">No visit data available</td></tr>';
  }
  
  // Update the table
  document.getElementById('visitsTableBody').innerHTML = tableHTML;
  
  // Build pagination
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `
    <li class="page-item ${window.currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${window.currentPage - 1}" aria-disabled="${window.currentPage === 1}">Previous</a>
    </li>
  `;
  
  // Page numbers
  const maxPages = 5; // Maximum number of page links to show
  const startPage = Math.max(1, window.currentPage - Math.floor(maxPages / 2));
  const endPage = Math.min(totalPages, startPage + maxPages - 1);
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <li class="page-item ${i === window.currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  // Next button
  paginationHTML += `
    <li class="page-item ${window.currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${window.currentPage + 1}" aria-disabled="${window.currentPage === totalPages}">Next</a>
    </li>
  `;
  
  // Update pagination
  const paginationElement = document.getElementById('visitsPagination');
  paginationElement.innerHTML = paginationHTML;
  
  // Add event listeners to pagination links
  paginationElement.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = parseInt(this.getAttribute('data-page'));
      if (!isNaN(page)) {
        window.currentPage = page;
        updateVisitTable(sortedLogs);
      }
    });
  });
}

// Filter data based on time period
function filterData(hours) {
  if (!window.originalLogs) {
    window.originalLogs = [...geoipLogs];
  }
  
  if (hours === 0) {
    // Show all data
    processGeoipData(window.originalLogs);
    return;
  }
  
  // Filter logs by time period
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  const filteredLogs = window.originalLogs.filter(log => log.timestamp >= cutoff);
  
  // Update visualizations with filtered data
  processGeoipData(filteredLogs);
}

// Search visits
function searchVisits(query) {
  if (!window.originalLogs) {
    window.originalLogs = [...geoipLogs];
  }
  
  if (!query) {
    // If search is empty, show all
    updateVisitTable(window.currentLogs || window.originalLogs);
    return;
  }
  
  query = query.toLowerCase();
  const filteredLogs = (window.currentLogs || window.originalLogs).filter(log => {
    // Search in various fields
    return (
      (log.section && log.section.toLowerCase().includes(query)) ||
      (log.ip && log.ip.includes(query)) ||
      (log.geo && log.geo.country && log.geo.country.toLowerCase().includes(query)) ||
      (log.geo && log.geo.city && log.geo.city.toLowerCase().includes(query)) ||
      (log.geo && log.geo.timezone && log.geo.timezone.toLowerCase().includes(query))
    );
  });
  
  // Update table with filtered results
  updateVisitTable(filteredLogs);
}

// Helper to set active button in a group
function setActiveButton(button) {
  // Remove active class from siblings
  const siblings = button.parentElement.children;
  for (let i = 0; i < siblings.length; i++) {
    siblings[i].classList.remove('active');
  }
  // Add active class to clicked button
  button.classList.add('active');
}
