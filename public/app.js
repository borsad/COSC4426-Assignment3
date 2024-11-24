let currentIndex = 0;  // Track the index of the data to display
let dataCache = [];  // Store the entire dataset for future use

// Fetch air quality dataset
const fetchAirQualityData = async () => {
    try {
        const response = await fetch('/api/dataset');
        if (!response.ok) throw new Error('Failed to fetch dataset');
        dataCache = await response.json(); // Store fetched data
        dataCache.sort((a, b) => new Date(b.Date) - new Date(a.Date));  // Sort by Date (latest first)

        // Render the first 5 records
        renderAirQualityData(currentIndex, 5);
        
        // Show the "Show More" button
        showShowMoreButton();
    } catch (error) {
        console.error('Error fetching dataset:', error.message);
    }
};

// Render data in A-Frame
const renderAirQualityData = (startIndex, numberOfRecords) => {
    const container = document.querySelector('#dynamic-content');
    container.innerHTML = '';  // Clear previous content

    // Loop through the data and render the required number of records
    const dataToRender = dataCache.slice(startIndex, startIndex + numberOfRecords);
    
    dataToRender.forEach((item, index) => {
        const coGt = parseFloat(item['CO(GT)']) || 0;
        const city = item['Date'] || 'Unknown'; // Use Date as city or any other field

        // Calculate positions to arrange boxes in a grid
        const x = (index % 10) * 1.5 - 7.5; // Grid column
        const z = Math.floor(index / 10) * -2 - 5; // Grid row

        // Create a box for visualization
        const box = document.createElement('a-box');
        box.setAttribute('position', `${x} ${coGt / 10 + 0.5} ${z}`);
        box.setAttribute('color', coGt > 50 ? 'red' : 'green'); // Color based on CO(GT)
        box.setAttribute('scale', `1 ${coGt / 10} 1`);

        // Create a label for the city (Date in this case)
        const text = document.createElement('a-text');
        text.setAttribute('value', `${city}\nCO(GT): ${coGt}`);
        text.setAttribute('position', `${x} ${(coGt / 10) + 1.5} ${z}`);
        text.setAttribute('align', 'center');
        text.setAttribute('color', 'black');

        container.appendChild(box);
        container.appendChild(text);
    });
};

// Show the "Show More" button
const showShowMoreButton = () => {
    const button = document.createElement('button');
    button.textContent = 'Show More';
    button.setAttribute('id', 'show-more-button');
    button.addEventListener('click', loadMoreData);

    // Append the button to the page
    document.body.appendChild(button);
};

// Load more data on button click
const loadMoreData = () => {
    currentIndex += 5;  // Move to the next 5 records
    renderAirQualityData(currentIndex, 5);  // Render next 5 records
    updateShowMoreButton();  // Update the button state
};

// Update "Show More" button state
const updateShowMoreButton = () => {
    const button = document.getElementById('show-more-button');
    
    // Hide the button if no more data to load
    if (currentIndex + 5 >= dataCache.length) {
        button.style.display = 'none';
    }
};

// Fetch data when app starts
fetchAirQualityData();

// Get the user's webcam feed and set it as the background video
const setCameraBackground = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.getElementById('camera-video');
        videoElement.srcObject = stream;
    } catch (error) {
        console.error('Error accessing camera:', error.message);
    }
};

// Call the function to set the camera background
setCameraBackground();
