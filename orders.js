document.addEventListener('DOMContentLoaded', function () {
    console.log("Order system initialized!");
    console.log("orders.js loaded successfully!");
    window.testFunction = () => console.log("Test function works!");

    const orderItemsContainer = document.getElementById('order-items-container');
    const emptyOrderMessage = document.getElementById('empty-order-message');
    const orderTotalElement = document.getElementById('order-total');
    const proceedToCheckoutBtn = document.getElementById('proceed-to-checkout');

    let orderItems = [];
    let orderTotal = 0;

    function initEventListeners() {
        document.querySelectorAll('[data-category]').forEach(button => {
            button.addEventListener('click', function () {
                document.querySelectorAll('[data-category]').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const category = this.getAttribute('data-category');
                filterMenuItems(category);
            });
        });

        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('decrease-quantity')) {
                const itemId = e.target.getAttribute('data-item-id');
                const input = document.getElementById(`quantity-${itemId}`);
                if (input) {
                    const value = parseInt(input.value) || 0;
                    input.value = Math.max(0, value - 1);
                }
            }

            if (e.target.classList.contains('increase-quantity')) {
                const itemId = e.target.getAttribute('data-item-id');
                const input = document.getElementById(`quantity-${itemId}`);
                if (input) {
                    const value = parseInt(input.value) || 0;
                    input.value = Math.min(10, value + 1);
                }
            }

            if (e.target.classList.contains('add-to-order')) {
                handleAddToOrder(e.target);
            }

            if (e.target.classList.contains('remove-item')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                if (!isNaN(index)) {
                    removeItemFromOrder(index);
                }
            }
        });

        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', function () {
                if (orderItems.length > 0) {
                    placeOrder();
                }
            });
        }
    }

    function filterMenuItems(category) {
        document.querySelectorAll('.menu-item').forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            item.style.display = (category === 'all' || itemCategory === category) ? 'block' : 'none';
        });
    }

    function handleAddToOrder(button) {
        const itemId = button.getAttribute('data-item-id');
        const itemName = button.getAttribute('data-item-name');
        const itemPrice = parseFloat(button.getAttribute('data-item-price'));
        const quantityInput = document.getElementById(`quantity-${itemId}`);
        const quantity = parseInt(quantityInput?.value) || 1;

        if (quantity > 0 && !isNaN(itemPrice)) {
            const existingItemIndex = orderItems.findIndex(item => item.id === itemId);
            if (existingItemIndex !== -1) {
                const existingItem = orderItems[existingItemIndex];
                existingItem.quantity += quantity;
                existingItem.subtotal = existingItem.quantity * existingItem.price;
            } else {
                orderItems.push({
                    id: itemId,
                    name: itemName,
                    price: itemPrice,
                    quantity: quantity,
                    subtotal: itemPrice * quantity
                });
            }

            if (quantityInput) quantityInput.value = 0;

            button.innerHTML = '<i class="fas fa-check"></i> Added';
            button.classList.remove('btn-primary');
            button.classList.add('btn-success');
            setTimeout(() => {
                button.innerHTML = 'Add';
                button.classList.remove('btn-success');
                button.classList.add('btn-primary');
            }, 1500);

            updateOrderSummary();
        }
    }

    function removeItemFromOrder(index) {
        if (index >= 0 && index < orderItems.length) {
            orderItems.splice(index, 1);
            updateOrderSummary();
        }
    }

    function updateOrderSummary() {
        orderTotal = orderItems.reduce((total, item) => total + item.subtotal, 0);

        if (orderItems.length === 0) {
            if (emptyOrderMessage) emptyOrderMessage.style.display = 'block';
            if (orderItemsContainer) orderItemsContainer.innerHTML = '';
            if (proceedToCheckoutBtn) proceedToCheckoutBtn.disabled = true;
        } else {
            if (emptyOrderMessage) emptyOrderMessage.style.display = 'none';
            if (orderItemsContainer) {
                orderItemsContainer.innerHTML = orderItems.map((item, index) => `
                    <div class="order-item d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span class="fw-bold">${item.name}</span>
                            <span class="text-muted ms-2">x${item.quantity}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="me-2">₹${item.subtotal.toFixed(2)}</span>
                            <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
            if (proceedToCheckoutBtn) proceedToCheckoutBtn.disabled = false;
        }

        if (orderTotalElement) {
            orderTotalElement.textContent = `₹${orderTotal.toFixed(2)}`;
        }
    }

    function placeOrder() {
        const orderData = {
            customer_name: "Anonymous",
            email: "",
            phone: "",
            address: "",
            items: JSON.stringify(orderItems.map(item => ({
                id: parseInt(item.id),
                quantity: item.quantity
            }))),
            total: orderTotal,
            instructions: ""
        };

        fetch('/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.href = data.redirect;
                } else {
                    throw new Error(data.message || 'Failed to place order');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            });
    }

    initEventListeners();
});
