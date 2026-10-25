(function () {
    'use strict';

    const locations = {
        raipur: { name: 'Raipur', latitude: 21.2506, longitude: 81.6348 },
        bilaspur: { name: 'Bilaspur', latitude: 22.0797, longitude: 82.1391 },
        jagdalpur: { name: 'Jagdalpur, Bastar', latitude: 19.0748, longitude: 82.0080 },
        ambikapur: { name: 'Ambikapur, Surguja', latitude: 23.1355, longitude: 83.1818 },
        durg: { name: 'Durg', latitude: 21.1904, longitude: 81.2849 },
        korba: { name: 'Korba', latitude: 22.3595, longitude: 82.7501 }
    };

    const elements = {};
    let selectedLocation = locations.raipur;
    let activeController = null;
    let requestNumber = 0;
    let locationRequestNumber = 0;

    function getWeatherInfo(code, isDay) {
        if (code === 0) return { description: isDay ? 'Clear sky' : 'Clear night', icon: isDay ? 'fa-sun' : 'fa-moon' };
        if (code === 1) return { description: 'Mainly clear', icon: 'fa-cloud-sun' };
        if (code === 2) return { description: 'Partly cloudy', icon: 'fa-cloud-sun' };
        if (code === 3) return { description: 'Overcast', icon: 'fa-cloud' };
        if (code === 45 || code === 48) return { description: 'Fog', icon: 'fa-smog' };
        if (code >= 51 && code <= 57) return { description: 'Drizzle', icon: 'fa-cloud-rain' };
        if (code >= 61 && code <= 67) return { description: 'Rain', icon: 'fa-cloud-showers-heavy' };
        if (code >= 71 && code <= 77) return { description: 'Snow', icon: 'fa-snowflake' };
        if (code >= 80 && code <= 82) return { description: 'Rain showers', icon: 'fa-cloud-showers-heavy' };
        if (code >= 85 && code <= 86) return { description: 'Snow showers', icon: 'fa-snowflake' };
        if (code >= 95 && code <= 99) return { description: 'Thunderstorm', icon: 'fa-cloud-bolt' };
        return { description: 'Conditions unavailable', icon: 'fa-cloud' };
    }

    function setIcon(element, iconName) {
        element.className = 'fa-solid ' + iconName;
    }

    function formatTemperature(value) {
        return Number.isFinite(value) ? Math.round(value) + '°' : '--°';
    }

    function setLoading() {
        elements.widget.setAttribute('aria-busy', 'true');
        elements.error.hidden = true;
        elements.error.textContent = '';
        elements.desc.textContent = 'Loading local weather…';
        elements.temp.textContent = '--°';
        elements.feelsLike.textContent = '--°';
        elements.high.textContent = '--°';
        elements.low.textContent = '--°';
        elements.rain.textContent = '--%';
        elements.humidity.textContent = '--%';
        elements.wind.textContent = '-- km/h';
        elements.windDirection.textContent = 'Current conditions';
        elements.updated.textContent = 'Fetching forecast…';
        elements.forecast.replaceChildren();
        const placeholder = document.createElement('p');
        placeholder.className = 'forecast-placeholder';
        placeholder.textContent = 'Loading the 7-day forecast…';
        elements.forecast.append(placeholder);
        elements.guidance.textContent = 'Checking the local forecast for planning guidance…';
        elements.soilMoisture.textContent = '--';
        elements.soilTemperature.textContent = '--';
        setIcon(elements.icon, 'fa-cloud-sun');
    }

    function setError(message) {
        elements.widget.setAttribute('aria-busy', 'false');
        elements.error.textContent = message;
        elements.error.hidden = false;
        elements.desc.textContent = 'Weather data unavailable';
        elements.updated.textContent = 'Please try again or choose another location.';
        elements.guidance.textContent = 'Check local conditions before scheduling field work or irrigation.';
        setIcon(elements.icon, 'fa-triangle-exclamation');
    }

    function updateGuidance(daily, current) {
        const rainChance = daily.precipitation_probability_max[0];
        const highTemperature = daily.temperature_2m_max[0];
        if (Number.isFinite(rainChance) && rainChance >= 60) {
            elements.guidance.textContent = 'Rain is likely today (' + Math.round(rainChance) + '% chance). Check the field and local advisory before irrigation or outdoor work.';
        } else if (Number.isFinite(highTemperature) && highTemperature >= 35) {
            elements.guidance.textContent = 'High temperatures are forecast today (' + Math.round(highTemperature) + '°C). Consider heat exposure when planning outdoor work and check crops for signs of stress.';
        } else if (Number.isFinite(current.precipitation) && current.precipitation > 0) {
            elements.guidance.textContent = 'Precipitation is being reported now. Check field conditions before machinery or other outdoor work.';
        } else {
            elements.guidance.textContent = 'No high rain chance or heat alert is shown in today’s forecast. Check your field conditions and local advisories before making irrigation decisions.';
        }
    }

    function renderForecast(daily) {
        elements.forecast.replaceChildren();
        const dayFormatter = new Intl.DateTimeFormat('en-IN', {
            weekday: 'short',
            timeZone: 'UTC'
        });
        const dateFormatter = new Intl.DateTimeFormat('en-IN', {
            day: 'numeric',
            month: 'short',
            timeZone: 'UTC'
        });

        daily.time.forEach(function (date, index) {
            const card = document.createElement('article');
            card.className = 'forecast-day';
            const forecastDate = new Date(date + 'T12:00:00Z');

            const day = document.createElement('p');
            day.className = 'forecast-day-name';
            day.textContent = index === 0
                ? 'Today'
                : dayFormatter.format(forecastDate);

            const dateLabel = document.createElement('p');
            dateLabel.className = 'forecast-day-date';
            dateLabel.textContent = dateFormatter.format(forecastDate);

            const weatherIcon = document.createElement('i');
            weatherIcon.className = 'fa-solid ' + getWeatherInfo(daily.weather_code[index], true).icon;
            weatherIcon.setAttribute('aria-hidden', 'true');

            const temperatures = document.createElement('p');
            temperatures.className = 'forecast-temperatures';
            temperatures.textContent = formatTemperature(daily.temperature_2m_max[index]) + 'C / ' + formatTemperature(daily.temperature_2m_min[index]) + 'C';

            const rain = document.createElement('p');
            rain.className = 'forecast-rain';
            const rainChance = daily.precipitation_probability_max[index];
            rain.textContent = Number.isFinite(rainChance) ? Math.round(rainChance) + '% rain' : 'Rain: --';

            card.append(day, dateLabel, weatherIcon, temperatures, rain);
            elements.forecast.append(card);
        });
    }

    function renderWeather(data) {
        const current = data.current;
        const daily = data.daily;
        const hourly = data.hourly;
        const weatherInfo = getWeatherInfo(current.weather_code, current.is_day === 1);
        const rainChance = daily.precipitation_probability_max[0];

        elements.cityHeading.textContent = selectedLocation.name;
        elements.soilCity.textContent = selectedLocation.name;
        elements.temp.textContent = formatTemperature(current.temperature_2m) + 'C';
        elements.feelsLike.textContent = formatTemperature(current.apparent_temperature) + 'C';
        elements.desc.textContent = weatherInfo.description;
        elements.high.textContent = formatTemperature(daily.temperature_2m_max[0]);
        elements.low.textContent = formatTemperature(daily.temperature_2m_min[0]);
        elements.rain.textContent = Number.isFinite(rainChance) ? Math.round(rainChance) + '%' : '--%';
        elements.humidity.textContent = Number.isFinite(current.relative_humidity_2m) ? Math.round(current.relative_humidity_2m) + '%' : '--%';
        elements.wind.textContent = Number.isFinite(current.wind_speed_10m) ? Math.round(current.wind_speed_10m) + ' km/h' : '-- km/h';
        elements.windDirection.textContent = Number.isFinite(current.wind_direction_10m) ? Math.round(current.wind_direction_10m) + '° direction' : 'Current conditions';

        const currentDate = new Date(current.time);
        const forecastDate = new Date(current.time.slice(0, 10) + 'T12:00:00Z');
        elements.date.textContent = Number.isNaN(forecastDate.getTime())
            ? 'Current conditions and the week ahead'
            : new Intl.DateTimeFormat('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC'
            }).format(forecastDate);
        elements.updated.textContent = 'Weather model updated ' + currentDate.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: data.timezone
        });
        setIcon(elements.icon, weatherInfo.icon);

        renderForecast(daily);
        updateGuidance(daily, current);
        renderSoilEstimate(hourly, current.time);
        elements.widget.setAttribute('aria-busy', 'false');
    }

    function renderSoilEstimate(hourly, currentTime) {
        const currentHour = currentTime.slice(0, 13);
        const hourIndex = hourly.time.findIndex(function (time) {
            return time.slice(0, 13) === currentHour;
        });
        if (hourIndex < 0) return;

        const moisture = hourly.soil_moisture_0_to_1cm[hourIndex];
        const temperature = hourly.soil_temperature_0cm[hourIndex];
        elements.soilMoisture.textContent = Number.isFinite(moisture) ? moisture.toFixed(2) + ' m³/m³' : '--';
        elements.soilTemperature.textContent = Number.isFinite(temperature) ? formatTemperature(temperature) + 'C' : '--';
    }

    function hasRequiredWeatherData(data) {
        return data &&
            data.current &&
            Number.isFinite(data.current.temperature_2m) &&
            Number.isFinite(data.current.weather_code) &&
            data.daily &&
            Array.isArray(data.daily.time) &&
            data.daily.time.length >= 7 &&
            Array.isArray(data.daily.weather_code) &&
            Array.isArray(data.daily.temperature_2m_max) &&
            Array.isArray(data.daily.temperature_2m_min) &&
            Array.isArray(data.daily.precipitation_probability_max) &&
            data.hourly &&
            Array.isArray(data.hourly.time) &&
            Array.isArray(data.hourly.soil_moisture_0_to_1cm) &&
            Array.isArray(data.hourly.soil_temperature_0cm) &&
            typeof data.timezone === 'string';
    }

    async function fetchWeather() {
        if (activeController) activeController.abort();
        activeController = new AbortController();
        const controller = activeController;
        const currentRequest = ++requestNumber;
        const timeout = window.setTimeout(function () {
            controller.abort();
        }, 15000);

        setLoading();
        try {
            const parameters = new URLSearchParams({
                latitude: String(selectedLocation.latitude),
                longitude: String(selectedLocation.longitude),
                current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
                hourly: 'soil_moisture_0_to_1cm,soil_temperature_0cm',
                forecast_days: '7',
                temperature_unit: 'celsius',
                wind_speed_unit: 'kmh',
                timezone: 'auto'
            });
            const response = await fetch('https://api.open-meteo.com/v1/forecast?' + parameters.toString(), {
                signal: controller.signal,
                headers: { Accept: 'application/json' }
            });
            if (!response.ok) throw new Error('Weather service returned an unsuccessful response.');
            const data = await response.json();
            if (!hasRequiredWeatherData(data)) throw new Error('Weather service returned incomplete forecast data.');
            if (currentRequest !== requestNumber) return;
            renderWeather(data);
        } catch (error) {
            if (currentRequest !== requestNumber) return;
            if (error.name === 'AbortError' && controller.signal.aborted) {
                setError('The weather request timed out. Check your connection and try again.');
            } else {
                setError('We could not load weather right now. Check your connection or try another location.');
            }
        } finally {
            window.clearTimeout(timeout);
            if (activeController === controller) activeController = null;
        }
    }

    function useDeviceLocation() {
        if (!navigator.geolocation) {
            elements.error.textContent = 'Location is not available in this browser. Choose a location from the list instead.';
            elements.error.hidden = false;
            return;
        }

        const currentLocationRequest = ++locationRequestNumber;
        elements.useLocation.disabled = true;
        elements.locationNote.textContent = 'Waiting for your permission to use this device’s location…';
        navigator.geolocation.getCurrentPosition(function (position) {
            if (currentLocationRequest !== locationRequestNumber) return;
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
                !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                elements.error.textContent = 'Your device returned an invalid location. Choose a location from the list instead.';
                elements.error.hidden = false;
                elements.useLocation.disabled = false;
                return;
            }

            selectedLocation = { name: 'Your location', latitude: latitude, longitude: longitude };
            let deviceOption = elements.locationSelect.querySelector('option[value="device-location"]');
            if (!deviceOption) {
                deviceOption = document.createElement('option');
                deviceOption.value = 'device-location';
                deviceOption.textContent = 'Your location';
                elements.locationSelect.append(deviceOption);
            }
            elements.locationSelect.value = 'device-location';
            elements.locationNote.textContent = 'Using your location for this forecast. It is not saved or sent anywhere except the weather service.';
            elements.useLocation.disabled = false;
            fetchWeather();
        }, function (error) {
            if (currentLocationRequest !== locationRequestNumber) return;
            const message = error.code === error.PERMISSION_DENIED
                ? 'Location permission was not granted. Choose a location from the list or allow access in your browser settings.'
                : 'We could not determine your location. Choose a location from the list instead.';
            elements.error.textContent = message;
            elements.error.hidden = false;
            elements.locationNote.textContent = 'Your location was not accessed. Choose an area from the list to continue.';
            elements.useLocation.disabled = false;
        }, {
            enableHighAccuracy: false,
            maximumAge: 300000,
            timeout: 10000
        });
    }

    function initialize() {
        elements.widget = document.getElementById('weather-widget');
        elements.error = document.getElementById('weather-error');
        elements.desc = document.getElementById('weather-desc');
        elements.temp = document.getElementById('weather-temp');
        elements.feelsLike = document.getElementById('weather-feels-like');
        elements.high = document.getElementById('weather-high');
        elements.low = document.getElementById('weather-low');
        elements.rain = document.getElementById('weather-rain');
        elements.humidity = document.getElementById('weather-humidity');
        elements.wind = document.getElementById('weather-wind');
        elements.windDirection = document.getElementById('weather-wind-direction');
        elements.updated = document.getElementById('weather-updated');
        elements.icon = document.getElementById('weather-icon');
        elements.forecast = document.getElementById('forecast-grid');
        elements.guidance = document.getElementById('guidance-text');
        elements.soilMoisture = document.getElementById('soil-moisture');
        elements.soilTemperature = document.getElementById('soil-temperature');
        elements.cityHeading = document.getElementById('weather-city-heading');
        elements.soilCity = document.getElementById('soil-city');
        elements.date = document.getElementById('weather-date');
        elements.locationSelect = document.getElementById('weather-location-select');
        elements.locationNote = document.getElementById('location-note');
        elements.useLocation = document.getElementById('weather-use-location');

        elements.locationSelect.addEventListener('change', function () {
            const nextLocation = locations[elements.locationSelect.value];
            if (!nextLocation) return;
            locationRequestNumber += 1;
            elements.useLocation.disabled = false;
            selectedLocation = nextLocation;
            elements.locationNote.textContent = 'Weather is shown for the selected area. Precise location is used only when you request it.';
            fetchWeather();
        });
        elements.useLocation.addEventListener('click', useDeviceLocation);
        document.getElementById('weather-retry').addEventListener('click', fetchWeather);
        fetchWeather();
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
