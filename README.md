# 🚕 Mini Taxi App

A complete GIS-based web application for taxi routing using Leaflet.js and OpenRouteService API. This application allows users to set pickup and dropoff locations on an interactive map and calculates optimal routes with distance and travel time estimates.

## ✨ Features

- **Interactive Map**: Full-screen map using Leaflet.js with OpenStreetMap tiles
- **Location Selection**: Click to set pickup (green marker) and dropoff (red marker) locations
- **Route Calculation**: Automatic route calculation using OpenRouteService API
- **Real-time Updates**: Live distance and ETA display
- **User Location**: Auto-detect and use current location as pickup point
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Themes**: Toggle between map themes
- **Reset Functionality**: Clear route and markers with one click
- **Modern UI**: Clean, intuitive interface with smooth animations

## 🚀 Quick Start

### Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection for map tiles and API calls
- OpenRouteService API key (optional for demo)

### Installation

1. **Clone or Download** the project files:
   ```
   mini-taxi-app/
   ├── index.html
   ├── style.css
   ├── script.js
   └── README.md
   ```

2. **Open the Application**:
   - Simply open `index.html` in your web browser
   - Or serve the files using a local web server

3. **Optional: Add API Key**:
   - Get a free API key from [OpenRouteService](https://openrouteservice.org/)
   - Replace `YOUR_ORS_API_KEY` in `script.js` with your actual key

### Local Development Server

For the best experience, serve the files using a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 🎯 How to Use

1. **Load the Application**: Open the app in your browser
2. **Set Pickup Location**: Click anywhere on the map to set your pickup point (green marker)
3. **Set Dropoff Location**: Click again to set your destination (red marker)
4. **View Route**: The app automatically calculates and displays the optimal route
5. **Check Information**: View distance and estimated travel time in the info panel
6. **Reset**: Click the reset button to start over

### Keyboard Shortcuts

- `Escape`: Reset the current route and markers

## 🛠️ Technical Details

### Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with flexbox, grid, and animations
- **JavaScript (ES6+)**: Modular, object-oriented programming
- **Leaflet.js**: Interactive mapping library
- **OpenRouteService API**: Route calculation and optimization
- **Turf.js**: Geospatial analysis utilities

### API Configuration

The app uses OpenRouteService for route calculations. To use your own API key:

1. Sign up at [OpenRouteService](https://openrouteservice.org/)
2. Get your API key
3. Replace the placeholder in `script.js`:

```javascript
this.config = {
    orsApiKey: 'YOUR_ACTUAL_API_KEY_HERE',
    // ... other config
};
```

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:

- Touch-friendly interface
- Responsive layout that adapts to screen size
- Optimized for portrait and landscape orientations
- Fast loading on mobile networks

## 🎨 Customization

### Styling

Modify `style.css` to customize the appearance:

- Colors and gradients
- Layout and spacing
- Typography
- Animations and transitions

### Functionality

Extend `script.js` to add new features:

- Additional map layers
- Different routing algorithms
- Custom markers and popups
- Integration with other APIs

### Map Configuration

Adjust map settings in the `config` object:

```javascript
this.config = {
    defaultLocation: [40.7128, -74.0060], // Default center
    zoomLevel: 13,                        // Initial zoom
    // ... other settings
};
```

## 🔧 Troubleshooting

### Common Issues

1. **Map Not Loading**:
   - Check internet connection
   - Ensure JavaScript is enabled
   - Try refreshing the page

2. **Route Calculation Fails**:
   - Verify API key is correct
   - Check API service status
   - Ensure coordinates are valid

3. **Location Detection Issues**:
   - Allow location permissions in browser
   - Check if HTTPS is required (some browsers)
   - Verify GPS is enabled on mobile devices

### Debug Mode

Enable console logging for debugging:

```javascript
// Add to script.js for detailed logging
console.log('Debug mode enabled');
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the OpenRouteService documentation

## 🔮 Future Enhancements

Potential features for future versions:

- Multiple waypoint support
- Different transportation modes (walking, cycling)
- Real-time traffic integration
- Offline map support
- Voice navigation
- Route alternatives
- Favorites and history
- Integration with ride-sharing APIs

---

**Happy Routing! 🚕✨** 