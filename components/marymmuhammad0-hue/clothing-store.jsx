'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ALL_COLORS = ['أسود', 'أبيض', 'كحلي', 'بيج', 'زيتي'];

const translations = {
  ar: {
    topBanner: 'شحن مجاني للطلبات الأكثر من 1500 ج.م لكافة المحافظات 🚚',
    storeName: 'فاشون ستور',
    navHome: 'الرئيسية',
    navContact: 'تواصل معنا',
    heroTitle: 'ELEVATE YOUR DAILY CASUAL STYLE',
    heroSub: 'أحدث تشكيلة ملابس كاجوال مريحة بأعلى خامات القطن والتقفيل الممتاز، لتستمتع بإطلالة عصريّة وأنيقة يومياً.',
    shopNow: 'تسوق الآن 🛍️',
    sectionTitle: 'تشكيلة أزياء الكاجوال',
    sectionSub: 'اختر القطعة، اللون، والمقاس المناسب لك',
    all: 'الكل',
    tshirts: 'تيشرت',
    pants: 'بنطالون',
    hoodies: 'هوديز & سويت شيرت',
    jackets: 'جاكيت',
    size: 'المقاس (Size)',
    color: 'اللون (Color)',
    addToCart: 'إضافة للسلة 🛍️',
    buyNow: 'اشتري الآن ⚡',
    outOfStock: 'نفذت الكمية',
    available: 'متاح للشحن',
    cartTitle: 'سلة التسوق وإتمام الطلب',
    cartEmpty: 'سلة التسوق فارغة حالياً.',
    browseClothes: 'تصفح الملابس',
    shippingDetails: 'بيانات الشحن والفاتورة',
    fullName: 'الاسم بالكامل:',
    phone: 'رقم الهاتف:',
    address: 'عنوان التوصيل التفصيلي:',
    subtotal: 'إجمالي المنتجات:',
    shippingFee: 'مصاريف الشحن:',
    free: 'مجاني 🎉',
    total: 'الإجمالي النهائي:',
    confirmOrder: 'تأكيد وإتمام الطلب 📦',
    orderSuccess: 'تم إرسال طلبك بنجاح! 🎉',
    orderSuccessSub: 'تم تسجيل طلبك ومتابعة تجهيزه للشحن فوراً.',
    orderId: 'رقم طلبك:',
    continueShopping: 'متابعة التسوق',
    footerDesc: 'علامة تجارية متخصصة في توفير أرقى وأحدث صيحات الملابس الكاجوال المريحة بأعلى معايير التصنيع والجودة.',
    footerContact: 'تواصل معنا مباشر:',
    footerEmail: '✉️ البريد الإلكتروني:',
    footerPhone: '📞 رقم الهاتف / واتساب:',
    footerRights: 'جميع الحقوق محفوظة © 2026 - فاشون ستور FASHION STORE',
  },
  en: {
    topBanner: 'Free shipping on orders over 1500 EGP nationwide 🚚',
    storeName: 'FASHION STORE',
    navHome: 'Home',
    navContact: 'Contact Us',
    heroTitle: 'ELEVATE YOUR DAILY CASUAL STYLE',
    heroSub: 'Discover our latest premium casual clothing collection crafted with high-quality cotton for daily elegance and comfort.',
    shopNow: 'Shop Now 🛍️',
    sectionTitle: 'Casual Wear Collection',
    sectionSub: 'Choose your preferred piece, size, and color',
    all: 'All',
    tshirts: 'T-Shirts',
    pants: 'Pants',
    hoodies: 'Hoodies & Sweatshirts',
    jackets: 'Jackets',
    size: 'Size',
    color: 'Color',
    addToCart: 'Add to Cart 🛍️',
    buyNow: 'Buy Now ⚡',
    outOfStock: 'Out of Stock',
    available: 'In Stock',
    cartTitle: 'Shopping Cart & Checkout',
    cartEmpty: 'Your shopping cart is currently empty.',
    browseClothes: 'Browse Collection',
    shippingDetails: 'Shipping & Invoice Details',
    fullName: 'Full Name:',
    phone: 'Phone Number:',
    address: 'Detailed Address:',
    subtotal: 'Products Subtotal:',
    shippingFee: 'Shipping Fee:',
    free: 'Free 🎉',
    total: 'Grand Total:',
    confirmOrder: 'Confirm & Complete Order 📦',
    orderSuccess: 'Order Placed Successfully! 🎉',
    orderSuccessSub: 'Your order has been recorded and is being prepared for shipping.',
    orderId: 'Order ID:',
    continueShopping: 'Continue Shopping',
    footerDesc: 'A leading brand dedicated to providing the latest comfortable casual fashion with premium quality and craftsmanship.',
    footerContact: 'Direct Contact:',
    footerEmail: '✉️ Email:',
    footerPhone: '📞 Phone / WhatsApp:',
    footerRights: 'All Rights Reserved © 2026 - FASHION STORE',
  }
};

async function apiRequest(url, { adminPassword, ...init } = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
      ...init.headers,
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'حدث خطأ غير متوقع، حاول مرة أخرى.');
  return data;
}

const fetchProducts = (url) => apiRequest(url);
const fetchOrders = ([url, adminPassword]) => apiRequest(url, { adminPassword });

const formatOrderDate = (iso) => {
  try { return new Date(iso).toLocaleDateString('ar-EG'); } catch (e) { return ''; }
};

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = translations[lang] || translations.ar;

  useEffect(() => {
    const savedLang = localStorage.getItem('fashion_store_lang');
    if (savedLang) {
      setLang(savedLang);
    } else {
      const deviceLang = navigator.language || navigator.userLanguage || 'ar';
      setLang(deviceLang.toLowerCase().startsWith('ar') ? 'ar' : 'en');
    }
  }, []);

  const toggleLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('fashion_store_lang', newLang);
  };

  const { data: products = [], error: productsError, isLoading: productsLoading, mutate: mutateProducts } =
    useSWR('/api/products', fetchProducts);

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedImages, setSelectedImages] = useState({});

  useEffect(() => {
    const savedCart = localStorage.getItem('fashion_store_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("خطأ في قراءة السلة", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fashion_store_cart', JSON.stringify(cart));
  }, [cart]);

  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [footerClicks, setFooterClicks] = useState(0);

  const { data: orders = [], mutate: mutateOrders } = useSWR(
    isAuthenticated ? ['/api/orders', adminPassword] : null,
    fetchOrders
  );

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    subtitle: '',
    priceBase: '',
    category: 'تيشرتات',
    images: [],
    stock: '10',
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableColors: ['أسود', 'أبيض', 'كحلي', 'بيج', 'زيتي']
  });

  const [productOptions, setProductOptions] = useState({});

  const handleMultipleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let loadedImages = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`الصورة ${file.name} حجمها كبير جداً.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        loadedImages.push(reader.result);
        filesProcessed++;
        if (filesProcessed === files.length) {
          setNewProductForm(prev => ({ ...prev, images: [...prev.images, ...loadedImages] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCheckboxChange = (field, value) => {
    setNewProductForm(prev => {
      const currentList = prev[field];
      const updatedList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [field]: updatedList };
    });
  };

  const handleOptionChange = (productId, field, value) => {
    setProductOptions(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const parseProductImages = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (typeof product.image === 'string' && product.image.startsWith('[')) {
      try { return JSON.parse(product.image); } catch (e) { return [product.image]; }
    }
    return product.image ? [product.image] : [];
  };

  const parseProductList = (rawVal, defaultList) => {
    if (Array.isArray(rawVal) && rawVal.length > 0) return rawVal;
    if (typeof rawVal === 'string' && rawVal.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawVal);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultList;
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا المنتج نفذ من المخزن حالياً.');
      return;
    }

    const availSizes = parseProductList(product.available_sizes, ALL_SIZES);
    const availColors = parseProductList(product.available_colors, ALL_COLORS);

    const opts = productOptions[product.id] || {
      size: availSizes[0] || 'M',
      color: availColors[0] || 'أسود'
    };

    const finalPrice = product.priceBase;
    const itemKey = `${product.id}-${opts.size}-${opts.color}`;
    const productImgs = parseProductImages(product);

    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartKey === itemKey);
      if (existing) {
        return prevCart.map(item => item.cartKey === itemKey ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, {
        cartKey: itemKey,
        id: product.id,
        name: product.name,
        image: productImgs[0] || '',
        size: opts.size,
        color: opts.color,
        price: finalPrice,
        qty: 1
      }];
    });
  };

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = cartTotal > 1500 ? 0 : 50;
  const grandTotal = cartTotal + deliveryFee;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;
    if (!customerForm.name || !customerForm.phone || !customerForm.address) return;

    setIsSubmittingOrder(true);
    setOrderError('');
    try {
      const created = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerForm,
          items: cart.map(i => ({ productId: i.id, size: i.size, color: i.color, qty: i.qty })),
        }),
      });
      setLastOrderId(created.id);
      setOrderSuccess(true);
      setCart([]);
      localStorage.removeItem('fashion_store_cart');
      setCustomerForm({ name: '', phone: '', address: '' });
      mutateProducts();
      if (isAuthenticated) mutateOrders();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.priceBase) return;
    if (newProductForm.images.length === 0) {
      alert('يرجى اختيار صورة واحدة على الأقل للمنتج.');
      return;
    }
    if (newProductForm.availableSizes.length === 0) {
      alert('يرجى تحديد مقاس واحد على الأقل متاح لهذا المنتج.');
      return;
    }
    if (newProductForm.availableColors.length === 0) {
      alert('يرجى تحديد لون واحد على الأقل متاح لهذا المنتج.');
      return;
    }

    try {
      await apiRequest('/api/products', {
        method: 'POST',
        adminPassword,
        body: JSON.stringify({
          name: newProductForm.name,
          subtitle: newProductForm.subtitle,
          priceBase: Number(newProductForm.priceBase),
          category: newProductForm.category,
          image: JSON.stringify(newProductForm.images),
          stock: Number(newProductForm.stock) || 0,
          availableSizes: JSON.stringify(newProductForm.availableSizes),
          availableColors: JSON.stringify(newProductForm.availableColors),
        }),
      });
      mutateProducts();
      setNewProductForm({
        name: '',
        subtitle: '',
        priceBase: '',
        category: 'تيشرتات',
        images: [],
        stock: '10',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        availableColors: ['أسود', 'أبيض', 'كحلي', 'بيج', 'زيتي']
      });
      alert('تمت إضافة قطعة الملابس بنجاح بجميع خياراتها!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟')) return;
    try {
      await apiRequest(`/api/products/${productId}`, { method: 'DELETE', adminPassword });
      mutateProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً من السجل؟')) return;
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', adminPassword });
      mutateOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        adminPassword,
        body: JSON.stringify({ status: newStatus }),
      });
      mutateOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: enteredPassword }),
      });
      setAdminPassword(enteredPassword);
      setIsAuthenticated(true);
      setPasswordError('');
      setEnteredPassword('');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setActiveTab('shop');
  };

  const handleSecretAdminTrigger = () => {
    const nextCount = footerClicks + 1;
    setFooterClicks(nextCount);
    if (nextCount >= 3) {
      setActiveTab('admin');
      setFooterClicks(0);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div style={{
      fontFamily: 'Cairo, sans-serif',
      backgroundColor: '#FFFFFF',
      color: '#111827',
      minHeight: '100vh',
      direction: isRtl ? 'rtl' : 'ltr',
      textAlign: isRtl ? 'right' : 'left',
    }}>
      <header style={styles.header}>
        <div style={styles.topBanner}>{t.topBanner}</div>
        <nav style={styles.navBar}>
          <div style={styles.brandLogo} onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}>
            <span style={{ fontSize: '1.6rem' }}>🛍️</span>
            <div>
              {t.storeName}
              <span style={styles.logoSub}>FASHION STORE CASUAL</span>
            </div>
          </div>

          <div style={styles.navLinks}>
            <button 
              style={{
                ...styles.navBtn,
                fontWeight: activeTab === 'shop' ? 'bold' : 'normal',
                borderBottom: activeTab === 'shop' ? '2px solid #111827' : '2px solid transparent'
              }}
              onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}
            >
              {t.navHome}
            </button>
            <button style={styles.navBtn} onClick={() => {
              const el = document.getElementById('contact-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              {t.navContact}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: '20px', overflow: 'hidden' }}>
              <button
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  backgroundColor: lang === 'ar' ? '#111827' : '#FFFFFF',
                  color: lang === 'ar' ? '#FFFFFF' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
                onClick={() => toggleLanguage('ar')}
              >
                العربية
              </button>
              <button
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  backgroundColor: lang === 'en' ? '#111827' : '#FFFFFF',
                  color: lang === 'en' ? '#FFFFFF' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
                onClick={() => toggleLanguage('en')}
              >
                EN
              </button>
            </div>

            <div style={styles.cartIconContainer} onClick={() => { setActiveTab('cart'); setOrderSuccess(false); }}>
              <span style={styles.cartIcon}>🛍️</span>
              <span style={styles.cartBadge}>{cart.reduce((a, b) => a + b.qty, 0)}</span>
            </div>
          </div>
        </nav>
      </header>

      {activeTab === 'shop' && (
        <main style={{ minHeight: '80vh' }}>
          <section style={styles.heroSection}>
            <div style={styles.heroTextContainer}>
              <h1 style={styles.heroTitle}>{t.heroTitle}</h1>
              <p style={styles.heroSubtitle}>{t.heroSub}</p>
              <div style={styles.heroButtons}>
                <button style={styles.primaryBtn} onClick={() => {
                  const el = document.getElementById('products-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>{t.shopNow}</button>
              </div>
            </div>

            <div style={styles.heroImageCard}>
              <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80" alt="Casual Collection" style={styles.heroImg} />
            </div>
          </section>

          <section id="products-grid" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9fafb' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>{t.sectionTitle}</h2>
              <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '20px' }}>{t.sectionSub}</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {['الكل', 'تيشرتات', 'بنطلونات', 'هوديز وسويت شيرت', 'جاكيتات'].map(cat => (
                  <button
                    key={cat}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      backgroundColor: selectedCategory === cat ? '#111827' : '#FFFFFF',
                      color: selectedCategory === cat ? '#FFFFFF' : '#374151',
                      border: selectedCategory === cat ? '1px solid #111827' : '1px solid #D1D5DB',
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'الكل' ? t.all : cat === 'تيشرتات' ? t.tshirts : cat === 'بنطلونات' ? t.pants : cat === 'هوديز وسويت شيرت' ? t.hoodies : t.jackets}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
              {(selectedCategory === 'الكل' ? products : products.filter(p => p.category === selectedCategory)).map(product => {
                const isOutOfStock = product.stock <= 0;
                const productImgs = parseProductImages(product);
                const activeImg = selectedImages[product.id] || productImgs[0] || '';

                const availSizes = parseProductList(product.available_sizes, ALL_SIZES);
                const availColors = parseProductList(product.available_colors, ALL_COLORS);

                const currentOpts = productOptions[product.id] || {
                  size: availSizes[0] || 'M',
                  color: availColors[0] || 'أسود'
                };

                return (
                  <div key={product.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: '280px' }}>
                      <img src={activeImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isOutOfStock && <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#EF4444', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{t.outOfStock}</span>}
                    </div>

                    {productImgs.length > 1 && (
                      <div style={{ display: 'flex', gap: '6px', padding: '10px 15px 0 15px', overflowX: 'auto' }}>
                        {productImgs.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt="thumb"
                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: activeImg === imgUrl ? '2px solid #111827' : '1px solid #D1D5DB' }}
                            onClick={() => setSelectedImages(prev => ({ ...prev, [product.id]: imgUrl }))}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '5px' }}>{product.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '15px' }}>{product.subtitle}</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#374151', fontWeight: '600' }}>{t.size}:</label>
                          <select style={styles.selectInput} value={currentOpts.size} onChange={(e) => handleOptionChange(product.id, 'size', e.target.value)} disabled={isOutOfStock}>
                            {availSizes.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#374151', fontWeight: '600' }}>{t.color}:</label>
                          <select style={styles.selectInput} value={currentOpts.color} onChange={(e) => handleOptionChange(product.id, 'color', e.target.value)} disabled={isOutOfStock}>
                            {availColors.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #F3F4F6' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>{product.priceBase} EGP</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ ...styles.addCartBtn, flex: 1, backgroundColor: isOutOfStock ? '#9CA3AF' : '#111827' }} onClick={() => addToCart(product)} disabled={isOutOfStock}>
                            {isOutOfStock ? t.outOfStock : t.addToCart}
                          </button>
                          <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isOutOfStock ? '#9CA3AF' : '#059669', color: '#fff', fontWeight: 'bold', cursor: isOutOfStock ? 'not-allowed' : 'pointer' }} onClick={() => { if (!isOutOfStock) { addToCart(product); setActiveTab('cart'); } }} disabled={isOutOfStock}>
                            {t.buyNow}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer id="contact-section" style={{ backgroundColor: '#111827', color: '#FFFFFF', padding: '50px 20px 20px 20px', marginTop: '60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', marginBottom: '40px' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{t.storeName}</h3>
                <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: '1.6' }}>{t.footerDesc}</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>{t.footerContact}</h4>
                <p style={{ color: '#9CA3AF' }}>{t.footerEmail} mariammohamed1611962@gmail.com</p>
                <p style={{ color: '#9CA3AF' }}>{t.footerPhone} 01147554038</p>
              </div>
            </div>
            <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#6B7280' }}>
              <span onClick={handleSecretAdminTrigger} style={{ cursor: 'pointer' }}>🛍️ </span>
              {t.footerRights}
            </div>
          </footer>
        </main>
      )}

      {activeTab === 'cart' && (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>{t.cartTitle}</h2>
          {orderSuccess ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #A7F3D0', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ color: '#059669', marginBottom: '10px' }}>{t.orderSuccess}</h3>
              <p>{t.orderSuccessSub}</p>
              {lastOrderId && <p style={{ marginTop: '8px' }}>{t.orderId} <strong>{lastOrderId}</strong></p>}
              <button style={{ ...styles.primaryBtn, marginTop: '20px' }} onClick={() => { setOrderSuccess(false); setActiveTab('shop'); }}>{t.continueShopping}</button>
            </div>
          ) : cart.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
              <p style={{ marginBottom: '20px' }}>{t.cartEmpty}</p>
              <button style={styles.primaryBtn} onClick={() => setActiveTab('shop')}>{t.browseClothes}</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {cart.map(item => (
                  <div key={item.cartKey} style={{ backgroundColor: '#FFFFFF', padding: '15px', borderRadius: '10px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <h4>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>{t.size}: {item.size} | {t.color}: {item.color}</p>
                      <span style={{ fontWeight: 'bold' }}>{item.price} EGP</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F9FAFB', padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                      <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateQty(item.cartKey, -1)}>-</button>
                      <span style={{ fontWeight: 'bold' }}>{item.qty}</span>
                      <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateQty(item.cartKey, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '20px' }}>{t.shippingDetails}</h3>
                <form onSubmit={handleCheckoutSubmit}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.fullName}</label>
                    <input type="text" style={styles.formInput} value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.phone}</label>
                    <input type="text" style={styles.formInput} value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} required />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>{t.address}</label>
                    <textarea style={{ ...styles.formInput, minHeight: '80px' }} value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} required />
                  </div>

                  <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>{t.subtotal}</span><span>{cartTotal} EGP</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>{t.shippingFee}</span><span>{deliveryFee === 0 ? t.free : `${deliveryFee} EGP`}</span></div>
                  <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}><span>{t.total}</span><span>{grandTotal} EGP</span></div>

                  <button type="submit" style={{ ...styles.primaryBtn, width: '100%', marginTop: '20px', backgroundColor: '#059669' }}>
                    {isSubmittingOrder ? '...' : t.confirmOrder}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
          {!isAuthenticated ? (
            <div style={{ maxWidth: '400px', margin: '60px auto', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
              <h2 style={{ marginBottom: '10px', color: '#111827' }}>لوحة تحكم المتجر</h2>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '20px' }}>أدخل كلمة مرور المدير لإدارة الملابس والطلبات.</p>
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>كلمة المرور:</label>
                  <input type="password" placeholder="أدخل كلمة المرور" style={styles.formInput} value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} required />
                </div>
                {passwordError && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '15px' }}>{passwordError}</p>}
                <button type="submit" style={{ ...styles.primaryBtn, width: '100%', borderRadius: '8px' }}>دخول اللوحة</button>
              </form>
              <button style={{ ...styles.primaryBtn, width: '100%', marginTop: '10px', backgroundColor: 'transparent', color: '#111827', border: '1px solid #111827' }} onClick={() => setActiveTab('shop')}>العودة للمتجر</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>لوحة تحكم FASHION STORE</h2>
                  <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>إدارة المخزون، تحديد المقاسات والألوان المتاحة، ومتابعة الطلبات.</p>
                </div>
                <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #111827', backgroundColor: 'transparent', cursor: 'pointer' }} onClick={handleLogout}>تسجيل الخروج 🚪</button>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>➕ إضافة قطعة ملابس جديدة:</h3>
                <form onSubmit={handleAddProductSubmit} style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>اسم المنتج:</label>
                      <input type="text" style={styles.formInput} placeholder="مثال: تيشرت أوفرسايز قطن" value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>وصف مختصر:</label>
                      <input type="text" style={styles.formInput} placeholder="مثال: قطن 100% مريح وعصري" value={newProductForm.subtitle} onChange={e => setNewProductForm({...newProductForm, subtitle: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>السعر (ج.م):</label>
                      <input type="number" style={styles.formInput} placeholder="350" value={newProductForm.priceBase} onChange={e => setNewProductForm({...newProductForm, priceBase: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>التصنيف:</label>
                      <select style={styles.selectInput} value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}>
                        <option value="تيشرتات">تيشرتات</option>
                        <option value="بنطلونات">بنطلونات</option>
                        <option value="هوديز وسويت شيرت">هوديز وسويت شيرت</option>
                        <option value="جاكيتات">جاكيتات</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>الكمية المتاحة:</label>
                      <input type="number" style={styles.formInput} value={newProductForm.stock} onChange={e => setNewProductForm({...newProductForm, stock: e.target.value})} required />
                    </div>
                  </div>

                  {/* تحديد المقاسات المتاحة لهذا المنتج */}
                  <div style={{ marginTop: '15px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📏 حدد المقاسات المتاحة لهذه القطعة:</label>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      {ALL_SIZES.map(s => (
                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newProductForm.availableSizes.includes(s)}
                            onChange={() => handleCheckboxChange('availableSizes', s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* تحديد الألوان المتاحة لهذا المنتج */}
                  <div style={{ marginTop: '15px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🎨 حدد الألوان المتاحة لهذه القطعة:</label>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      {ALL_COLORS.map(c => (
                        <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newProductForm.availableColors.includes(c)}
                            onChange={() => handleCheckboxChange('availableColors', c)}
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>صور المنتج:</label>
                    <input type="file" accept="image/*" multiple onChange={handleMultipleImagesUpload} style={{ ...styles.formInput, padding: '6px' }} />
                  </div>

                  {newProductForm.images.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 'bold' }}>تم تحديد {newProductForm.images.length} صور ✓</span>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {newProductForm.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`معاينة ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" style={{ ...styles.primaryBtn, marginTop: '20px', padding: '10px 25px' }}>إضافة القطعة 🚀</button>
                </form>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>📦 المنتجات الحالية:</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'right' }}>
                        <th style={{ padding: '10px' }}>الصور</th>
                        <th style={{ padding: '10px' }}>اسم القطعة</th>
                        <th style={{ padding: '10px' }}>المقاسات المتاحة</th>
                        <th style={{ padding: '10px' }}>الألوان المتاحة</th>
                        <th style={{ padding: '10px' }}>السعر</th>
                        <th style={{ padding: '10px' }}>المخزن</th>
                        <th style={{ padding: '10px' }}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const imgs = parseProductImages(p);
                        const sizes = parseProductList(p.available_sizes, ALL_SIZES);
                        const colors = parseProductList(p.available_colors, ALL_COLORS);

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px' }}>
                              <img src={imgs[0]} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                            </td>
                            <td style={{ padding: '10px' }}><strong>{p.name}</strong></td>
                            <td style={{ padding: '10px' }}>{sizes.join(', ')}</td>
                            <td style={{ padding: '10px' }}>{colors.join(', ')}</td>
                            <td style={{ padding: '10px' }}>{p.priceBase} ج.م</td>
                            <td style={{ padding: '10px' }}>{p.stock} قطع</td>
                            <td style={{ padding: '10px' }}>
                              <button style={{ padding: '4px 10px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleDeleteProduct(p.id)}>حذف 🗑️</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 100 },
  topBanner: { backgroundColor: '#111827', color: '#F9FAFB', textAlign: 'center', padding: '8px', fontSize: '0.85rem' },
  navBar: { maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandLogo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' },
  logoSub: { display: 'block', fontSize: '0.65rem', color: '#6B7280', letterSpacing: '1px' },
  navLinks: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#111827' },
  cartIconContainer: { position: 'relative', cursor: 'pointer', backgroundColor: '#F3F4F6', padding: '8px 12px', borderRadius: '50%', display: 'flex' },
  cartIcon: { fontSize: '1.2rem' },
  cartBadge: { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#111827', color: '#FFFFFF', fontSize: '0.75rem', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold' },
  heroSection: { maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' },
  heroTextContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  heroTitle: { fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' },
  heroSubtitle: { fontSize: '1.05rem', color: '#4B5563', lineHeight: '1.6' },
  heroButtons: { display: 'flex', gap: '15px' },
  primaryBtn: { backgroundColor: '#111827', color: '#FFFFFF', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  heroImageCard: { borderRadius: '16px', overflow: 'hidden' },
  heroImg: { width: '100%', height: '400px', objectFit: 'cover' },
  selectInput: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontSize: '0.85rem', outline: 'none' },
  addCartBtn: { padding: '10px', borderRadius: '8px', border: 'none', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
  formInput: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB', fontSize: '0.9rem', outline: 'none' },
};
