document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        sortingAlgorithm: document.getElementById('sorting-algorithm'),
        sortingProperty: document.getElementById('sorting-property'),
        runSorting: document.getElementById('run-sorting'),
        resetSorting: document.getElementById('reset-sorting'),
        sortingVisualization: document.querySelector('.sorting-visualization'),
        timeComplexity: document.getElementById('time-complexity'),
        spaceComplexity: document.getElementById('space-complexity'),
        comparisonCount: document.getElementById('comparison-count'),
        swapCount: document.getElementById('swap-count'),
        knapsackCapacity: document.getElementById('knapsack-capacity'),
        capacityValue: document.getElementById('capacity-value'),
        runKnapsack: document.getElementById('run-knapsack'),
        knapsackResults: document.getElementById('knapsack-results'),
        capacityFill: document.getElementById('capacity-fill')
    };

    const sampleOrders = Array.from({length: 10}, (_, i) => ({
        id: i + 1,
        price: Math.floor(Math.random() * 50) + 10,
        items: Math.floor(Math.random() * 5) + 1,
        date: new Date(Date.now() - (Math.floor(Math.random() * 14) * 86400000))
    }));

    function initSortingVisualization() {
        elements.sortingVisualization.innerHTML = '';
        const property = elements.sortingProperty.value;
        const maxValue = Math.max(...sampleOrders.map(order => 
            property === 'price' ? order.price : 
            property === 'items' ? order.items : 
            14 - Math.floor((Date.now() - order.date.getTime()) / 86400000)
        ));

        sampleOrders.forEach(order => {
            const value = property === 'price' ? order.price : 
                         property === 'items' ? order.items : 
                         14 - Math.floor((Date.now() - order.date.getTime()) / 86400000);
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${(value / maxValue) * 180}px`;
            bar.style.width = `${100 / sampleOrders.length - 2}%`;
            bar.setAttribute('data-bs-toggle', 'tooltip');
            bar.setAttribute('title', `Order #${order.id}: ₹${order.price}, ${order.items} items`);
            bar.dataset.value = value;
            bar.dataset.orderId = order.id;
            elements.sortingVisualization.appendChild(bar);
        });

        elements.comparisonCount.textContent = '0';
        elements.swapCount.textContent = '0';
    }

    function updateComplexityInfo(algorithm) {
        const complexities = {
            bubble: {time: 'O(n²)', space: 'O(1)'},
            insertion: {time: 'O(n²)', space: 'O(1)'},
            selection: {time: 'O(n²)', space: 'O(1)'},
            quick: {time: 'O(n log n) average, O(n²) worst case', space: 'O(log n)'}
        };
        elements.timeComplexity.textContent = complexities[algorithm].time;
        elements.spaceComplexity.textContent = complexities[algorithm].space;
    }

    async function runSorting() {
        const algorithm = elements.sortingAlgorithm.value;
        updateComplexityInfo(algorithm);
        const bars = elements.sortingVisualization.querySelectorAll('.bar');
        const values = Array.from(bars).map(bar => parseFloat(bar.dataset.value));
        let comparisons = 0, swaps = 0;

        function updateCounters() {
            elements.comparisonCount.textContent = comparisons;
            elements.swapCount.textContent = swaps;
        }

        async function visualSwap(i, j) {
            bars[i].style.backgroundColor = bars[j].style.backgroundColor = 'var(--bs-danger)';
            await new Promise(r => setTimeout(r, 100));
            [bars[i].style.height, bars[j].style.height] = [bars[j].style.height, bars[i].style.height];
            [bars[i].dataset.value, bars[j].dataset.value] = [bars[j].dataset.value, bars[i].dataset.value];
            [bars[i].dataset.orderId, bars[j].dataset.orderId] = [bars[j].dataset.orderId, bars[i].dataset.orderId];
            bars[i].style.backgroundColor = bars[j].style.backgroundColor = 'var(--bs-primary)';
            swaps++;
            updateCounters();
            await new Promise(r => setTimeout(r, 50));
        }

        function compare(a, b) {
            comparisons++;
            updateCounters();
            return a > b;
        }

        async function bubbleSort() {
            const n = values.length;
            for (let i = 0; i < n - 1; i++) {
                let swapped = false;
                for (let j = 0; j < n - i - 1; j++) {
                    if (compare(values[j], values[j + 1])) {
                        [values[j], values[j + 1]] = [values[j + 1], values[j]];
                        await visualSwap(j, j + 1);
                        swapped = true;
                    }
                }
                if (!swapped) break;
            }
        }

        async function insertionSort() {
            const n = values.length;
            for (let i = 1; i < n; i++) {
                const key = values[i];
                let j = i - 1;
                while (j >= 0 && compare(values[j], key)) {
                    values[j + 1] = values[j];
                    await visualSwap(j, j + 1);
                    j--;
                }
                values[j + 1] = key;
            }
        }

        async function selectionSort() {
            const n = values.length;
            for (let i = 0; i < n - 1; i++) {
                let minIndex = i;
                for (let j = i + 1; j < n; j++) {
                    if (compare(values[minIndex], values[j])) minIndex = j;
                }
                if (minIndex !== i) {
                    [values[i], values[minIndex]] = [values[minIndex], values[i]];
                    await visualSwap(i, minIndex);
                }
            }
        }

        async function quickSort(left = 0, right = values.length - 1) {
            if (left < right) {
                const pivotIndex = await partition(left, right);
                await quickSort(left, pivotIndex - 1);
                await quickSort(pivotIndex + 1, right);
            }
        }

        async function partition(left, right) {
            const pivot = values[right];
            let i = left - 1;
            for (let j = left; j < right; j++) {
                if (!compare(values[j], pivot)) {
                    i++;
                    [values[i], values[j]] = [values[j], values[i]];
                    await visualSwap(i, j);
                }
            }
            [values[i + 1], values[right]] = [values[right], values[i + 1]];
            await visualSwap(i + 1, right);
            return i + 1;
        }

        switch (algorithm) {
            case 'bubble': await bubbleSort(); break;
            case 'insertion': await insertionSort(); break;
            case 'selection': await selectionSort(); break;
            case 'quick': await quickSort(); break;
        }
    }

    function updateCapacityValue() {
        elements.capacityValue.textContent = elements.knapsackCapacity.value;
    }
    async function runKnapsack() {
        const capacity = parseInt(elements.knapsackCapacity.value);
        const orderCheckboxes = document.querySelectorAll('#order-selection .form-check-input:checked');
        
        if (orderCheckboxes.length === 0) {
            alert('Please select at least one order for optimization.');
            return;
        }
    
        elements.knapsackResults.innerHTML = `
            <div class="text-center my-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Running optimization algorithm...</p>
            </div>
        `;
    
       
    try {
        const response = await fetch('/api/optimize-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                order_ids: Array.from(orderCheckboxes).map(cb => parseInt(cb.value)),
                capacity: parseInt(elements.knapsackCapacity.value)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result || !result.success) {
            throw new Error(result?.error || 'Optimization failed without details');
        }

        // Ensure required fields exist
        const safeResult = {
            optimized_orders: result.optimized_orders || [],
            total_value: result.total_value || 0,
            total_weight: result.total_weight || 0,
            capacity: result.capacity || parseInt(elements.knapsackCapacity.value),
            capacity_utilization: result.capacity_utilization || 0
        };

        displayKnapsackResults(safeResult);
        
    } catch (error) {
        console.error('Optimization Error:', error);
        elements.knapsackResults.innerHTML = `
            <div class="alert alert-danger">
                ${error.message || 'Failed to optimize orders'}
            </div>
        `;
    }
}
    function displayKnapsackResults(result) {
        // Safely set capacity fill with fallback
        const utilization = result.capacity_utilization || 0;
        elements.capacityFill.style.width = `${utilization}%`;
    
        // Safely get values with defaults
        const orderCount = result.optimized_orders?.length || 0;
        const totalValue = result.total_value || 0;
        const totalWeight = result.total_weight || 0;
        const capacity = result.capacity || 0;
    
        let resultsHtml = `
            <div class="mb-3">
                <div class="alert alert-success">
                    <strong>Optimization Complete!</strong><br>
                    Selected ${orderCount} orders with total value ₹${totalValue.toFixed(2)}
                    using ${totalWeight} of ${capacity} capacity (${utilization.toFixed(1)}%).
                </div>
            </div>
            <div class="mb-3">
                <h6>Selected Orders:</h6>
                <div class="selected-orders">
        `;
        if (result.optimized_orders && result.optimized_orders.length) {
            result.optimized_orders.forEach(order => {
                const orderValue = order.value || 0;
                const orderWeight = order.weight || 0;
                const customer = order.customer || 'Unknown';
                const date = order.date || 'Unknown date';
                
                resultsHtml += `
                    <div class="knapsack-item selected mb-2">
                        Order #${order.id || 'N/A'}: ₹${orderValue.toFixed(2)} - ${orderWeight} items
                        <small class="d-block">${customer} - ${date}</small>
                    </div>
                `;
            });
        } else {
            resultsHtml += `
                <div class="alert alert-warning">
                    No orders were selected in the optimization.
                </div>
            `;
        }
        
        elements.knapsackResults.innerHTML = resultsHtml + `</div></div>`;
    }
    elements.runSorting?.addEventListener('click', runSorting);
    elements.resetSorting?.addEventListener('click', initSortingVisualization);
    elements.sortingProperty?.addEventListener('change', initSortingVisualization);
    elements.knapsackCapacity?.addEventListener('input', updateCapacityValue);
    elements.runKnapsack?.addEventListener('click', runKnapsack);

    if (elements.sortingVisualization) initSortingVisualization();
    if (elements.capacityValue && elements.knapsackCapacity) updateCapacityValue();
});