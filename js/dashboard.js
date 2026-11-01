const user = window.AgriSessionStore.getUser();

const changePasswordSection = document.querySelector('#change-password');
const showChangePasswordSection = () => {
    const isRequested = window.location.hash === '#change-password';
    changePasswordSection.hidden = !isRequested;
    if (isRequested) changePasswordSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

showChangePasswordSection();
window.addEventListener('hashchange', showChangePasswordSection);

if (!user) {
    window.location.replace('/login.html');
} else {
    const name = user.name || 'Farmer';
    document.querySelectorAll('#header-name, #welcome-name, #profile-name, #profile-initial').forEach(element => {
        element.translate = !user.name;
    });

    document.querySelector('#header-name').textContent = name;
    document.querySelector('#welcome-name').textContent = name;
    document.querySelector('#profile-name').textContent = name;
    document.querySelector('#profile-initial').textContent = name.charAt(0).toUpperCase();
    document.querySelector('#profile-mobile').textContent = user.mobile || 'Not available';
    document.querySelector('#profile-district').textContent = user.district || 'Not available';

    const servicesGrid = document.querySelector('#cg-farmer-services-grid');
    const servicesSearch = document.querySelector('#farmer-services-search');
    const noServicesMessage = document.querySelector('#farmer-services-empty');
    const serviceCards = (servicesGrid && Array.isArray(window.CG_FARMER_SERVICES) ? window.CG_FARMER_SERVICES : []).map(service => {
        const card = document.createElement('article');
        card.className = 'farmer-service-card';

        const icon = document.createElement('i');
        icon.className = service.icon;
        icon.setAttribute('aria-hidden', 'true');

        const heading = document.createElement('h3');
        heading.textContent = service.name;

        const description = document.createElement('p');
        description.textContent = service.description;

        if (service.availabilityNote) {
            const availabilityNote = document.createElement('p');
            availabilityNote.className = 'farmer-service-availability';
            availabilityNote.textContent = service.availabilityNote;
            card.append(availabilityNote);
        }

        const link = document.createElement('a');
        link.className = 'farmer-service-button';
        link.href = service.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open Service';

        card.prepend(icon, heading, description);
        card.append(link);
        servicesGrid.append(card);
        return { card, service };
    });

    servicesSearch?.addEventListener('input', () => {
        const query = servicesSearch.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        serviceCards.forEach(({ card, service }) => {
            const matches = `${service.name} ${service.description}`.toLocaleLowerCase().includes(query);
            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        if (noServicesMessage) noServicesMessage.hidden = visibleCount !== 0;
    });

    document.querySelector('#logout-button').addEventListener('click', () => {
        try {
            window.AgriSessionStore.clearUser();
            window.location.replace('/login.html');
        } catch (error) {
            window.alert(window.agriTranslate(error.message));
        }
    });
}

document.querySelector('#change-password-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button');
    const message = document.querySelector('#password-message');
    button.disabled = true;
    try {
        await window.AgriApiClient.post('v1/password', Object.fromEntries(new FormData(form)));
        window.AgriSessionStore.clearUser();
        window.location.replace('/login.html');
    } catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; }
});

if (user?.accessToken) {
    window.AgriApiClient.get('v1/me').then(profile => {
        window.AgriSessionStore.saveUser({ ...user, ...profile });
        document.querySelector('#profile-mobile').textContent = profile.mobile;
        document.querySelector('#profile-district').textContent = profile.district || 'Not available';
    }).catch(error => {
        const message = document.querySelector('#password-message');
        if (message) message.textContent = error.message;
    });
}

(() => {
    const calculatorForm = document.querySelector('#profit-calculator-form');
    if (!calculatorForm) return;

    const totalCostValue = document.querySelector('#total-cost-value');
    const expectedRevenueValue = document.querySelector('#expected-revenue-value');
    const netProfitValue = document.querySelector('#net-profit-value');
    const profitPerAcreValue = document.querySelector('#profit-per-acre-value');
    const costPerKgValue = document.querySelector('#cost-per-kg-value');
    const profitMarginValue = document.querySelector('#profit-margin-value');
    const expenseBreakdownList = document.querySelector('#expense-breakdown-list');
    const costBar = document.querySelector('#cost-bar');
    const revenueBar = document.querySelector('#revenue-bar');
    const costBarLabel = document.querySelector('#cost-bar-label');
    const revenueBarLabel = document.querySelector('#revenue-bar-label');
    const calculatorMessage = document.querySelector('#profit-calculator-message');
    const netCard = document.querySelector('.net-card');
    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });

    const formatCurrency = (value) => {
        const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
        return currencyFormatter.format(amount);
    };

    const safeNumber = (value) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const setMessage = (text, type = '') => {
        if (!calculatorMessage) return;
        calculatorMessage.textContent = text;
        calculatorMessage.className = 'calculator-message';
        if (type) calculatorMessage.classList.add(type);
    };

    const getFormData = () => {
        const formData = new FormData(calculatorForm);
        return {
            cropName: String(formData.get('cropName') || 'Crop'),
            landArea: safeNumber(formData.get('landArea')),
            landUnit: String(formData.get('landUnit') || 'acre'),
            expectedYield: safeNumber(formData.get('expectedYield')),
            sellingPrice: safeNumber(formData.get('sellingPrice')),
            seedCost: safeNumber(formData.get('seedCost')),
            fertilizerCost: safeNumber(formData.get('fertilizerCost')),
            pesticideCost: safeNumber(formData.get('pesticideCost')),
            laborCost: safeNumber(formData.get('laborCost')),
            irrigationCost: safeNumber(formData.get('irrigationCost')),
            machineryCost: safeNumber(formData.get('machineryCost')),
            transportationCost: safeNumber(formData.get('transportationCost')),
            otherExpenses: safeNumber(formData.get('otherExpenses'))
        };
    };

    const calculateMetrics = (data) => {
        const landAreaInAcres = data.landUnit === 'hectare' ? data.landArea * 2.47105 : data.landArea;
        const expenses = [
            { label: 'Seed cost', value: data.seedCost },
            { label: 'Fertilizer cost', value: data.fertilizerCost },
            { label: 'Pesticide cost', value: data.pesticideCost },
            { label: 'Labor cost', value: data.laborCost },
            { label: 'Irrigation cost', value: data.irrigationCost },
            { label: 'Machinery cost', value: data.machineryCost },
            { label: 'Transportation cost', value: data.transportationCost },
            { label: 'Other expenses', value: data.otherExpenses }
        ];

        const totalCost = expenses.reduce((sum, item) => sum + item.value, 0);
        const expectedHarvest = Math.max(data.expectedYield, 0);
        const revenue = expectedHarvest * data.sellingPrice;
        const netProfit = revenue - totalCost;
        const profitPerAcre = landAreaInAcres > 0 ? netProfit / landAreaInAcres : 0;
        const costPerKg = expectedHarvest > 0 ? totalCost / expectedHarvest : 0;
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
            cropName: data.cropName,
            totalCost,
            expectedHarvest,
            revenue,
            netProfit,
            profitPerAcre,
            costPerKg,
            profitMargin,
            expenses,
            landAreaInAcres
        };
    };

    const renderBreakdown = (expenses) => {
        if (!expenseBreakdownList) return;
        expenseBreakdownList.innerHTML = expenses.map((item) => `
            <li>
                <span>${item.label}</span>
                <strong>${formatCurrency(item.value)}</strong>
            </li>
        `).join('');
    };

    const renderChart = (totalCost, revenue) => {
        const safeTotal = Number.isFinite(totalCost) ? totalCost : 0;
        const safeRevenue = Number.isFinite(revenue) ? revenue : 0;
        const maxValue = Math.max(safeTotal, safeRevenue, 1);

        if (costBar) costBar.style.width = `${Math.min((safeTotal / maxValue) * 100, 100)}%`;
        if (revenueBar) revenueBar.style.width = `${Math.min((safeRevenue / maxValue) * 100, 100)}%`;
        if (costBarLabel) costBarLabel.textContent = formatCurrency(safeTotal);
        if (revenueBarLabel) revenueBarLabel.textContent = formatCurrency(safeRevenue);
    };

    const updateSummary = (metrics) => {
        totalCostValue.textContent = formatCurrency(metrics.totalCost);
        expectedRevenueValue.textContent = formatCurrency(metrics.revenue);
        netProfitValue.textContent = formatCurrency(metrics.netProfit);
        profitPerAcreValue.textContent = formatCurrency(metrics.profitPerAcre);
        costPerKgValue.textContent = formatCurrency(metrics.costPerKg);
        const formattedMargin = Number.isFinite(metrics.profitMargin) ? `${metrics.profitMargin >= 0 ? '+' : '-'}${Math.abs(metrics.profitMargin).toFixed(2)}%` : '0.00%';
        profitMarginValue.textContent = formattedMargin;

        if (metrics.netProfit > 0) {
            netProfitValue.textContent = `+${formatCurrency(metrics.netProfit)}`;
            netCard?.classList.remove('negative');
            netCard?.classList.add('positive');
        } else if (metrics.netProfit < 0) {
            netProfitValue.textContent = `-${formatCurrency(Math.abs(metrics.netProfit))}`;
            netCard?.classList.remove('positive');
            netCard?.classList.add('negative');
        } else {
            netProfitValue.textContent = formatCurrency(0);
            netCard?.classList.remove('positive', 'negative');
        }

        if (metrics.netProfit > 0) {
            setMessage(`${metrics.cropName} is expected to be profitable.`, 'success');
        } else if (metrics.netProfit < 0) {
            setMessage(`${metrics.cropName} is expected to incur a loss.`, 'error');
        } else {
            setMessage(`${metrics.cropName} is estimated to break even.`, 'success');
        }

        renderBreakdown(metrics.expenses);
        renderChart(metrics.totalCost, metrics.revenue);
    };

    const validateFieldValues = (data) => {
        const errors = [];

        if (data.landArea <= 0) {
            errors.push('Land area must be greater than zero.');
        }

        if (data.expectedYield < 0) {
            errors.push('Expected crop yield cannot be negative.');
        }

        if (data.sellingPrice < 0) {
            errors.push('Selling price cannot be negative.');
        }

        const expenseKeys = [
            ['seedCost', 'Seed cost'],
            ['fertilizerCost', 'Fertilizer cost'],
            ['pesticideCost', 'Pesticide cost'],
            ['laborCost', 'Labor cost'],
            ['irrigationCost', 'Irrigation cost'],
            ['machineryCost', 'Machinery cost'],
            ['transportationCost', 'Transportation cost'],
            ['otherExpenses', 'Other expenses']
        ];

        expenseKeys.forEach(([key, label]) => {
            if (data[key] < 0) {
                errors.push(`${label} cannot be negative.`);
            }
        });

        return errors;
    };

    const calculateCurrentFormValues = () => {
        const data = getFormData();
        const validationErrors = validateFieldValues(data);

        if (validationErrors.length > 0) {
            setMessage(validationErrors[0], 'error');
            totalCostValue.textContent = '₹0';
            expectedRevenueValue.textContent = '₹0';
            netProfitValue.textContent = '₹0';
            profitPerAcreValue.textContent = '₹0';
            costPerKgValue.textContent = '₹0';
            profitMarginValue.textContent = '0%';
            renderBreakdown([
                { label: 'Seed cost', value: 0 },
                { label: 'Fertilizer cost', value: 0 },
                { label: 'Pesticide cost', value: 0 },
                { label: 'Labor cost', value: 0 },
                { label: 'Irrigation cost', value: 0 },
                { label: 'Machinery cost', value: 0 },
                { label: 'Transportation cost', value: 0 },
                { label: 'Other expenses', value: 0 }
            ]);
            renderChart(0, 0);
            return;
        }

        const metrics = calculateMetrics(data);
        updateSummary(metrics);
    };

    const resetCalculator = () => {
        calculatorForm.reset();
        const cropField = calculatorForm.querySelector('#crop-name');
        if (cropField) cropField.value = 'Rice';
        const landUnitField = calculatorForm.querySelector('#land-unit');
        if (landUnitField) landUnitField.value = 'acre';
        const defaultValues = {
            'land-area': 2,
            'expected-yield': 3200,
            'selling-price': 28,
            'seed-cost': 2200,
            'fertilizer-cost': 4600,
            'pesticide-cost': 2100,
            'labor-cost': 5200,
            'irrigation-cost': 2800,
            'machinery-cost': 3500,
            'transportation-cost': 1800,
            'other-expenses': 1500
        };

        Object.entries(defaultValues).forEach(([id, value]) => {
            const input = calculatorForm.querySelector(`#${id}`);
            if (input) input.value = value;
        });

        setMessage('');
        calculateCurrentFormValues();
    };

    const downloadSummary = () => {
        const data = getFormData();
        const metrics = calculateMetrics(data);
        const summaryText = [
            `Crop: ${metrics.cropName}`,
            `Land Area: ${metrics.landAreaInAcres.toFixed(2)} acres`,
            `Total Cost: ${formatCurrency(metrics.totalCost)}`,
            `Expected Revenue: ${formatCurrency(metrics.revenue)}`,
            `Estimated Profit/Loss: ${formatCurrency(metrics.netProfit)}`,
            `Profit per Acre: ${formatCurrency(metrics.profitPerAcre)}`,
            `Cost per Kg: ${formatCurrency(metrics.costPerKg)}`,
            `Profit Margin: ${Number.isFinite(metrics.profitMargin) ? metrics.profitMargin.toFixed(2) : '0.00'}%`,
            '',
            'These results are estimates based on your inputs. Actual cultivation costs, crop yields, and selling prices may vary.'
        ].join('\n');

        const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'farming-cost-profit-summary.txt';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    calculatorForm.addEventListener('submit', (event) => {
        event.preventDefault();
        calculateCurrentFormValues();
    });

    calculatorForm.addEventListener('input', () => {
        calculateCurrentFormValues();
    });

    document.querySelector('#edit-calculation-btn')?.addEventListener('click', () => {
        calculatorForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusTarget = calculatorForm.querySelector('#crop-name');
        focusTarget?.focus();
    });

    document.querySelector('#recalculate-btn')?.addEventListener('click', calculateCurrentFormValues);
    document.querySelector('#reset-calculator-btn')?.addEventListener('click', resetCalculator);
    document.querySelector('#print-summary-btn')?.addEventListener('click', () => window.print());
    document.querySelector('#download-summary-btn')?.addEventListener('click', downloadSummary);

    calculateCurrentFormValues();
})();
