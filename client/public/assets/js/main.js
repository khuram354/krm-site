// ===== API BASE URL =====
const API_URL = "http://localhost:5000/api";

// ===== DOM ELEMENTS =====
const productContainer = document.getElementById("productContainer");
const cartCount = document.getElementById("cartCount");

// Agar cartCount nahi mila toh dummy create karein
if (!cartCount) {
    console.warn("cartCount element not found, creating dummy");
    // Cart page par cartCount nahi hai, isliye ignore karein
}

// ===== LOAD PRODUCTS ON PAGE LOAD =====
document.addEventListener("DOMContentLoaded", () => {
    if (productContainer) {
        loadProducts(1);
    }
    updateCartCount();
    checkAuthStatus();
});

// ===== 1. LOAD ALL PRODUCTS =====
let currentPage = 1;
const productsPerPage = 8;

async function loadProducts(page = 1) {
    try {
        currentPage = page;
        const response = await fetch(
            `${API_URL}/products?page=${page}&limit=${productsPerPage}`,
        );
        const data = await response.json();

        if (data.success) {
            displayProducts(data.products);
            displayPagination(data.pagination);
        } else {
            showError("Failed to load products");
        }
    } catch (error) {
        console.error("Error loading products:", error);
        showError("Network error. Please try again.");
    }
}

// ===== DISPLAY PAGINATION =====
function displayPagination(pagination) {
    const { total, page, pages } = pagination;

    // Remove old pagination if exists
    const oldPagination = document.getElementById("paginationContainer");
    if (oldPagination) oldPagination.remove();

    if (pages <= 1) return;
    // 👇 CHECK: productContainer exists
    if (!productContainer) {
        console.warn("Product container not found");
        return;
    }

    // Create pagination container
    const container = document.createElement("div");
    container.id = "paginationContainer";
    container.className = "d-flex justify-content-center mt-4";

    let paginationHTML = `<ul class="pagination">`;

    // Previous button
    paginationHTML += `
        <li class="page-item ${page === 1 ? "disabled" : ""}">
            <button class="page-link" onclick="loadProducts(${page - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= pages; i++) {
        paginationHTML += `
            <li class="page-item ${i === page ? "active" : ""}">
                <button class="page-link" onclick="loadProducts(${i})">${i}</button>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${page === pages ? "disabled" : ""}">
            <button class="page-link" onclick="loadProducts(${page + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;

    paginationHTML += `</ul>`;
    container.innerHTML = paginationHTML;

    // Insert after product container
    productContainer.parentNode.insertBefore(
        container,
        productContainer.nextSibling,
    );
    // 👇 CHECK: parentNode exists
    if (productContainer.parentNode) {
        productContainer.parentNode.insertBefore(
            container,
            productContainer.nextSibling,
        );
    }
}

// ===== 2. DISPLAY PRODUCTS =====
function displayProducts(products) {
    if (!productContainer) return;

    const noImage =
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect width=%22300%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E";

    if (products.length === 0) {
        productContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <h4>No products found</h4>
                <p class="text-muted">Check back later for new products!</p>
            </div>
        `;
        return;
    }

    productContainer.innerHTML = products
        .map(
            (product) => `
    <div class="col-md-3 col-sm-6">
        <div class="product-card">
            <a href="product.html?id=${product._id}" class="text-decoration-none text-dark">
                <img src="${product.images && product.images.length > 0 ? "http://localhost:5000" + product.images[0] : noImage}" 
                     alt="${product.name}"
                     onerror="this.src='${noImage}'">
                <h5 class="card-title">${product.name}</h5>
                <p class="text-muted small">${product.category || "Uncategorized"}</p>
                <div class="price">$${product.price.toFixed(2)}</div>
                <!-- 👇 REVIEWS COUNT SHOW KAREIN -->
                <div class="small text-muted mt-1">
                    <i class="fas fa-star text-warning"></i>
                    ${product.ratings ? product.ratings.toFixed(1) : "0"} 
                    (${product.numReviews || 0} reviews)
                </div>
            </a>
            <button class="btn btn-primary mt-2" onclick="addToCart('${product._id}')">
                <i class="fas fa-cart-plus me-2"></i>Add to Cart
            </button>
        </div>
    </div>
`,
        )
        .join("");
}

// ===== 3. ADD TO CART =====
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast("Product added to cart! 🛒");
}

// ===== 4. UPDATE CART COUNT =====
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// ===== 5. CHECK AUTH STATUS =====
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

// ===== 6. LOGOUT =====
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.reload();
}

// ===== 7. REGISTER =====
document
    .getElementById("registerForm")
    ?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                showToast("Registration successful! Welcome! 🎉");
                bootstrap.Modal.getInstance(
                    document.getElementById("registerModal"),
                ).hide();
                checkAuthStatus();
                document.getElementById("registerForm").reset();
            } else {
                showToast(data.message || "Registration failed", "error");
            }
        } catch (error) {
            console.error("Register error:", error);
            showToast("Network error. Please try again.", "error");
        }
    });

// ===== 8. LOGIN =====
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            showToast("Login successful! Welcome back! 👋");
            bootstrap.Modal.getInstance(
                document.getElementById("loginModal"),
            ).hide();
            checkAuthStatus();
            document.getElementById("loginForm").reset();
        } else {
            showToast(data.message || "Login failed", "error");
        }
    } catch (error) {
        console.error("Login error:", error);
        showToast("Network error. Please try again.", "error");
    }
});

// ===== 9. SHOW TOAST NOTIFICATION =====
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

// ===== 10. CREATE TOAST CONTAINER =====
function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
}

// ===== 11. SHOW ERROR =====
function showError(message) {
    if (!productContainer) {
        console.error("Product container not found");
        return;
    }
    productContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h4>Oops! Something went wrong</h4>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary" onclick="loadProducts()">
                <i class="fas fa-sync me-2"></i>Retry
            </button>
        </div>
    `;
}

// ===== 12. SEARCH & FILTER PRODUCTS =====
async function searchProducts() {
    const keyword = document.getElementById("searchInput")?.value || "";
    const category = document.getElementById("categoryFilter")?.value || "";
    const sort = document.getElementById("sortFilter")?.value || "newest";

    // Build query string
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    if (category) params.append("category", category);
    if (sort) params.append("sort", sort);

    try {
        const response = await fetch(
            `${API_URL}/products/search?${params.toString()}`,
        );
        const data = await response.json();

        if (data.success) {
            displayProducts(data.products);
        } else {
            showError("No products found");
        }
    } catch (error) {
        console.error("Search error:", error);
        showError("Network error. Please try again.");
    }
}

// ===== 13. CLEAR FILTERS =====
function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "";
    document.getElementById("sortFilter").value = "newest";
    loadProducts(); // Reset to all products
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    updateCartCount();
    checkAuthStatus();

    // Search on input change (with debounce)
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(searchProducts, 300);
        });
    }

    // Filter on change
    document
        .getElementById("categoryFilter")
        ?.addEventListener("change", searchProducts);
    document
        .getElementById("sortFilter")
        ?.addEventListener("change", searchProducts);
});
