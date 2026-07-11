// ===== DOM ELEMENTS =====
const cartContainer = document.getElementById("cartContainer");

// ===== LOAD CART ON PAGE LOAD =====
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    updateCartCount();
    checkAuthStatus();
});

// ===== 1. LOAD CART ITEMS =====
async function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-4x text-muted mb-4"></i>
                <h3>Your cart is empty</h3>
                <p class="text-muted">Looks like you haven't added any items yet.</p>
                <a href="index.html" class="btn btn-primary mt-3">
                    <i class="fas fa-arrow-left me-2"></i>Start Shopping
                </a>
            </div>
        `;
        return;
    }

    try {
        // Get product details for each cart item
        const productPromises = cart.map((item) =>
            fetch(`${API_URL}/products/${item.id}`).then((res) => res.json()),
        );

        const productResponses = await Promise.all(productPromises);
        const products = productResponses.map((res) => res.product);

        displayCartItems(products, cart);
    } catch (error) {
        console.error("Error loading cart:", error);
        cartContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4>Error loading cart</h4>
                <p class="text-muted">Please try again later.</p>
                <button class="btn btn-primary" onclick="loadCart()">
                    <i class="fas fa-sync me-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// ===== 2. DISPLAY CART ITEMS =====
function displayCartItems(products, cart) {
    let total = 0;
    let itemsHTML = "";

    products.forEach((product) => {
        const cartItem = cart.find((item) => item.id === product._id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const itemTotal = product.price * quantity;
        total += itemTotal;

        itemsHTML += `
            <div class="row align-items-center border-bottom py-3" id="cart-item-${product._id}">
                <div class="col-md-3 col-12 text-center text-md-start">
                    <img src="${product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/100x100?text=No+Image"}" 
                         alt="${product.name}"
                         class="img-fluid rounded"
                         style="max-height: 100px; object-fit: contain;">
                </div>
                <div class="col-md-3 col-12">
                    <h5 class="fw-bold">${product.name}</h5>
                    <p class="text-muted small">${product.category || "Uncategorized"}</p>
                </div>
                <div class="col-md-2 col-12">
                    <p class="fw-bold">Rs. ${product.price.toFixed(2)}</p>
                </div>
                <div class="col-md-2 col-12">
                    <div class="d-flex align-items-center">
                        <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity('${product._id}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="mx-3 fw-bold" id="qty-${product._id}">${quantity}</span>
                        <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity('${product._id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-2 col-12 text-end">
                    <p class="fw-bold text-primary">Rs. ${itemTotal.toFixed(2)}</p>
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart('${product._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    // Checkout Section
    cartContainer.innerHTML = `
        ${itemsHTML}
        
        <!-- Cart Summary -->
        <div class="row mt-4">
            <div class="col-md-6 offset-md-6">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title fw-bold">Order Summary</h5>
                        <hr>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Subtotal</span>
                            <span>Rs. ${total.toFixed(2)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Shipping</span>
                            <span>${total > 0 ? "$5.00" : "$0.00"}</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between fw-bold fs-5">
                            <span>Total</span>
                            <span>Rs. ${(total + (total > 0 ? 5 : 0)).toFixed(2)}</span>
                        </div>
                        <button class="btn btn-primary w-100 mt-3" onclick="checkout()" ${total === 0 ? "disabled" : ""}>
                            <i class="fas fa-credit-card me-2"></i>Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== 3. UPDATE QUANTITY =====
window.updateQuantity = function (productId, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemIndex = cart.findIndex((item) => item.id === productId);

    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;

        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
        loadCart(); // Reload cart display
    }
};

// ===== 4. REMOVE FROM CART =====
window.removeFromCart = function (productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter((item) => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCart(); // Reload cart display
    showToast("Item removed from cart! 🗑️");
};

// ===== 5. CHECKOUT =====
window.checkout = async function () {
    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login to checkout! 🔐", "error");
        const loginModal = new bootstrap.Modal(
            document.getElementById("loginModal"),
        );
        loginModal.show();
        return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        showToast("Your cart is empty! 🛒", "error");
        return;
    }

    try {
        // Get product details for each cart item
        const productPromises = cart.map((item) =>
            fetch(`${API_URL}/products/${item.id}`).then((res) => res.json()),
        );
        const productResponses = await Promise.all(productPromises);
        const products = productResponses.map((res) => res.product);

        // Prepare order items
        const orderItems = cart.map((item, index) => ({
            product: item.id,
            name: products[index].name,
            price: products[index].price,
            quantity: item.quantity,
        }));

        // Calculate total
        let total = 0;
        orderItems.forEach((item) => {
            total += item.price * item.quantity;
        });

        // Create order
        const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                items: orderItems,
                total: total + 5, // Shipping
                shippingAddress: {
                    street: "123 Main St",
                    city: "Karachi",
                    state: "Sindh",
                    zip: "12345",
                    country: "Pakistan",
                },
                paymentMethod: "credit_card",
            }),
        });

        const data = await response.json();

        if (data.success) {
            showToast("Order placed successfully! 🎉");
            localStorage.removeItem("cart");
            updateCartCount();
            loadCart();
        } else {
            showToast(data.message || "Order failed", "error");
        }
    } catch (error) {
        console.error("Checkout error:", error);
        showToast("Network error. Please try again.", "error");
    }
};

// ===== 6. SHOW TOAST NOTIFICATION =====
function showToast(message, type = "success") {
    const toastContainer =
        document.getElementById("toastContainer") || createToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast show align-items-center text-white bg-${type === "error" ? "danger" : "success"} border-0`;
    toast.role = "alert";
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== 7. CREATE TOAST CONTAINER =====
function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
}
