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
        loadProducts(1);
    } else if (path.includes("orders.html")) {
        loadOrders();
    } else if (path.includes("users.html")) {
        loadUsers();
    }

    // Search on input
    document
        .getElementById("adminSearchInput")
        ?.addEventListener("input", filterAdminProducts);
    document
        .getElementById("adminCategoryFilter")
        ?.addEventListener("change", filterAdminProducts);
    document
        .getElementById("adminStockFilter")
        ?.addEventListener("change", filterAdminProducts);
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
let adminCurrentPage = 1;
const adminProductsPerPage = 5;
let adminSearchKeyword = "";
let adminCategoryFilter = "";
let adminStockFilter = "";

async function loadProducts(page = 1) {
    try {
        adminCurrentPage = page;

        // Build query string with filters
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", adminProductsPerPage);
        if (adminSearchKeyword) params.append("keyword", adminSearchKeyword);
        if (adminCategoryFilter) params.append("category", adminCategoryFilter);
        if (adminStockFilter === "instock") params.append("minStock", "1");
        if (adminStockFilter === "outofstock") params.append("maxStock", "0");
        if (adminStockFilter === "lowstock") params.append("maxStock", "10");

        const response = await fetch(
            `${API_URL}/products?${params.toString()}`,
        );
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
            const oldPagination = document.getElementById("adminPagination");
            if (oldPagination) oldPagination.remove();
            return;
        }

        tbody.innerHTML = data.products
            .map(
                (product) => `
            <tr>
                <td>
                    <img src="${
                        product.images && product.images.length > 0
                            ? "http://localhost:5000" + product.images[0]
                            : noImage
                    }" 
                         alt="${product.name}"
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                </td>
                <td>${product.name}</td>
                <td>Rs. ${product.price.toFixed(2)}</td>
                <td>${product.numReviews || 0}</td>
                <td>
                    <span class="badge bg-${
                        product.stock > 10
                            ? "success"
                            : product.stock > 0
                              ? "warning"
                              : "danger"
                    }">
                        ${
                            product.stock > 10
                                ? "✅ In Stock"
                                : product.stock > 0
                                  ? "⚠️ Low Stock"
                                  : "❌ Out of Stock"
                        }
                    </span>
                    <span class="d-block small text-muted">${product.stock} units</span>
                </td>
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

        displayAdminPagination(data.pagination);
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// ===== ADMIN PAGINATION =====
function displayAdminPagination(pagination) {
    const { total, page, pages } = pagination;

    const oldPagination = document.getElementById("adminPagination");
    if (oldPagination) oldPagination.remove();

    if (pages <= 1) return;

    const tableContainer = document.querySelector(".card-body");
    if (!tableContainer) return;

    const container = document.createElement("div");
    container.id = "adminPagination";
    container.className =
        "d-flex justify-content-between align-items-center mt-3";

    let paginationHTML = `
        <span class="text-muted small">Showing ${(page - 1) * pagination.limit + 1} - ${Math.min(
            page * pagination.limit,
            total,
        )} of ${total} products</span>
        <ul class="pagination pagination-sm mb-0">
    `;

    paginationHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
            <button class="page-link" onclick="loadProducts(${page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;

    for (let i = 1; i <= pages; i++) {
        paginationHTML += `
            <li class="page-item ${i === page ? "active" : ""}">
                <button class="page-link" onclick="loadProducts(${i})">${i}</button>
            </li>
        `;
    }

    paginationHTML += `
        <li class="page-item ${page === pages ? "disabled" : ""}">
            <button class="page-link" onclick="loadProducts(${page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;

    paginationHTML += `</ul>`;
    container.innerHTML = paginationHTML;
    tableContainer.appendChild(container);
}

// ===== FILTER FUNCTIONS =====
function filterAdminProducts() {
    adminSearchKeyword =
        document.getElementById("adminSearchInput")?.value || "";
    adminCategoryFilter =
        document.getElementById("adminCategoryFilter")?.value || "";
    adminStockFilter = document.getElementById("adminStockFilter")?.value || "";
    loadProducts(1);
}

function clearAdminFilters() {
    document.getElementById("adminSearchInput").value = "";
    document.getElementById("adminCategoryFilter").value = "";
    document.getElementById("adminStockFilter").value = "";
    adminSearchKeyword = "";
    adminCategoryFilter = "";
    adminStockFilter = "";
    loadProducts(1);
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

        if (data.success && data.orders) {
            updateOrderStats(data.orders);
        }

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
                <td>Rs. ${order.total?.toFixed(2) || "0.00"}</td>
                <td>
                    <span class="badge bg-${
                        order.status === "completed"
                            ? "success"
                            : order.status === "processing"
                              ? "info"
                              : order.status === "cancelled"
                                ? "danger"
                                : "warning"
                    }">
                        ${order.status || "pending"}
                    </span>
                </td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    <select class="form-select form-select-sm" id="status-${
                        order._id
                    }" name="status-${order._id}" onchange="updateOrderStatus('${
                        order._id
                    }', this.value)">
                        <option value="pending" ${
                            order.status === "pending" ? "selected" : ""
                        }>Pending</option>
                        <option value="processing" ${
                            order.status === "processing" ? "selected" : ""
                        }>Processing</option>
                        <option value="completed" ${
                            order.status === "completed" ? "selected" : ""
                        }>Completed</option>
                        <option value="cancelled" ${
                            order.status === "cancelled" ? "selected" : ""
                        }>Cancelled</option>
                    </select>
                </td>
            </tr>
        `,
            )
            .join("");
    } catch (error) {
        console.error("Error loading orders:", error);
    }
}

// ===== UPDATE ORDER STATS =====
function updateOrderStats(orders) {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const processing = orders.filter((o) => o.status === "processing").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;

    document.getElementById("totalOrders").textContent = total;
    document.getElementById("completedOrders").textContent = completed;
    document.getElementById("pendingOrders").textContent = pending;
    document.getElementById("processingOrders").textContent = processing;
    document.getElementById("cancelledOrders").textContent = cancelled;
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
                <td><span class="badge bg-${
                    user.role === "admin" ? "warning" : "secondary"
                }">${user.role}</span></td>
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
    // Load product data in edit modal
    fetch(`${API_URL}/products/${id}`)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                const product = data.product;
                document.getElementById("editProductId").value = product._id;
                document.getElementById("editName").value = product.name;
                document.getElementById("editSlug").value = product.slug;
                document.getElementById("editDescription").value =
                    product.description;
                document.getElementById("editPrice").value = product.price;
                document.getElementById("editCategory").value =
                    product.category;
                document.getElementById("editStock").value = product.stock;

                const modal = new bootstrap.Modal(
                    document.getElementById("editProductModal"),
                );
                modal.show();
            }
        })
        .catch((err) => {
            console.error("Error loading product:", err);
            alert("Failed to load product data");
        });
};

// ===== DELETE PRODUCT - Show Confirmation Modal =====
let productToDelete = null;

window.deleteProduct = function (id) {
    fetch(`${API_URL}/products/${id}`)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                productToDelete = id;
                document.getElementById("deleteProductName").textContent =
                    `"${data.product.name}"`;
                const modal = new bootstrap.Modal(
                    document.getElementById("deleteProductModal"),
                );
                modal.show();
            }
        })
        .catch((err) => {
            console.error("Error fetching product:", err);
            alert("Failed to load product details");
        });
};

// ===== CONFIRM DELETE =====
document
    .getElementById("confirmDeleteBtn")
    ?.addEventListener("click", async function () {
        if (!productToDelete) return;

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/products/${productToDelete}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            bootstrap.Modal.getInstance(
                document.getElementById("deleteProductModal"),
            ).hide();

            if (data.success) {
                alert("✅ Product deleted successfully!");
                productToDelete = null;
                loadProducts(adminCurrentPage);
            } else {
                alert("❌ " + (data.message || "Failed to delete product"));
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("❌ Network error. Please try again.");
        }
    });

document
    .getElementById("deleteProductModal")
    ?.addEventListener("hidden.bs.modal", function () {
        productToDelete = null;
    });

// ===== SHOW ADD PRODUCT =====
window.showAddProduct = function () {
    const modal = new bootstrap.Modal(
        document.getElementById("addProductModal"),
    );
    modal.show();
};

// ===== AUTO-GENERATE SLUG FROM NAME =====
document.getElementById("pName")?.addEventListener("input", function () {
    const slug = this.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    document.getElementById("pSlug").value = slug;
});

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
                loadProducts(adminCurrentPage);
            } else {
                alert("❌ " + (data.message || "Failed to add product"));
            }
        } catch (error) {
            console.error("Error adding product:", error);
            alert("❌ Network error. Please try again.");
        }
    });

// ===== EDIT PRODUCT - Auto Slug =====
document.getElementById("editName")?.addEventListener("input", function () {
    const slug = this.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    document.getElementById("editSlug").value = slug;
});

// ===== EDIT PRODUCT - Submit =====
document
    .getElementById("editProductForm")
    ?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            return;
        }

        const id = document.getElementById("editProductId").value;
        const formData = new FormData();
        formData.append("name", document.getElementById("editName").value);
        formData.append("slug", document.getElementById("editSlug").value);
        formData.append(
            "description",
            document.getElementById("editDescription").value,
        );
        formData.append("price", document.getElementById("editPrice").value);
        formData.append(
            "category",
            document.getElementById("editCategory").value,
        );
        formData.append("stock", document.getElementById("editStock").value);

        const imageFile = document.getElementById("editImage").files[0];
        if (imageFile) {
            formData.append("images", imageFile);
        }

        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Product updated successfully!");
                bootstrap.Modal.getInstance(
                    document.getElementById("editProductModal"),
                ).hide();
                document.getElementById("editProductForm").reset();
                loadProducts(adminCurrentPage);
            } else {
                alert("❌ " + (data.message || "Failed to update product"));
            }
        } catch (error) {
            console.error("Error updating product:", error);
            alert("❌ Network error. Please try again.");
        }
    });

// ===== ORDER ACTIONS =====
window.viewOrder = function (id) {
    alert("View order: " + id);
};

// ===== UPDATE ORDER STATUS =====
window.updateOrderStatus = async function (orderId, status) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (data.success) {
            showToast(`Order status updated to ${status}`, "success");
            loadOrders();
        } else {
            alert("❌ " + (data.message || "Failed to update order status"));
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        alert("❌ Network error. Please try again.");
    }
};

// ===== USER ACTIONS =====
window.deleteUser = function (id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    alert("Delete user: " + id);
};

// ===== SHOW TOAST NOTIFICATION =====
function showToast(message, type = "success") {
    const toastContainer =
        document.getElementById("toastContainer") || createToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast show align-items-center text-white bg-${
        type === "error" ? "danger" : "success"
    } border-0`;
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

// ===== CREATE TOAST CONTAINER =====
function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
}

// ===== FORMAT DATE (DD-MM-YYYY) =====
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}
