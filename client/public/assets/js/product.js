// ===== GET PRODUCT ID FROM URL =====
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// ===== LOAD PRODUCT DETAIL =====
document.addEventListener("DOMContentLoaded", () => {
    if (productId) {
        loadProductDetail(productId);
        loadReviews(productId);
    }
    updateCartCount();
    checkAuthStatus();
});

async function loadProductDetail(id) {
    try {
        const response = await fetch(
            `http://localhost:5000/api/products/${id}`,
        );
        const data = await response.json();

        if (data.success) {
            displayProductDetail(data.product);
        }
    } catch (error) {
        console.error("Error loading product:", error);
    }
}

function displayProductDetail(product) {
    const container = document.getElementById("productDetail");
    const stars = generateStars(product.ratings || 0);

    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${product.images && product.images.length > 0 ? "http://localhost:5000" + product.images[0] : "https://via.placeholder.com/400"}" 
                     class="img-fluid rounded" alt="${product.name}">
            </div>
            <div class="col-md-6">
                <h2>${product.name}</h2>
                <p class="text-muted">${product.category}</p>
                <div class="mb-3">
                    ${stars}
                    <!-- 👇 REVIEWS COUNT SHOW KAREIN -->
                    <span class="ms-2">(${product.numReviews || 0} reviews)</span>
                </div>
                <h3 class="text-primary">Rs. ${product.price.toFixed(2)}</h3>
                <p class="mt-3">${product.description}</p>
                <p><strong>Stock:</strong> ${product.stock > 0 ? "In Stock" : "Out of Stock"}</p>
                <button class="btn btn-primary btn-lg" onclick="addToCart('${product._id}')">
                    <i class="fas fa-cart-plus me-2"></i>Add to Cart
                </button>
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let html = "";
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star text-warning"></i>';
    }
    if (halfStar) {
        html += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star text-warning"></i>';
    }
    return html;
}

// ===== SET RATING =====
let selectedRating = 0;

function setRating(rating) {
    selectedRating = rating;
    document.getElementById("reviewRating").value = rating;

    // Update stars
    const stars = document.querySelectorAll(".rating-stars i");
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = "fas fa-star fa-2x text-warning";
        } else {
            star.className = "far fa-star fa-2x text-warning";
        }
    });
}

// ===== CHECK IF USER ALREADY REVIEWED =====
async function checkUserReview(productId) {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/reviews/product/${productId}`);
        const data = await response.json();

        if (data.success) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const userReview = data.reviews.find((r) => r.user === user.id);
            return userReview ? true : false;
        }
    } catch (error) {
        console.error("Error checking review:", error);
    }
    return false;
}

// ===== LOAD REVIEWS =====
async function loadReviews(productId) {
    try {
        const response = await fetch(`${API_URL}/reviews/product/${productId}`);
        const data = await response.json();

        if (data.success) {
            displayReviews(data.reviews);

            // Show review form if user is logged in and hasn't reviewed
            const token = localStorage.getItem("token");
            const hasReviewed = await checkUserReview(productId);

            if (token && !hasReviewed) {
                document
                    .getElementById("reviewFormContainer")
                    .classList.remove("d-none");
            } else if (hasReviewed) {
                document.getElementById("reviewFormContainer").innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>You already reviewed this product!
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}

// ===== DISPLAY REVIEWS =====
function displayReviews(reviews) {
    const container = document.getElementById("reviewsList");
    const count = document.getElementById("reviewCount");

    // 👇 UPDATE REVIEWS COUNT
    if (count) {
        count.textContent = `(${reviews.length})`;
    }

    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-comment fa-2x mb-2"></i>
                <p>No reviews yet. Be the first to review!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews
        .map(
            (review) => `
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${review.name}</strong>
                        <span class="ms-2">${generateStars(review.rating)}</span>
                    </div>
                    <small class="text-muted">${new Date(review.createdAt).toLocaleDateString()}</small>
                </div>
                <p class="mt-2 mb-0">${review.comment}</p>
            </div>
        </div>
    `,
        )
        .join("");
}

// ===== SUBMIT REVIEW =====
document.getElementById("reviewForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login to submit a review");
        return;
    }

    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value;

    if (!rating || rating === "0") {
        alert("Please select a rating");
        return;
    }

    if (!comment.trim()) {
        alert("Please write a comment");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                productId: productId,
                rating: parseInt(rating),
                comment: comment.trim(),
            }),
        });

        const data = await response.json();

        if (data.success) {
            alert("✅ Review submitted successfully!");
            document.getElementById("reviewForm").reset();
            document.getElementById("reviewRating").value = "0";
            document.querySelectorAll(".rating-stars i").forEach((star) => {
                star.className = "far fa-star fa-2x text-warning";
            });
            // Reload reviews
            loadReviews(productId);
        } else {
            alert("❌ " + (data.message || "Failed to submit review"));
        }
    } catch (error) {
        console.error("Error submitting review:", error);
        alert("❌ Network error. Please try again.");
    }
});
