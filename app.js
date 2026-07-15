// ==========================================
// 1. App State & Globals
// ==========================================
let currentActiveRouteId = 1;
let mapInstance = null;
let mapMarkers = [];
let mapPolylines = [];
let activeDetailTab = 'itinerary-tab';

// Define the connections for each option to draw paths on the map
// type can be 'road' (solid gold) or 'flight' (dashed emerald)
const routeSegments = {
  1: [
    { from: "hanoi", to: "halong", type: "road" },
    { from: "halong", to: "hanoi", type: "road" }, // van back to airport
    { from: "hanoi", to: "danang", type: "flight" },
    { from: "danang", to: "hoian", type: "road" },
    { from: "hoian", to: "danang", type: "road" },
    { from: "danang", to: "hanoi", type: "flight" }
  ],
  2: [
    { from: "hanoi", to: "sapa", type: "road" },
    { from: "sapa", to: "ninhbinh", type: "road" },
    { from: "ninhbinh", to: "halong", type: "road" },
    { from: "halong", to: "hanoi", type: "road" }
  ],
  3: [
    { from: "hanoi", to: "sapa", type: "road" },
    { from: "sapa", to: "hanoi", type: "road" },
    { from: "hanoi", to: "halong", type: "road" },
    { from: "halong", to: "hanoi", type: "road" },
    { from: "hanoi", to: "danang", type: "flight" },
    { from: "danang", to: "hoian", type: "road" },
    { from: "hoian", to: "danang", type: "road" },
    { from: "danang", to: "hanoi", type: "flight" }
  ],
  4: [
    { from: "hanoi", to: "ninhbinh", type: "road" },
    { from: "ninhbinh", to: "hanoi", type: "road" },
    { from: "hanoi", to: "danang", type: "flight" },
    { from: "danang", to: "hoian", type: "road" },
    { from: "hoian", to: "danang", type: "road" },
    { from: "danang", to: "hanoi", type: "flight" }
  ]
};

// Map day numbers to locations for zooming on timeline click
const dayLocationMapping = {
  1: {
    1: "hanoi", 2: "hanoi", 3: "hanoi", 4: "halong", 5: "hoian",
    6: "hoian", 7: "danang", 8: "danang", 9: "hanoi", 10: "hanoi", 11: "hanoi"
  },
  2: {
    1: "hanoi", 2: "hanoi", 3: "sapa", 4: "sapa", 5: "sapa",
    6: "ninhbinh", 7: "ninhbinh", 8: "halong", 9: "hanoi", 10: "hanoi", 11: "hanoi"
  },
  3: {
    1: "hanoi", 2: "sapa", 3: "hanoi", 4: "halong", 5: "hoian",
    6: "hoian", 7: "danang", 8: "hanoi", 9: "hanoi", 10: "hanoi", 11: "hanoi"
  },
  4: {
    1: "hanoi", 2: "hanoi", 3: "ninhbinh", 4: "ninhbinh", 5: "hoian",
    6: "hoian", 7: "danang", 8: "hoian", 9: "danang", 10: "hanoi", 11: "hanoi"
  }
};

// ==========================================
// 2. Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initTravelers();
  initCountdown();
  initComparisonTable();
  initRouteSelectors();
  initMap();
  initDestinationsGuide();
  
  // Set default active route
  setActiveRoute(1);
});

// ==========================================
// 3. Render Static Components
// ==========================================
function initTravelers() {
  const travelersContainer = document.getElementById("travelers-list");
  if (!travelersContainer) return;
  
  travelersContainer.innerHTML = Object.entries(travelersData).map(([key, info]) => `
    <div class="traveler-card">
      <div class="traveler-photo-container">
        <img src="${info.image}" alt="${info.name}" class="traveler-img img-${key}">
      </div>
      <span class="traveler-name">${info.name}</span>
    </div>
  `).join("");
}

function initCountdown() {
  const targetDate = new Date("2026-09-19T15:00:00").getTime();
  
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;
    
    if (distance < 0) {
      document.getElementById("countdown").innerHTML = "<div class='text-center'><h3>הטיסה כבר יצאה! שתהיה נסיעה טובה ✈️</h3></div>";
      clearInterval(countdownInterval);
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    document.getElementById("days").innerText = String(days).padStart(2, '0');
    document.getElementById("hours").innerText = String(hours).padStart(2, '0');
    document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
    document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');
  }
  
  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}

function initComparisonTable() {
  const table = document.getElementById("comparison-table");
  if (!table) return;
  
  // Generate Header
  let headerHtml = "<tr>";
  comparisonData.headers.forEach(header => {
    headerHtml += `<th>${header}</th>`;
  });
  headerHtml += "</tr>";
  
  // Generate Rows
  let rowsHtml = "";
  comparisonData.rows.forEach(row => {
    rowsHtml += `<tr><td>${row.name}</td>`;
    row.values.forEach(val => {
      // Add special class styling for yes/no or rating stars
      let cellClass = "";
      if (val.includes("✅")) cellClass = "text-success font-bold";
      if (val.includes("❌")) cellClass = "text-muted";
      if (val.includes("⭐")) cellClass = "text-gold font-bold";
      
      rowsHtml += `<td class="${cellClass}">${val}</td>`;
    });
    rowsHtml += "</tr>";
  });
  
  table.innerHTML = headerHtml + rowsHtml;
}

function initRouteSelectors() {
  const container = document.getElementById("route-selector-buttons");
  if (!container) return;
  
  container.innerHTML = routeOptions.map(option => `
    <div class="route-btn-card" id="route-btn-${option.id}" onclick="setActiveRoute(${option.id})">
      <span class="route-btn-tag">${option.tag}</span>
      <h3>${option.title}</h3>
      <p>${option.subtitle}</p>
    </div>
  `).join("");
}

// ==========================================
// 4. Map Operations (Leaflet)
// ==========================================
function initMap() {
  if (typeof L === 'undefined') {
    console.error("Leaflet is not loaded. The interactive map cannot be initialized.");
    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--primary); font-weight: bold; background: rgba(4,75,54,0.05); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: var(--accent);"></i>
          <span>המפה האינטראקטיבית דורשת חיבור לאינטרנט.</span>
          <span style="font-size: 0.85rem; font-weight: normal; color: #64748b; max-width: 280px; line-height: 1.4;">אנא ודאו שאתם מחוברים לרשת וטענו מחדש את הדף כדי לצפות במסלול על המפה.</span>
        </div>
      `;
    }
    return;
  }

  // Center of Vietnam (Da Nang area coordinates)
  const centerOfVietnam = [16.5, 106.5];
  
  mapInstance = L.map('map', {
    center: centerOfVietnam,
    zoom: 5.5,
    zoomControl: true,
    scrollWheelZoom: false // Disable scroll zoom so user can scroll page easily
  });
  
  // CartoDB Voyager map tiles - clean and premium
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapInstance);
  
  // Enable dragging and keyboard controls
  mapInstance.on('focus', () => { mapInstance.scrollWheelZoom.enable(); });
  mapInstance.on('blur', () => { mapInstance.scrollWheelZoom.disable(); });
}

function updateMapForRoute(routeId) {
  if (!mapInstance) return;
  
  // Clear old markers
  mapMarkers.forEach(marker => mapInstance.removeLayer(marker));
  mapMarkers = [];
  
  // Clear old polylines
  mapPolylines.forEach(line => mapInstance.removeLayer(line));
  mapPolylines = [];
  
  const route = routeOptions.find(r => r.id === routeId);
  if (!route) return;
  
  // 1. Add markers for unique locations in this route
  const uniqueKeys = [...new Set(route.path)];
  const bounds = [];
  
  uniqueKeys.forEach((key, index) => {
    const loc = locations[key];
    if (!loc) return;
    
    // Custom beautiful markers with CSS classes
    const numIcon = L.divIcon({
      className: 'custom-map-marker-wrapper',
      html: `
        <div class="custom-map-marker">
          <div class="marker-core">${index + 1}</div>
          <div class="marker-label">${loc.name}</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    const marker = L.marker(loc.coords, { icon: numIcon })
      .addTo(mapInstance)
      .bindPopup(`<strong>${loc.name}</strong><br>${loc.desc}`);
    
    mapMarkers.push(marker);
    bounds.push(loc.coords);
  });
  
  // 2. Draw segments (Road/Flight paths)
  const segments = routeSegments[routeId] || [];
  segments.forEach(seg => {
    const startLoc = locations[seg.from];
    const endLoc = locations[seg.to];
    
    if (startLoc && endLoc) {
      const isFlight = seg.type === 'flight';
      const color = isFlight ? '#10b981' : '#ca8a04';
      const weight = isFlight ? 3 : 4;
      const dashArray = isFlight ? '8, 8' : '0';
      const opacity = isFlight ? 0.8 : 0.9;
      
      const polyline = L.polyline([startLoc.coords, endLoc.coords], {
        color: color,
        weight: weight,
        dashArray: dashArray,
        opacity: opacity,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapInstance);
      
      mapPolylines.push(polyline);
    }
  });
  
  // 3. Fit bounds to show the entire route clearly with padding
  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 9,
      animate: true,
      duration: 1.2
    });
  }
}

function zoomToLocation(locKey) {
  const loc = locations[locKey];
  if (loc && mapInstance) {
    mapInstance.setView(loc.coords, 9, {
      animate: true,
      duration: 0.8
    });
    
    // Find the marker corresponding to this location and open its popup
    const marker = mapMarkers.find(m => {
      const latLng = m.getLatLng();
      return Math.abs(latLng.lat - loc.coords[0]) < 0.01 && Math.abs(latLng.lng - loc.coords[1]) < 0.01;
    });
    if (marker) {
      marker.openPopup();
    }
  }
}

// ==========================================
// 5. Route Switching Operations
// ==========================================
function setActiveRoute(routeId) {
  currentActiveRouteId = routeId;
  
  // Update Selector Button UI
  document.querySelectorAll(".route-btn-card").forEach(btn => {
    btn.classList.remove("active");
  });
  const activeBtn = document.getElementById(`route-btn-${routeId}`);
  if (activeBtn) activeBtn.classList.add("active");
  
  // Get route data
  const route = routeOptions.find(r => r.id === routeId);
  if (!route) return;
  
  // Update details card texts
  document.getElementById("active-route-badge").innerText = route.tag;
  document.getElementById("active-route-title").innerText = route.title;
  document.getElementById("active-route-subtitle").innerText = route.subtitle;
  document.getElementById("active-route-description").innerText = route.description;
  document.getElementById("map-route-title").innerText = `מפה: ${route.title}`;
  
  // Update stats
  document.getElementById("stat-flights").innerText = route.stats.flights;
  document.getElementById("stat-road").innerText = route.stats.roadHours;
  document.getElementById("stat-pacing").innerText = route.stats.pacing;
  document.getElementById("stat-parents").innerText = route.stats.suitability;
  
  // Render Day-by-Day Timeline
  renderItinerary(route.itinerary, routeId);
  
  // Render Pros & Cons
  renderProsCons(route.pros, route.cons);
  
  // Render Upgrades
  renderUpgrades(route.upgrades);
  
  // Reset active tab to itinerary tab
  switchDetailTab('itinerary-tab');
  
  // Update Map
  updateMapForRoute(routeId);
}

function renderItinerary(itineraryList, routeId) {
  const timeline = document.getElementById("days-timeline");
  if (!timeline) return;
  
  timeline.innerHTML = itineraryList.map((item, index) => {
    const locationKey = dayLocationMapping[routeId][item.day] || "hanoi";
    return `
      <div class="timeline-item" id="timeline-day-${item.day}" onclick="highlightTimelineDay(${item.day}, '${locationKey}')">
        <div class="timeline-circle"></div>
        <div class="timeline-content">
          <div class="timeline-day-header">
            <span class="day-num">יום ${item.day}</span>
            <span class="day-date">${item.date}</span>
          </div>
          <h4>${item.title}</h4>
          <p>${item.desc}</p>
        </div>
      </div>
    `;
  }).join("");
}

function highlightTimelineDay(dayNum, locationKey) {
  // Clear active styling
  document.querySelectorAll(".timeline-item").forEach(item => {
    item.classList.remove("active");
  });
  
  // Add active style to selected day
  const targetItem = document.getElementById(`timeline-day-${dayNum}`);
  if (targetItem) targetItem.classList.add("active");
  
  // Zoom on Map
  zoomToLocation(locationKey);
}

function renderProsCons(pros, cons) {
  const prosList = document.getElementById("route-pros");
  const consList = document.getElementById("route-cons");
  
  if (prosList) {
    prosList.innerHTML = pros.map(p => `<li>${p}</li>`).join("");
  }
  if (consList) {
    consList.innerHTML = cons.map(c => `<li>${c}</li>`).join("");
  }
}

function renderUpgrades(upgrades) {
  const upgradesList = document.getElementById("route-upgrades");
  if (upgradesList) {
    upgradesList.innerHTML = upgrades.map(u => {
      // Support basic bold parsing if markdown ** is present
      const processedText = u.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<li>${processedText}</li>`;
    }).join("");
  }
}

function switchDetailTab(tabId) {
  activeDetailTab = tabId;
  
  // Update Tab buttons UI
  document.querySelectorAll(".detail-tabs .tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  
  // Find button by its onclick function parameter
  const targetBtn = Array.from(document.querySelectorAll(".detail-tabs .tab-btn")).find(btn => {
    return btn.getAttribute("onclick").includes(tabId);
  });
  if (targetBtn) targetBtn.classList.add("active");
  
  // Update Content Panels UI
  document.querySelectorAll(".tab-content").forEach(panel => {
    panel.classList.remove("active");
  });
  const targetPanel = document.getElementById(tabId);
  if (targetPanel) targetPanel.classList.add("active");
}

function initDestinationsGuide() {
  const container = document.getElementById("destinations-guide-container");
  if (!container) return;

  container.innerHTML = destinationsGuide.map(dest => {
    const processedThings = dest.thingsToDo.map(thing => {
      // Support basic bold parsing if markdown ** is present
      return `<li>${thing.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
    }).join("");

    return `
      <div class="dest-card glass-card">
        <div class="dest-image-wrap">
          <img src="${dest.image}" alt="${dest.name}" class="dest-image">
          <div class="dest-header-overlay">
            <h3>${dest.name}</h3>
            <span class="dest-vibe"><i class="fa-solid fa-wand-magic-sparkles"></i> ${dest.vibe}</span>
          </div>
        </div>
        <div class="dest-body">
          <div class="dest-meta">
            <span class="meta-tag"><i class="fa-regular fa-clock"></i> משך מומלץ: ${dest.timeRecommended}</span>
          </div>
          <p class="dest-desc">${dest.description}</p>
          
          <div class="dest-activities">
            <h4><i class="fa-solid fa-circle-check text-emerald"></i> אטרקציות ופעילויות מרכזיות:</h4>
            <ul class="styled-list">
              ${processedThings}
            </ul>
          </div>
          
          <div class="dest-family-tip">
            <div class="tip-title">
              <i class="fa-solid fa-lightbulb text-gold"></i>
              <strong>טיפ משפחתי מותאם:</strong>
            </div>
            <p>${dest.familyTip}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");
}
