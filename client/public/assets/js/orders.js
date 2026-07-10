// ===== LOAD ORDERS ON PAGE LOAD =====
document.addEventListener("DOMContentLoaded", () => {
    loadUserOrders();
    updateCartCount();
    checkAuthStatus();
});

// ===== LOAD USER ORDERS =====
async function loadUserOrders() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("ordersContainer");

    if (!token) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-lock fa-3x text-muted mb-3"></i>
                <h4>Please Login to View Orders</h4>
                <p class="text-muted">Login to see your order history</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
                    <i class="fas fa-sign-in-alt me-2"></i>Login
                </button>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/orders/myorders`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        const data = await response.json();

        if (data.success && data.orders.length > 0) {
            container.innerHTML = data.orders
                .map(
                    (order) => `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h6 class="fw-bold">Order #${order._id.slice(-6)}</h6>
                            <span class="badge bg-${order.status === "completed" ? "success" : order.status === "cancelled" ? "danger" : "warning"}">
                                ${order.status || "pending"}
                            </span>
                        </div>
                        <p class="text-muted small">${new Date(order.createdAt).toLocaleDateString()}</p>
                        <hr>
                        ${order.items
                            .map(
                                (item) => `
                            <div class="d-flex justify-content-between">
                                <span>${item.name} × ${item.quantity}</span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `,
                            )
                            .join("")}
                        <hr>
                        <div class="d-flex justify-content-between fw-bold">
                            <span>Total</span>
                            <span>$${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `,
                )
                .join("");
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h4>No Orders Yet</h4>
                    <p class="text-muted">Start shopping to see your orders here</p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-shopping-bag me-2"></i>Start Shopping
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading orders:", error);
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h4>Error Loading Orders</h4>
                <p class="text-muted">Please try again later</p>
                <button class="btn btn-primary" onclick="loadUserOrders()">
                    <i class="fas fa-sync me-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// ===== UPDATE CART COUNT =====
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById("cartCount");
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// ===== CHECK AUTH STATUS =====
function checkAuthStatus() {
    const token = localStorage.getItem("token");
    const authLinks = document.getElementById("authLinks");

    if (token) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        authLinks.innerHTML = `
            <div class="dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i>${user.name || "User"}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                    <li><a class="dropdown-item" href="orders.html"><i class="fas fa-shopping-bag me-2"></i>Orders</a></li>
                    ${
                        user.role === "admin"
                            ? `
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="admin/dashboard.html"><i class="fas fa-cog me-2"></i>Admin Panel</a></li>
                    `
                            : ""
                    }
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
    } else {
        authLinks.innerHTML = `
            <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">
                <i class="fas fa-user me-1"></i>Login
            </a>
        `;
    }
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}
