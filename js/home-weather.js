(() => {
    const widget = document.querySelector('[data-home-weather]');
    if (!widget) return;

    const icon = widget.querySelector('[data-weather-icon]');
    const temperature = widget.querySelector('[data-weather-temperature]');
    const description = widget.querySelector('[data-weather-description]');
    const updated = widget.querySelector('[data-weather-updated]');
    const locationLabel = widget.querySelector('[data-weather-location]');
    const locationStatus = widget.querySelector('[data-weather-location-status]');
    const forecast = widget.querySelector('[data-weather-forecast]');
    const refreshButton = widget.querySelector('[data-weather-refresh]');
    const fallbackLocation = {
        latitude: 21.2506,
        longitude: 81.6348,
        name: 'Raipur, Chhattisgarh'
    };
    let selectedLocation = fallbackLocation;
    let locationNotice = '';

    const getWeatherInfo = (code, isDay) => {
        if (code === 0) return { icon: isDay ? '☀️' : '🌙', description: 'Clear' };
        if (code <= 3) return { icon: '⛅', description: 'Partly cloudy' };
        if (code === 45 || code === 48) return { icon: '🌫️', description: 'Fog' };
        if (code >= 51 && code <= 67) return { icon: '🌧️', description: 'Rain' };
        if (code >= 71 && code <= 77) return { icon: '❄️', description: 'Snow' };
        if (code >= 80 && code <= 82) return { icon: '🌧️', description: 'Rain showers' };
        if (code === 95 || code === 96 || code === 99) return { icon: '⛈️', description: 'Thunderstorm' };
        return { icon: '🌤️', description: 'Current conditions' };
    };

    const renderForecast = (hourly) => {
        const times = hourly.time;
        const temperatures = hourly.temperature_2m;
        const codes = hourly.weather_code;
        const dayFlags = hourly.is_day;
        if (!Array.isArray(times) || !Array.isArray(temperatures) || !Array.isArray(codes)) {
            throw new Error('Weather service returned incomplete hourly forecast');
        }

        const slots = times
            .map((time, index) => ({ time, index }))
            .filter(({ time }) => {
                const hour = Number(time.slice(11, 13));
                return hour % 4 === 0;
            })
            .slice(0, 6);

        if (slots.length === 0) {
            throw new Error('Weather service returned no hourly forecast for today');
        }

        forecast.replaceChildren();
        slots.forEach(({ time, index }) => {
            const hour = Number(time.slice(11, 13));
            const conditions = getWeatherInfo(codes[index], dayFlags?.[index] === 1);
            const item = document.createElement('li');
            item.className = 'home-weather-forecast-item';

            const timeLabel = document.createElement('span');
            timeLabel.className = 'home-weather-forecast-time';
            timeLabel.textContent = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;

            const iconLabel = document.createElement('span');
            iconLabel.className = 'home-weather-forecast-icon';
            iconLabel.setAttribute('aria-hidden', 'true');
            iconLabel.textContent = conditions.icon;

            const temperatureLabel = document.createElement('span');
            temperatureLabel.className = 'home-weather-forecast-temperature';
            temperatureLabel.textContent = `${Math.round(temperatures[index])}°`;

            item.setAttribute('aria-label', `${timeLabel.textContent}: ${conditions.description}, ${temperatureLabel.textContent}`);
            item.append(timeLabel, iconLabel, temperatureLabel);
            forecast.append(item);
        });
    };

    const loadLocationName = async (latitude, longitude) => {
        const parameters = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            localityLanguage: 'en'
        });

        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${parameters}`);
            if (!response.ok) {
                throw new Error(`Location name service returned HTTP ${response.status}`);
            }

            const place = await response.json();
            const name = [place.city || place.locality, place.principalSubdivision, place.countryName]
                .filter((part, index, parts) => typeof part === 'string' && part.trim() && parts.indexOf(part) === index)
                .map(part => part.trim())
                .join(', ');
            if (!name) {
                throw new Error('Location name service returned no place name');
            }

            selectedLocation.name = name;
            locationLabel.textContent = name;
            widget.setAttribute('aria-label', `${name} current weather`);
        } catch (error) {
            console.error('Unable to load current location name:', error);
            locationNotice = 'Could not fetch your location name; showing weather for your area.';
            locationStatus.textContent = locationNotice;
        }
    };

    const loadWeather = async () => {
        refreshButton.disabled = true;
        icon.textContent = '⏳';
        temperature.textContent = '--°C';
        description.textContent = 'Loading current conditions...';
        updated.textContent = 'Fetching latest weather...';
        locationStatus.textContent = locationNotice;
        locationLabel.textContent = selectedLocation.name;
        widget.setAttribute('aria-label', `${selectedLocation.name} current weather`);
        forecast.replaceChildren();
        const loadingMessage = document.createElement('li');
        loadingMessage.className = 'home-weather-forecast-message';
        loadingMessage.textContent = "Loading today's forecast...";
        forecast.append(loadingMessage);

        try {
            const parameters = new URLSearchParams({
                latitude: String(selectedLocation.latitude),
                longitude: String(selectedLocation.longitude),
                current_weather: 'true',
                hourly: 'temperature_2m,weather_code,is_day',
                forecast_days: '1',
                temperature_unit: 'celsius',
                windspeed_unit: 'kmh',
                timezone: 'auto'
            });
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`);
            if (!response.ok) {
                throw new Error(`Weather service returned HTTP ${response.status}`);
            }

            const data = await response.json();
            const current = data.current_weather;
            if (!current || !Number.isFinite(current.temperature) || !Number.isFinite(current.weathercode)) {
                throw new Error('Weather service returned incomplete current conditions');
            }

            const conditions = getWeatherInfo(current.weathercode, current.is_day === 1 || current.is_day === true);
            icon.textContent = conditions.icon;
            temperature.textContent = `${Math.round(current.temperature)}°C`;
            description.textContent = `${conditions.description} · Wind ${Math.round(current.windspeed || 0)} ${data.windspeed_unit || 'km/h'}`;
            updated.textContent = `Updated: ${new Date(current.time).toLocaleString()}`;
            renderForecast(data.hourly);
        } catch (error) {
            console.error('Unable to load home weather preview:', error);
            icon.textContent = '⚠️';
            temperature.textContent = '--°C';
            description.textContent = 'Weather data is currently unavailable.';
            updated.textContent = 'Please try again or open Weather & Soil for more information.';
            forecast.replaceChildren();
            const errorMessage = document.createElement('li');
            errorMessage.className = 'home-weather-forecast-message';
            errorMessage.textContent = "Today's forecast is currently unavailable.";
            forecast.append(errorMessage);
        } finally {
            refreshButton.disabled = false;
        }
    };

    refreshButton.addEventListener('click', loadWeather);

    if (!navigator.geolocation) {
        locationNotice = 'Location is unavailable; showing Raipur weather.';
        loadWeather();
        return;
    }

    refreshButton.disabled = true;
    updated.textContent = 'Requesting permission to use your location...';
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
            !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            locationNotice = 'Your location could not be determined; showing Raipur weather.';
            loadWeather();
            return;
        }

        selectedLocation = {
            latitude,
            longitude,
            name: 'Your location'
        };
        locationNotice = 'Your location is used for this forecast. Coordinates are sent to the weather and place-name services; the site does not save them.';
        loadWeather();
        loadLocationName(latitude, longitude);
    }, (error) => {
        locationNotice = error.code === error.PERMISSION_DENIED
            ? 'Location permission was declined; showing Raipur weather.'
            : 'Your location could not be determined; showing Raipur weather.';
        loadWeather();
    }, {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000
    });
})();
