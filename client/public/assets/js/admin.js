// ===== API BASE URL =====
const API_URL = "http://localhost:5000/api";

// ===== CHECK ADMIN AUTH =====
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || user.role !== "admin") {
        window.location.href = "../index.html";
        return;
    }

    // Page-specific functions
    const path = window.location.pathname;
    if (path.includes("dashboard.html")) {
        loadDashboard();
    } else if (path.includes("products.html")) {
        loadProducts();
    } else if (path.includes("orders.html")) {
        loadOrders();
    } else if (path.includes("users.html")) {
        loadUsers();
    }
});

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const token = localStorage.getItem("token");

        // Get products count
        const productsRes = await fetch(`${API_URL}/products`);
        const productsData = await productsRes.json();
        document.getElementById("totalProducts").textContent =
            productsData.count || 0;

        // Get orders (will implement later)
        document.getElementById("totalOrders").textContent = "0";
        document.getElementById("totalUsers").textContent = "0";
        document.getElementById("totalRevenue").textContent = "$0";

        // Recent orders placeholder
        document.getElementById("recentOrders").innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    <i class="fas fa-box me-2"></i>No recent orders
                </td>
            </tr>
        `;
    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

// ===== PRODUCTS (Admin) =====
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        const tbody = document.getElementById("productsTableBody");
        if (!tbody) return;

        const noImage =
            "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect width=%2250%22 height=%2250%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3ENo%3C/text%3E%3C/svg%3E";

        if (!data.success || data.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-box-open fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No products found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.products
            .map(
                (product) => `
            <tr>
                <td>
                    <img src="${product.images && product.images.length > 0 ? "http://localhost:5000" + product.images[0] : noImage}" 
                         alt="${product.name}"
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                </td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td><span class="badge bg-${product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "danger"}">${product.stock}</span></td>
                <td>${product.category || "Uncategorized"}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editProduct('${product._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
            )
            .join("");
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// ===== ORDERS =====
async function loadOrders() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();

        const tbody = document.getElementById("ordersTableBody");
        if (!tbody) return;

        if (!data.success || data.orders?.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-box-open fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No orders found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.orders
            .map(
                (order) => `
            <tr>
                <td>#${order._id.slice(-6)}</td>
                <td>${order.user?.name || "Guest"}</td>
                <td>$${order.total?.toFixed(2) || "0.00"}</td>
                <td>
                    <span class="badge bg-${order.status === "completed" ? "success" : order.status === "pending" ? "warning" : "danger"}">
                        ${order.status || "pending"}
                    </span>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `,
            )
            .join("");
    } catch (error) {
        console.error("Error loading orders:", error);
    }
}

// ===== USERS =====
async function loadUsers() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();

        const tbody = document.getElementById("usersTableBody");
        if (!tbody) return;

        if (!data.success || data.users?.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-users fa-2x text-muted mb-2"></i>
                        <p class="text-muted">No users found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.users
            .map(
                (user) => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-${user.role === "admin" ? "warning" : "secondary"}">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
            )
            .join("");
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

// ===== PRODUCT ACTIONS =====
window.editProduct = function (id) {
    alert("Edit product: " + id);
};

window.deleteProduct = async function (id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();

        if (data.success) {
            alert("Product deleted successfully!");
            loadProducts();
        } else {
            alert(data.message || "Failed to delete product");
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Network error");
    }
};

window.showAddProduct = function () {
    alert("Add product form will open here");
};

// ===== ORDER ACTIONS =====
window.viewOrder = function (id) {
    alert("View order: " + id);
};

// ===== USER ACTIONS =====
window.deleteUser = function (id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    alert("Delete user: " + id);
};

// ===== ADD PRODUCT (With Image) =====
document
    .getElementById("addProductForm")
    ?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            return;
        }

        const formData = new FormData();
        formData.append("name", document.getElementById("pName").value);
        formData.append("slug", document.getElementById("pSlug").value);
        formData.append(
            "description",
            document.getElementById("pDescription").value,
        );
        formData.append("price", document.getElementById("pPrice").value);
        formData.append("category", document.getElementById("pCategory").value);
        formData.append("stock", document.getElementById("pStock").value);

        const imageFile = document.getElementById("pImage").files[0];
        if (imageFile) {
            formData.append("images", imageFile);
        }

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Product added successfully!");
                bootstrap.Modal.getInstance(
                    document.getElementById("addProductModal"),
                ).hide();
                document.getElementById("addProductForm").reset();
                loadProducts();
            } else {
                alert("❌ " + (data.message || "Failed to add product"));
            }
        } catch (error) {
            console.error("Error adding product:", error);
            alert("❌ Network error. Please try again.");
        }
    });
// ===== AUTO-GENERATE SLUG FROM NAME =====
document.getElementById("pName")?.addEventListener("input", function () {
    const slug = this.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    document.getElementById("pSlug").value = slug;
});
