'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const DEFAULT_OPTIONS = { size: 'M', color: 'أسود' };

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
  try {
    return new Date(iso).toLocaleDateString('ar-EG');
  } catch (e) {
    return '';
  }
};

export default function App() {
  const { data: products = [], error: productsError, isLoading: productsLoading, mutate: mutateProducts } =
    useSWR('/api/products', fetchProducts);

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedImages, setSelectedImages] = useState({});

  useEffect(() => {
    const savedCart = localStorage.getItem('fashion_store_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("خطأ في قراءة السلة", e);
      }
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

  const [newProductForm, setNewProductForm] = useState({ name: '', subtitle: '', priceBase: '', category: 'تيشرتات', images: [], stock: '10' });
  const [editingProduct, setEditingProduct] = useState(null);

  const [productOptions, setProductOptions] = useState({});

  // رفع صور متعددة للقطعة الواحدة
  const handleMultipleImagesUpload = (e, isEditing = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let loadedImages = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`الصورة ${file.name} حجمها كبير جداً (الحد الأقصى 2 ميجابايت).`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        loadedImages.push(reader.result);
        filesProcessed++;
        if (filesProcessed === files.length) {
          if (isEditing) {
            setEditingProduct(prev => ({ ...prev, images: [...(prev.images || []), ...loadedImages] }));
          } else {
            setNewProductForm(prev => ({ ...prev, images: [...prev.images, ...loadedImages] }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOptionChange = (productId, field, value) => {
    setProductOptions(prev => ({
      ...prev,
      [productId]: { ...DEFAULT_OPTIONS, ...prev[productId], [field]: value }
    }));
  };

  const parseProductImages = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (typeof product.image === 'string' && product.image.startsWith('[')) {
      try { return JSON.parse(product.image); } catch (e) { return [product.image]; }
    }
    return product.image ? [product.image] : [];
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا المقاس/المنتج نفذ من المخزن حالياً.');
      return;
    }

    const opts = productOptions[product.id] || DEFAULT_OPTIONS;
    const finalPrice = product.priceBase;
    const itemKey = `${product.id}-${opts.size}-${opts.color}`;
    const productImgs = parseProductImages(product);

    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartKey === itemKey);
      if (existing) {
        return prevCart.map(item =>
          item.cartKey === itemKey ? { ...item, qty: item.qty + 1 } : item
        );
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
    if (!customerForm.name || !customerForm.phone || !customerForm.address) {
      alert('يرجى استكمال البيانات.');
      return;
    }

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

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.priceBase) return;
    if (newProductForm.images.length === 0) {
      alert('يرجى اختيار صورة واحدة على الأقل للمنتج.');
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
        }),
      });
      mutateProducts();
      setNewProductForm({ name: '', subtitle: '', priceBase: '', category: 'تيشرتات', images: [], stock: '10' });
      alert('تمت إضافة قطعة الملابس بكافة صورها بنجاح!');
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

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        adminPassword,
        body: JSON.stringify({
          name: editingProduct.name,
          priceBase: Number(editingProduct.priceBase),
          stock: Number(editingProduct.stock),
          image: JSON.stringify(editingProduct.images || [editingProduct.image]),
        }),
      });
      mutateProducts();
      setEditingProduct(null);
      alert('تم تحديث البيانات والصور بنجاح!');
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

  const filteredProducts = selectedCategory === 'الكل'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'جديد': return { backgroundColor: '#FFF3CD', color: '#856404', border: '1px solid #FFEEBA' };
      case 'جاري الشحن': return { backgroundColor: '#CCE5FF', color: '#004085', border: '1px solid #B8DAFF' };
      case 'تم التسليم': return { backgroundColor: '#D4EDDA', color: '#155724', border: '1px solid #C3E6CB' };
      case 'ملغي': return { backgroundColor: '#F8D7DA', color: '#721C24', border: '1px solid #F5C6CB' };
      default: return { backgroundColor: '#E2E3E5', color: '#383D41' };
    }
  };

  const countNewOrders = orders.filter(o => o?.status === 'جديد').length;
  const countShippingOrders = orders.filter(o => o?.status === 'جاري الشحن').length;
  const countDeliveredOrders = orders.filter(o => o?.status === 'تم التسليم').length;
  const countCancelledOrders = orders.filter(o => o?.status === 'ملغي').length;

  const totalSales = orders
    .filter(o => o?.status === 'تم التسليم')
    .reduce((sum, o) => sum + (Number(o?.total) || 0), 0);

  const scrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.topBanner}>شحن مجاني للطلبات الأكثر من 1500 ج.م لكافة المحافظات 🚚</div>
        <nav style={styles.navBar}>
          <div style={styles.brandLogo} onClick={() => { setActiveTab('shop'); setOrderSuccess(false); }}>
            <span style={{ fontSize: '1.6rem' }}>🛍️</span>
            <div>
              فاشون ستور
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
              الرئيسية
            </button>
            <button style={styles.navBtn} onClick={scrollToContact}>
              تواصل معنا
            </button>
          </div>

          <div style={styles.cartIconContainer} onClick={() => { setActiveTab('cart'); setOrderSuccess(false); }}>
            <span style={styles.cartIcon}>🛍️</span>
            <span style={styles.cartBadge}>{cart.reduce((a, b) => a + b.qty, 0)}</span>
          </div>
        </nav>
      </header>

      {activeTab === 'shop' && (
        <main style={styles.mainContent}>
          <section style={styles.heroSection}>
            <div style={styles.heroTextContainer}>
              <h1 style={styles.heroTitle}>ELEVATE YOUR DAILY CASUAL STYLE</h1>
              <p style={styles.heroSubtitle}>
                أحدث تشكيلة ملابس كاجوال مريحة بأعلى خامات القطن والتقفيل الممتاز، لتستمتع بإطلالة عصريّة وأنيقة يومياً.
              </p>
              <div style={styles.heroButtons}>
                <button style={{ ...styles.primaryBtn }} onClick={() => {
                  const el = document.getElementById('products-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>تسوق الآن 🛍️</button>
                <button style={{ ...styles.secondaryBtn }} onClick={scrollToContact}>تواصل معنا</button>
              </div>
            </div>

            <div style={styles.heroImageCard}>
              <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80" alt="تشكيلة ملابس كاجوال" style={styles.heroImg} />
            </div>
          </section>

          <section id="products-grid" style={{ ...styles.sectionPadding, backgroundColor: '#f9fafb' }}>
            <div style={styles.sectionHeaderCenter}>
              <h2 style={styles.sectionTitle}>تشكيلة أزياء الكاجوال</h2>
              <p style={styles.sectionSub}>اختر القطعة، اللون، والمقاس المناسب لك</p>

              <div style={styles.filterBar}>
                {['الكل', 'تيشرتات', 'بنطلونات', 'هوديز وسويت شيرت', 'جاكيتات'].map(cat => (
                  <button
                    key={cat}
                    style={{
                      ...styles.filterBtn,
                      backgroundColor: selectedCategory === cat ? '#111827' : '#FFFFFF',
                      color: selectedCategory === cat ? '#FFFFFF' : '#374151',
                      border: selectedCategory === cat ? '1px solid #111827' : '1px solid #D1D5DB',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {productsLoading && (
              <p role="status" style={{ textAlign: 'center', color: '#6B7280' }}>جاري تحميل التشكيلة...</p>
            )}
            {productsError && (
              <p role="alert" style={{ textAlign: 'center', color: '#EF4444' }}>
                تعذر تحميل المنتجات.{' '}
                <button style={{ ...styles.secondaryBtn, padding: '4px 12px' }} onClick={() => mutateProducts()}>إعادة المحاولة</button>
              </p>
            )}
            {!productsLoading && !productsError && filteredProducts.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9CA3AF' }}>لا توجد قطع ملابس في هذا التصنيف حالياً.</p>
            )}
            <div style={styles.productsGrid}>
              {filteredProducts.map(product => {
                const currentOpts = productOptions[product.id] || DEFAULT_OPTIONS;
                const isOutOfStock = product.stock <= 0;
                const productImgs = parseProductImages(product);
                const activeImg = selectedImages[product.id] || productImgs[0] || '';

                return (
                  <div key={product.id} style={{ ...styles.productCard, opacity: isOutOfStock ? 0.75 : 1 }}>
                    <div style={styles.productImgContainer}>
                      <img src={activeImg} alt={product.name} style={styles.productImg} />
                      <span style={styles.categoryBadge}>{product.category}</span>
                      {isOutOfStock && <span style={styles.outOfStockBadge}>نفذت الكمية</span>}
                    </div>

                    {/* معرض الصور المصغرة للألوان والتزوايا */}
                    {productImgs.length > 1 && (
                      <div style={{ display: 'flex', gap: '6px', padding: '10px 15px 0 15px', overflowX: 'auto' }}>
                        {productImgs.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt={`صورة ${idx + 1}`}
                            style={{
                              width: '45px',
                              height: '45px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: activeImg === imgUrl ? '2px solid #111827' : '1px solid #D1D5DB',
                              opacity: activeImg === imgUrl ? 1 : 0.6
                            }}
                            onClick={() => setSelectedImages(prev => ({ ...prev, [product.id]: imgUrl }))}
                          />
                        ))}
                      </div>
                    )}

                    <div style={styles.productDetails}>
                      <h3 style={styles.productName}>{product.name}</h3>
                      <p style={styles.productSubtitle}>{product.subtitle}</p>
                      
                      <p style={{ fontSize: '0.8rem', color: isOutOfStock ? '#EF4444' : '#10B981', marginBottom: '10px', fontWeight: '500' }}>
                        الحالة: {isOutOfStock ? 'نفذت الكمية من المخزن' : `متاح للشحن (${product.stock} قطع)`}
                      </p>

                      <div style={styles.optionsContainer}>
                        <div style={styles.optionGroup}>
                          <label style={styles.optionLabel}>المقاس (Size):</label>
                          <select 
                            style={styles.selectInput}
                            value={currentOpts.size}
                            onChange={(e) => handleOptionChange(product.id, 'size', e.target.value)}
                            disabled={isOutOfStock}
                          >
                            <option value="S">Small (S)</option>
                            <option value="M">Medium (M)</option>
                            <option value="L">Large (L)</option>
                            <option value="XL">X-Large (XL)</option>
                            <option value="XXL">2X-Large (XXL)</option>
                          </select>
                        </div>

                        <div style={styles.optionGroup}>
                          <label style={styles.optionLabel}>اللون (Color):</label>
                          <select 
                            style={styles.selectInput}
                            value={currentOpts.color}
                            onChange={(e) => handleOptionChange(product.id, 'color', e.target.value)}
                            disabled={isOutOfStock}
                          >
                            <option value="أسود">أسود</option>
                            <option value="أبيض">أبيض</option>
                            <option value="كحلي">كحلي</option>
                            <option value="بيج">بيج</option>
                            <option value="زيتي">زيتي</option>
                          </select>
                        </div>
                      </div>

                      <div style={styles.priceRow}>
                        <div style={styles.priceTag}>{product.priceBase} ج.م</div>
                        
                        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '10px' }}>
                          <button 
                            style={{
                              ...styles.addCartBtn,
                              flex: 1,
                              backgroundColor: isOutOfStock ? '#9CA3AF' : '#111827',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              transition: 'transform 0.15s ease'
                            }} 
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                          >
                            {isOutOfStock ? 'نفذت الكمية' : 'إضافة للسلة 🛍️'}
                          </button>

                          <button 
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: isOutOfStock ? '#9CA3AF' : '#059669',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => {
                              if (!isOutOfStock) {
                                addToCart(product);
                                setActiveTab('cart');
                              }
                            }}
                            disabled={isOutOfStock}
                          >
                            اشتري الآن ⚡
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer id="contact-section" style={styles.contactFooter}>
            <div style={styles.footerContent}>
              <div style={styles.footerBrandCol}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '2rem', cursor: 'pointer' }} onClick={handleSecretAdminTrigger} title="🛍️">🛍️</span>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#F9FAFB' }}>فاشون ستور</h3>
                </div>
                <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  علامة تجارية متخصصة في توفير أرقى وأحدث صيحات الملابس الكاجوال المريحة بأعلى معايير التصنيع والجودة.
                </p>
              </div>

              <div style={styles.footerContactCol}>
                <h4 style={{ color: '#F3F4F6', fontSize: '1.2rem', marginBottom: '15px' }}>تواصل معنا مباشر:</h4>
                <div style={styles.contactItem}>
                  <span>✉️ البريد الإلكتروني:</span>
                  <a href="mailto:contact@fashionstore.com" style={styles.contactLink}>contact@fashionstore.com</a>
                </div>
                <div style={styles.contactItem}>
                  <span>📞 رقم الهاتف / واتساب:</span>
                  <a href="https://wa.me/201147554038" target="_blank" rel="noreferrer" style={styles.contactLink}>01147554038</a>
                </div>
              </div>
            </div>
            <div style={styles.footerBottomBar}>
              جميع الحقوق محفوظة © 2026 - فاشون ستور FASHION STORE
            </div>
          </footer>
        </main>
      )}

      {activeTab === 'cart' && (
        <div style={styles.cartPage}>
          <h2 style={styles.cartPageTitle}>سلة التسوق وإتمام الطلب</h2>
          
          {orderSuccess ? (
            <div style={styles.successBox}>
              <h3 style={{ color: '#059669', marginBottom: '10px' }}>تم إرسال طلبك بنجاح! 🎉</h3>
              <p>تم تسجيل طلبك ومتابعة تجهيزه للشحن فوراً.</p>
              {lastOrderId && <p style={{ marginTop: '8px' }}>رقم طلبك: <strong>{lastOrderId}</strong></p>}
              <button style={{ ...styles.primaryBtn, marginTop: '20px' }} onClick={() => { setOrderSuccess(false); setActiveTab('shop'); }}>
                متابعة التسوق
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <p>سلة التسوق فارغة حالياً.</p>
              <button style={styles.primaryBtn} onClick={() => setActiveTab('shop')}>تصفح الملابس</button>
            </div>
          ) : (
            <div style={styles.cartLayout}>
              <div style={styles.cartItemsCol}>
                {cart.map(item => (
                  <div key={item.cartKey} style={styles.cartItemRow}>
                    <img src={item.image} alt={item.name} style={styles.cartItemImg} />
                    <div style={styles.cartItemDetails}>
                      <h4>{item.name}</h4>
                      <p style={styles.cartMeta}>المقاس: {item.size} | اللون: {item.color}</p>
                      <span style={styles.cartItemPrice}>{item.price} ج.م</span>
                    </div>

                    <div style={styles.qtyControls}>
                      <button style={styles.qtyBtn} onClick={() => updateQty(item.cartKey, -1)}>-</button>
                      <span style={styles.qtyNum}>{item.qty}</span>
                      <button style={styles.qtyBtn} onClick={() => updateQty(item.cartKey, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.summaryCard}>
                <h3>بيانات الشحن والفاتورة</h3>
                <form onSubmit={handleCheckoutSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>الاسم بالكامل:</label>
                    <input type="text" style={styles.formInput} placeholder="اكتب اسمك هنا" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>رقم الهاتف:</label>
                    <input type="text" style={styles.formInput} placeholder="01xxxxxxxxx" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>عنوان التوصيل التفصيلي:</label>
                    <textarea style={styles.formTextarea} placeholder="المحافظة، المدينة، اسم الشارع، رقم العمارة..." value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} required />
                  </div>

                  <hr style={styles.hr} />

                  <div style={styles.summaryRow}>
                    <span>إجمالي المنتجات:</span>
                    <span>{cartTotal} ج.م</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>مصاريف الشحن:</span>
                    <span>{deliveryFee === 0 ? 'مجاني 🎉' : `${deliveryFee} ج.م`}</span>
                  </div>
                  <hr style={styles.hr} />
                  <div style={{ ...styles.summaryRow, fontWeight: 'bold', fontSize: '1.2rem', color: '#111827' }}>
                    <span>الإجمالي النهائي:</span>
                    <span>{grandTotal} ج.م</span>
                  </div>

                  {orderError && <p role="alert" style={{ color: '#EF4444', fontSize: '0.9rem', marginTop: '12px' }}>{orderError}</p>}
                  <button type="submit" style={{ ...styles.submitOrderBtn, opacity: isSubmittingOrder ? 0.7 : 1 }} disabled={isSubmittingOrder}>
                    {isSubmittingOrder ? 'جاري إرسال الطلب...' : 'تأكيد وإتمام الطلب 📦'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={styles.adminPage}>
          {!isAuthenticated ? (
            <div style={styles.loginCard}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
              <h2 style={{ marginBottom: '10px', color: '#111827' }}>لوحة تحكم المتجر</h2>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '20px' }}>أدخل كلمة مرور المدير إدارة الملابس والطلبات.</p>
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                  <label style={styles.formLabel}>كلمة المرور:</label>
                  <input type="password" placeholder="أدخل كلمة المرور" style={styles.formInput} value={enteredPassword} onChange={(e) => setEnteredPassword(e.target.value)} required />
                </div>
                {passwordError && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '15px' }}>{passwordError}</p>}
                <button type="submit" style={{ ...styles.primaryBtn, width: '100%', borderRadius: '8px' }}>دخول اللوحة</button>
              </form>
              <button style={{ ...styles.secondaryBtn, width: '100%', marginTop: '10px', fontSize: '0.85rem' }} onClick={() => setActiveTab('shop')}>العودة للمتجر</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <h2 style={styles.adminTitle}>لوحة تحكم FASHION STORE</h2>
                  <p style={styles.adminSub}>إدارة المخزون، الأسعار، وحالات طلبات الشحن.</p>
                </div>
                <button style={{ ...styles.secondaryBtn, padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleLogout}>تسجيل الخروج 🚪</button>
              </div>

              <div style={{ ...styles.securitySection, marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>➕ إضافة قطعة ملابس جديدة (مع إمكانية تحديد صور متعددة للألوان):</h3>
                <form onSubmit={handleAddProductSubmit} style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={styles.formLabel}>اسم المنتج:</label>
                      <input type="text" style={styles.formInput} placeholder="مثال: تيشرت أوفرسايز قطن" value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <label style={styles.formLabel}>وصف مختصر:</label>
                      <input type="text" style={styles.formInput} placeholder="مثال: قطن 100% مريح وعصري" value={newProductForm.subtitle} onChange={e => setNewProductForm({...newProductForm, subtitle: e.target.value})} />
                    </div>
                    <div>
                      <label style={styles.formLabel}>السعر (ج.م):</label>
                      <input type="number" style={styles.formInput} placeholder="350" value={newProductForm.priceBase} onChange={e => setNewProductForm({...newProductForm, priceBase: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                    <div>
                      <label style={styles.formLabel}>التصنيف:</label>
                      <select style={styles.selectInput} value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}>
                        <option value="تيشرتات">تيشرتات</option>
                        <option value="بنطلونات">بنطلونات</option>
                        <option value="هوديز وسويت شيرت">هوديز وسويت شيرت</option>
                        <option value="جاكيتات">جاكيتات</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.formLabel}>الكمية المتاحة:</label>
                      <input type="number" style={styles.formInput} value={newProductForm.stock} onChange={e => setNewProductForm({...newProductForm, stock: e.target.value})} required />
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <label style={styles.formLabel}>صور المنتج (يمكنك اختيار أكثر من صورة معاً للألوان والزوايا المختلف):</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleMultipleImagesUpload(e, false)} style={{ ...styles.formInput, padding: '6px' }} />
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

                  <button type="submit" style={{ ...styles.primaryBtn, marginTop: '20px', padding: '10px 25px' }}>إضافة القطعة بكافة صورها 🚀</button>
                </form>
              </div>

              <div style={{ ...styles.securitySection, marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>📦 قائمة المنتجات الحالية:</h3>
                <div style={styles.tableResponsive}>
                  <table style={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>الصور</th>
                        <th>اسم القطعة</th>
                        <th>التصنيف</th>
                        <th>السعر</th>
                        <th>المخزن</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const imgs = parseProductImages(p);
                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {imgs.slice(0, 3).map((img, idx) => (
                                  <img key={idx} src={img} alt={p.name} style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                                ))}
                                {imgs.length > 3 && <span style={{ fontSize: '0.75rem', alignSelf: 'center' }}>+{imgs.length - 3}</span>}
                              </div>
                            </td>
                            <td><strong>{p.name}</strong><br/><span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{p.subtitle}</span></td>
                            <td><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E5E7EB', fontSize: '0.8rem' }}>{p.category}</span></td>
                            <td>{p.priceBase} ج.م</td>
                            <td>
                              <span style={{ fontWeight: 'bold', color: p.stock > 0 ? '#059669' : '#DC2626' }}>
                                {p.stock} قطع
                              </span>
                            </td>
                            <td>
                              <button style={{ ...styles.secondaryBtn, padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }} onClick={() => handleDeleteProduct(p.id)}>حذف 🗑️</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ ...styles.securitySection, marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: '#111827' }}>📋 سجل الطلبات والشحن:</h3>
                {orders.length === 0 ? (
                  <p style={{ color: '#6B7280' }}>لا توجد طلبات جديدة حتى الآن.</p>
                ) : (
                  <div style={styles.tableResponsive}>
                    <table style={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>رقم الطلب</th>
                          <th>التاريخ</th>
                          <th>العميل والموبايل</th>
                          <th>عنوان الشحن</th>
                          <th>تفاصيل (المقاس / اللون / العدد)</th>
                          <th>الإجمالي</th>
                          <th>الحالة</th>
                          <th>تغيير الحالة / حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o?.id}>
                            <td><strong>{o?.id}</strong></td>
                            <td style={{ fontSize: '0.85rem' }}>{formatOrderDate(o?.created_at)}</td>
                            <td>{o?.customer_name}<br/><a href={`https://wa.me/20${o?.customer_phone?.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" style={{ color: '#059669', fontSize: '0.85rem' }}>{o?.customer_phone}</a></td>
                            <td style={{ fontSize: '0.85rem', maxWidth: '150px' }}>{o?.shipping_address}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {o?.items?.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '4px' }}>
                                  • {item.name} (مقاس: {item.size} - لون: {item.color}) × {item.qty}
                                </div>
                              ))}
                            </td>
                            <td><strong>{o?.total} ج.م</strong></td>
                            <td>
                              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', ...getStatusBadgeStyle(o?.status) }}>
                                {o?.status || 'جديد'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <select 
                                  style={{ ...styles.selectInput, fontSize: '0.8rem', padding: '4px' }}
                                  value={o?.status || 'جديد'}
                                  onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                >
                                  <option value="جديد">جديد</option>
                                  <option value="جاري الشحن">جاري الشحن</option>
                                  <option value="تم التسليم">تم التسليم</option>
                                  <option value="ملغي">ملغي</option>
                                </select>
                                <button style={{ ...styles.secondaryBtn, padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }} onClick={() => handleDeleteOrder(o.id)}>حذف الطلب</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    fontFamily: 'Cairo, sans-serif',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    minHeight: '100vh',
    direction: 'rtl',
    textAlign: 'right',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topBanner: {
    backgroundColor: '#111827',
    color: '#F9FAFB',
    textAlign: 'center',
    padding: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  navBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#111827',
  },
  logoSub: {
    display: 'block',
    fontSize: '0.65rem',
    color: '#6B7280',
    letterSpacing: '1px',
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#111827',
    padding: '5px 0',
  },
  cartIconContainer: {
    position: 'relative',
    cursor: 'pointer',
    backgroundColor: '#F3F4F6',
    padding: '8px 12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: '1.2rem',
  },
  cartBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  mainContent: {
    minHeight: '80vh',
  },
  heroSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'center',
  },
  heroTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    color: '#4B5563',
    lineHeight: '1.6',
  },
  heroButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  primaryBtn: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    color: '#111827',
    border: '1px solid #111827',
    padding: '12px 25px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  heroImageCard: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  heroImg: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    display: 'block',
  },
  sectionPadding: {
    padding: '60px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeaderCenter: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '10px',
  },
  sectionSub: {
    color: '#6B7280',
    fontSize: '0.95rem',
    marginBottom: '20px',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '25px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  productImgContainer: {
    position: 'relative',
    height: '280px',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  productDetails: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  productName: {
    fontSize: '1.15rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '5px',
  },
  productSubtitle: {
    fontSize: '0.85rem',
    color: '#6B7280',
    marginBottom: '15px',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionLabel: {
    fontSize: '0.8rem',
    color: '#374151',
    fontWeight: '600',
  },
  selectInput: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#F9FAFB',
    fontSize: '0.85rem',
    color: '#111827',
    outline: 'none',
  },
  priceRow: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '15px',
    borderTop: '1px solid #F3F4F6',
  },
  priceTag: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827',
  },
  addCartBtn: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  contactFooter: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    padding: '50px 20px 20px 20px',
    marginTop: '60px',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '40px',
    marginBottom: '40px',
  },
  footerBrandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  footerContactCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  contactItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '0.9rem',
    color: '#9CA3AF',
  },
  contactLink: {
    color: '#F3F4F6',
    textDecoration: 'none',
    fontWeight: '500',
  },
  footerBottomBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '20px',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#6B7280',
  },
  cartPage: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '0 20px',
  },
  cartPageTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '30px',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #A7F3D0',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },
  emptyCart: {
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  cartLayout: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '30px',
  },
  cartItemsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  cartItemRow: {
    backgroundColor: '#FFFFFF',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  cartItemImg: {
    width: '70px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  cartItemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cartMeta: {
    fontSize: '0.8rem',
    color: '#6B7280',
  },
  cartItemPrice: {
    fontWeight: 'bold',
    color: '#111827',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F9FAFB',
    padding: '5px 10px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#111827',
  },
  qtyNum: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    minWidth: '20px',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    height: 'fit-content',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  formGroup: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  formLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
  },
  formInput: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#F9FAFB',
    fontSize: '0.9rem',
    outline: 'none',
  },
  formTextarea: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#F9FAFB',
    fontSize: '0.9rem',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #E5E7EB',
    margin: '15px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '0.95rem',
    color: '#4B5563',
  },
  submitOrderBtn: {
    width: '100%',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '15px',
    boxShadow: '0 4px 10px rgba(5,150,105,0.2)',
  },
  adminPage: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  loginCard: {
    maxWidth: '400px',
    margin: '60px auto',
    backgroundColor: '#FFFFFF',
    padding: '40px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
  },
  adminTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '5px',
  },
  adminSub: {
    color: '#6B7280',
    fontSize: '0.9rem',
  },
  securitySection: {
    backgroundColor: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  adminTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
};
