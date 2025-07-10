/**
 * Mini Taxi App - GIS Navigation Application
 * A complete taxi routing application using Leaflet.js and OpenRouteService API
 */

class MiniTaxiApp {
    constructor() {
        // Configuration
        this.config = {
            defaultLocation: [40.7128, -74.0060], // New York City
            zoomLevel: 13,
            orsApiKey: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNlM2VmMmVmNjcxZTQ4OTdiOGZmZGRmMWVjYmFjMTUyIiwiaCI6Im11cm11cjY0In0=', // Replace with your actual API key
            orsBaseUrl: 'https://api.openrouteservice.org/v2/directions/driving-car'
        };

        // Application state
        this.state = {
            map: null,
            pickupMarker: null,
            dropoffMarker: null,
            routeLayer: null,
            currentStep: 'pickup', // 'pickup' or 'dropoff'
            userLocation: null,
            pickupCoords: null,
            dropoffCoords: null
        };

        // DOM elements
        this.elements = {
            map: document.getElementById('map'),
            controlPanel: document.getElementById('controlPanel'),
            status: document.getElementById('status'),
            taxiType: document.getElementById('taxiType'),
            pickupCoords: document.getElementById('pickupCoords'),
            dropoffCoords: document.getElementById('dropoffCoords'),
            routeInfo: document.getElementById('routeInfo'),
            distance: document.getElementById('distance'),
            eta: document.getElementById('eta'),
            fare: document.getElementById('fare'),
            resetBtn: document.getElementById('resetBtn'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };

        // Fare configuration
        this.fareConfig = {
            baseFare: 30,
            rates: {
                'driving-car': 15,      // Car: ₹15/km
                'cycling-regular': 10,  // Bike: ₹10/km
                'driving-hgv': 20       // Van: ₹20/km
            }
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.initializeMap();
            this.setupEventListeners();
            await this.detectUserLocation();
            this.updateUI();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize the application');
        }
    }

    /**
     * Initialize the Leaflet map
     */
    async initializeMap() {
        // Create map instance
        this.state.map = L.map(this.elements.map, {
            center: this.config.defaultLocation,
            zoom: this.config.zoomLevel,
            zoomControl: true,
            attributionControl: true
        });

        // Add dark theme tile layer as default
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.state.map);

        // Add additional tile layer options
        const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        // Add layer control
        const baseMaps = {
            "Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }),
            "Light": lightTiles
        };

        L.control.layers(baseMaps).addTo(this.state.map);

        // Add map click event
        this.state.map.on('click', (e) => this.handleMapClick(e));
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Reset button
        this.elements.resetBtn.addEventListener('click', () => this.resetApp());

        // Taxi type selector
        this.elements.taxiType.addEventListener('change', () => {
            this.onTaxiTypeChange();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.resetApp();
            }
        });

        // Touch events for mobile
        this.elements.map.addEventListener('touchstart', (e) => {
            // Prevent default touch behavior that might interfere with map
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Detect user's current location
     */
    async detectUserLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser');
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            this.state.userLocation = [position.coords.latitude, position.coords.longitude];
            
            // Center map on user location
            this.state.map.setView(this.state.userLocation, this.config.zoomLevel);
            
            // Add user location marker
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background-color: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            L.marker(this.state.userLocation, { icon: userIcon })
                .addTo(this.state.map)
                .bindPopup('Your current location')
                .openPopup();

            // Set user location as default pickup point
            this.setPickupLocation(this.state.userLocation[0], this.state.userLocation[1]);
            this.elements.status.textContent = 'Pickup set to your location. Click to set dropoff.';

            console.log('User location detected and set as pickup:', this.state.userLocation);
        } catch (error) {
            console.log('Could not get user location:', error);
        }
    }

    /**
     * Get current position with timeout
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Geolocation timeout'));
            }, 10000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeout);
                    resolve(position);
                },
                (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    /**
     * Handle map click events
     */
    handleMapClick(e) {
        const { lat, lng } = e.latlng;

        if (this.state.currentStep === 'pickup') {
            this.setPickupLocation(lat, lng);
        } else if (this.state.currentStep === 'dropoff') {
            this.setDropoffLocation(lat, lng);
        }
    }

    /**
     * Set pickup location
     */
    setPickupLocation(lat, lng) {
        // Remove existing pickup marker
        if (this.state.pickupMarker) {
            this.state.map.removeLayer(this.state.pickupMarker);
        }

        // Create pickup marker (green)
        const pickupIcon = L.divIcon({
            className: 'pickup-marker',
            html: '<div style="background-color: #4CAF50; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">P</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        this.state.pickupMarker = L.marker([lat, lng], { icon: pickupIcon })
            .addTo(this.state.map)
            .bindPopup('Pickup Location');

        this.state.pickupCoords = [lat, lng];
        this.state.currentStep = 'dropoff';

        this.updateUI();
        this.elements.status.textContent = 'Now click to set dropoff location';
    }

    /**
     * Set dropoff location
     */
    setDropoffLocation(lat, lng) {
        // Remove existing dropoff marker
        if (this.state.dropoffMarker) {
            this.state.map.removeLayer(this.state.dropoffMarker);
        }

        // Create dropoff marker (red)
        const dropoffIcon = L.divIcon({
            className: 'dropoff-marker',
            html: '<div style="background-color: #f44336; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">D</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        this.state.dropoffMarker = L.marker([lat, lng], { icon: dropoffIcon })
            .addTo(this.state.map)
            .bindPopup('Dropoff Location');

        this.state.dropoffCoords = [lat, lng];
        this.state.currentStep = 'complete';

        this.updateUI();
        this.calculateRoute();
    }

    /**
     * Calculate route between pickup and dropoff locations
     */
    async calculateRoute() {
        if (!this.state.pickupCoords || !this.state.dropoffCoords) {
            console.warn('Missing coordinates for route calculation');
            return;
        }

        console.log('Calculating route between:', {
            pickup: this.state.pickupCoords,
            dropoff: this.state.dropoffCoords
        });

        this.showLoading(true);
        this.elements.status.textContent = 'Calculating route...';

        try {
            const route = await this.fetchRoute();
            console.log('Route data received:', route);
            this.displayRoute(route);
        } catch (error) {
            console.error('Route calculation failed:', error);
            this.showError('Failed to calculate route. Please try again.');
            this.elements.status.textContent = 'Route calculation failed';
            
            // Try fallback route
            try {
                console.log('Attempting fallback route...');
                this.createSimpleRoute();
            } catch (fallbackError) {
                console.error('Fallback route also failed:', fallbackError);
            }
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle taxi type change
     */
    onTaxiTypeChange() {
        const selectedProfile = this.elements.taxiType.value;
        console.log('Taxi type changed to:', selectedProfile);
        
        // Recalculate route if both points are set
        if (this.state.pickupCoords && this.state.dropoffCoords) {
            this.calculateRoute();
        }
    }

    /**
     * Fetch route from OpenRouteService API
     */
    async fetchRoute() {
        const [pickupLat, pickupLng] = this.state.pickupCoords;
        const [dropoffLat, dropoffLng] = this.state.dropoffCoords;
        const selectedProfile = this.elements.taxiType.value;

        // Check if API key is configured
        if (this.config.orsApiKey === 'YOUR_ORS_API_KEY') {
            // Fallback: Create a simple straight-line route for demo
            return this.createDemoRoute(pickupLat, pickupLng, dropoffLat, dropoffLng, selectedProfile);
        }

        const requestBody = {
            coordinates: [
                [pickupLng, pickupLat],
                [dropoffLng, dropoffLat]
            ],
            format: 'geojson',
            preference: 'fastest',
            units: 'km'
        };

        // Update API URL based on selected profile
        const apiUrl = `https://api.openrouteservice.org/v2/directions/${selectedProfile}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': this.config.orsApiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('API call failed, using demo route:', error);
            return this.createDemoRoute(pickupLat, pickupLng, dropoffLat, dropoffLng, selectedProfile);
        }
    }

    /**
     * Create a demo route (straight line) when API is not available
     */
    createDemoRoute(pickupLat, pickupLng, dropoffLat, dropoffLng, profile = 'driving-car') {
        const distance = this.calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
        
        // Adjust duration based on vehicle type
        let durationMultiplier = 2; // Default: 2 minutes per km
        switch (profile) {
            case 'cycling-regular':
                durationMultiplier = 4; // Bike: 4 minutes per km
                break;
            case 'driving-hgv':
                durationMultiplier = 2.5; // Van: 2.5 minutes per km
                break;
            case 'driving-car':
            default:
                durationMultiplier = 2; // Car: 2 minutes per km
                break;
        }
        
        const duration = distance * durationMultiplier;

        // Create a more robust GeoJSON structure
        const routeData = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {
                    name: 'Demo Route',
                    profile: profile,
                    segments: [{
                        distance: distance * 1000, // Convert to meters
                        duration: duration * 60    // Convert to seconds
                    }],
                    summary: {
                        distance: distance * 1000,
                        duration: duration * 60
                    }
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [pickupLng, pickupLat],
                        [dropoffLng, dropoffLat]
                    ]
                }
            }]
        };

        // Validate the GeoJSON structure
        if (!routeData.features || !routeData.features[0] || !routeData.features[0].geometry) {
            console.error('Invalid GeoJSON structure created');
            throw new Error('Failed to create valid route data');
        }

        return routeData;
    }

    /**
     * Display route on the map
     */
    displayRoute(routeData) {
        try {
            // Remove existing route
            if (this.state.routeLayer) {
                this.state.map.removeLayer(this.state.routeLayer);
            }

            // Validate route data
            if (!routeData || !routeData.features || !Array.isArray(routeData.features)) {
                throw new Error('Invalid route data structure');
            }

            // Add new route with error handling
            this.state.routeLayer = L.geoJSON(routeData, {
                style: {
                    color: '#667eea',
                    weight: 6,
                    opacity: 0.8
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(feature.properties.name);
                    }
                }
            }).addTo(this.state.map);

            // Fit map to show both markers and route
            const bounds = L.latLngBounds([
                this.state.pickupCoords,
                this.state.dropoffCoords
            ]);
            this.state.map.fitBounds(bounds, { padding: [20, 20] });

            // Extract route information
            const features = routeData.features;
            if (features && features.length > 0) {
                const properties = features[0].properties;
                const distance = properties.segments?.[0]?.distance || 0;
                const duration = properties.segments?.[0]?.duration || 0;

                this.updateRouteInfo(distance, duration);
            }

            this.elements.status.textContent = 'Route calculated successfully!';
            
        } catch (error) {
            console.error('Error displaying route:', error);
            this.showError('Failed to display route. Please try again.');
            this.elements.status.textContent = 'Route display failed';
            
            // Fallback: create a simple polyline
            this.createSimpleRoute();
        }
    }

    /**
     * Create a simple polyline route as fallback
     */
    createSimpleRoute() {
        try {
            // Remove existing route
            if (this.state.routeLayer) {
                this.state.map.removeLayer(this.state.routeLayer);
            }

            // Create simple polyline
            this.state.routeLayer = L.polyline([
                this.state.pickupCoords,
                this.state.dropoffCoords
            ], {
                color: '#667eea',
                weight: 6,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(this.state.map);

            // Calculate distance and duration
            const distance = this.calculateDistance(
                this.state.pickupCoords[0], this.state.pickupCoords[1],
                this.state.dropoffCoords[0], this.state.dropoffCoords[1]
            );
            const duration = distance * 2; // 2 minutes per km

            this.updateRouteInfo(distance * 1000, duration * 60);
            this.elements.status.textContent = 'Route displayed (simplified)';
            
        } catch (error) {
            console.error('Error creating simple route:', error);
            this.showError('Could not display route');
        }
    }

    /**
     * Update route information display
     */
    updateRouteInfo(distance, duration) {
        // Convert distance from meters to kilometers
        const distanceKm = (distance / 1000).toFixed(2);
        
        // Convert duration from seconds to minutes
        const durationMinutes = Math.round(duration / 60);

        // Calculate fare
        const fare = this.calculateFare(distanceKm);

        this.elements.distance.textContent = `${distanceKm} km`;
        this.elements.eta.textContent = `${durationMinutes} min`;
        this.elements.fare.textContent = `₹${fare}`;
        this.elements.routeInfo.style.display = 'block';
    }

    /**
     * Calculate fare based on distance and vehicle type
     */
    calculateFare(distanceKm) {
        const selectedProfile = this.elements.taxiType.value;
        const ratePerKm = this.fareConfig.rates[selectedProfile] || this.fareConfig.rates['driving-car'];
        
        const fare = this.fareConfig.baseFare + (distanceKm * ratePerKm);
        return Math.round(fare);
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update coordinates display
        if (this.state.pickupCoords) {
            const [lat, lng] = this.state.pickupCoords;
            this.elements.pickupCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } else {
            this.elements.pickupCoords.textContent = 'Not set';
        }

        if (this.state.dropoffCoords) {
            const [lat, lng] = this.state.dropoffCoords;
            this.elements.dropoffCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } else {
            this.elements.dropoffCoords.textContent = 'Not set';
        }

        // Update status
        if (this.state.currentStep === 'pickup') {
            this.elements.status.textContent = 'Click to set pickup location';
        } else if (this.state.currentStep === 'dropoff') {
            this.elements.status.textContent = 'Click to set dropoff location';
        }
    }

    /**
     * Reset the application
     */
    resetApp() {
        // Remove markers
        if (this.state.pickupMarker) {
            this.state.map.removeLayer(this.state.pickupMarker);
            this.state.pickupMarker = null;
        }

        if (this.state.dropoffMarker) {
            this.state.map.removeLayer(this.state.dropoffMarker);
            this.state.dropoffMarker = null;
        }

        // Remove route
        if (this.state.routeLayer) {
            this.state.map.removeLayer(this.state.routeLayer);
            this.state.routeLayer = null;
        }

        // Reset state
        this.state.currentStep = 'pickup';
        this.state.pickupCoords = null;
        this.state.dropoffCoords = null;

        // Reset taxi type to default
        this.elements.taxiType.value = 'driving-car';

        // Reset UI
        this.elements.routeInfo.style.display = 'none';
        this.elements.fare.textContent = '-';
        this.updateUI();

        // Center map on user location or default
        const centerLocation = this.state.userLocation || this.config.defaultLocation;
        this.state.map.setView(centerLocation, this.config.zoomLevel);
    }

    /**
     * Show loading overlay
     */
    showLoading(show) {
        if (show) {
            this.elements.loadingOverlay.classList.add('active');
        } else {
            this.elements.loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 3000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    /**
     * Get distance between two points using Haversine formula
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    /**
     * Convert degrees to radians
     */
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MiniTaxiApp();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniTaxiApp;
} 