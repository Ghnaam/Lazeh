// البيانات الابتدائية للمتجر (تخزن محلياً)
let db = JSON.parse(localStorage.getItem('lazat_db')) || {
    branches: ["فرع حي النورية", "فرع العزيزية", "فرع الإحسان"],
    categories: ["الكل", "فطاير", "خلطات الجبن", "كيكات وحلويات"],
    products: [
        { id: 1, name: "خلية عسل ملكي", category: "خلطات الجبن", price: 25, branch: "فرع حي النورية" },
        { id: 2, name: "فطيرة زعتر بالجبن", category: "فطاير", price: 15, branch: "فرع العزيزية" },
        { id: 3, name: "كيكة التمر الفاخرة", category: "كيكات وحلويات", price: 45, branch: "فرع حي النورية" }
    ],
    cart: [],
    orders: [],
    currentBranch: null,
    activeCategory: "الكل"
};

function saveDB() {
    localStorage.setItem('lazat_db', JSON.stringify(db));
}

// تشغيل النظام عند فتح الصفحة
window.onload = function() {
    if (!db.currentBranch) {
        showBranchModal();
    } else {
        document.getElementById('current-branch-label').innerText = `الفرع: ${db.currentBranch}`;
        renderStore();
    }
};

function showBranchModal() {
    const list = document.getElementById('branches-list');
    list.innerHTML = db.branches.map(b => `<div class="branch-option" onclick="selectBranch('${b}')">${b}</div>`).join('');
    document.getElementById('branch-modal').classList.remove('hidden');
}

function selectBranch(branch) {
    db.currentBranch = branch;
    saveDB();
    document.getElementById('branch-modal').classList.add('hidden');
    document.getElementById('current-branch-label').innerText = `الفرع: ${branch}`;
    renderStore();
}

function renderStore() {
    renderCategories();
    renderProducts();
    updateCartCount();
}

function renderCategories() {
    const bar = document.getElementById('categories-bar');
    bar.innerHTML = db.categories.map(cat => 
        `<button class="category-btn ${db.activeCategory === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>`
    ).join('');
}

function filterCategory(cat) {
    db.activeCategory = cat;
    renderProducts();
    renderCategories();
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const filtered = db.products.filter(p => 
        p.branch === db.currentBranch && (db.activeCategory === "الكل" || p.category === db.activeCategory)
    );
    
    if (filtered.length === 0) {
        grid.innerHTML = "<p>لا توجد منتجات متاحة في هذا القسم حالياً.</p>";
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div>
                <h3>${p.name}</h3>
                <p class="price">${p.price} ر.س</p>
            </div>
            <button class="btn" onclick="addToCart(${p.id})">إضافة للسلة</button>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = db.products.find(p => p.id === productId);
    const existing = db.cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        db.cart.push({ ...product, qty: 1 });
    }
    saveDB();
    updateCartCount();
}

function updateCartCount() {
    const count = db.cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-count').innerText = count;
}

function openCart() {
    const itemsContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    
    if (db.cart.length === 0) {
        itemsContainer.innerHTML = "<p>السلة فارغة.</p>";
        totalContainer.innerHTML = "";
    } else {
        itemsContainer.innerHTML = db.cart.map(item => `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span>${item.name} (×${item.qty})</span>
                <span>${item.price * item.qty} ر.س</span>
            </div>
        `).join('');
        const total = db.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        totalContainer.innerHTML = `<h3>المجموع الإجمالي: ${total} ر.س</h3>`;
    }
    document.getElementById('cart-modal').classList.remove('hidden');
}

function closeCart() {
    document.getElementById('cart-modal').classList.add('hidden');
}

function checkout() {
    const phone = document.getElementById('customer-phone').value;
    if (!phone || phone.length < 9) {
        alert("الرجاء إدخال رقم جوال صحيح لتأكيد الحجز.");
        return;
    }
    const order = {
        id: Date.now(),
        phone: phone,
        branch: db.currentBranch,
        items: [...db.cart],
        total: db.cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        status: "قيد الانتظار"
    };
    db.orders.push(order);
    db.cart = [];
    saveDB();
    updateCartCount();
    closeCart();
    alert("تم حجز الطلب بنجاح! احتفظ برقم الجوال لاستلام الطلب من الفرع.");
}

function openAdmin() {
    document.getElementById('admin-modal').classList.remove('hidden');
    switchAdminTab('products');
}

function closeAdmin() {
    document.getElementById('admin-modal').classList.add('hidden');
}

function switchAdminTab(tab) {
    const body = document.getElementById('admin-body');
    if (tab === 'products') {
        body.innerHTML = `
            <h3>إضافة منتج جديد</h3>
            <input type="text" id="new-p-name" placeholder="اسم المنتج">
            <input type="text" id="new-p-price" placeholder="السعر">
            <button class="btn primary" onclick="addNewProduct()">إضافة للمتجر</button>
            <h3 style="margin-top:20px;">المنتجات الحالية للفرع</h3>
            <ul>${db.products.map(p => `<li>${p.name} - ${p.price} ر.س (${p.branch})</li>`).join('')}</ul>
        `;
    } else {
        body.innerHTML = `
            <h3>الحجوزات الواردة</h3>
            <ul>${db.orders.length === 0 ? '<li>لا توجد حجوزات حالياً</li>' : db.orders.map(o => `<li>جوال: ${o.phone} | المجموع: ${o.total} ر.س | الحالة: ${o.status}</li>`).join('')}</ul>
        `;
    }
}

function addNewProduct() {
    const name = document.getElementById('new-p-name').value;
    const price = parseFloat(document.getElementById('new-p-price').value);
    if (!name || !price) return;
    db.products.push({
        id: Date.now(),
        name: name,
        category: "فطاير",
        price: price,
        branch: db.currentBranch
    });
    saveDB();
    switchAdminTab('products');
}
